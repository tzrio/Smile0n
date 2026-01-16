# Firebase + Firestore Setup (Wall Decor Admin)

Dokumen ini menjelaskan apa yang perlu kamu siapkan supaya aplikasi bisa memakai **Firebase Auth + Firestore** dan tetap bisa di-host di **GitHub Pages**.

## 0) Kenapa Firebase cocok untuk 24 jam tanpa VPS?

- Frontend (React) bisa di-host di GitHub Pages (gratis).
- Database + auth ditangani Firebase (managed).
- Tidak perlu server PHP/Laravel untuk selalu online.

> Catatan: untuk fitur **"nambah user dari UI"** dengan aman, kamu tetap butuh komponen server-side. Di Firebase ini biasanya berupa **Cloud Functions** (masih managed, bukan VPS).

---

## 1) Buat Firebase Project

1. Buka Firebase Console → Add project.
2. Buat **Web App** (ikon `</>`).
3. Copy konfigurasi Firebase dan isi ke `.env` (lihat `.env.example`).

File env yang dipakai frontend:
- `VITE_DATA_SOURCE=firebase`
- `VITE_FIREBASE_*` (apiKey, authDomain, projectId, dll)

---

## 2) Aktifkan Firebase Auth (Email/Password)

Firebase Console → **Authentication** → Get started → Sign-in method:
- Enable **Email/Password**.

Tambahkan domain yang diizinkan:
- Authentication → Settings → **Authorized domains**
- Tambahkan domain GitHub Pages kamu, contoh:
  - `yourname.github.io`

---

## 3) Buat Firestore

Firebase Console → **Firestore Database** → Create database.

Pilih mode:
- Untuk development: Start in **test mode** (sementara saja)
- Untuk production: langsung pakai rules yang aman (lihat bagian Rules)

Region: pilih yang dekat (mis. `asia-southeast2` jika tersedia).

---

## 4) Struktur Data Firestore (yang disarankan)

Gunakan collections berikut:

### `users/{uid}`
Field minimum:
- `name: string`
- `email: string`
- `role: 'CEO'|'CTO'|'CMO'|'PENDING'`
- `position: string` (jabatan)
- `createdAt: timestamp`
- `updatedAt: timestamp`

> Catatan: di codebase sekarang, halaman **Karyawan** mengambil data dari collection `users` (artinya: **karyawan = user**).

### `products/{productId}`
- `name: string`
- `category: string`
- `kind: 'FINISHED'|'RAW_MATERIAL'|'OTHER'`
- `createdAt, updatedAt`

### `stockMovements/{movementId}`
- `productId: string`
- `type: 'IN'|'OUT'`
- `quantity: number`
- `date: timestamp`
- `responsibleUserId: string`

> Kompatibilitas: aplikasi saat ini menulis field `responsibleEmployeeId`. Repo Firestore akan membaca **keduanya** (`responsibleEmployeeId` atau `responsibleUserId`).

### `transactions/{transactionId}`
- `type: 'PURCHASE'|'SALE'`
- `description: string`
- `amount: number`
- `date: timestamp`
- `responsibleUserId: string`

> Kompatibilitas: aplikasi saat ini menulis field `responsibleEmployeeId`. Repo Firestore akan membaca **keduanya** (`responsibleEmployeeId` atau `responsibleUserId`).

### `settings/app`
- `cashOpeningBalance: number`

> Ini mirip dengan `src/data/types.ts`, tapi dipisah per-collection supaya tidak mentok batas 1MB dokumen.

---

## 5) Rules (Keamanan) – minimal tapi benar

**Sangat disarankan pakai Custom Claims** untuk role (paling aman). Namun kalau kamu ingin cepat tanpa Cloud Functions dulu, kamu masih bisa pakai role di `users/{uid}` asalkan rules-nya melarang user mengubah `role` sendiri.

### Minimum policy yang aman (tanpa custom claims):
- Semua user yang login boleh baca data.
- Hanya CEO boleh:
  - create/update/delete user
  - (opsional) delete data penting

Di repo ini sudah disiapkan file rules: `firestore.rules`.

Cara pakai:
1) Firebase Console → Firestore → Rules
2) Paste isi file `firestore.rules`
3) Publish

Catatan penting:
- Pastikan dokumen `users/{uid}` untuk akun CEO sudah punya `role: 'CEO'` (set manual sekali di Console).
- Akun user baru otomatis dibuatkan dokumen `users/{uid}` dengan `role: 'PENDING'` (default non-privilege).

Untuk implementasi paling aman (recommended):
- Role disimpan di **custom claims**: `request.auth.token.role`

Kamu bisa mulai dari rules seperti ini (contoh konsep):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function role() { return request.auth.token.role; }
    function isCEO() { return isSignedIn() && role() == 'CEO'; }

    match /users/{uid} {
      allow read: if isSignedIn();
      allow write: if isCEO();
    }

    match /products/{id} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    match /stockMovements/{id} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    match /transactions/{id} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    match /settings/{id} {
      allow read: if isSignedIn();
      allow write: if isCEO();
    }
  }
}
```

---

## 6) Fitur “Tambah User dari UI” (tanpa Laravel)

Ini bagian penting: **membuat akun user baru di Firebase Auth** tidak bisa dilakukan aman dari frontend biasa.

Solusi yang benar:
- Buat **Cloud Function** (Admin SDK) yang:
  - membuat user Auth (email/password)
  - set **custom claims** `role` (CEO/CTO/CMO)
  - membuat dokumen `users/{uid}`

Repo ini sudah menyiapkan Cloud Function callable bernama `createUser` di folder `functions/`.
Halaman **Karyawan** akan memanggil function ini saat `VITE_DATA_SOURCE=firebase` dan user yang login ber-role **CEO**.

Alternatif (kurang ideal):
- CEO membuat user manual di Firebase Console.

### Deploy Cloud Functions
1) Install Firebase CLI:
- `npm i -g firebase-tools`
2) Login dan pilih project:
- `firebase login`
- `firebase use --add`
3) Install dependencies Functions:
- `cd functions`
- `npm install`
4) Deploy:
- `firebase deploy --only functions`

Opsional (sekalian publish rules):
- `firebase deploy --only firestore:rules,functions`

---

## Mode Spark (tanpa Functions)

Kalau project kamu masih Spark (belum bisa deploy Functions), flow yang dipakai:

- User baru membuat akun lewat halaman `#/signup` (Email/Password).
- App akan membuat dokumen `users/{uid}` dengan `role: 'PENDING'`.
- User `PENDING` tidak bisa masuk ke `/app/*` sampai role diubah CEO.
- CEO bisa approve user lewat halaman **Karyawan** dengan mengubah role `PENDING` → `CTO/CMO/CEO`.

Bootstrap CEO pertama (sekali saja):

- Buat akun CEO dulu via `#/signup`.
- Buka Firebase Console → Firestore Database → collection `users` → dokumen milik CEO → ubah field `role` menjadi `CEO`.
- Login ulang sebagai CEO, lalu approve user lain lewat UI.

---

## 7) Hosting di GitHub Pages (SPA routing)

Karena aplikasi kamu pakai React Router dengan URL seperti `/app/dashboard`, GitHub Pages perlu handling routing.

Pilih salah satu:

### Opsi A (paling gampang): pakai HashRouter
URL jadi `/#/app/dashboard` dan GitHub Pages aman.

### Opsi B: tetap BrowserRouter + 404 redirect
Tambahkan file `404.html` yang me-redirect ke `index.html`.

> Kalau kamu mau, aku bisa implement opsi A atau B di codebase.

---

## 8) Next step yang paling efektif

Kalau kamu setuju, langkah selanjutnya yang bisa aku kerjakan di repo ini:
1) Tambah integrasi **Firebase Auth** untuk login/logout + ganti password.
2) Tambah repository **Firestore** (mode `VITE_DATA_SOURCE=firebase`).
3) Scaffold Cloud Functions untuk **create user + set role claims**.
4) Siapkan config GitHub Pages (HashRouter atau 404 redirect).
