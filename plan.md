# Rencana Tahap 2 — Database, Login, dan Peran

## Tujuan dan batasan

Membangun skema PostgreSQL/Drizzle lengkap, login Better Auth dengan username dan password, session SSR, perlindungan halaman, serta middleware akses Hono. Hanya membuat jalur yang dibutuhkan untuk login, logout, dan pengujian otorisasi; tidak membangun halaman barang, barang masuk, kasir, utang, atau pengelolaan akun kasir. Tidak menambah pustaka, memakai Dexie, atau menambahkan PWA.

Project Owner memilih Neon dan mengisi `DATABASE_URL` secara privat ke `.env`. Jangan menampilkan atau mencatat nilainya. Jumlah disimpan sebagai bilangan bulat persepuluh (`jumlahPersepuluh`): 2,5 kg menjadi 25. Cara ini menyimpan satu angka desimal dengan tepat tanpa pembulatan floating-point; layar/layanan membagi atau mengalikan 10 pada batas konversi. Uang memakai integer rupiah. Tambahkan batasan `CHECK (stok >= 0)` di database.

## Rancangan implementasi

- `db/schema/`: tabel Barang, Barang Masuk, Pembeli, Transaksi, Item Transaksi, Riwayat Harga Jual, Pembayaran Utang, serta tabel user/session/account/verification yang dipakai Better Auth. Transaksi, Item Transaksi, dan Barang Masuk memakai UUID. `waktuDicatat` dan `createdAt` merupakan kolom terpisah.
- `db/index.ts`, `drizzle.config.ts`, `drizzle/`: koneksi Drizzle dari `DATABASE_URL`, konfigurasi migrasi PostgreSQL, migrasi yang dihasilkan dan skrip menjalankannya.
- `lib/auth.ts` dan `lib/auth-client.ts`: Better Auth server/client, plugin username, field peran `admin`/`kasir`, password minimum delapan karakter. Login tidak memakai pemeriksaan panjang/kekuatan. Tidak ada pendaftaran mandiri atau reset email.
- `db/seed.ts`: memvalidasi `ADMIN_USERNAME` dan `ADMIN_PASSWORD` dari `.env`, menolak password kurang dari delapan karakter atau bernilai Lemah, lalu membuat admin idempoten tanpa mencetak password.
- `validation/login.ts` dan `validation/search.ts`: skema login serta parsing `kembali` yang hanya menerima path internal (`/…`, bukan `//…`).
- `types/router.ts`, `routes/__root.tsx`, `router.tsx`, `routes/_app.tsx`, dan `routes/_app/admin/route.tsx`: session dari cookie di root `beforeLoad`, dialirkan lewat RouterContext; halaman terlindungi mengalihkan ke login dengan alamat kembali; route admin menolak kasir.
- `server/app.ts`, `server/middleware/`, dan route TanStack Start `api/$.ts`: Hono menerima permintaan API, meneruskan endpoint Better Auth, dan mengecek login/peran di server. Sediakan endpoint pemeriksaan admin non-bisnis untuk menguji penolakan akses.
- `routes/login.tsx`: form Formisch/Valibot dengan field reusable, FormAlert, toast, dan ThemeToggle; kesalahan login tampil di form. Logout menghapus sesi dan cache pengguna.
- `.env.example`, `.gitignore`, dan skrip `db:*`: petunjuk pengisian rahasia privat tanpa menyimpan nilai asli di git.

## Struktur kerja

Perubahan mengikuti pembagian yang sudah ada: `src/routes/` untuk route dan layout, `src/server/` untuk Hono/middleware, `src/db/` untuk koneksi/schema/seed, `src/lib/` untuk konfigurasi Better Auth, `src/validation/` untuk Valibot, dan `src/types/` untuk tipe session. `drizzle/` menyimpan migrasi, sedangkan `.env.example` mendokumentasikan variabel tanpa nilai sensitif.

## Gaya tampilan

Pakai tampilan Kasiar yang sudah ada: antarmuka Indonesia, ringkas, responsif, token tema DaisyUI, label field tetap terlihat, dan tombol sentuh yang cukup besar. Halaman login memakai pola komponen form bersama Tahap 1, tanpa ilustrasi tambahan.

## Urutan dan batas operasi

Jalankan pemeriksaan awal sebelum mengubah kode. Siapkan berkas petunjuk rahasia lebih dahulu, lalu minta Project Owner mengisi `.env` secara privat. Setelah koneksi tersedia, hasilkan dan tinjau migrasi, kemudian jalankan hanya pada database pengembangan Neon yang dipilih. Jangan menjalankan migrasi, seed, atau menebak kredensial admin sebelum nilai privat tersedia. Sesudah implementasi, uji login/logout, login salah, pengalihan kembali, serta penolakan route/API admin di server; lalu periksa tipe, build, lint, commit, dan push `origin/main` hanya bila build dan tipe lulus.
