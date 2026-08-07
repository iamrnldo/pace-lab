# Panduan Deploy — PaceLab / RunCalc

Arsitektur produksi:

```
Frontend (React/Vite)  →  Netlify          https://<sitenya>.netlify.app
Backend  (Express)     →  Vercel Functions https://<apinya>.vercel.app
Database (PostgreSQL)  →  Neon (managed, SSL)
```

> ⚠️ Secret yang pernah dikirim lewat chat sebaiknya di-rotate setelah deploy
> selesai (JWT_SECRET, JWT_REFRESH_SECRET, GOOGLE_CLIENT_SECRET, ADMIN_PASSWORD).

---

## 1️⃣ Database (Neon — gratis, cocok untuk Vercel)

1. Buka https://console.neon.tech → **New project**.
2. Nama: `pacelab`, Region: **Singapore (ap-southeast-1)** (terdekat ke user).
3. Setelah project jadi, buka **Dashboard → Connection string** dan copy
   string `postgres://...` (pilih yang **pooled** TIDAK wajib; direct saja).
4. Inisialisasi schema + seed admin, pilih salah satu:
   - **Opsi A (disarankan):** paste connection string-nya ke Arena,
     saya jalankan `npm run db:init` dari sandbox ini.
   - **Opsi B (sendiri):** dari folder `backend/`:
     ```bash
     cd backend
     DATABASE_URL="postgres://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb" npm run db:init
     ```
   Script ini membuat semua tabel (schema.sql), seed `calculator_types`,
   dan membuat akun admin.

> Catatan: biarkan `DB_NAME` kosong / tidak perlu diisi kalau pakai
> `DATABASE_URL` — nama database diambil dari URL (mis. `neondb`).

---

## 2️⃣ Backend → Vercel

Project sudah ter-import di Vercel. Yang perlu diubah di dashboard:

1. **Project → Settings → General → Root Directory** = `backend`
   (abaikan saran `services` di vercel.json root — itu untuk monorepo
   multi-deploy; frontend kita tetap di Netlify).
2. **Framework Preset**: *Other* (biarkan `backend/vercel.json` yang bekerja).
3. **Environment Variables** (hapus `NODE_ENV=development` yang lama!):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgres://...` (dari Neon) |
| `CLIENT_URL` | `https://<sitenya>.netlify.app` |
| `JWT_SECRET` | *(nilai secret kamu)* |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | *(nilai secret kamu)* |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `GOOGLE_CLIENT_ID` | `9160345695-....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-....` |
| `GOOGLE_CALLBACK_URL` | `https://<apinya>.vercel.app/api/v1/auth/google/callback` |
| `ADMIN_EMAIL` | `admin@pacelab.com` |
| `ADMIN_PASSWORD` | **ganti dari admin123!** |
| `ADMIN_NAME` | `PaceLab Admin` |

4. Deploy ulang (push commit / tombol **Redeploy**).
5. Cek: `https://<apinya>.vercel.app/api/v1/health` → `{"status":"ok"}`.

Catatan teknis yang sudah di-handle di kode:
- Entry serverless: `backend/api/index.js` + rewrite di `backend/vercel.json`.
- Schema SQL ikut ter-bundle (disalin otomatis saat `npm install` oleh
  `scripts/prepare-db-sql.js`, di-include lewat `includeFiles`).
- Init DB berjalan lazy & idempotent (`ensureDatabaseReady`) — aman untuk
  cold start; schema sebaiknya sudah dibuat dulu lewat `npm run db:init`.
- Cookie refresh token: `SameSite=None; Secure` saat production
  (wajib karena frontend & backend beda domain).
- CORS: `CLIENT_URL` boleh berisi beberapa URL dipisah koma
  (mis. tambah URL deploy-preview Netlify).

---

## 3️⃣ Frontend → Netlify (env belum terkonfigurasi)

Vite membaca `VITE_*` **saat build**, jadi setelah menambah env wajib
**rebuild**, bukan sekadar refresh.

1. Netlify dashboard → site kamu → **Site configuration → Environment variables**:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<apinya>.vercel.app/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | `9160345695-....apps.googleusercontent.com` |
| `VITE_APP_NAME` | `RunCalc Pro` |

2. **Deploys → Trigger deploy → “Clear cache and deploy site”**.
3. `netlify.toml` sudah benar (build `npm run build`, publish `dist`,
   SPA redirect `/* → /index.html`).

---

## 4️⃣ Google OAuth Console

Buka https://console.cloud.google.com/apis/credentials (OAuth client kamu):

- **Authorized JavaScript origins** tambahkan:
  - `https://<sitenya>.netlify.app`
  - `https://<apinya>.vercel.app`
- **Authorized redirect URIs** tambahkan:
  - `https://<apinya>.vercel.app/api/v1/auth/google/callback`

(Simpan; perubahan bisa butuh ±5 menit propagasi.)

---

## 5️⃣ Uji coba

1. Buka `https://<sitenya>.netlify.app/login`.
2. Login admin form: `admin@pacelab.com` + password yang kamu set
   (default `admin123` kalau tidak diganti).
3. Cek Network tab: request ke `https://<apinya>.vercel.app/api/v1/...`
   harus 200 dan cookie `refreshToken` tersimpan (cross-site).

---

## ⚠️ Batasan yang perlu diketahui

- **Upload avatar di Vercel** disimpan di `/tmp` (ephemeral). File hilang
  saat function dingin kembali. Untuk produksi serius, ganti ke
  Vercel Blob / Supabase Storage / Cloudinary nanti.
- Plan Hobby Vercel: function max duration ±10s. Kalau cold start pertama
  terasa lambat/timeout, jalankan `npm run db:init` dulu supaya request
  pertama tidak perlu membuat schema.
- Deploy preview Vercel/Netlify otomatis diizinkan CORS selama hostname
  induknya terdaftar di `CLIENT_URL`.
