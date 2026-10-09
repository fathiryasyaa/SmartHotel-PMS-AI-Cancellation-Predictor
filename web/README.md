# The Grand Azura Hotel — Web App

Aplikasi web sistem reservasi hotel berbasis Flask (Python) yang terintegrasi dengan model Machine Learning (XGBoost) untuk prediksi pembatalan serta sistem manajemen hotel (PMS) untuk staf.

> **Petunjuk Lengkap untuk Tim**: Silakan baca panduan lengkap di [README.md di root folder](../README.md).

---

## Cara Menjalankan

### 1. Nyalakan MySQL di XAMPP
Pastikan service MySQL di XAMPP Control Panel sudah berjalan (Running di port 3306).
Buat database `hotel_booking` di phpMyAdmin, atau import `hotel_booking.sql`.

### 2. Install Dependensi (Gunakan Virtual Environment)
```bash
pip install -r requirements.txt
```

### 3. Jalankan Server Flask
```bash
python app.py
```

### 4. Akses di Browser
| URL | Keterangan |
|---|---|
| `http://localhost:5000/` | Halaman utama hotel (tamu) |
| `http://localhost:5000/booking` | Form reservasi kamar multi-step |
| `http://localhost:5000/my-booking` | Halaman cek status reservasi tamu |
| `http://localhost:5000/staff/login` | Login staf (Password: `fathir123`) |
| `http://localhost:5000/pms` | Property Management System (staf operasional) |
| `http://localhost:5000/dashboard` | Dashboard analitik risiko pembatalan AI |

---

## API Endpoints Utama
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/booking` | Publik | Buat reservasi baru & prediksi risiko AI |
| GET | `/api/my-booking` | Publik | Cek status reservasi tamu (ID & Email) |
| GET | `/api/room-availability` | Publik | Cek stok ketersediaan kamar real-time |
| GET | `/api/pms/bookings` | Staf | Daftar reservasi operasional PMS |
| POST | `/api/pms/status` | Staf | Update status kamar (checkin, checkout, cancel) |
| GET | `/api/bookings` | Staf | Ambil semua data reservasi aktif |
| GET | `/api/stats` | Staf | Statistik agregat untuk dashboard |
| DELETE | `/api/booking/<id>` | Staf | Soft-delete data reservasi |
