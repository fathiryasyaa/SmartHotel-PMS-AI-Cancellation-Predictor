# The Grand Azura Hotel — Web App

Aplikasi web hotel yang terintegrasi dengan model AI prediksi pembatalan (XGBoost).

## Cara Menjalankan

### 1. Simpan model dari notebook
Buka `ProjectAkhir.ipynb`, jalankan **BAB 11** (cell paling bawah) untuk meng-generate:
```
web/model/xgb_model.pkl
web/model/scaler.pkl
web/model/feature_names.json
web/model/freq_country.json
```

### 2. Install dependensi
```bash
cd web
pip install -r requirements.txt
```

### 3. Jalankan server
```bash
python app.py
```

### 4. Akses di browser
| URL | Keterangan |
|-----|------------|
| `http://localhost:5000/` | Halaman utama hotel (tamu) |
| `http://localhost:5000/booking` | Form reservasi kamar |
| `http://localhost:5000/dashboard` | Dashboard staff (risiko pembatalan) |

## Struktur Folder
```
web/
├── app.py                  ← Flask backend
├── requirements.txt
├── model/                  ← Artefak model (di-generate dari notebook)
│   ├── xgb_model.pkl
│   ├── scaler.pkl
│   ├── feature_names.json
│   └── freq_country.json
├── templates/
│   ├── index.html          ← Landing page hotel
│   ├── booking.html        ← Form reservasi (3 langkah)
│   └── dashboard.html      ← Dashboard monitoring staff
└── static/
    ├── css/
    │   ├── main.css         ← Global styles + navbar + footer
    │   ├── index.css        ← Landing page styles
    │   ├── booking.css      ← Form styles
    │   └── dashboard.css    ← Dashboard styles
    └── js/
        ├── main.js          ← Global scripts
        ├── booking.js       ← Multi-step form logic
        └── dashboard.js     ← Dashboard charts & tables
```

## API Endpoints
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/booking` | Kirim data reservasi, dapat prediksi AI |
| GET  | `/api/bookings` | Ambil semua data reservasi |
| GET  | `/api/stats` | Statistik agregat untuk dashboard |
