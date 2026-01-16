# Wall Decor Admin (Internal)

Website admin internal untuk usaha wall decor (khusus karyawan, bukan publik).

Baca panduan proyek (lebih lengkap): [PROJECT_GUIDE.md](PROJECT_GUIDE.md)

## Fitur

- Login & role-based access (CEO / CTO / CMO)
- Manajemen profil karyawan (Nama, Jabatan)
- Manajemen stok barang (Produk, Kategori, Stok masuk/keluar, Sisa stok otomatis)
- Pencatatan transaksi (Pembelian, Penjualan, Tanggal, Penanggung jawab)
- Laporan keuangan sederhana (Total penjualan, total pembelian, untung/rugi, saldo kas)
- Dashboard analytics (grafik stok, penjualan, profit per bulan)

## Cara Menjalankan

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

## Deploy GitHub Pages

Project ini sudah diset untuk GitHub Pages (repo site) dengan:
- `HashRouter` (URL jadi `/#/app/dashboard` supaya refresh tidak 404)
- Vite `base: '/Smile0n/'` (case-sensitive; sesuaikan jika nama repo berbeda)

Jika repo kamu **bukan** bernama `smile0n`, ubah `base` di `vite.config.ts`.

### Deploy + Firebase env (GitHub Actions)

Workflow GitHub Pages sudah disiapkan di `.github/workflows/deploy-pages.yml`.

Tambahkan GitHub Secrets (Settings → Secrets and variables → Actions):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (opsional)

## Akun Demo

- `ceo@walldecor.local` / `admin123`
- `cto@walldecor.local` / `admin123`
- `cmo@walldecor.local` / `admin123`

## Mode Firebase (Spark / tanpa Cloud Functions)

Jika `VITE_DATA_SOURCE=firebase`, user bisa daftar via `/#/signup`.

- User baru akan dibuat dengan role `PENDING`.
- CEO perlu approve role user dari halaman **Karyawan**.

Bootstrap CEO pertama (sekali saja): ubah `users/{uid}.role` menjadi `CEO` lewat Firebase Console.

## Data & Integrasi Backend

Default penyimpanan memakai localStorage (mode `local`) supaya UI bisa jalan tanpa backend.

- Data model: `src/data/types.ts`
- Repository facade: `src/data/repository.ts`
- Local implementation: `src/data/repositoryLocal.ts`
- API implementation: `src/data/repositoryApi.ts`

### Mode API

Lihat `.env.example` untuk konfigurasi `VITE_DATA_SOURCE` dan `VITE_API_BASE_URL`.

Kontrak endpoint ada di `API_CONTRACT.md`.

