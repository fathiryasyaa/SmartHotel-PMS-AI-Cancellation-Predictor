# 🏨 The Grand Azura Hotel — Web App & AI Cancellation Prediction

Aplikasi web sistem reservasi hotel modern yang terintegrasi dengan **Machine Learning (XGBoost)** untuk memprediksi risiko pembatalan reservasi tamu secara *real-time*. Dilengkapi modul **Property Management System (PMS)** dan **Dashboard Analitik** untuk staf hotel.

Dibuat untuk keperluan **Tugas Besar / Tugas Kelompok Pemrograman Web (PEM.WEB)**.

---

## 📌 Daftar Isi
1. [Prasyarat Sistem](#1-prasyarat-sistem)
2. [Langkah-Langkah Menjalankan (Untuk Anggota Kelompok)](#2-langkah-langkah-menjalankan-untuk-anggota-kelompok)
3. [Setup Database MySQL (XAMPP)](#3-setup-database-mysql-xampp)
4. [Daftar Halaman & Akun Login](#4-daftar-halaman--akun-login)
5. [Fitur-Fitur Utama](#5-fitur-fitur-utama)
6. [Struktur Folder Proyek](#6-struktur-folder-proyek)
7. [Panduan Kolaborasi Git](#7-panduan-kolaborasi-git)
8. [Troubleshooting (Solusi Masalah Umum)](#8-troubleshooting-solusi-masalah-umum)

---

## 1. Prasyarat Sistem
Sebelum menjalankan proyek di laptop kalian, pastikan sudah terpasang:
* **Python** (versi 3.10 atau lebih baru)
* **XAMPP** (untuk Apache & MySQL Database)
* **Git**
* Web Browser modern (Google Chrome, Microsoft Edge, Firefox, dll)

---

## 2. Langkah-Langkah Menjalankan (Untuk Anggota Kelompok)

### Langkah 1: Clone Repository
Buka terminal / Command Prompt / Git Bash, lalu jalankan:
```bash
git clone https://github.com/fathiryasyaa/tugas_web.git
cd tugas_web
```

### Langkah 2: Buat & Aktifkan Virtual Environment (venv)
Sangat disarankan memakai `venv` agar paket Python tidak bentrok:
* **Pengguna Windows (PowerShell / Command Prompt)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
  *(Jika muncul error script execution policy di PowerShell, jalankan `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` lalu ulangi activate).*
* **Pengguna Linux / macOS**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Langkah 3: Install Dependensi Python
Pastikan virtual environment sudah aktif (ada tanda `(venv)` di awal baris terminal), lalu install dependensi:
```bash
pip install -r web/requirements.txt
```

### Langkah 4: Nyalakan Database MySQL
1. Buka aplikasi **XAMPP Control Panel**.
2. Klik tombol **Start** pada modul **MySQL** (dan Apache jika perlu).
3. Pastikan MySQL berjalan di port default `3306`.
4. *(Lihat bagian [Setup Database](#3-setup-database-mysql-xampp) di bawah jika database belum dibuat).*

### Langkah 5: Jalankan Server Flask
Masuk ke folder `web` dan jalankan `app.py`:
```bash
cd web
python app.py
```
Jika berhasil, terminal akan menampilkan output:
```
* Running on http://127.0.0.1:5000
```
Buka browser dan akses **`http://localhost:5000`**.

---

## 3. Setup Database MySQL (XAMPP)

Konfigurasi koneksi database default di [`web/app.py`](web/app.py):
* **Host**: `localhost`
* **Port**: `3306`
* **User**: `root`
* **Password**: ` ` *(kosong — default XAMPP)*
* **Database**: `hotel_booking`

### Cara 1: Menggunakan phpMyAdmin (Disarankan)
1. Buka browser dan kunjungi `http://localhost/phpmyadmin`.
2. Klik menu **"New"** / **"Baru"** di sebelah kiri.
3. Buat database baru bernama: **`hotel_booking`** (Collation: `utf8mb4_unicode_ci` atau default).
4. Klik tab **"Import"**, pilih file **`web/hotel_booking.sql`**, lalu klik **"Go / Kirim"**.

### Cara 2: Inisialisasi Otomatis via `app.py`
Cukup buat database kosong `hotel_booking` di phpMyAdmin, saat `python app.py` dijalankan pertama kali, sistem akan secara otomatis membuat tabel `bookings` dan `room_inventory` beserta data defaultnya.

---

## 4. Daftar Halaman & Akun Login

| Halaman | URL | Keterangan |
|---|---|---|
| **Landing Page** | `http://localhost:5000/` | Halaman utama hotel untuk tamu, galeri kamar, dan fasilitas |
| **Form Reservasi** | `http://localhost:5000/booking` | Pemilihan kamar, input data tamu, date range picker & kalkulasi harga |
| **Cek Reservasi Tamu** | `http://localhost:5000/my-booking` | Tamu dapat mengecek status booking menggunakan ID Reservasi & Email |
| **Login Staf** | `http://localhost:5000/staff/login` | Akses masuk portal operasional hotel |
| **Staff PMS** | `http://localhost:5000/pms` | Property Management: kelola check-in/out, kontak tamu (Telepon & WA langsung) |
| **Staff Dashboard** | `http://localhost:5000/dashboard` | Monitoring risiko pembatalan Machine Learning & statistik reservasi |

### 🔑 Kredensial Login Staf:
* **Password**: `fathir123`
*(Tidak memerlukan username, cukup masukkan password staf di atas)*.

---

## 5. Fitur-Fitur Utama

### 🌟 Sisi Tamu (Guest)
* **Katalog Kamar Dinamis**: Filter kamar berdasarkan tipe hotel (*City Hotel* di perkotaan atau *Resort Hotel* di tepi pantai).
* **Date Range Picker Modern**: Kalender interaktif pemilihan tanggal check-in & check-out, kalkulasi otomatis durasi malam & perkiraan total harga.
* **Input Kontak Terstandarisasi**: Input nomor telepon/WhatsApp dengan batas otomatis maksimal 15 digit angka (standar internasional E.164).
* **Cek Status Booking Mandiri**: Tamu dapat melacak status reservasi mereka tanpa harus login.

### 💼 Sisi Staf & Hotel (Staff / PMS)
* **Property Management System (PMS)**:
  * Pelacakan status kamar: `Reserved` ➔ `Checked-in` ➔ `Checked-out` / `Canceled`.
  * Tombol aksi kontak langsung: Shortcut telepon (`tel:`), chat WhatsApp otomatis (`https://wa.me/62...`), dan email (`mailto:`).
  * Filter pencarian cepat berdasarkan nama tamu, kode booking, nomor HP, atau email.
* **Integrasi AI / Machine Learning (XGBoost)**:
  * Model memprediksi tingkat probabilitas pembatalan reservasi tamu.
  * Klasifikasi risiko: **Low Risk**, **Medium Risk**, dan **High Risk**.
  * Kartu penanganan risiko tinggi untuk mempermudah staf hotel melakukan tindak lanjut (*follow-up*) deposit atau konfirmasi.

---

## 6. Struktur Folder Proyek

```text
tugas_web/
├── .gitignore               ← Mengabaikan venv, cache, file sementara
├── README.md                ← Panduan utama proyek (file ini)
├── ProjectAkhir.ipynb       ← Jupyter Notebook analisis data & training model XGBoost
├── dataset/                 ← Dataset pelatihan hotel booking (.csv)
├── venv/                    ← Virtual environment Python (tidak di-push ke git)
└── web/                     ← Source code aplikasi web Flask
    ├── app.py               ← Server Flask, routing, endpoint API, koneksi MySQL
    ├── requirements.txt     ← Daftar pustaka Python yang dibutuhkan
    ├── hotel_booking.sql    ← Skema database MySQL lengkap
    ├── model/               ← Artefak model Machine Learning yang telah dilatih
    │   ├── xgb_model.pkl    ← Model XGBoost tersimpan
    │   ├── scaler.pkl       ← StandardScaler
    │   ├── feature_names.json ← Daftar fitur input model
    │   └── freq_country.json  ← Frekuensi encoding negara asal
    ├── templates/           ← File template HTML (Jinja2)
    │   ├── index.html       ← Halaman utama
    │   ├── booking.html     ← Form multi-step reservasi
    │   ├── my_booking.html  ← Cek status reservasi tamu
    │   ├── login.html       ← Login staf
    │   ├── pms.html         ← Property Management System (PMS)
    │   └── dashboard.html   ← Dashboard analitik staf
    └── static/              ← File statis (CSS & JavaScript)
        ├── css/             ← Berkas stylesheet per halaman
        └── js/              ← Berkas script logika interaktif
```

---

## 7. Panduan Kolaborasi Git

Agar pengerjaan tugas kelompok berjalan lancar dan tidak terjadi konflik kode (*merge conflict*), ikuti aturan praktis berikut:

1. **Selalu Tarik Perubahan Terbaru Sebelum Mulai Ngoding**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Jika Ingin Mengerjakan Fitur Baru, Buat Branch Sendiri**:
   ```bash
   git checkout -b fitur-nama-kalian
   # contoh: git checkout -b fitur-laporan-keuangan
   ```
3. **Commit Perubahan dengan Pesan yang Jelas**:
   ```bash
   git add .
   git commit -m "feat: menambah tombol cetak invoice di pms"
   ```
4. **Push ke Branch Kalian**:
   ```bash
   git push origin fitur-nama-kalian
   ```
5. **Konfirmasi ke Tim**: Kabari teman kelompok di grup WhatsApp sebelum melakukan merge ke `main`.

---

## 8. Troubleshooting (Solusi Masalah Umum)

### Q: `Can't connect to MySQL server on 'localhost'`
> **Solusi**: Pastikan XAMPP sudah dibuka dan service **MySQL** sudah dalam kondisi **Running** (berwarna hijau).

### Q: `Access denied for user 'root'@'localhost'`
> **Solusi**: Jika MySQL di laptop kalian menggunakan password khusus (bukan kosong), buka file [`web/app.py`](web/app.py) baris ~43, ubah parameter `'password': ''` sesuai password MySQL laptop kalian.

### Q: `ModuleNotFoundError: No module named 'flask'` (atau modul lainnya)
> **Solusi**: Virtual environment belum aktif atau dependensi belum terinstall. Jalankan `.\venv\Scripts\activate` lalu `pip install -r web/requirements.txt`.

### Q: Model `.pkl` tidak ditemukan saat server dijalankan?
> **Solusi**: Pastikan folder `web/model/` berisi file `xgb_model.pkl` dan artefak lainnya. Seluruh artefak model sudah tersedia di repository ini dan tidak perlu di-train ulang dari awal.

---

Jika ada pertanyaan atau kendala saat menjalankan web, silakan diskusikan di grup koordinasi tugas kelompok! Selamat mengerjakan! 🚀
