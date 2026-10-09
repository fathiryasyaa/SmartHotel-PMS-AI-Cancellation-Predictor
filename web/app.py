from flask import Flask, request, jsonify, render_template, session, redirect, url_for
import joblib
import json
import numpy as np
import os
from datetime import datetime
from functools import wraps
import mysql.connector
from mysql.connector import pooling

app = Flask(__name__)
app.secret_key = 'hotel_cancellation_secret_2024'

# ── Staff credentials ───────────────────────────────────────────────────────
STAFF_PASSWORD = 'fathir123'

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('staff_logged_in'):
            return redirect(url_for('staff_login'))
        return f(*args, **kwargs)
    return decorated

# ── Load artefak model ──────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, 'model')

model  = joblib.load(os.path.join(MODEL_DIR, 'xgb_model.pkl'))
scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))

with open(os.path.join(MODEL_DIR, 'feature_names.json')) as f:
    FEATURE_NAMES = json.load(f)

with open(os.path.join(MODEL_DIR, 'freq_country.json')) as f:
    FREQ_COUNTRY = json.load(f)

# ── MySQL connection pool ───────────────────────────────────────────────────
DB_CONFIG = {
    'host':     'localhost',
    'port':     3306,
    'user':     'root',
    'password': '',           # password XAMPP default kosong
    'database': 'hotel_booking',
    'charset':  'utf8mb4',
}

pool = pooling.MySQLConnectionPool(
    pool_name='hotel_pool',
    pool_size=5,
    **DB_CONFIG,
)


def get_conn():
    return pool.get_connection()


# Stok kamar awal per tipe (kapasitas total tiap tipe kamar)
ROOM_INITIAL_STOCK = {
    'A': 40, 'B': 35, 'C': 30, 'D': 20, 'E': 25,
    'F': 15, 'G': 10, 'H': 8,  'I': 4,  'L': 2,
}

def init_db():
    """Buat tabel jika belum ada."""
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id                      VARCHAR(20)    PRIMARY KEY,
            guest_name              VARCHAR(120)   NOT NULL,
            guest_email             VARCHAR(150)   NOT NULL DEFAULT '',
            guest_phone             VARCHAR(30)    NOT NULL DEFAULT '',
            hotel                   VARCHAR(60)    NOT NULL,
            arrival_date_day_of_month TINYINT      NOT NULL,
            arrival_date_month      VARCHAR(20)    NOT NULL,
            arrival_date_year       SMALLINT       NOT NULL,
            stays_in_week_nights    TINYINT        NOT NULL DEFAULT 0,
            stays_in_weekend_nights TINYINT        NOT NULL DEFAULT 0,
            adults                  TINYINT        NOT NULL DEFAULT 1,
            children                TINYINT        NOT NULL DEFAULT 0,
            babies                  TINYINT        NOT NULL DEFAULT 0,
            country                 VARCHAR(10)    NOT NULL DEFAULT 'PRT',
            meal                    VARCHAR(10)    NOT NULL DEFAULT 'BB',
            market_segment          VARCHAR(40)    NOT NULL DEFAULT 'Online TA',
            distribution_channel    VARCHAR(30)    NOT NULL DEFAULT 'TA/TO',
            reserved_room_type      CHAR(1)        NOT NULL DEFAULT 'A',
            deposit_type            VARCHAR(20)    NOT NULL DEFAULT 'No Deposit',
            customer_type           VARCHAR(30)    NOT NULL DEFAULT 'Transient',
            lead_time               SMALLINT       NOT NULL DEFAULT 0,
            adr                     DECIMAL(10,2)  NOT NULL DEFAULT 0,
            required_car_parking_spaces TINYINT    NOT NULL DEFAULT 0,
            total_of_special_requests   TINYINT    NOT NULL DEFAULT 0,
            probability             DECIMAL(5,2)   NOT NULL,
            prediction              TINYINT        NOT NULL,
            risk_level              VARCHAR(10)    NOT NULL,
            risk_label              VARCHAR(30)    NOT NULL,
            policy                  VARCHAR(60)    NOT NULL,
            -- Status aktual (PMS)
            pms_status              VARCHAR(20)    NOT NULL DEFAULT 'reserved'
                                    COMMENT 'reserved | checked_in | checked_out | canceled_guest | canceled_staff | no_show',
            checkin_at              DATETIME       NULL DEFAULT NULL,
            checkout_at             DATETIME       NULL DEFAULT NULL,
            canceled_at             DATETIME       NULL DEFAULT NULL,
            canceled_by             VARCHAR(20)    NULL DEFAULT NULL
                                    COMMENT 'guest | staff',
            cancel_reason           VARCHAR(255)   NULL DEFAULT NULL,
            -- Audit staff-delete
            created_at              DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_at              DATETIME       NULL DEFAULT NULL,
            deleted_by              VARCHAR(60)    NULL DEFAULT NULL,
            delete_reason           VARCHAR(255)   NULL DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Buat tabel room_inventory untuk melacak ketersediaan kamar
    cur.execute("""
        CREATE TABLE IF NOT EXISTS room_inventory (
            room_type       CHAR(1)     PRIMARY KEY,
            total_rooms     SMALLINT    NOT NULL DEFAULT 0,
            available_rooms SMALLINT    NOT NULL DEFAULT 0,
            updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Tambah kolom baru jika tabel sudah ada tapi belum punya kolom PMS
    alter_stmts = [
        "ALTER TABLE bookings ADD COLUMN guest_email VARCHAR(150) NOT NULL DEFAULT '' AFTER guest_name",
        "ALTER TABLE bookings ADD COLUMN guest_phone VARCHAR(30) NOT NULL DEFAULT '' AFTER guest_email",
        "ALTER TABLE bookings ADD COLUMN pms_status VARCHAR(20) NOT NULL DEFAULT 'reserved' AFTER policy",
        "ALTER TABLE bookings ADD COLUMN checkin_at DATETIME NULL DEFAULT NULL AFTER pms_status",
        "ALTER TABLE bookings ADD COLUMN checkout_at DATETIME NULL DEFAULT NULL AFTER checkin_at",
        "ALTER TABLE bookings ADD COLUMN canceled_at DATETIME NULL DEFAULT NULL AFTER checkout_at",
        "ALTER TABLE bookings ADD COLUMN canceled_by VARCHAR(20) NULL DEFAULT NULL AFTER canceled_at",
        "ALTER TABLE bookings ADD COLUMN cancel_reason VARCHAR(255) NULL DEFAULT NULL AFTER canceled_by",
    ]
    for stmt in alter_stmts:
        try:
            cur.execute(stmt)
        except Exception:
            pass   # kolom sudah ada, abaikan

    # Seed room_inventory jika belum ada data
    cur.execute("SELECT COUNT(*) FROM room_inventory")
    if cur.fetchone()[0] == 0:
        for rtype, total in ROOM_INITIAL_STOCK.items():
            cur.execute("""
                INSERT INTO room_inventory (room_type, total_rooms, available_rooms)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE total_rooms = VALUES(total_rooms)
            """, (rtype, total, total))

    conn.commit()
    cur.close()
    conn.close()


# Inisialisasi tabel saat startup
with app.app_context():
    init_db()

# ── Lookup data ─────────────────────────────────────────────────────────────
COUNTRY_CHOICES = [
    # Asia Tenggara
    ("IDN", "Indonesia"),        ("MYS", "Malaysia"),         ("SGP", "Singapore"),
    ("THA", "Thailand"),         ("PHL", "Philippines"),      ("VNM", "Vietnam"),
    ("MMR", "Myanmar"),          ("KHM", "Cambodia"),         ("BRN", "Brunei"),
    # Asia Timur
    ("CHN", "China"),            ("JPN", "Japan"),            ("KOR", "South Korea"),
    ("TWN", "Taiwan"),           ("HKG", "Hong Kong"),        ("MNG", "Mongolia"),
    # Asia Selatan
    ("IND", "India"),            ("PAK", "Pakistan"),         ("BGD", "Bangladesh"),
    ("LKA", "Sri Lanka"),        ("NPL", "Nepal"),            ("MDV", "Maldives"),
    # Timur Tengah
    ("ARE", "United Arab Emirates"), ("SAU", "Saudi Arabia"), ("QAT", "Qatar"),
    ("KWT", "Kuwait"),           ("OMN", "Oman"),             ("BHR", "Bahrain"),
    ("JOR", "Jordan"),           ("ISR", "Israel"),           ("TUR", "Turkey"),
    # Eropa Barat
    ("GBR", "United Kingdom"),   ("FRA", "France"),           ("DEU", "Germany"),
    ("ITA", "Italy"),            ("ESP", "Spain"),            ("PRT", "Portugal"),
    ("NLD", "Netherlands"),      ("BEL", "Belgium"),          ("CHE", "Switzerland"),
    ("AUT", "Austria"),          ("SWE", "Sweden"),           ("NOR", "Norway"),
    ("DNK", "Denmark"),          ("FIN", "Finland"),          ("IRL", "Ireland"),
    ("GRC", "Greece"),           ("LUX", "Luxembourg"),       ("ISL", "Iceland"),
    ("MLT", "Malta"),
    # Eropa Timur & Tengah
    ("RUS", "Russia"),           ("POL", "Poland"),           ("CZE", "Czech Republic"),
    ("HUN", "Hungary"),          ("ROU", "Romania"),          ("BGR", "Bulgaria"),
    ("HRV", "Croatia"),          ("SRB", "Serbia"),           ("UKR", "Ukraine"),
    ("EST", "Estonia"),          ("LVA", "Latvia"),           ("LTU", "Lithuania"),
    # Amerika Utara
    ("USA", "United States"),    ("CAN", "Canada"),           ("MEX", "Mexico"),
    # Amerika Tengah & Karibia
    ("CUB", "Cuba"),             ("JAM", "Jamaica"),          ("DOM", "Dominican Republic"),
    ("CRI", "Costa Rica"),       ("PAN", "Panama"),
    # Amerika Selatan
    ("BRA", "Brazil"),           ("ARG", "Argentina"),        ("CHL", "Chile"),
    ("COL", "Colombia"),         ("PER", "Peru"),             ("URY", "Uruguay"),
    ("ECU", "Ecuador"),
    # Afrika
    ("ZAF", "South Africa"),     ("EGY", "Egypt"),            ("MAR", "Morocco"),
    ("NGA", "Nigeria"),          ("KEN", "Kenya"),            ("TZA", "Tanzania"),
    ("GHA", "Ghana"),            ("TUN", "Tunisia"),          ("MUS", "Mauritius"),
    # Oseania
    ("AUS", "Australia"),        ("NZL", "New Zealand"),      ("FJI", "Fiji"),
    # Lainnya
    ("other", "Other"),
]
MEAL_CHOICES    = [("BB","Bed & Breakfast"),("HB","Half Board"),
                   ("FB","Full Board"),("SC","Self Catering")]
ROOM_TYPES      = ["A","B","C","D","E","F","G","H","I","L"]
MARKET_SEGMENTS = ["Online TA","Offline TA/TO","Direct","Corporate",
                   "Complementary","Groups","Aviation"]
DIST_CHANNELS   = ["TA/TO","Direct","Corporate","GDS"]
CUSTOMER_TYPES  = ["Transient","Transient-Party","Contract","Group"]
DEPOSIT_TYPES   = ["No Deposit","Refundable","Non Refund"]
MONTHS          = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"]


# ── Model helpers ────────────────────────────────────────────────────────────
def build_feature_vector(data: dict) -> np.ndarray:
    hotel          = data.get('hotel', 'City Hotel')
    meal           = data.get('meal', 'BB')
    country        = data.get('country', 'PRT')
    market_segment = data.get('market_segment', 'Online TA')
    distribution   = data.get('distribution_channel', 'TA/TO')
    reserved_room  = data.get('reserved_room_type', 'A')
    assigned_room  = data.get('assigned_room_type', reserved_room)
    deposit_type   = data.get('deposit_type', 'No Deposit')
    customer_type  = data.get('customer_type', 'Transient')
    arrival_month  = data.get('arrival_date_month', 'July')

    lead_time       = int(data.get('lead_time', 0))
    arrival_year    = int(data.get('arrival_date_year', 2024))
    arrival_week    = int(data.get('arrival_date_week_number', 27))
    arrival_day     = int(data.get('arrival_date_day_of_month', 15))
    weekend_nights  = int(data.get('stays_in_weekend_nights', 0))
    week_nights     = int(data.get('stays_in_week_nights', 2))
    adults          = int(data.get('adults', 2))
    children        = float(data.get('children', 0))
    babies          = int(data.get('babies', 0))
    is_repeated     = int(data.get('is_repeated_guest', 0))
    prev_cancel     = int(data.get('previous_cancellations', 0))
    prev_not_cancel = int(data.get('previous_bookings_not_canceled', 0))
    booking_changes = int(data.get('booking_changes', 0))
    agent           = float(data.get('agent', 0))
    company         = float(data.get('company', 0))
    days_waiting    = int(data.get('days_in_waiting_list', 0))
    adr             = float(data.get('adr', 100))
    parking         = int(data.get('required_car_parking_spaces', 0))
    special_req     = int(data.get('total_of_special_requests', 0))

    holiday_months   = ['July', 'August', 'December']
    is_holiday       = 1 if arrival_month in holiday_months else 0
    is_room_mismatch = 1 if reserved_room != assigned_room else 0
    country_freq     = FREQ_COUNTRY.get(country, FREQ_COUNTRY.get('other', 0.001))

    row = {
        'lead_time': lead_time,
        'arrival_date_year': arrival_year,
        'arrival_date_week_number': arrival_week,
        'arrival_date_day_of_month': arrival_day,
        'stays_in_weekend_nights': weekend_nights,
        'stays_in_week_nights': week_nights,
        'adults': adults, 'children': children, 'babies': babies,
        'is_repeated_guest': is_repeated,
        'previous_cancellations': prev_cancel,
        'previous_bookings_not_canceled': prev_not_cancel,
        'booking_changes': booking_changes,
        'agent': agent, 'company': company,
        'days_in_waiting_list': days_waiting,
        'adr': adr,
        'required_car_parking_spaces': parking,
        'total_of_special_requests': special_req,
        'is_holiday_season': is_holiday,
        'is_room_mismatch': is_room_mismatch,
        'country_freq': country_freq,
        'hotel_Resort Hotel': 1 if hotel == 'Resort Hotel' else 0,
        'meal_FB': 1 if meal == 'FB' else 0,
        'meal_HB': 1 if meal == 'HB' else 0,
        'meal_SC': 1 if meal == 'SC' else 0,
        'meal_Undefined': 0,
        'market_segment_Complementary': 1 if market_segment == 'Complementary' else 0,
        'market_segment_Corporate':     1 if market_segment == 'Corporate' else 0,
        'market_segment_Direct':        1 if market_segment == 'Direct' else 0,
        'market_segment_Groups':        1 if market_segment == 'Groups' else 0,
        'market_segment_Offline TA/TO': 1 if market_segment == 'Offline TA/TO' else 0,
        'market_segment_Online TA':     1 if market_segment == 'Online TA' else 0,
        'distribution_channel_Direct':  1 if distribution == 'Direct' else 0,
        'distribution_channel_GDS':     1 if distribution == 'GDS' else 0,
        'distribution_channel_TA/TO':   1 if distribution == 'TA/TO' else 0,
        'distribution_channel_Undefined': 0,
        'reserved_room_type_B': 1 if reserved_room == 'B' else 0,
        'reserved_room_type_C': 1 if reserved_room == 'C' else 0,
        'reserved_room_type_D': 1 if reserved_room == 'D' else 0,
        'reserved_room_type_E': 1 if reserved_room == 'E' else 0,
        'reserved_room_type_F': 1 if reserved_room == 'F' else 0,
        'reserved_room_type_G': 1 if reserved_room == 'G' else 0,
        'reserved_room_type_H': 1 if reserved_room == 'H' else 0,
        'reserved_room_type_L': 1 if reserved_room == 'L' else 0,
        'reserved_room_type_P': 0,
        'assigned_room_type_B': 1 if assigned_room == 'B' else 0,
        'assigned_room_type_C': 1 if assigned_room == 'C' else 0,
        'assigned_room_type_D': 1 if assigned_room == 'D' else 0,
        'assigned_room_type_E': 1 if assigned_room == 'E' else 0,
        'assigned_room_type_F': 1 if assigned_room == 'F' else 0,
        'assigned_room_type_G': 1 if assigned_room == 'G' else 0,
        'assigned_room_type_H': 1 if assigned_room == 'H' else 0,
        'assigned_room_type_I': 1 if assigned_room == 'I' else 0,
        'assigned_room_type_K': 0,
        'assigned_room_type_L': 1 if assigned_room == 'L' else 0,
        'assigned_room_type_P': 0,
        'deposit_type_Non Refund': 1 if deposit_type == 'Non Refund' else 0,
        'deposit_type_Refundable':  1 if deposit_type == 'Refundable' else 0,
        'customer_type_Group':           1 if customer_type == 'Group' else 0,
        'customer_type_Transient':       1 if customer_type == 'Transient' else 0,
        'customer_type_Transient-Party': 1 if customer_type == 'Transient-Party' else 0,
        'arrival_date_month_August':    1 if arrival_month == 'August' else 0,
        'arrival_date_month_December':  1 if arrival_month == 'December' else 0,
        'arrival_date_month_February':  1 if arrival_month == 'February' else 0,
        'arrival_date_month_January':   1 if arrival_month == 'January' else 0,
        'arrival_date_month_July':      1 if arrival_month == 'July' else 0,
        'arrival_date_month_June':      1 if arrival_month == 'June' else 0,
        'arrival_date_month_March':     1 if arrival_month == 'March' else 0,
        'arrival_date_month_May':       1 if arrival_month == 'May' else 0,
        'arrival_date_month_November':  1 if arrival_month == 'November' else 0,
        'arrival_date_month_October':   1 if arrival_month == 'October' else 0,
        'arrival_date_month_September': 1 if arrival_month == 'September' else 0,
    }
    return np.array([row.get(col, 0) for col in FEATURE_NAMES], dtype=float)


def predict_cancellation(data: dict) -> dict:
    vec    = build_feature_vector(data)
    scaled = scaler.transform(vec.reshape(1, -1))
    proba  = float(model.predict_proba(scaled)[0][1])
    pred   = int(model.predict(scaled)[0])

    if proba > 0.70:
        risk_level, risk_label = 'high',   'Risiko Tinggi'
        policy = 'Wajib Deposit Penuh / Non-Refundable'
    elif proba > 0.30:
        risk_level, risk_label = 'medium', 'Risiko Sedang'
        policy = 'Biaya Pembatalan 50% jika H-7'
    else:
        risk_level, risk_label = 'low',    'Risiko Rendah'
        policy = 'Fleksibilitas Pembatalan Gratis'

    return {
        'probability': round(proba * 100, 2),
        'prediction':  pred,
        'risk_level':  risk_level,
        'risk_label':  risk_label,
        'policy':      policy,
    }


# ── DB helpers ───────────────────────────────────────────────────────────────
def row_to_dict(row, cursor) -> dict:
    """Konversi row MySQL ke dict, handle Decimal & datetime."""
    d = {}
    for col, val in zip([c[0] for c in cursor.description], row):
        if hasattr(val, 'isoformat'):      # datetime / date
            val = val.isoformat(sep=' ')
        elif hasattr(val, '__float__') and not isinstance(val, (int, float)):
            val = float(val)               # Decimal → float
        d[col] = val
    return d


def next_booking_id() -> str:
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM bookings")
    n = cur.fetchone()[0]
    cur.close()
    conn.close()
    return f"HTL-{1000 + n}"


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    total_rooms = sum(ROOM_INITIAL_STOCK.values())
    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute("SELECT SUM(total_rooms) FROM room_inventory")
        row = cur.fetchone()
        if row and row[0] is not None:
            total_rooms = int(row[0])
        cur.close()
        conn.close()
    except Exception:
        pass
    return render_template('index.html', total_rooms=total_rooms)


@app.route('/booking')
def booking():
    return render_template('booking.html',
        country_choices=COUNTRY_CHOICES,
        meal_choices=MEAL_CHOICES,
        room_types=ROOM_TYPES,
        market_segments=MARKET_SEGMENTS,
        dist_channels=DIST_CHANNELS,
        customer_types=CUSTOMER_TYPES,
        deposit_types=DEPOSIT_TYPES,
        months=MONTHS,
    )


@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')


@app.route('/staff/login', methods=['GET', 'POST'])
def staff_login():
    error = None
    if request.method == 'POST':
        pw = request.form.get('password', '')
        if pw == STAFF_PASSWORD:
            session['staff_logged_in'] = True
            return redirect(url_for('dashboard'))
        error = 'Password salah. Silakan coba lagi.'
    return render_template('login.html', error=error)


@app.route('/staff/logout')
def staff_logout():
    session.clear()
    return redirect(url_for('staff_login'))


# ── API: ketersediaan kamar (real-time) ─────────────────────────────────────
@app.route('/api/room-availability')
def api_room_availability():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT room_type, total_rooms, available_rooms
        FROM room_inventory
        ORDER BY room_type
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    result = {
        r[0]: {'total': int(r[1]), 'available': int(r[2])}
        for r in rows
    }
    return jsonify(result)


# ── API: buat reservasi ──────────────────────────────────────────────────────
@app.route('/api/booking', methods=['POST'])
def api_booking():
    data        = request.get_json()
    room_type   = data.get('reserved_room_type', 'A').upper()
    result      = predict_cancellation(data)
    booking_id  = next_booking_id()
    now         = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = get_conn()
    cur  = conn.cursor()
    try:
        # ── Cek & kurangi stok kamar (atomic dengan SELECT FOR UPDATE) ──
        cur.execute("""
            SELECT available_rooms FROM room_inventory
            WHERE room_type = %s
            FOR UPDATE
        """, (room_type,))
        inv_row = cur.fetchone()
        if not inv_row:
            return jsonify({'error': f'Tipe kamar {room_type} tidak ditemukan'}), 400
        if inv_row[0] <= 0:
            return jsonify({'error': f'Kamar tipe {room_type} sudah penuh/tidak tersedia'}), 409

        # Kurangi stok
        cur.execute("""
            UPDATE room_inventory
            SET available_rooms = available_rooms - 1
            WHERE room_type = %s AND available_rooms > 0
        """, (room_type,))
        if cur.rowcount == 0:
            return jsonify({'error': f'Kamar tipe {room_type} baru saja habis, silakan pilih tipe lain'}), 409

        cur.execute("""
            INSERT INTO bookings (
                id, guest_name, guest_email, guest_phone, hotel,
                arrival_date_day_of_month, arrival_date_month, arrival_date_year,
                stays_in_week_nights, stays_in_weekend_nights,
                adults, children, babies,
                country, meal, market_segment, distribution_channel,
                reserved_room_type, deposit_type, customer_type,
                lead_time, adr, required_car_parking_spaces,
                total_of_special_requests,
                probability, prediction, risk_level, risk_label, policy,
                created_at
            ) VALUES (
                %s,%s,%s,%s,%s,
                %s,%s,%s,
                %s,%s,
                %s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,
                %s,
                %s,%s,%s,%s,%s,
                %s
            )
        """, (
            booking_id,
            data.get('guest_name', 'Tamu'),
            data.get('guest_email', '').strip().lower(),
            data.get('guest_phone', '').strip()[:20],
            data.get('hotel', 'City Hotel'),
            int(data.get('arrival_date_day_of_month', 1)),
            data.get('arrival_date_month', 'January'),
            int(data.get('arrival_date_year', 2024)),
            int(data.get('stays_in_week_nights', 0)),
            int(data.get('stays_in_weekend_nights', 0)),
            int(data.get('adults', 1)),
            int(float(data.get('children', 0))),
            int(data.get('babies', 0)),
            data.get('country', 'PRT'),
            data.get('meal', 'BB'),
            data.get('market_segment', 'Online TA'),
            data.get('distribution_channel', 'TA/TO'),
            room_type,
            data.get('deposit_type', 'No Deposit'),
            data.get('customer_type', 'Transient'),
            int(data.get('lead_time', 0)),
            float(data.get('adr', 0)),
            int(data.get('required_car_parking_spaces', 0)),
            int(data.get('total_of_special_requests', 0)),
            result['probability'],
            result['prediction'],
            result['risk_level'],
            result['risk_label'],
            result['policy'],
            now,
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

    return jsonify({'booking_id': booking_id, **result})


# ── API: ambil semua reservasi (aktif saja) ──────────────────────────────────
@app.route('/api/bookings')
@login_required
def api_bookings():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT * FROM bookings
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
    """)
    rows = [row_to_dict(r, cur) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(rows)


# ── API: statistik ───────────────────────────────────────────────────────────
@app.route('/api/stats')
@login_required
def api_stats():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT
            COUNT(*)                                           AS total,
            SUM(risk_level = 'high')                          AS high,
            SUM(risk_level = 'medium')                        AS medium,
            SUM(risk_level = 'low')                           AS low,
            ROUND(IFNULL(AVG(probability), 0), 2)             AS avg_probability,
            SUM(deleted_at IS NOT NULL)                       AS deleted_count
        FROM bookings
        WHERE deleted_at IS NULL
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({
        'total':           int(row[0]),
        'high':            int(row[1] or 0),
        'medium':          int(row[2] or 0),
        'low':             int(row[3] or 0),
        'avg_probability': float(row[4] or 0),
    })


# ── API: soft-delete reservasi ───────────────────────────────────────────────
@app.route('/api/booking/<booking_id>', methods=['DELETE'])
@login_required
def api_delete_booking(booking_id):
    body      = request.get_json() or {}
    reason    = body.get('reason', '').strip()
    deleted_by = body.get('deleted_by', 'Staff').strip()

    if not reason:
        return jsonify({'error': 'Alasan penghapusan wajib diisi'}), 400

    conn = get_conn()
    cur  = conn.cursor()
    try:
        # Pastikan record ada dan belum dihapus
        cur.execute(
            "SELECT id, reserved_room_type, pms_status FROM bookings WHERE id = %s AND deleted_at IS NULL",
            (booking_id,)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Reservasi tidak ditemukan'}), 404

        _, room_type, pms_status = row

        # Soft delete — data tetap ada di DB, hanya ditandai
        cur.execute("""
            UPDATE bookings
            SET deleted_at    = %s,
                deleted_by    = %s,
                delete_reason = %s
            WHERE id = %s
        """, (datetime.now(), deleted_by, reason, booking_id))

        # Kembalikan stok kamar jika booking masih aktif (belum cancel/checkout)
        if pms_status not in ('canceled_guest', 'canceled_staff', 'checked_out'):
            cur.execute("""
                UPDATE room_inventory
                SET available_rooms = LEAST(available_rooms + 1, total_rooms)
                WHERE room_type = %s
            """, (room_type,))

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

    return jsonify({'success': True, 'booking_id': booking_id})


# ── API: log reservasi yang dihapus (untuk audit) ────────────────────────────
@app.route('/api/bookings/deleted')
@login_required
def api_deleted_bookings():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, guest_name, hotel, arrival_date_month, arrival_date_year,
               probability, risk_level, risk_label,
               deleted_at, deleted_by, delete_reason
        FROM bookings
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
    """)
    rows = [row_to_dict(r, cur) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(rows)


# ── Halaman cek & batalkan reservasi (tamu) ──────────────────────────────────
@app.route('/my-booking')
def my_booking():
    return render_template('my_booking.html')


# ── API: cari booking milik tamu (email + nama) ──────────────────────────────
@app.route('/api/my-booking', methods=['POST'])
def api_my_booking():
    body       = request.get_json() or {}
    email      = body.get('email', '').strip().lower()
    guest_name = body.get('guest_name', '').strip().lower()

    if not email or not guest_name:
        return jsonify({'error': 'Email dan nama wajib diisi'}), 400

    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT * FROM bookings
        WHERE LOWER(guest_email) = %s AND deleted_at IS NULL
        ORDER BY created_at DESC
    """, (email,))
    rows = [row_to_dict(r, cur) for r in cur.fetchall()]
    cur.close()
    conn.close()

    if not rows:
        return jsonify({'error': 'Tidak ada reservasi dengan email tersebut'}), 404

    # Verifikasi nama (case-insensitive, partial match)
    matched = [r for r in rows if guest_name in r['guest_name'].lower()]
    if not matched:
        return jsonify({'error': 'Nama tidak cocok dengan data reservasi pada email tersebut'}), 403

    # Kembalikan semua reservasi yang cocok (tamu bisa punya >1)
    return jsonify(matched)


# ── API: tamu membatalkan reservasi sendiri ───────────────────────────────────
@app.route('/api/my-booking/cancel', methods=['POST'])
def api_guest_cancel():
    body       = request.get_json() or {}
    booking_id = body.get('booking_id', '').strip().upper()
    email      = body.get('email', '').strip().lower()
    reason     = body.get('reason', '').strip()

    if not booking_id or not email:
        return jsonify({'error': 'Booking ID dan email wajib diisi'}), 400

    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, guest_name, guest_email, pms_status, deposit_type, reserved_room_type
        FROM bookings
        WHERE id = %s AND deleted_at IS NULL
    """, (booking_id,))
    row = cur.fetchone()

    if not row:
        cur.close(); conn.close()
        return jsonify({'error': 'Reservasi tidak ditemukan'}), 404

    db_id, db_name, db_email, pms_status, deposit_type, room_type = row

    if email != db_email.lower():
        cur.close(); conn.close()
        return jsonify({'error': 'Email tidak cocok dengan data reservasi'}), 403

    if pms_status in ('checked_in', 'checked_out'):
        cur.close(); conn.close()
        return jsonify({'error': f'Reservasi sudah {pms_status}, tidak bisa dibatalkan'}), 400

    if pms_status in ('canceled_guest', 'canceled_staff'):
        cur.close(); conn.close()
        return jsonify({'error': 'Reservasi sudah dibatalkan sebelumnya'}), 400

    cur.execute("""
        UPDATE bookings
        SET pms_status  = 'canceled_guest',
            canceled_at = %s,
            canceled_by = 'guest',
            cancel_reason = %s
        WHERE id = %s
    """, (datetime.now(), reason or 'Dibatalkan oleh tamu', booking_id))

    # Kembalikan stok kamar ke inventory
    cur.execute("""
        UPDATE room_inventory
        SET available_rooms = LEAST(available_rooms + 1, total_rooms)
        WHERE room_type = %s
    """, (room_type,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'success': True, 'booking_id': booking_id, 'deposit_type': deposit_type})


# ── PMS halaman (staff) ───────────────────────────────────────────────────────
@app.route('/pms')
@login_required
def pms():
    return render_template('pms.html')


# ── API: ambil semua reservasi untuk PMS (termasuk status) ───────────────────
@app.route('/api/pms/bookings')
@login_required
def api_pms_bookings():
    status_filter = request.args.get('status', '')
    conn = get_conn()
    cur  = conn.cursor()
    if status_filter:
        cur.execute("""
            SELECT * FROM bookings
            WHERE deleted_at IS NULL AND pms_status = %s
            ORDER BY arrival_date_year, arrival_date_month, arrival_date_day_of_month
        """, (status_filter,))
    else:
        cur.execute("""
            SELECT * FROM bookings
            WHERE deleted_at IS NULL
            ORDER BY arrival_date_year, arrival_date_month, arrival_date_day_of_month
        """)
    rows = [row_to_dict(r, cur) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(rows)


# ── API: PMS statistik ────────────────────────────────────────────────────────
@app.route('/api/pms/stats')
@login_required
def api_pms_stats():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT
            SUM(pms_status = 'reserved')        AS reserved,
            SUM(pms_status = 'checked_in')       AS checked_in,
            SUM(pms_status = 'checked_out')      AS checked_out,
            SUM(pms_status LIKE 'canceled%')     AS canceled,
            SUM(pms_status = 'no_show')          AS no_show,
            COUNT(*)                             AS total
        FROM bookings
        WHERE deleted_at IS NULL
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()
    keys = ['reserved','checked_in','checked_out','canceled','no_show','total']
    return jsonify({k: int(v or 0) for k, v in zip(keys, row)})


# ── API: update status PMS (check-in / check-out / cancel / no-show) ─────────
@app.route('/api/pms/status', methods=['POST'])
@login_required
def api_pms_update_status():
    body       = request.get_json() or {}
    booking_id = body.get('booking_id', '').strip()
    new_status = body.get('status', '').strip()
    note       = body.get('note', '').strip()

    valid = ('checked_in', 'checked_out', 'canceled_staff', 'no_show', 'reserved')
    if new_status not in valid:
        return jsonify({'error': f'Status tidak valid. Pilih: {valid}'}), 400

    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        "SELECT id, pms_status, reserved_room_type FROM bookings WHERE id = %s AND deleted_at IS NULL",
        (booking_id,)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return jsonify({'error': 'Reservasi tidak ditemukan'}), 404

    _, old_status, room_type = row
    now = datetime.now()

    # Set timestamp kolom yang relevan
    extra_col, extra_val = '', None
    if new_status == 'checked_in':
        extra_col = ', checkin_at = %s'
        extra_val = now
    elif new_status == 'checked_out':
        extra_col = ', checkout_at = %s'
        extra_val = now
    elif new_status == 'canceled_staff':
        extra_col = ', canceled_at = %s, canceled_by = %s, cancel_reason = %s'

    if extra_col == ', canceled_at = %s, canceled_by = %s, cancel_reason = %s':
        cur.execute(f"""
            UPDATE bookings SET pms_status = %s {extra_col} WHERE id = %s
        """, (new_status, now, 'staff', note or 'Dibatalkan oleh staff', booking_id))
    elif extra_val:
        cur.execute(f"""
            UPDATE bookings SET pms_status = %s {extra_col} WHERE id = %s
        """, (new_status, extra_val, booking_id))
    else:
        cur.execute("UPDATE bookings SET pms_status = %s WHERE id = %s",
                    (new_status, booking_id))

    # ── Sinkronisasi stok kamar ──────────────────────────────────────────────
    # Jika status berubah ke canceled/no_show (dari status aktif) → kembalikan stok
    canceling = new_status in ('canceled_staff', 'no_show')
    was_active = old_status in ('reserved', 'checked_in')
    if canceling and was_active:
        cur.execute("""
            UPDATE room_inventory
            SET available_rooms = LEAST(available_rooms + 1, total_rooms)
            WHERE room_type = %s
        """, (room_type,))
    # Jika di-revert ke 'reserved' dari status cancel → kurangi stok lagi
    elif new_status == 'reserved' and old_status in ('canceled_staff', 'canceled_guest', 'no_show'):
        cur.execute("""
            UPDATE room_inventory
            SET available_rooms = GREATEST(available_rooms - 1, 0)
            WHERE room_type = %s
        """, (room_type,))

    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'success': True, 'booking_id': booking_id, 'new_status': new_status})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
