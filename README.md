# Hotel Booking & Cancellation Prediction System

Aplikasi web sistem reservasi hotel *end-to-end* yang mengintegrasikan model *Machine Learning* (XGBoost) untuk memprediksi probabilitas pembatalan reservasi tamu secara *real-time*. Dilengkapi modul Property Management System (PMS) dan Dashboard Analitik untuk operasional staf hotel.

Proyek ini dibangun menggunakan Python (Flask), MySQL, dan Vanilla JavaScript/CSS dengan penekanan pada performa, validasi data yang ketat, dan integrasi inferensi model *machine learning*.

---

## Daftar Isi
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Arsitektur & Fitur Utama](#arsitektur--fitur-utama)
- [Struktur Database](#struktur-database)
- [Panduan Instalasi & Menjalankan](#panduan-instalasi--menjalankan)
- [Konfigurasi Database](#konfigurasi-database)
- [Daftar Rute & Kredensial Staf](#daftar-rute--kredensial-staf)
- [Dokumentasi API](#dokumentasi-api)
- [Pipeline Machine Learning](#pipeline-machine-learning)
- [Struktur Proyek](#struktur-proyek)

---

## Teknologi yang Digunakan

- **Backend**: Python 3.10+, Flask, MySQL Connector Python (Connection Pooling)
- **Machine Learning**: XGBoost, Scikit-learn, Joblib, NumPy, Pandas
- **Database**: MySQL / MariaDB (InnoDB Engine, ACID-compliant)
- **Frontend**: HTML5 Semantik, Vanilla CSS (Modern CSS Variables, Flexbox/Grid), Vanilla JavaScript (ES6+)

---

## Arsitektur & Fitur Utama

### 1. Portal Reservasi Tamu (Guest Portal)
- **Katalog Kamar Terpisah**: Pemilihan kamar disesuaikan secara dinamis berdasarkan jenis hotel (City Hotel atau Resort Hotel).
- **Date Range Picker Interaktif**: Kalender kustom dua panel untuk pemilihan tanggal check-in dan check-out, kalkulasi otomatis durasi malam, dan perhitungan total biaya menginap.
- **Validasi Kontak Standar E.164**: Input nomor telepon/WhatsApp dibatasi maksimal 15 digit angka dengan normalisasi otomatis untuk format komunikasi internasional.
- **Pengecekan Stok Kamar Real-Time**: Sinkronisasi stok kamar yang tersedia melalui API backend secara berkala.
- **Cek Status Reservasi Mandiri**: Tamu dapat memeriksa status reservasi mereka menggunakan ID Reservasi dan email terdaftar.

### 2. Modul Staf & Property Management System (PMS)
- **Manajemen Siklus Kamar**: Pelacakan dan pembaruan status kamar secara operasional (`Reserved` -> `Checked-in` -> `Checked-out` / `Canceled`).
- **Integrasi Komunikasi Langsung**: Tautan cepat untuk menghubungi tamu via telepon (`tel:`), chat WhatsApp langsung (`https://wa.me/...`), dan email (`mailto:`).
- **Pencarian Cepat**: Filter pencarian instan berdasarkan kode booking, nama tamu, nomor telepon, dan email.

### 3. Dashboard Analitik & Prediksi Risiko AI
- **Skoring Risiko Pembatalan**: Setiap reservasi yang masuk langsung dinilai probabilitas pembatalannya oleh model XGBoost ke dalam tingkatan risiko (*Low*, *Medium*, *High*).
- **Tindak Lanjut Risiko Tinggi (High Risk Follow-up)**: Antarmuka khusus bagi staf untuk memprioritaskan konfirmasi ulang atau penagihan deposit pada reservasi berisiko tinggi.
- **Metrik Kunci Operasional**: Visualisasi jumlah reservasi aktif, rata-rata probabilitas pembatalan, dan distribusi tingkat risiko.

---

## Struktur Database

Sistem menggunakan database relasional `hotel_booking` dengan dua tabel utama:

1. **`bookings`**:
   - Menyimpan seluruh atribut reservasi tamu (tanggal kedatangan, jumlah tamu, tipe kamar, durasi menginap, lead time, ADR, preferensi kamar).
   - Menyimpan hasil inferensi model AI (`probability`, `prediction`, `risk_level`, `policy`).
   - Menyimpan status siklus operasional PMS (`pms_status`, `checkin_at`, `checkout_at`, `canceled_at`, `cancel_reason`).
   - Mendukung pencatatan riwayat penghapusan data secara aman (*soft delete* melalui `deleted_at`, `deleted_by`, `delete_reason`).

2. **`room_inventory`**:
   - Melacak kapasitas total dan ketersediaan kamar secara *real-time* untuk setiap tipe kamar (A hingga L).
   - Pengurangan stok kamar saat reservasi dilakukan secara atomik menggunakan transaksi SQL `SELECT ... FOR UPDATE`.

---

## Panduan Instalasi & Menjalankan

### 1. Prasyarat Sistem
- Python versi 3.10 atau yang lebih baru
- MySQL Server (misalnya melalui XAMPP atau instalasi MySQL lokal terpisah)
- Git

### 2. Clone Repository
```bash
git clone https://github.com/fathiryasyaa/tugas_web.git
cd tugas_web
```

### 3. Konfigurasi Virtual Environment
Disarankan untuk menggunakan virtual environment agar dependensi paket terisolasi dengan rapi:

**Windows (PowerShell / Command Prompt):**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Instalasi Dependensi
Pastikan virtual environment telah aktif, lalu jalankan:
```bash
pip install -r web/requirements.txt
```

### 5. Menjalankan Server Aplikasi
Masuk ke direktori `web` dan jalankan script utama:
```bash
cd web
python app.py
```
Aplikasi akan aktif dan dapat diakses pada browser melalui alamat `http://localhost:5000`.

---

## Konfigurasi Database

Secara default, aplikasi menggunakan konfigurasi koneksi MySQL standar (seperti pada XAMPP):
- **Host**: `localhost`
- **Port**: `3306`
- **User**: `root`
- **Password**: *(kosong)*
- **Database**: `hotel_booking`

Jika menggunakan kredensial berbeda, sesuaikan variabel `DB_CONFIG` di dalam file `web/app.py`.

### Inisialisasi Skema Database:
Anda dapat mengimpor file `web/hotel_booking.sql` ke dalam phpMyAdmin/MySQL CLI, atau cukup buat database kosong dengan nama `hotel_booking`. Fungsi inisialisasi pada `app.py` akan otomatis mendeteksi dan membuat struktur tabel yang diperlukan saat server pertama kali dijalankan.

---

## Daftar Rute & Kredensial Staf

| Rute | Akses | Deskripsi |
|---|---|---|
| `/` | Publik | Halaman utama hotel, portofolio fasilitas, dan galeri kamar |
| `/booking` | Publik | Alur formulir reservasi kamar tamu multi-langkah |
| `/my-booking` | Publik | Pelacakan status reservasi tamu mandiri |
| `/staff/login` | Publik | Halaman autentikasi staf |
| `/pms` | Staf | Property Management System untuk manajemen operasional kamar |
| `/dashboard` | Staf | Dashboard analitik risiko pembatalan Machine Learning |

### Kredensial Akun Staf:
- **Password**: `fathir123`
*(Sistem menggunakan autentikasi sesi berbasis kunci staf)*

---

## Dokumentasi API

### Publik
- `POST /api/booking`: Menerima data payload reservasi, menjalankan inferensi XGBoost, mengurangi stok kamar, dan menyimpan data reservasi.
- `GET /api/room-availability`: Mengembalikan data kapasitas dan sisa kamar yang tersedia secara *real-time*.
- `GET /api/my-booking`: Mengambil informasi detail reservasi berdasarkan kombinasi ID booking dan email tamu.

### Terproteksi (Login Diperlukan)
- `GET /api/bookings`: Mengambil daftar seluruh reservasi aktif (non-deleted).
- `GET /api/pms/bookings`: Mengambil daftar reservasi untuk operasional PMS.
- `POST /api/pms/status`: Memperbarui status operasional reservasi (`checkin`, `checkout`, `cancel`).
- `GET /api/stats`: Mengembalikan statistik agregat (total booking, distribusi risiko, rata-rata probabilitas pembatalan).
- `DELETE /api/booking/<booking_id>`: Melakukan *soft-delete* reservasi dengan menyertakan alasan penghapusan dan nama staf.

---

## Pipeline Machine Learning

Model klasifikasi dikembangkan menggunakan Jupyter Notebook (`ProjectAkhir.ipynb`) dengan alur sebagai berikut:
1. **Dataset**: Hotel Booking Demand dataset (mencakup data lead time, saluran distribusi, riwayat pembatalan, segmen pasar, ADR, dan permintaan khusus).
2. **Preprocessing**:
   - Pembersihan data pencilan (*outliers*) dan penanganan nilai kosong.
   - Penskalaan fitur numerik menggunakan `StandardScaler`.
   - *Frequency encoding* pada fitur berkategori tinggi (seperti negara asal).
   - *One-hot encoding* pada variabel kategori nominal.
3. **Model**: XGBoost Classifier yang dioptimasi untuk akurasi klasifikasi biner (`0 = Check-Out / Tidak Batal`, `1 = Canceled / Batal`).
4. **Artefak yang Digunakan Web**:
   - `web/model/xgb_model.pkl`: Model XGBoost serialisasi.
   - `web/model/scaler.pkl`: StandardScaler fitted.
   - `web/model/feature_names.json`: Daftar urutan fitur masukan model.
   - `web/model/freq_country.json`: Bobot pemetaan frekuensi negara asal.

---

## Struktur Proyek

```text
tugas_web/
|-- README.md                  # Dokumentasi utama proyek
|-- ProjectAkhir.ipynb         # Eksplorasi data, pelatihan, dan evaluasi model ML
|-- dataset/                   # Dataset hotel booking
|-- web/
    |-- app.py                 # Backend Flask, routing, logika bisnis, & inferensi ML
    |-- requirements.txt       # Daftar pustaka Python yang dibutuhkan
    |-- hotel_booking.sql      # Skema tabel dan data inisialisasi database
    |-- model/                 # Artefak model machine learning
    |   |-- xgb_model.pkl
    |   |-- scaler.pkl
    |   |-- feature_names.json
    |   |-- freq_country.json
    |-- templates/             # Template Jinja2 HTML
    |   |-- index.html
    |   |-- booking.html
    |   |-- my_booking.html
    |   |-- login.html
    |   |-- pms.html
    |   |-- dashboard.html
    |-- static/                # Aset statis aplikasi
        |-- css/               # Modular styling CSS
        |-- js/                # Logika antarmuka JavaScript
```
