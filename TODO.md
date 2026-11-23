# TODO — Tahap 2: Database, Login, dan Peran

## Skema database dan migrasi

- [ ] Gunakan Neon untuk database pengembangan. Minta Project Owner mengisi `DATABASE_URL` secara privat ke `.env`; jangan meminta rahasia ditempel di chat atau menyimpannya dalam kode/commit/log.
- [ ] Buat skema Drizzle untuk semua tabel sesuai ARCHITECTURE.md bagian 5: Barang, Barang Masuk, Pembeli, Transaksi, Item Transaksi, Riwayat Harga Jual, Pembayaran Utang, dan tabel Better Auth.
- [ ] ID Transaksi, Item Transaksi, dan Barang Masuk harus UUID. Simpan `waktuDicatat` dan `createdAt` sebagai kolom terpisah. Simpan uang sebagai bilangan bulat rupiah.
- [ ] Pilih satu pendekatan jumlah beras kg desimal satu angka dan jelaskan; stok tidak boleh negatif harus dijaga dengan batasan database.
- [ ] Buat migrasi pertama dan jalankan pada database pengembangan yang dipilih.

## Autentikasi, session, dan hak akses

- [ ] Better Auth menyediakan login username + password dan peran `admin`/`kasir`; panjang minimum password 8 karakter disamakan dengan skema.
- [ ] `db/seed.ts` membuat akun admin dari pengaturan lingkungan. Password awal minimal 8 karakter dan bukan Lemah; password tidak dicetak ke log.
- [ ] Session dimasukkan ke RouterContext dari cookie di `beforeLoad` root. `_app.tsx` mengalihkan pengunjung tanpa login ke halaman login dengan parameter `kembali` yang tervalidasi sebagai alamat internal. Route admin menolak selain admin.
- [ ] Middleware Hono memeriksa login dan peran admin di server.
- [ ] Halaman login menggunakan Formisch, field reusable, FormAlert, dan toast. Kesalahan login berbahasa Indonesia tampil di form. Form login tidak memeriksa panjang maupun kekuatan password.
- [ ] Tidak ada pendaftaran mandiri atau reset password lewat email. Logout dan sesi berakhir menghapus/memperbarui konteks serta menampilkan toast dan mengarahkan ke login dengan `kembali`.
- [ ] Skema Valibot `login.ts` dan `search.ts` memvalidasi parameter `kembali`.

## Batas lingkup dan hasil uji

- [ ] Jangan membuat halaman barang, barang masuk, kasir, utang, atau admin pengguna (fitur itu tahap berikutnya).
- [ ] Selesai bila admin dapat login dan logout; login salah menampilkan pesan Indonesia di form; halaman terlindungi tanpa login mengarah ke login lalu kembali ke halaman semula; dan pengecekan peran terbukti berjalan di server. Peran kasir baru dapat diuji pada Tahap 3.
