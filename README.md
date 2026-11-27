# Kasiar

Kasiar adalah aplikasi web untuk mencatat barang dan stok, barang masuk, penjualan kasir, serta utang pembeli. Antarmuka berbahasa Indonesia dan mendukung ponsel maupun komputer.

## Menjalankan di komputer sendiri

Pastikan Node.js dan npm tersedia. Dari folder project, jalankan:

```sh
npm ci
cp .env.example .env
```

Buka `.env` di editor teks dan isi nilainya secara privat. Jangan unggah atau mengirimkan file ini; file tersebut berisi kata sandi dan kunci rahasia.

- `DATABASE_URL`: alamat koneksi PostgreSQL. Untuk Neon pilih **pooled connection string**; contoh format di `.env.example` hanya placeholder dan tidak dapat dipakai apa adanya.
- `BETTER_AUTH_SECRET`: rahasia acak panjang, minimal 32 karakter. Buat nilai unik dan jangan gunakan contoh publik.
- `ADMIN_USERNAME` dan `ADMIN_PASSWORD`: nama pengguna serta kata sandi admin pertama. Kata sandi minimal 8 karakter dan tidak boleh berkekuatan “Lemah”.
- `BETTER_AUTH_URL` bersifat opsional di konfigurasi saat ini; jangan menambahkannya kecuali memang diminta oleh konfigurasi aplikasi.

Buat database kosong di Neon (atau PostgreSQL yang kompatibel), lalu jalankan migrasi dan seed admin:

```sh
npx drizzle-kit migrate
node --env-file=.env --import=tsx src/db/seed.ts
```

Seed membaca `ADMIN_USERNAME` dan `ADMIN_PASSWORD` dari environment. Jika akun admin dengan username itu sudah ada, seed tidak mengubah akun tersebut. Simpan `.env` di mesin lokal saja. Untuk menjalankan aplikasi:

```sh
npm run dev
```

Vite menampilkan alamat lokal di terminal. Untuk pemeriksaan sebelum perubahan dikirim:

```sh
npm run lint
npm run format:check
npm run build
```

## Menyiapkan Vercel dan database

**Panduan ini hanya menyiapkan konfigurasi. Jangan menekan Deploy sebagai bagian dari pemeriksaan ini.** Vercel Hobby ditujukan untuk pemakaian pribadi/non-komersial. Jika Kasiar dipakai untuk kegiatan usaha toko, Project Owner perlu memeriksa syarat dan memilih paket yang sesuai; jangan menganggap Hobby boleh untuk penggunaan komersial. [Ketentuan Vercel](https://vercel.com/legal/terms) [Batas penggunaan Hobby](https://vercel.com/docs/plans/hobby)

### Database di wilayah dekat Indonesia

Buat database di Singapore (`ap-southeast-1`) agar dekat dengan pengguna di Indonesia. Neon menyediakan region Singapore, dan wilayah project tidak dapat dipindahkan setelah project dibuat. Supabase juga menyediakan Singapore. Pilih region database dengan hati-hati sebelum membuat project. [Region Neon](https://neon.com/docs/introduction/regions) [Region Supabase](https://supabase.com/docs/guides/platform/regions)

Untuk aplikasi serverless, isi `DATABASE_URL` di Vercel dengan alamat koneksi **pooled/pooler** dari penyedia database, bukan alamat koneksi langsung. Pada Neon, alamat pooled memakai host dengan akhiran `-pooler`. Pada Supabase, gunakan transaction pooler (umumnya port 6543). Kode koneksi Kasiar memakai `prepare: false`, yang cocok untuk transaction pooling. Jalankan migrasi skema menggunakan alamat database yang sesuai sebelum aplikasi menerima pengguna. [Connection pooling Neon](https://neon.com/docs/connect/connection-pooling) [Koneksi database Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)

### Environment variables di Vercel

Di project Vercel, buka **Settings → Environment Variables** dan masukkan nilai privat berikut untuk **Production** dan lingkungan lain yang akan digunakan (**Preview**/**Development** bila diperlukan):

1. `DATABASE_URL` — connection string PostgreSQL pooled/pooler untuk database yang dipilih.
2. `BETTER_AUTH_SECRET` — rahasia acak yang sama panjang dan kuatnya dengan lingkungan yang akan digunakan. Jangan salin nilai contoh.
3. `ADMIN_USERNAME` dan `ADMIN_PASSWORD` — kredensial bootstrap untuk seed admin pertama. Isi hanya jika proses seed dijalankan di lingkungan itu; jangan menaruhnya di kode atau repositori.

Periksa ulang bahwa nilai variabel tidak memiliki spasi atau tanda kutip yang tak disengaja. Perubahan environment berlaku untuk deployment berikutnya, bukan otomatis mengubah deployment yang sudah ada. Simpan rahasia hanya di pengaturan privat Vercel dan jangan tempel nilainya ke tiket atau chat. [Environment variables Vercel](https://vercel.com/docs/environment-variables)

### Menghubungkan GitHub

1. Masuk ke Vercel dan pilih **Add New → Project**.
2. Hubungkan akun GitHub bila diminta, lalu impor `laodeaksar/kasiar`.
3. Periksa framework/build settings yang dikenali Vercel dan isi environment variables sebelum deployment pertama.
4. Atur region Function ke Singapore (`sin1`) dan pastikan dekat dengan region database. Vercel Hobby membatasi project ke satu region Function; default Vercel dapat berbeda, jadi periksa pengaturan project. [Daftar region Vercel](https://vercel.com/docs/regions) [Pengaturan region Function](https://vercel.com/docs/functions/configuring-functions/region)
5. Vercel menghubungkan deployment ke push Git secara default. Jangan mengirim push atau menekan tombol Deploy untuk menayangkan aplikasi sebelum Project Owner siap dan menyetujui deployment. [Integrasi GitHub Vercel](https://vercel.com/docs/git/vercel-for-github)

### Perhatikan kuota database gratis

Paket gratis bukan tanpa batas. Berdasarkan dokumentasi yang diperiksa pada 27 November 2026, Neon Free mencakup 100 CU-jam per project per bulan, penyimpanan 1 GB per project (20 GB total akun), dan transfer publik 5 GB per project per bulan. Jika kuota tertentu habis, compute dapat disuspensi atau penulisan dapat gagal sampai batas pulih atau paket diubah. Supabase Free juga memiliki batas dan kebijakan jeda project tidak aktif. Batas paket dapat berubah, jadi baca dokumentasi resmi terbaru sebelum mengandalkan layanan ini untuk operasional toko: [paket dan batas Neon](https://neon.com/docs/introduction/plans) dan [jeda project gratis Supabase](https://supabase.com/docs/guides/platform/free-project-pausing).

## Catatan keamanan

Jangan commit `.env`, connection string, password, maupun `BETTER_AUTH_SECRET`. Gunakan akun uji dan database terpisah untuk pengujian yang membuat atau mengubah catatan. Jangan memasukkan data pelanggan atau transaksi nyata ke lingkungan uji.
