# DocuSync - Real-Time Collaborative PDF Annotation

Aplikasi web modern untuk mengunggah file PDF dan berkolaborasi memberikan komentar di setiap halaman atau baris dokumen seperti Google Docs. Dilengkapi dengan sinkronisasi instan dua arah via **WebSocket** dan penyimpanan histori percakapan permanen di basis data **SQLite**.

---

## 🌟 Fitur Utama

1. **Upload & Manajemen File PDF**:
   - Unggah file PDF mandiri (drag & drop hingga 30MB) dengan auto-hitung halaman.
   - Pilihan multi-dokumen (switch antar file yang sudah diunggah).
   - Sudah dilengkapi contoh dokumen *Panduan Kolaborasi DocuSync.pdf* saat pertama kali dibuka.

2. **Komentar Ala Google Docs**:
   - **Mode Pasang Pin**: Klik di mana saja pada halaman atau baris teks untuk menempatkan pin komentar.
   - **Nomor Baris Otomatis**: Mendeteksi perkiraan posisi baris halaman (`Hal 1 • Baris ~8`).
   - **Thread Balasan (Replies)**: Kolaborator dapat membalas komentar secara berjenjang.
   - **Selesaikan Komentar (Resolve)**: Tandai thread yang sudah selesai atau buka kembali.
   - **Edit & Hapus Komentar**: Kontrol penuh atas catatan Anda.

3. **Sinkronisasi Instan Real-Time (WebSocket)**:
   - Setiap pin komentar, balasan, dan status resolve disiarkan secara instan ke seluruh pengguna aktif tanpa perlu refresh halaman.
   - **Indikator Kolaborator Aktif**: Avatar stack menampilkan siapa saja yang sedang membuka dokumen dan di halaman berapa mereka berada.
   - **Live Cursor Movement**: Kursor kolaborator lain tampak meluncur di atas halaman PDF lengkap dengan label nama.

4. **Penyimpanan Basis Data Permanen**:
   - Menggunakan engine **SQLite WAL Mode** untuk performa tinggi dan keandalan ACID.
   - Seluruh histori komentar, balasan, waktu kirim, dan file PDF tersimpan aman di disk.

5. **Ekspor & Pelaporan**:
   - Unduh rangkuman review dalam format **Markdown (.md)** atau **JSON**.
   - Unduh file PDF asli kapan saja.

---

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server (Express + WebSocket + Vite)
npm run dev

# 3. Buka di browser
# http://localhost:3000
```

> **Tip Pengujian Real-Time**: Buka URL aplikasi di dua tab browser berdampingan (atau gunakan jendela Incognito). Klik tombol **"Ganti Profil"** di salah satu tab untuk beralih persona (misal: Siti Rahma & Ahmad Fauzi). Tambahkan komentar di Tab A dan perhatikan pin langsung muncul di Tab B secara instan!

---

## 📦 Panduan Simpan ke GitHub

Inisialisasi git dan push ke repositori GitHub Anda:

```bash
# 1. Inisialisasi Git
git init
git add .
git commit -m "feat: real-time collaborative PDF annotation"

# 2. Ganti nama branch utama ke main
git branch -M main

# 3. Hubungkan ke repositori GitHub Anda (ganti <USERNAME> dengan username GitHub Anda)
git remote add origin https://github.com/<USERNAME>/docusync-pdf-review.git

# 4. Push ke GitHub
git push -u origin main
```

---

## ☁️ Panduan Deployment Cloud

### Opsi 1: Deploy ke Heroku
Aplikasi ini sudah menyertakan `Procfile` (`web: npm run start`) dan siap dijalankan di Heroku:

```bash
# 1. Login ke Heroku CLI
heroku login

# 2. Buat aplikasi Heroku
heroku create docusync-app

# 3. Deploy langsung via Git
git push heroku main

# 4. Buka aplikasi di browser
heroku open
```

### Opsi 2: Deploy ke Railway atau Render (Sangat Direkomendasikan)
Railway dan Render menyediakan volume disk persisten secara gratis, sehingga file PDF dan SQLite DB tersimpan aman selamanya dengan WebSocket real-time:

1. Kunjungi [railway.app](https://railway.app) atau [render.com](https://render.com).
2. Pilih **"Deploy from GitHub repo"** dan pilih repositori Anda.
3. Konfigurasi build:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Port**: `3000` (atau otomatis terdeteksi via `$PORT`)
4. Klik **Deploy**! Aplikasi langsung live dengan HTTPS dan WebSocket aktif.

---

## 🛠️ Stack Teknologi

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, PDF.js (`pdfjs-dist`).
- **Backend**: Node.js 22, Express.js, WebSocket (`ws`), Multer.
- **Database**: SQLite bawaan Node 22 (`DatabaseSync`) dengan WAL mode.
