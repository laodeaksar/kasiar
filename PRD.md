# PRD: Kasiar

> Aplikasi web pencatatan stok sembako, barang masuk, kasir sederhana, dan utang pembeli.
> Dokumen ini ditulis untuk dibaca langsung oleh AI Coding Builder (Cursor, Bolt, Lovable).
> Tanda `[...]` berarti **belum diputuskan oleh Project Owner**. Jangan ditebak, tanyakan dulu.

## 1. Ringkasan Produk

**Kasiar** membantu pemilik toko sembako agar tidak lagi lupa mencatat **barang masuk** dan **utang pembeli**. Aplikasi ini juga menyediakan **kasir sederhana** untuk mencatat penjualan harian.

**Masalah utama:** barang masuk dan utang pembeli sering lupa dicatat.

## 2. Target Pengguna

| Peran | Jumlah | Keterangan |
|---|---|---|
| **Kasir** | 1 orang | Pengguna harian: catat barang masuk, melayani penjualan, mencatat utang dan pelunasan |
| **Admin (pemilik)** | 1 orang | Memakai akun admin terpisah untuk membuat dan mereset akun kasir serta mengelola barang dan harga jual lewat halaman admin |

**Perangkat:** HP (mobile) dan komputer (desktop). Tampilan harus **responsif** (nyaman di kedua ukuran layar).

**Akun admin pertama** dibuat lewat **seed** (data awal yang dijalankan sekali saat penyiapan). Username dan password awal ditentukan Project Owner dan tidak ditulis di kode.

## 3. User Flow

1. **Login:** kasir login dengan **username + password**.
2. **Barang masuk:** menu Barang Masuk → pilih barang (yang sudah didaftarkan admin) → isi jumlah, harga beli, dan pemasok → simpan → stok bertambah.
3. **Penjualan:** pilih barang dan jumlah → total otomatis terhitung → isi **jumlah dibayar** (dibayar penuh = **Lunas**; dibayar sebagian atau tidak dibayar = sisanya menjadi **Utang**) → simpan → stok berkurang.
4. **Utang:** jika ada sisa yang belum dibayar, isi nama pembeli → sisa tercatat sebagai utang atas nama tersebut.
5. **Pelunasan:** menu Utang → pilih pembeli → catat pembayaran → sisa utang berkurang.
6. **Admin:** pemilik login dengan akun admin → buat akun kasir, reset password kasir, serta tambah/ubah barang (termasuk harga jual).

## 4. Fitur

### 4.1 Fitur MVP (wajib di rilis pertama)

- **Login** username + password dengan dua peran: kasir dan admin.
- **Password minimal 8 karakter dan tidak boleh Lemah**, dengan **indikator kekuatan password** saat admin membuat akun kasir atau mereset password (lihat bagian 5).
- **Halaman admin** untuk pemilik (buat akun kasir, reset password kasir, tambah/ubah barang termasuk harga jual).
- **Daftar barang & stok.** Setiap varian adalah **barang tersendiri, tanpa konversi:**
  - **Beras karung:** 50 kg, 25 kg, 10 kg, 5 kg. Stok dihitung dalam **karung**.
  - **Beras eceran.** Stok dihitung dalam **kg** dan **boleh desimal dengan satu angka di belakang koma** (misal 2,5 kg).
  - **Telur (butir)** dan **Telur (rak)**. Masing-masing dihitung sendiri.
  - Barang lain: satuan **kg, pcs, atau pack**.
  - Satuan **karung, butir, rak, pcs, dan pack** dihitung dalam **bilangan bulat**.
- **Catat barang masuk:** tanggal, barang, jumlah, **harga beli**, **pemasok**. Tanggal terisi hari ini secara bawaan. Setelah tersimpan, form siap untuk catatan berikutnya (fokus kembali ke isian barang).
- **Kasir sederhana:** pilih barang, hitung total, isi jumlah dibayar, simpan transaksi (Lunas, bayar sebagian, atau Utang penuh).
- **Catat utang & pelunasan:** nama pembeli, nominal utang, riwayat pembayaran, sisa utang.
- **Daftar dengan pencarian dan halaman:** daftar barang, barang masuk, dan utang tampil **20 baris per halaman** dan bisa dicari.
  - Barang (kasir dan admin): cari nama barang. Admin juga bisa memfilter status aktif, nonaktif, atau semua.
  - Barang masuk: cari barang atau pemasok, dan filter rentang tanggal.
  - Utang: cari nama pembeli, filter belum lunas (bawaan) atau semua, dan buka rincian per pembeli.
  - Pencarian dan halaman tersimpan di alamat halaman (URL), jadi tombol kembali dan segarkan halaman tidak menghilangkan filter.
  - Di **HP**, tiap baris daftar tampil sebagai **kartu** agar mudah dibaca. Di **desktop**, tampil sebagai tabel penuh.
  - Urutan baris ditentukan aplikasi (misalnya barang masuk dari yang terbaru).
- **Konfirmasi dan peringatan harga** sebelum aksi penting (lihat bagian 5).
- **Notifikasi singkat (toast)** setelah aksi berhasil atau gagal (lihat bagian 5).
- **Tampilan memuat (skeleton) dan tampilan kosong** yang ramah di setiap daftar dan halaman (lihat bagian 5).
- **Mode tampilan terang dan gelap** (dark mode), dengan pilihan Ikuti perangkat, Terang, atau Gelap (lihat bagian 5).

### 4.2 Fitur Masa Depan (JANGAN dikerjakan dulu)

- Grafik dan laporan penjualan
- Cetak struk
- Notifikasi stok menipis
- Pengingat jatuh tempo utang
- Scan barcode
- Konversi otomatis antar satuan (karung ↔ kg, butir ↔ rak)
- Pengurutan daftar oleh pengguna
- **Katalog barang untuk pelanggan:** halaman **hanya lihat** yang **boleh dibuka tanpa login**. Menampilkan nama barang, satuan, harga jual, dan **jumlah stok**. `[Apakah akun dengan role customer tetap dibutuhkan, mengingat katalog bisa dibuka tanpa login? Belum ditentukan]`
- **PWA** (aplikasi web yang bisa dipasang di layar HP dan dibuka seperti aplikasi biasa).
- **Penyimpanan lokal di perangkat (IndexedDB, yaitu penyimpanan data di dalam browser) dengan Dexie**, untuk cache dan kerja offline.
- **Kasir offline:** kasir bisa **mencatat transaksi tanpa internet**, dan transaksi **otomatis tersinkron** (terkirim ke server) saat kembali online. **Stok tetap tidak boleh negatif**: transaksi yang stoknya tidak cukup saat sinkron **ditolak**, tidak hilang, dan tetap tersimpan di perangkat beserta alasannya agar bisa ditangani kasir. Yang bisa dicatat offline adalah **penjualan dan barang masuk**. **Pelunasan utang tetap perlu online**. Harga yang dipakai adalah **harga saat dicatat**, dan server memeriksa bahwa harga itu pernah berlaku; jika tidak cocok, transaksi ditolak.

## 5. Panduan Logika Aplikasi

Ditulis dengan bahasa sederhana agar bisa langsung diikuti AI Builder.

- **Saat Barang Masuk disimpan:** tambahkan jumlah ke stok barang itu, lalu simpan catatannya (tanggal, barang, jumlah, harga beli, pemasok).
- **Saat transaksi disimpan:** kurangi stok barang yang dipilih. Jika stok tidak cukup, tampilkan peringatan dan **jangan simpan**.
- **Tanpa konversi:** stok tiap varian berdiri sendiri. Menjual Beras eceran (kg) tidak mengubah stok Beras karung. Menjual Telur (butir) tidak mengubah stok Telur (rak).
- **Saat jumlah dibayar kurang dari total:** selisihnya menjadi utang. Nama pembeli **wajib** diisi, lalu tambahkan selisih itu ke total utang pembeli tersebut. Jika dibayar penuh, transaksi berstatus Lunas dan tidak ada utang. Jumlah dibayar tidak boleh negatif.
- **Saat pelunasan dicatat:** kurangi sisa utang. Jika sisa 0, tandai **Lunas**. Pembayaran tidak boleh melebihi sisa utang.
- **Jejak catatan:** setiap catatan menyimpan tanggal, jam, dan pengguna yang menginput.
- **Tanpa hapus permanen:** koreksi dilakukan lewat catatan baru agar riwayat tetap jelas.
- **Hak akses:** halaman admin hanya bisa dibuka akun admin. Kasir tidak boleh mengaksesnya.
- **Harga:** harga jual **hanya bisa diubah oleh admin**. Kasir tidak bisa mengubah harga, baik di daftar barang maupun saat transaksi.
- **Riwayat harga:** setiap kali admin mengubah harga jual (dan saat barang pertama kali ditambahkan), aplikasi mencatat riwayatnya: barang, harga, waktu berlaku, dan admin yang mengubah. Riwayat ini **tidak ditampilkan di MVP**; dipakai untuk fitur masa depan (kasir offline).
- **Data barang:** hanya admin yang boleh menambah barang baru dan mengubah data barang (nama, satuan, harga jual). Kasir hanya bisa melihat daftar barang dan stok, serta memilih barang yang sudah ada untuk barang masuk dan transaksi.
- **Password kasir:** minimal **8 karakter**. Saat admin membuat akun kasir atau mereset password, tampil **indikator kekuatan password** yang berubah saat mengetik: **Lemah**, **Sedang**, atau **Kuat**, lengkap dengan saran singkat (misalnya "Tambahkan huruf besar, angka, atau simbol"). Password dengan penilaian **Lemah ditolak** dan tidak bisa disimpan (pesan: "Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol."). Password **Sedang** dan **Kuat** boleh disimpan. Form login tidak memeriksa panjang password. Password awal akun admin (seed) juga harus minimal 8 karakter dan tidak boleh Lemah.
- **Kriteria penilaian password** (berlaku sama di layar dan di server): **Lemah** jika kurang dari 8 karakter, hanya satu jenis karakter, atau sama dengan username. **Sedang** jika minimal 8 karakter dan memuat minimal 2 jenis karakter. **Kuat** jika minimal 12 karakter dan memuat minimal 3 jenis karakter. Jenis karakter: huruf kecil, huruf besar, angka, dan simbol.
- **Daftar syarat password melayang:** saat kolom password dipilih (fokus) pada form buat akun kasir dan reset password, muncul **kotak kecil melayang di atas kolom password** berisi daftar syarat. Setiap syarat **berwarna merah jika belum terpenuhi dan hijau jika sudah**, dan berubah langsung saat mengetik. Selain warna, tiap syarat diberi tanda centang atau silang dan teks, agar tetap jelas bagi yang sulit membedakan warna. Kotak hilang saat kolom ditinggalkan. Jika ruang di atas tidak cukup (misalnya layar HP kecil), kotak pindah ke bawah kolom. Kotak ini tidak muncul di form login.
  - **Wajib agar password bisa disimpan:** minimal 8 karakter; tidak sama dengan username; memuat minimal 2 jenis karakter.
  - **Disarankan agar password Kuat:** minimal 12 karakter; memuat minimal 3 jenis karakter.
  - **Jenis karakter** (huruf kecil, huruf besar, angka, simbol) ditampilkan sebagai penanda kecil: hijau jika sudah ada, merah jika belum, agar mudah melihat jenis yang belum dipakai.
  - Password hanya bisa disimpan jika **semua syarat wajib hijau**. Syarat yang disarankan tidak menghalangi penyimpanan.

### Konfirmasi dan Peringatan

Sebelum aksi tertentu, aplikasi menampilkan kotak **"Yakin?"** agar kesalahan input tidak langsung tersimpan. Kotak yang sama dipakai di seluruh aplikasi. Menutup kotak tanpa memilih dianggap **batal**.

| Aksi | Konfirmasi | Isi pesan |
|---|---|---|
| Simpan transaksi **Lunas** | Tidak | Agar kasir tetap cepat |
| Simpan transaksi dengan **sisa utang** | Ya | Nama pembeli, total, dibayar, sisa utang |
| Catat pelunasan | Ya | Nama pembeli, nominal, sisa setelah bayar |
| Simpan barang masuk | Tidak | Langsung simpan |
| Ubah harga jual (admin) | Ya | Harga lama dan harga baru |
| Ubah data barang: nama atau satuan (admin) | Ya | Peringatan bahwa mengubah satuan mengubah arti angka stok |
| Reset password kasir (admin) | Ya | Nama akun kasir |
| Nonaktifkan barang (admin) | Ya | Nama barang |
| Kosongkan seluruh keranjang kasir | Ya | Jumlah item yang akan dihapus |
| Keluar (logout) saat keranjang masih berisi | Ya | Peringatan bahwa keranjang belum disimpan |
| Menutup form yang isiannya belum disimpan | Ya | Peringatan bahwa isian akan hilang |
| Hapus satu item dari keranjang kasir | Tidak | Mudah ditambahkan kembali |
| Tambah barang baru (admin) | Tidak | Mudah diubah lagi oleh admin |
| Buat akun kasir (admin) | Tidak | Langsung simpan |
| Aktifkan kembali barang (admin) | Tidak | Langsung simpan |

**Peringatan harga** (peringatan, bukan larangan: pengguna tetap boleh lanjut setelah membaca):
- **Barang masuk:** jika **harga beli lebih tinggi dari harga jual** barang itu, tampilkan kedua harga dan minta pengguna memeriksa ulang sebelum menyimpan.
- **Admin mengubah harga jual:** jika **harga baru di bawah harga beli terakhir** barang itu (diambil dari catatan barang masuk terbaru), tampilkan harga baru dan harga beli terakhir.
- Jika barang belum pernah punya catatan barang masuk, peringatan ini tidak ditampilkan.

### Notifikasi Singkat (Toast)

Setelah sebuah aksi selesai, aplikasi menampilkan **pesan kecil yang hilang sendiri** (toast) agar kasir tahu aksinya berhasil.

| Aksi | Pesan sukses |
|---|---|
| Simpan transaksi Lunas | "Transaksi tersimpan." |
| Simpan transaksi dengan sisa utang | "Transaksi tersimpan. Utang tercatat atas nama [nama pembeli]." |
| Simpan barang masuk | "Barang masuk tersimpan." |
| Catat pelunasan | "Pembayaran tercatat." |
| Tambah barang (admin) | "Barang ditambahkan." |
| Ubah data atau harga barang (admin) | "Data barang diperbarui." |
| Buat akun kasir (admin) | "Akun kasir dibuat." |
| Reset password kasir (admin) | "Password kasir direset." |

**Aturan:**
- Pesan sukses hilang sendiri setelah sekitar 3 detik. Peringatan sekitar 5 detik. Pesan error tetap tampil sampai ditutup.
- **Kesalahan pada form tetap tampil di form**, bukan sebagai toast. Contoh: "Stok tidak cukup" muncul di atas form sampai kasir memperbaikinya.
- Toast error dipakai untuk kegagalan di luar form, misalnya internet terputus atau sesi login berakhir. Jika sesi berakhir, pengguna diarahkan ke halaman login dan setelah login kembali ke halaman semula.
- Maksimal 3 pesan tampil sekaligus. Semua pesan memakai Bahasa Indonesia yang singkat.

### Tampilan Memuat dan Kosong

- **Saat data pertama kali dimuat**, aplikasi menampilkan **kerangka abu-abu berdenyut** (skeleton) yang menyerupai isi halaman, bukan layar kosong atau putaran besar.
- **Saat tidak ada data**, aplikasi menampilkan pesan ramah beserta petunjuk langkah berikutnya.
- **Saat gagal memuat**, aplikasi menampilkan "Data gagal dimuat." dengan tombol **Coba lagi**.
- Pesan untuk **"belum ada data"** berbeda dari **"hasil pencarian tidak ditemukan"**. Pada yang kedua tersedia tombol **Hapus pencarian**.
- Tombol aksi hanya tampil untuk pengguna yang berhak. Kasir tidak melihat tombol "Tambah barang".

| Tempat | Pesan saat kosong | Tombol |
|---|---|---|
| Daftar barang (kasir) | "Belum ada barang. Hubungi admin untuk menambahkan barang." | Tidak ada |
| Daftar barang (admin) | "Belum ada barang. Tambahkan barang pertama." | Tambah barang |
| Barang masuk | "Belum ada barang masuk. Catat barang masuk pertama." | Catat barang masuk |
| Utang (belum lunas) | "Tidak ada utang yang belum lunas." | Tidak ada |
| Rincian utang pembeli | "Belum ada pembayaran." | Tidak ada |
| Keranjang kasir | "Keranjang masih kosong. Pilih barang untuk memulai." | Tidak ada |
| Pilih barang (hasil pencarian kosong) | "Barang tidak ditemukan." | Tidak ada |
| Pencarian pada semua daftar | "Tidak ada hasil untuk [kata cari]." | Hapus pencarian |

### Tema Tampilan (Dark Mode)

- Aplikasi mendukung **mode terang** dan **mode gelap**.
- Pengguna memilih **Ikuti perangkat** (bawaan), **Terang**, atau **Gelap** lewat tombol pilihan tema di bagian atas setiap halaman, termasuk halaman login.
- Pilihan tersimpan di **perangkat** yang dipakai (bukan di akun) dan diingat saat aplikasi dibuka lagi.
- Halaman langsung tampil dengan tema yang benar, tanpa kilatan tema yang salah saat dibuka.
- Semua halaman, tabel, kartu, kotak konfirmasi, toast, dan indikator password tetap **mudah dibaca** di kedua mode. Status seperti Lunas dan Utang tidak hanya mengandalkan warna, tetapi juga teks.

## 6. Tech-Stack

| Kebutuhan | Pilihan | Penjelasan sederhana |
|---|---|---|
| Kerangka aplikasi | TanStack Start + React | Rangka utama aplikasi web |
| Rendering | SSR (bawaan TanStack Start) | Halaman pertama dibuat di server lalu dikirim ke browser, supaya cepat tampil di HP |
| Pengambilan data | TanStack Query | Mengambil dan menyegarkan data dari server (*API*, jalur komunikasi tampilan dan database) |
| Tabel | TanStack Table | Tabel daftar barang, transaksi, utang |
| Keadaan layar | TanStack Store | Menyimpan keadaan sementara, misal keranjang kasir |
| Grafik | Recharts | Disiapkan untuk grafik, **belum dipakai di MVP** |
| Penyimpanan lokal | Dexie (IndexedDB) | Disiapkan untuk fase berikutnya (PWA dan offline), **belum dipakai di MVP** |
| Form & validasi | Formisch + Valibot | Form input dan pengecekan isian |
| Login | Better Auth | Sistem login (*autentikasi*) |
| Tampilan | DaisyUI + Tailwind | Komponen dan gaya visual siap pakai |
| Ikon | Lucide React | Kumpulan ikon |
| Server & data | Hono + Drizzle + PostgreSQL | Hono: server API. Drizzle: penghubung ke database. PostgreSQL: penyimpan data |
| Hosting | Vercel | Tempat aplikasi tayang |
| Database | Neon (alternatif: Supabase) | Layanan PostgreSQL. Keduanya PostgreSQL, jadi struktur aplikasi tetap sama. Supabase hanya dipakai sebagai database, bukan untuk login |

**Catatan biaya:** semua pustaka gratis (*open source*). Neon dan Supabase punya paket gratis `[cek batasnya sebelum dipakai, termasuk apakah database dijeda saat lama tidak dipakai]`. Paket gratis Vercel (Hobby) resmi untuk pemakaian pribadi non-komersial, jadi `[risiko ketentuan komersial dicatat; jika bermasalah, pindah hosting atau paket berbayar]`.

## 7. Di Luar Cakupan MVP

Semua yang tercantum di **4.2 Fitur Masa Depan**, ditambah: daftar mandiri pengguna, reset password lewat email, dan aplikasi mobile native.

## 8. Hal yang Masih Perlu Diputuskan

- Tidak ada keputusan produk yang tertunda. Catatan: risiko hosting Vercel (bagian 6) dan batas paket gratis Neon perlu dicek sendiri oleh Project Owner.
