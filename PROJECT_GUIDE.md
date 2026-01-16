# Wall Decor Admin — Project Guide

Dokumen ini dibuat untuk membantu orang lain cepat paham proyek ini saat dibuka di GitHub.

## Ringkas

Ini adalah dashboard admin internal untuk usaha wall decor.
Frontend dibuat sebagai SPA (Vite + React + TypeScript + Tailwind) dan bisa jalan:

- `local` (tanpa backend) lewat localStorage
- `firebase` (Auth + Firestore)
- `api` (scaffold kontrak endpoint)

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- React Router (HashRouter untuk GitHub Pages)
- Chart.js (grafik dashboard)
- Firebase Auth + Firestore (opsional, mode `firebase`)

## Struktur Folder Penting

- `src/auth/` → auth state, role, proteksi route
- `src/data/` → repository facade + implementasi per data source
- `src/pages/` → halaman dashboard
- `src/app/AppShell.tsx` → layout sidebar
- `firestore.rules` → rules Firestore yang dipakai

## Data Source Mode

Set lewat env:

- `VITE_DATA_SOURCE=local` → demo / tanpa backend
- `VITE_DATA_SOURCE=firebase` → Firebase Auth + Firestore
- `VITE_DATA_SOURCE=api` → scaffold panggil backend

Lihat `.env.example`.

## Firebase (Spark / tanpa Cloud Functions)

Karena Firebase Spark sering tidak bisa deploy Cloud Functions, project ini support flow tanpa Functions.

### Flow role (Spark)

1) User daftar lewat `/#/signup`
2) App membuat dokumen `users/{uid}` dengan `role: 'PENDING'`
3) User `PENDING` otomatis ditolak saat masuk `/app/*` (redirect balik ke login)
4) CEO meng-approve via halaman **Karyawan** dengan mengubah role:
   - `PENDING` → `CTO/CMO/CEO`

### Bootstrap CEO pertama (sekali saja)

- Buat akun CEO via `/#/signup`
- Buka Firebase Console → Firestore Database → `users/{uid}` milik CEO → ubah `role` menjadi `CEO`
- Login ulang sebagai CEO, lalu approve user lain lewat UI

### Kenapa user Auth kadang tidak ada di Firestore?

Biasanya karena Firestore Rules menolak `create` pada `users/{uid}`.

Checklist cepat:

- Pastikan rules `firestore.rules` sudah dipublish di Firebase Console
- Lihat error di DevTools Console (biasanya `Missing or insufficient permissions`)
- Pastikan user membuat dokumen sendiri (`uid` cocok) dan role awal `PENDING`

## GitHub Pages

Proyek ini pakai `HashRouter`, jadi URL jadi `/#/app/dashboard` dan aman saat refresh.

Untuk repo bernama `smile0n`, Vite `base` sudah diset. Kalau nama repo berbeda, ubah di `vite.config.ts`.

## Logo

Logo diambil dari `public/smileon_logo.jpg` dan dirender menggunakan `import.meta.env.BASE_URL` supaya path benar di GitHub Pages.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
