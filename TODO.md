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

# TODO — Tahap 3: Admin (Pengguna dan Barang) dan Daftar Barang

## Akun kasir (admin)
- [x] Admin dapat membuat akun kasir dengan username dan password, melihat daftar akun kasir, serta mereset password akun kasir.
- [x] Indikator kekuatan password (Lemah, Sedang, Kuat) terlihat saat membuat akun dan mereset password; password Lemah ditolak di layar dan server dengan pesan “Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol.” Password minimal 8 karakter, tidak sama dengan username, dan penilaian memakai fungsi bersama `lib/password-strength.ts`.
- [x] Reset password meminta konfirmasi sebelum perubahan; pembuatan akun tidak meminta konfirmasi.
- [x] Setelah admin membuat akun kasir, akun kasir dapat login; kasir ditolak membuka halaman admin melalui pemeriksaan server, bukan hanya menu.

## Pengelolaan barang (admin)
- [x] Admin dapat melihat daftar barang di `/admin/barang` dengan pencarian `q`, halaman `halaman`, filter `status` aktif/nonaktif/semua (bawaan aktif), dan 20 baris per halaman; nilai pencarian/filter/halaman tervalidasi, disimpan di URL, dan bertahan setelah refresh.
- [x] Admin dapat menambah barang, mengubah nama dan satuan (dengan konfirmasi), mengubah harga jual (dengan konfirmasi), menonaktifkan barang (dengan konfirmasi), serta mengaktifkan kembali barang (tanpa konfirmasi).
- [x] Tambah barang dan setiap perubahan harga jual menulis Riwayat Harga Jual secara atomik dengan penyimpanan/pembaruan barang; harga uang bilangan bulat rupiah.
- [x] Jika barang memiliki catatan barang masuk dan harga jual baru di bawah harga beli terakhir, tampilkan peringatan yang menyebut harga baru dan harga beli terakhir; jika belum ada catatan barang masuk, jangan tampilkan peringatan.
- [x] Pesan toast sukses sesuai PRD: “Barang ditambahkan.” dan “Data barang diperbarui.” Empty state admin: “Belum ada barang. Tambahkan barang pertama.” beserta tombol Tambah barang; pencarian kosong: “Tidak ada hasil untuk [kata cari].” beserta Hapus pencarian.

## Daftar barang bersama (admin/kasir)
- [x] `/barang` hanya-baca untuk admin dan kasir; keduanya dapat mencari nama barang dengan `q`, berpindah menggunakan `halaman`, dan URL mempertahankan pencarian/halaman setelah refresh.
- [x] Daftar menggunakan paginasi server 20 baris, kartu pada HP, tabel pada desktop, dan komponen DataTable bersama; kolom admin saja boleh memuat peringatan harga beli terakhir, bukan mutasi.
- [x] Kasir tidak dapat menambah barang atau mengubah harga melalui API/server; semua endpoint admin menolak role kasir.
- [x] Empty state kasir: “Belum ada barang. Hubungi admin untuk menambahkan barang.” tanpa tombol tambah; empty state admin menawarkan aksi tambah barang.

## Struktur dan pemeriksaan tahap
- [x] Setiap fitur memiliki `queries.ts`, `columns.tsx`, file form, skema Valibot di `validation/barang.ts`, `validation/pengguna.ts`, dan `validation/reset-password.ts`, serta `validateSearch` sesuai URL.
- [x] Satuan, status, role, dan ukuran halaman berasal dari `lib/konstanta.ts`; kg boleh satu angka desimal dan satuan lain bilangan bulat (barang tidak menyimpan jumlah stok pada tahap ini).
- [x] Tidak mengerjakan barang masuk, kasir, maupun utang. Tidak menambah dependency dan tidak menampilkan rahasia.
- [x] Build dan pemeriksaan tipe lulus, lint tanpa error, serta fitur yang dapat diuji tanpa mengubah data bersama sudah dicoba.
