# AGENTS.md: Kasiar

Panduan untuk AI Coding Agent (Cursor, Bolt, Lovable, dan sejenisnya) yang mengerjakan proyek ini.

## 1. Tentang Proyek

**Kasiar** adalah aplikasi web pencatatan stok sembako: catat barang masuk, kasir sederhana, dan catat utang pembeli. Pengguna: 1 kasir dan 1 admin (pemilik).

**Project Owner bukan orang IT.** Jelaskan keputusan teknis dengan bahasa sederhana. Setiap istilah teknis diberi penjelasan singkat dalam kurung.

## 2. Baca Dulu

1. `PRD.md`: apa yang dibangun (sumber kebenaran untuk fitur dan aturan bisnis).
2. `ARCHITECTURE.md`: bagaimana dibangun (struktur, data, alur).

Jika ada pertentangan antara dokumen dan permintaan di chat, **tanyakan ke Project Owner**. Jangan memilih sendiri.

## 3. Aturan Utama

1. **Kerjakan hanya fitur MVP** di `PRD.md` bagian 4.1. Jangan menyentuh bagian 4.2 (Fitur Masa Depan), sekalipun terlihat mudah.
2. **Tanda `[...]` berarti belum diputuskan.** Jangan menebak. Berhenti dan tanyakan Project Owner.
3. **Jangan mengarang data.** Data contoh (*seed*) harus diberi label jelas sebagai contoh dan mudah dihapus.
4. **Jangan menambah pustaka di luar daftar** di bawah tanpa alasan jelas dan persetujuan Project Owner.
5. **Jangan menyarankan atau memakai layanan berbayar** tanpa persetujuan Project Owner. Targetnya biaya Rp0.
6. **Perubahan besar** (mengganti struktur data, mengganti pustaka, menghapus fitur) **minta konfirmasi dulu**.

## 4. Tech-Stack (wajib)

- TanStack Start + React (**SSR aktif**)
- TanStack Query, TanStack Table, TanStack Store
- Formisch + Valibot (form dan validasi)
- Better Auth (login username + password, peran admin dan kasir)
- DaisyUI + Tailwind, Lucide React (tampilan dan ikon)
- Hono + Drizzle + PostgreSQL (server, penghubung, database)
- Hosting: Vercel. Database: Neon (PostgreSQL). Alternatif yang boleh dipakai: Supabase (PostgreSQL). Pakai Supabase **hanya sebagai database**: login tetap memakai Better Auth, jangan memakai fitur Auth atau pustaka klien Supabase.
- Recharts: sudah dipilih tetapi **belum dipakai di MVP**.
- **Dexie** (pembungkus IndexedDB) dan **PWA**: disetujui untuk fase berikutnya, **belum dipakai di MVP**.

Bahasa pemrograman: TypeScript (kebiasaan bawaan TanStack Start).
Package manager dan perintah menjalankan proyek: `[Belum ditentukan]`

## 5. Aturan Domain (jangan dilanggar)

- **Tanpa konversi satuan.** Beras karung (stok dalam karung), Beras eceran (stok dalam kg), Telur (butir), dan Telur (rak) adalah **barang terpisah**. Stok satu varian tidak boleh mengubah stok varian lain.
- **Stok tidak boleh negatif.** Jika stok tidak cukup, tampilkan peringatan dan jangan simpan transaksi.
- **Beras eceran (kg) boleh desimal dengan satu angka di belakang koma** (misal 2,5 kg). Satuan karung, butir, rak, pcs, dan pack: **bilangan bulat**.
- **Pembayaran sebagian diperbolehkan:** jika jumlah dibayar kurang dari total, sisanya menjadi utang pembeli dan **nama pembeli wajib diisi**. Jika dibayar penuh, status Lunas.
- **Pelunasan tidak boleh melebihi sisa utang.** Sisa utang dihitung dari catatan, tidak diketik manual.
- **Atomik:** menyimpan transaksi (item, stok, utang), barang masuk, atau pelunasan harus berhasil **semuanya atau batal semuanya** dalam satu transaksi database.
- **Tanpa hapus permanen.** Koreksi lewat catatan baru.
- **Uang** disimpan sebagai bilangan bulat rupiah.
- **Harga jual hanya bisa diubah admin.** Kasir tidak boleh mengubah harga, baik di daftar barang maupun saat transaksi. Server memakai harga dari database, bukan harga kiriman dari layar.
- **Riwayat harga jual:** setiap perubahan harga jual (termasuk harga awal barang) dicatat di tabel Riwayat Harga Jual dalam proses atomik yang sama dengan perubahan harga di Barang. Tidak ditampilkan di MVP (lihat `ARCHITECTURE.md` bagian 5 dan 11).
- **ID UUID** untuk Transaksi, Item Transaksi, dan Barang Masuk. Waktu kejadian (`waktuDicatat`) disimpan terpisah dari waktu diterima server (`createdAt`); di MVP nilainya sama dengan waktu server.
- **Hanya admin yang boleh menambah barang baru dan mengubah data barang** (nama, satuan, harga jual). Kasir hanya melihat daftar barang dan stok, serta memilih barang yang sudah ada untuk barang masuk dan transaksi.
- Setiap catatan menyimpan **waktu dan pengguna** yang menginput.

## 6. Keamanan

- Semua halaman dan data hanya bisa diakses **setelah login**.
- **Cek peran di server**, bukan hanya menyembunyikan menu. Kasir tidak boleh membuka halaman admin.
- Tidak ada daftar mandiri dan tidak ada reset password lewat email.
- **Akun admin pertama dibuat lewat seed.** Username dan password awal diambil dari *environment variables*, tidak ditulis di kode.
- Rahasia (alamat database, rahasia login) hanya di *environment variables*. Jangan tulis di kode, jangan kirim ke browser, jangan masuk ke riwayat versi.
- Validasi isian di **layar dan di server**.
- **Session dan queryClient dititipkan lewat router context** (lihat `ARCHITECTURE.md` bagian 3, "Context Router"). QueryClient dibuat baru untuk setiap permintaan di server. Session di context hanya untuk pengalihan dan tampilan, bukan pengganti pengecekan di server. Jangan menyimpan session di TanStack Store. Root route dibuat dengan `createRootRouteWithContext` bertipe `RouterContext` (dari `types/`), nilai awal context dibuat di `router.tsx`, dan session diisi di `beforeLoad` milik root route.
- **Query dan mutasi** ditulis di `queries.ts` per fitur (lihat `ARCHITECTURE.md` bagian 3). Komponen dan loader tidak memanggil API langsung. Tanpa pembaruan optimistis untuk stok dan utang, dan tombol simpan dinonaktifkan selama mutasi berjalan.
- **Konfirmasi memakai hook `useConfirm`** (modal bersama, dipasang sekali di `__root.tsx`). Jangan membuat modal konfirmasi sendiri di tiap halaman, dan jangan memanggil `useConfirm` dari `queries.ts`. Daftar aksi yang perlu konfirmasi dan aturan peringatan harga ada di `PRD.md` bagian 5 ("Konfirmasi dan Peringatan") dan `ARCHITECTURE.md` bagian 3.
- **Notifikasi memakai hook `useToast`** (toast dari komponen `toast` dan `alert` DaisyUI, tanpa pustaka tambahan, dipasang sekali di `__root.tsx`). Daftar pesan ada di `PRD.md` bagian 5 ("Notifikasi Singkat (Toast)"). Jangan memanggil `useToast` dari `queries.ts`. Error form tetap tampil di form (`FormAlert`), bukan toast. Toast error hanya untuk kegagalan di luar form.
- **Keadaan memuat, kosong, dan gagal memakai `Skeleton`, `EmptyState`, dan `ErrorState`** dari `components/feedback/` (DaisyUI + Lucide, tanpa pustaka tambahan; lihat `ARCHITECTURE.md` bagian 3, "Komponen Umpan Balik"). Skeleton meniru bentuk isi dan hanya untuk pemuatan pertama, tanpa spinner layar penuh. Bedakan "belum ada data" dari "pencarian tidak ditemukan". Tombol aksi di empty state hanya untuk peran yang berhak. Daftar pesan ada di `PRD.md` bagian 5 ("Tampilan Memuat dan Kosong").
- **Setiap form memakai Formisch + skema Valibot** (lihat `ARCHITECTURE.md` bagian 3, "Form dengan Formisch"). Satu form satu skema di `validation/`, dipakai layar dan server, dan tipenya diturunkan dari skema. Urutan kirim: validasi → konfirmasi bila perlu → mutasi dari `queries.ts` → toast dan reset. Error per isian dari server tampil di isiannya, error umum di `FormAlert`. Pencarian dan filter daftar bukan form Formisch, melainkan parameter URL. Password kasir **minimal 8 karakter** (buat akun dan reset; form login tidak memeriksa panjang) dan disamakan di Better Auth. Saat membuat akun dan mereset password, tampilkan **indikator kekuatan** (Lemah, Sedang, Kuat) lewat `PasswordStrengthIndicator` dan `lib/password-strength.ts`, serta **daftar syarat yang melayang di atas isian** lewat `PasswordRequirementsPopover` (tiap syarat merah jika belum terpenuhi dan hijau jika sudah, dengan ikon dan teks, pindah ke bawah bila ruang di atas tidak cukup, hanya di form buat akun dan reset, tanpa pustaka tambahan); kriterianya ada di `PRD.md` bagian 5. Password dengan penilaian **Lemah ditolak** di layar dan di server (fungsi `lib/password-strength.ts` dipakai bersama, kriteria di `PRD.md` bagian 5); **Sedang** dan **Kuat** diterima. Password awal di `seed.ts` juga minimal 8 karakter dan tidak boleh Lemah.
- **Dark mode memakai tema DaisyUI `light` dan `dark`** (lihat `ARCHITECTURE.md` bagian 3, "Tema (Dark Mode)"). Pilihan tema (Ikuti perangkat, Terang, Gelap) disimpan di cookie `tema` per perangkat dan dibaca server agar tidak ada kilatan tema salah. **Dilarang warna tetap**: pakai token DaisyUI, bukan kode warna atau kelas warna mentah. Nilai cookie `tema` hanya `terang` atau `gelap`, selain itu diabaikan. Jaga kontras di kedua tema dan jangan mengandalkan warna saja. Uji tiap halaman di kedua tema.
- **Types dan schema: satu sumber kebenaran** (lihat `ARCHITECTURE.md` bagian 3, "Types dan Schema"). Tipe baris database diturunkan dari tabel Drizzle (`db/schema/`), tipe input diturunkan dari skema Valibot (`validation/`), tipe respons dan error ada di `types/`. Satuan, peran, status, dan ukuran halaman ditulis sekali di `lib/konstanta.ts`. Jangan menulis tipe manual yang bisa diturunkan, dan jangan memakai satu tipe untuk baris database, input, dan respons sekaligus. Layar hanya `import type` dari `db/schema`, tidak mengimpor tabel Drizzle. TypeScript `strict`, tanpa `any`; data dari luar bertipe `unknown` lalu divalidasi. Uang bilangan bulat rupiah, tanpa float; konversi desimal dilakukan di satu tempat (`server/services/`). Penamaan domain memakai Bahasa Indonesia (`Barang`, `hargaJual`), istilah teknis umum tetap Inggris.
- **Rencana masa depan, JANGAN dikerjakan di MVP** (lihat `ARCHITECTURE.md` bagian 11): katalog barang publik tanpa login (nama, satuan, harga jual, stok), PWA, IndexedDB dengan Dexie, dan kasir offline dengan sinkronisasi otomatis. Jangan memasang Dexie atau pustaka PWA sekarang. Agar tidak menutup kemungkinan itu, pusatkan pengecekan peran di `server/middleware/` (tanpa pola "jika admin atau kasir" yang tersebar), simpan daftar peran di `lib/konstanta.ts`, dan jangan mengimpor kode yang hanya ada di browser ke kode SSR. Bagian masa depan yang bertanda `[...]` belum diputuskan, jadi tanyakan Project Owner sebelum memulainya. Keputusan kasir offline sudah tertulis di bagian 11: stok tidak boleh negatif (transaksi ditolak tetapi tidak hilang), harga saat dicatat diverifikasi server, penjualan dan barang masuk bisa offline, pelunasan utang tetap online.
- **SSR aktif** (lihat `ARCHITECTURE.md` bagian 3, "SSR"). Loader memuat data awal lewat `queries.ts`. Saat SSR, teruskan cookie login ke API. Halaman setelah login tidak boleh di-cache bersama (no-store/private) dan diberi noindex. Tanggal dan jam dirender di browser untuk menghindari hydration mismatch. Jangan memakai `window` atau penyimpanan browser saat render di server. Kode server dan rahasia tidak boleh ikut ke browser.
- **Parameter URL divalidasi dengan `validateSearch`** memakai skema Valibot di `validation/search.ts` (lihat `ARCHITECTURE.md` bagian 3, "Parameter URL"). Nilai tidak valid diganti nilai bawaan. Parameter `kembali` hanya boleh alamat internal (diawali `/`, bukan `//`). Filter dan halaman daftar dibaca dari URL, dan server memvalidasi ulang parameternya. Jangan menaruh rahasia di URL. Paginasi dilakukan di server, 20 baris per halaman.
- **Daftar memakai komponen `DataTable` reusable** dari `components/data-table/` (lihat `ARCHITECTURE.md` bagian 3, "Data Table Reusable"). Jangan membuat tabel HTML mentah. Kolom didefinisikan per fitur di `columns.tsx`. Mode server-side: halaman dan filter dibaca dari URL, bukan state lokal. Di HP baris tampil sebagai kartu. Semua endpoint daftar mengembalikan bentuk jawaban yang sama (baris, total, halaman, ukuran halaman).
- **Form memakai field reusable** dari `components/form/` (lihat `ARCHITECTURE.md` bagian 3, "Field Form Reusable"). Jangan membuat isian mentah di halaman. Nilai uang dan jumlah disimpan sebagai angka murni, bukan teks berformat. Pesan error validasi berbahasa Indonesia ditulis di `validation/`.

## 7. Gaya Kerja

- Teks antarmuka memakai **Bahasa Indonesia** `[default; konfirmasi ke Project Owner jika perlu bahasa lain]`.
- Tampilan sederhana dan cepat dipakai kasir. Utamakan tombol besar dan alur sedikit langkah. Perangkat: **HP (mobile) dan komputer (desktop)**, jadi tampilan harus **responsif**.
- Ikuti kebiasaan bawaan TanStack Start untuk struktur folder (lihat `ARCHITECTURE.md` bagian 3).
- Kerjakan bertahap per fitur, dengan urutan usulan: login dan peran → barang → barang masuk → kasir → utang → halaman admin.
- Setelah tiap tahap selesai, jelaskan ke Project Owner dengan bahasa sederhana **apa yang sudah bisa dicoba** dan apa langkah berikutnya.

## 8. Checklist Sebelum Menyatakan Selesai

- [ ] Hanya fitur MVP yang dikerjakan.
- [ ] Tidak ada pustaka tambahan di luar daftar.
- [ ] Aturan domain di bagian 5 terpenuhi (tanpa konversi, stok tidak negatif, atomik, utang wajib nama).
- [ ] Peran admin/kasir dicek di server.
- [ ] Tampilan nyaman di HP dan desktop.
- [ ] Kasir tidak bisa mengubah harga maupun menambah/mengubah barang (dicek di server).
- [ ] ID Transaksi, Item Transaksi, dan Barang Masuk bertipe UUID, dan perubahan harga jual tercatat di Riwayat Harga Jual.
- [ ] Pembayaran sebagian menghasilkan utang sebesar selisihnya.
- [ ] Tidak ada rahasia di dalam kode.
- [ ] Tidak ada data contoh yang menyerupai data asli tanpa label.
- [ ] Bagian bertanda `[...]` tidak ditebak, sudah ditanyakan ke Project Owner.
- [ ] Penjelasan akhir ke Project Owner memakai bahasa sederhana.

## 9. Catatan Hosting

Paket gratis Vercel (Hobby) resmi untuk pemakaian pribadi non-komersial. Project Owner sudah memilih Vercel dan menyadari risiko ini. Jangan mengubah pilihan hosting tanpa diminta.
