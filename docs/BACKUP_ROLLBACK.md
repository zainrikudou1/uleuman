# Prosedur Backup & Rollback

## 1. Backup Database D1 Berkala
Sebelum melakukan pembaruan aplikasi atau migrasi skema, ekspor seluruh data D1 (konfigurasi, RSVP, daftar tamu, dan media):
```bash
npx wrangler d1 export ivory_binder_db --remote --output=backup-ivory-binder-$(date +%Y%m%d).sql
```
Simpan juga arsip CSV RSVP secara berkala melalui tombol **Export RSVP ke CSV** di Dashboard Admin (`/admin`).

## 2. Aturan Upgrade Aman (Tanpa Menghapus Data Lama)
- Selalu gunakan migrasi tambahan (`0002_*.sql`) dengan `ALTER TABLE` atau `CREATE TABLE IF NOT EXISTS`.
- Jangan menjalankan `DROP TABLE` atau `DELETE FROM invitation_config` pada database produksi.

## 3. Rollback Cepat
- **Rollback Frontend/Functions**: Di Cloudflare Pages Dashboard → **Deployments**, pilih deployment stabil sebelumnya lalu klik **Rollback to this deployment**.
- **Rollback Database D1**: Jika terjadi kesalahan data, pulihkan dari file backup SQL:
  ```bash
  npx wrangler d1 execute ivory_binder_db --remote --file=backup-ivory-binder-YYYYMMDD.sql
  ```
