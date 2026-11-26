# Panduan Deployment Cloudflare Pages + D1

## 1. Persiapan Database D1
1. Buat database D1 baru:
   ```bash
   npx wrangler d1 create ivory_binder_db
   ```
2. Salin `database_id` yang muncul ke file `wrangler.toml`.
3. Jalankan migrasi awal (data resmi Saepudin & Khodijah otomatis terisi):
   ```bash
   npx wrangler d1 migrations apply ivory_binder_db --remote
   ```
   *(Catatan: Jika menyalin SQL ke D1 Web Console, file `migrations/0001_init.sql` sudah bebas komentar `--` agar aman dieksekusi langsung.)*

## 2. Konfigurasi Secret Keamanan Admin
Jangan pernah menaruh kata sandi di kode frontend. Buat hash PBKDF2-SHA256 di terminal lokal (Node.js):
```bash
node -e "
const crypto = require('crypto');
const pass = 'GANTI_PASSWORD_ADMIN_KUAT';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(pass, salt, 100000, 32, 'sha256').toString('hex');
console.log('ADMIN_PASSWORD_HASH=' + 'pbkdf2_sha256$100000$' + salt + '$' + hash);
console.log('ADMIN_SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
"
```
Masukkan kedua variabel tersebut (`ADMIN_PASSWORD_HASH` dan `ADMIN_SESSION_SECRET`) ke **Cloudflare Dashboard → Pages → Settings → Environment variables (Encrypted / Secret)**.

## 3. Deploy ke Cloudflare Pages
- **Via Wrangler CLI**:
  ```bash
  npx wrangler pages deploy public --project-name=ivory-spiral-binder-saepudin-khodijah
  ```
- **Via Git Integration**: Hubungkan repositori ke Cloudflare Pages dengan Build output directory `public` dan bind D1 database `DB` ke `ivory_binder_db`.
