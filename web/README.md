# The Grand Azura Hotel — Web Application

Modul aplikasi web sistem reservasi hotel berbasis Flask (Python) yang terintegrasi dengan model Machine Learning (XGBoost) untuk klasifikasi risiko pembatalan reservasi serta modul Property Management System (PMS) untuk operasional staf hotel.

Untuk dokumentasi arsitektur lengkap, silakan merujuk ke [README.md di root repository](../README.md).

---

## Prasyarat & Menjalankan Aplikasi

### 1. Database
Pastikan MySQL service aktif pada port 3306. Buat database `hotel_booking` atau impor file `hotel_booking.sql`.

### 2. Instalasi Dependensi
```bash
pip install -r requirements.txt
```

### 3. Menjalankan Server
```bash
python app.py
```
Aplikasi berjalan pada `http://localhost:5000`.

---

## Ringkasan Rute Aplikasi

| Rute | Akses | Fungsi |
|---|---|---|
| `/` | Publik | Landing page hotel |
| `/booking` | Publik | Formulir reservasi kamar bertahap |
| `/my-booking` | Publik | Cek status reservasi tamu |
| `/staff/login` | Publik | Autentikasi staf (Password: `fathir123`) |
| `/pms` | Staf | Property Management System (check-in, check-out, kontak tamu) |
| `/dashboard` | Staf | Analitik risiko pembatalan Machine Learning |

---

## Ringkasan REST API

| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/booking` | Publik | Pembuatan reservasi baru dan kalkulasi inferensi AI |
| GET | `/api/room-availability` | Publik | Pengecekan ketersediaan stok kamar |
| GET | `/api/my-booking` | Publik | Pencarian data reservasi tamu |
| GET | `/api/bookings` | Staf | Daftar seluruh data reservasi aktif |
| GET | `/api/pms/bookings` | Staf | Data reservasi untuk manajemen PMS |
| POST | `/api/pms/status` | Staf | Perubahan status operasional kamar |
| GET | `/api/stats` | Staf | Ringkasan metrik statistik operasional |
| DELETE | `/api/booking/<id>` | Staf | Soft-delete reservasi |
