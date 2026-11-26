# Panduan Penggunaan — IVORY SPIRAL BINDER

## 1. Undangan Tamu (`/`)
- **Personalisasi Nama Tamu**: Tambahkan parameter `?to=Nama+Tamu` pada URL, misalnya:
  `https://domain-anda.pages.dev/?to=Bpk.+Ahmad+Fauzi`
- **Membuka Binder**: Tekan tombol **BUKA UNDANGAN** pada halaman cover. Sampul terbuka dengan animasi 3D, musik latar mulai berputar (jika aktif), dan halaman berpindah otomatis setiap ~3,8 detik.
- **Kontrol Navigasi**:
  - **Play / Pause**: Menjalankan atau menjeda perpindahan halaman otomatis.
  - **Prev / Next & Angka Halaman (1–10)**: Membalik halaman secara manual (otomatis menjeda autoplay agar tidak bertabrakan).
  - **Cover**: Kembali ke halaman sampul depan.
  - **Musik**: Tombol `♪ Musik: ON/OFF` serta penggeser volume di bilah atas.

## 2. Dashboard Admin (`/admin` atau `/admin.html`)
- Masuk menggunakan kata sandi admin yang telah dikonfigurasi di Cloudflare Environment Secrets (`ADMIN_PASSWORD_HASH`).
- **Tab Mempelai & Acara**: Mengubah data mempelai, orang tua, jadwal Resepsi & Tablig Akbar, alamat/link Maps, dan Kalam Hikmah.
- **Tab Galeri & Foto**: Mengunggah foto portrait mempelai (Hal 4 & 5) serta foto polaroid scrapbook (Hal 8). Gambar dikompresi otomatis di browser.
- **Tab Musik & Tema**: Mengaktifkan/menonaktifkan musik, mengunggah audio MP3/OGG, mengatur jeda autoplay, dan menyesuaikan palet warna.
- **Tab Tamu & Link WA**: Menambahkan daftar tamu dan langsung membuat tautan WhatsApp personal siap kirim.
- **Tab RSVP & Export CSV**: Memantau konfirmasi kehadiran, menghapus entri jika perlu, dan mengunduh rekap ke file `.csv`.
