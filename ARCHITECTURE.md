# ARCHITECTURE: Kasiar

> Dokumen ini menjelaskan **bagaimana Kasiar dirancang secara teknis**, dengan bahasa sederhana.
> Baca bersama `PRD.md`. Isi di sini adalah **usulan**; AI Builder boleh menyesuaikan selama tidak melanggar `PRD.md`.
> Tanda `[...]` berarti belum diputuskan. Jangan ditebak, tanyakan Project Owner.
> Dokumen ini sengaja **tanpa kode**.

## 1. Gambaran Umum

```
Browser (kasir / admin)
        │
        ▼
TanStack Start (halaman web)  ── dihosting di Vercel
        │
        ▼
Hono (server API)  ── semua aturan bisnis dan pengecekan hak akses
        │
        ▼
Drizzle (penghubung)
        │
        ▼
PostgreSQL di Neon atau Supabase (penyimpan data)
```

Tampilan **responsif**: nyaman dipakai di HP (mobile) dan komputer (desktop). Halaman dirender di server (**SSR**) lalu diteruskan ke browser.

Better Auth menangani login dan sesi. Semua data dibaca dan ditulis **hanya lewat server Hono**, tidak langsung dari browser ke database.

## 2. Peran Setiap Bagian

| Bagian | Tugas di Kasiar |
|---|---|
| TanStack Start | Halaman: login, barang, barang masuk, kasir, utang, admin. Dirender di server (SSR) |
| TanStack Query | Mengambil dan menyegarkan data dari server |
| TanStack Table | Tabel daftar barang, riwayat transaksi, daftar utang |
| TanStack Store | Keranjang kasir (isi sementara sebelum disimpan) |
| Formisch + Valibot | Form dan pengecekan isian di layar |
| Better Auth | Login username + password, peran admin/kasir. Gunakan fitur username dan peran bawaannya bila tersedia |
| Hono | Server API: aturan stok, utang, dan hak akses |
| Drizzle | Menulis dan membaca database, serta mengelola perubahan struktur tabel |
| Neon (PostgreSQL), alternatif Supabase | Menyimpan semua data. Supabase hanya dipakai sebagai database, bukan untuk login |
| DaisyUI + Tailwind + Lucide | Tampilan dan ikon |
| Recharts | **Belum dipakai di MVP** |
| Dexie (IndexedDB) | **Belum dipakai di MVP** (fase berikutnya, lihat bagian 11) |

## 3. Struktur Folder (usulan)

> Ini usulan. Ikuti kebiasaan bawaan TanStack Start versi yang dipakai, dan AI Builder boleh menyesuaikan nama atau letak file selama pembagian tugasnya tetap sama.
> Nama folder fitur memakai istilah toko (barang, utang) agar mudah dipahami Project Owner.

```
kasiar/
├── PRD.md                      # apa yang dibangun
├── ARCHITECTURE.md             # dokumen ini
├── AGENTS.md                   # aturan untuk AI Builder
├── .env.example                # daftar NAMA pengaturan rahasia (tanpa isi asli)
├── drizzle.config.ts           # pengaturan Drizzle
├── drizzle/                    # riwayat perubahan struktur tabel (migrasi), dibuat otomatis
└── src/
    ├── router.tsx              # membuat router + nilai awal context (queryClient + session)
    ├── routes/                 # HALAMAN (satu file = satu alamat di browser)
    │   ├── __root.tsx          # kerangka semua halaman; dibuat dengan createRootRouteWithContext, membaca session ke context, memasang Provider (queryClient, konfirmasi, toast), mengatur tema dari cookie
    │   ├── login.tsx           # halaman login
    │   ├── _app.tsx            # pembungkus: wajib login (cek session dari context)
    │   ├── _app/
    │   │   ├── index.tsx       # beranda, diarahkan ke kasir
    │   │   ├── kasir.tsx       # penjualan (Lunas / bayar sebagian / Utang)
    │   │   ├── barang.tsx      # daftar barang & stok (kasir hanya melihat)
    │   │   ├── barang-masuk.tsx# catat barang masuk
    │   │   ├── utang.tsx       # daftar pembeli, sisa utang, catat pelunasan
    │   │   └── admin/          # KHUSUS ADMIN
    │   │       ├── route.tsx   # pembungkus: wajib admin (cek peran dari context)
    │   │       ├── index.tsx   # menu admin
    │   │       ├── pengguna.tsx# buat akun kasir, reset password
    │   │       └── barang.tsx  # tambah/ubah barang dan harga jual
    │   └── api/
    │       └── $.ts            # pintu masuk API: meneruskan permintaan ke server Hono
    ├── features/               # isi tampilan per fitur; tiap folder punya `queries.ts` (query dan mutasi), `columns.tsx` (kolom tabel) bila punya daftar, dan file form seperti `barang-form.tsx` bila punya form
    │   ├── kasir/              # keranjang (TanStack Store), form pembayaran
    │   ├── barang/
    │   ├── barang-masuk/
    │   ├── utang/
    │   └── admin/
    ├── components/             # komponen umum yang dipakai banyak fitur (tabel, input, tombol, layout)
    │   ├── modal/              # kotak dialog reusable: Modal, ModalBody, ModalFooter (lihat "Modal Reusable")
    │   ├── confirm/            # modal konfirmasi (dibangun di atas Modal): confirm-provider.tsx (dipasang di __root) + use-confirm.ts (hook)
    │   ├── form/               # field form reusable + tombol simpan (lihat "Field Form Reusable")
    │   ├── data-table/         # tabel reusable (TanStack Table): paginasi, pencarian, kartu di HP (lihat "Data Table Reusable")
    │   ├── toast/              # notifikasi singkat: toast-provider.tsx (dipasang di __root) + use-toast.ts (hook)
    │   ├── feedback/           # EmptyState, Skeleton, ErrorState (lihat "Komponen Umpan Balik")
    │   └── theme/              # tema terang/gelap: theme-toggle.tsx + pembaca cookie tema (lihat "Tema (Dark Mode)")
    ├── server/                 # SERVER (hanya berjalan di server)
    │   ├── app.ts              # aplikasi Hono utama
    │   ├── middleware/         # cek sudah login, cek peran admin
    │   ├── routes/             # endpoint per fitur: barang, barang-masuk, transaksi, utang, admin
    │   └── services/           # ATURAN BISNIS: stok, transaksi, utang (semuanya atomik)
    ├── db/
    │   ├── index.ts            # koneksi ke PostgreSQL
    │   ├── schema/             # definisi tabel (Drizzle), termasuk tabel milik Better Auth
    │   └── seed.ts             # membuat akun admin awal
    ├── lib/
    │   ├── auth.ts             # Better Auth sisi server
    │   ├── auth-client.ts      # Better Auth sisi layar
    │   ├── api.ts              # fungsi dasar memanggil API Hono + penanganan error
    │   ├── format.ts           # format rupiah dan angka (kg satu angka di belakang koma)
    │   ├── password-strength.ts # menilai password: tingkat (Lemah, Sedang, Kuat) dan status tiap syarat
    │   └── konstanta.ts        # nilai tetap bersama: satuan, peran, status, ukuran halaman
    ├── validation/             # aturan isian Valibot, dipakai layar dan server (satu file per form, ditambah `search.ts` untuk parameter URL)
    ├── types/                  # tipe bersama: bentuk respons API, bentuk error, session (lihat "Types dan Schema")
    └── styles/
        └── app.css             # Tailwind + DaisyUI (dua tema: terang dan gelap)
```

Catatan: file `api/$.ts` hanya gambaran. Cara menghubungkan Hono ke TanStack Start mengikuti dokumentasi resmi versi yang dipakai.

### Peta Fitur

| Fitur | Halaman | Endpoint server | Tabel utama |
|---|---|---|---|
| Kasir | `kasir` | `transaksi` | Transaksi, Item Transaksi, Pembeli, Barang |
| Daftar barang | `barang`, `admin/barang` | `barang` | Barang |
| Barang masuk | `barang-masuk` | `barang-masuk` | Barang Masuk, Barang |
| Utang | `utang` | `utang` | Pembeli, Pembayaran Utang, Transaksi |
| Admin | `admin/*` | `admin` | Pengguna (Better Auth) |

### Aturan Penempatan

- **Aturan bisnis hanya di `server/services/`** (stok, transaksi, utang). Layar boleh menghitung total untuk tampilan, tetapi server menghitung ulang dan menjadi sumber kebenaran.
- **Layar tidak mengakses database.** Semua data lewat API Hono (diambil dengan TanStack Query). Komponen dan loader tidak memanggil API langsung; selalu lewat `queries.ts` fitur tersebut.
- **Validasi satu sumber:** aturan isian ditulis sekali di `validation/` dan dipakai layar maupun server.
- **Pengecekan peran di `server/middleware/`**, bukan hanya menyembunyikan menu di layar.
- **Satu fitur, satu set file:** satu folder di `features/`, satu file di `server/routes/`, dan tabelnya di `db/schema/`.
- **`seed.ts` hanya** membuat akun admin awal dan membaca username serta password awal dari pengaturan lingkungan.
- **Rahasia** hanya di file pengaturan lingkungan (`.env`) yang tidak masuk riwayat versi. `.env.example` hanya berisi nama pengaturannya.

### Context Router (queryClient dan session)

Router TanStack punya **context**: tempat menitipkan data yang bisa dipakai semua halaman. Kasiar menitipkan dua hal di sana:

- **queryClient** (pengelola data TanStack Query)
- **session** (data pengguna yang sedang login: id, username, peran; atau kosong jika belum login)

**Mendeklarasikan context (bertipe):**
- Bentuk context ditulis sebagai tipe `RouterContext` di `types/`. Isinya `queryClient` dan `session` (session boleh kosong).
- Root route di `__root.tsx` dibuat dengan **`createRootRouteWithContext`** yang diberi tipe `RouterContext`. Dengan begitu semua route di bawahnya (`_app.tsx`, `admin/route.tsx`, halaman, loader, dan `beforeLoad`) mendapat context yang bertipe, dan salah ketik langsung terdeteksi.
- `router.tsx` membuat router dengan **nilai awal context**: QueryClient baru dan session kosong.
- Session diisi di `beforeLoad` milik root route (dari cookie, lewat server function Better Auth). Hasil `beforeLoad` bergabung ke context sehingga bisa dibaca route turunan. Cara persisnya mengikuti dokumentasi TanStack Router dan TanStack Start versi yang dipakai.

**Cara kerja:**
1. `router.tsx` membuat router dengan nilai awal context, termasuk **QueryClient baru untuk setiap permintaan di server**. Jangan memakai satu QueryClient global di server, agar data satu pengguna tidak bocor ke pengguna lain. Di browser cukup satu.
2. `__root.tsx` membaca session dari cookie login (lewat Better Auth, di server) di `beforeLoad` sebelum halaman dimuat, lalu menaruhnya di context. Pembungkus aplikasi (Provider) TanStack Query dipasang di sini dengan queryClient dari context.
3. `_app.tsx` mengecek session dari context. Jika kosong, arahkan ke halaman login.
4. `_app/admin/route.tsx` mengecek peran dari context. Jika bukan admin, tolak dan arahkan keluar.
5. Pemuat data (*loader*) tiap halaman memakai queryClient dari context untuk mengambil data lebih dulu, sehingga halaman tampil sudah berisi data.
6. Setelah **login atau logout**, context dimuat ulang dan cache queryClient dikosongkan agar data pengguna sebelumnya tidak tersisa.

**Batasan penting:**
- Session di context dipakai untuk **pengalihan halaman dan tampilan menu**, bukan untuk keamanan. Server Hono tetap mengecek login dan peran sendiri di `server/middleware/`.
- Session tidak disimpan di TanStack Store. Sumber kebenarannya satu: cookie login yang dibaca Better Auth.
- Isi session secukupnya (id, username, peran). Jangan menaruh password atau data sensitif lain.

### queries.ts (Query dan Mutasi)

Setiap fitur punya **satu file `queries.ts`** di foldernya (`features/kasir/queries.ts`, `features/barang/queries.ts`, dan seterusnya). File ini satu-satunya tempat layar berbicara dengan API Hono.

**Isi setiap `queries.ts`:**
1. **Kunci query** (*query key*, label data di cache) yang disusun berjenjang per fitur, misalnya semua data barang berada di bawah satu label induk.
2. **Query:** pengambil data (daftar barang, riwayat barang masuk, daftar utang, dan sebagainya) dalam bentuk *query options* TanStack Query, sehingga bisa dipakai oleh loader halaman maupun komponen.
3. **Mutasi:** aksi menyimpan atau mengubah data (simpan transaksi, simpan barang masuk, catat pelunasan, ubah harga, dan sebagainya).
4. **Aturan memuat ulang data** (*invalidation*) setelah mutasi berhasil.

**Aturan:**
- Komponen dan loader **tidak memanggil API langsung**; selalu lewat `queries.ts` fitur terkait. Fungsi dasar pemanggilan API dan penanganan error ada di `lib/api.ts`. Klien bawaan Hono boleh dipakai jika memudahkan.
- **Validasi dengan aturan Valibot** dari `validation/` sebelum data dikirim. Server tetap memvalidasi ulang.
- **Tanpa pembaruan optimistis** untuk stok dan utang. Layar baru berubah setelah server menjawab berhasil, karena server adalah sumber kebenaran.
- **Cegah klik ganda:** tombol simpan dinonaktifkan selama mutasi berjalan, agar transaksi tidak tersimpan dua kali.
- **Pesan error dari server** (Bahasa Indonesia, misalnya "Stok tidak cukup") ditampilkan apa adanya kepada kasir.
- Setelah transaksi berhasil, keranjang kasir (TanStack Store) dikosongkan.

**Data yang dimuat ulang setelah mutasi berhasil:**

| Mutasi | Data yang dimuat ulang |
|---|---|
| Simpan transaksi | Barang (stok berubah), utang dan pembeli |
| Simpan barang masuk | Barang |
| Catat pelunasan | Utang dan pembeli |
| Tambah/ubah barang atau harga (admin) | Barang |
| Buat akun/reset password (admin) | Pengguna |

### Modal Konfirmasi (useConfirm)

Semua konfirmasi "Yakin?" memakai **satu modal bersama** yang dipanggil lewat hook `useConfirm`, bukan modal buatan sendiri di tiap halaman.

**Cara kerja:**
1. `confirm-provider.tsx` dipasang **sekali** di `__root.tsx` dan menampilkan satu modal yang dibangun di atas komponen `Modal` reusable (lihat Modal Reusable).
2. `use-confirm.ts` adalah hook yang dipanggil dari komponen. Hasilnya fungsi `confirm(...)` yang **ditunggu (await) jawabannya**: `true` jika pengguna menekan tombol lanjut, `false` jika batal.
3. Isian yang bisa diatur saat memanggil: judul, pesan, teks tombol lanjut dan batal, serta jenis (biasa atau berbahaya, tombol lanjut berwarna merah).
4. Alurnya di komponen: tanya `confirm` dulu, lalu hanya jika `true`, jalankan mutasi dari `queries.ts`.

**Aturan:**
- `queries.ts` **tidak boleh** memanggil `useConfirm` atau menyentuh tampilan. Konfirmasi dilakukan di komponen, sebelum memanggil mutasi.
- **Satu konfirmasi aktif pada satu waktu.**
- Menutup modal (tombol Esc atau klik di luar modal) dianggap **batal**.
- Untuk aksi berbahaya, fokus awal ada di tombol **Batal**.
- Tombol cukup besar untuk layar HP, dan teks memakai Bahasa Indonesia.
- Modal yang berisi **form** (misalnya form tambah barang di halaman admin) bukan konfirmasi. Itu memakai komponen `Modal` reusable (lihat Modal Reusable).

**Aksi yang memakai konfirmasi** (sama dengan `PRD.md` bagian 5, "Konfirmasi dan Peringatan", yang menjadi acuan utama):

| Aksi | Konfirmasi | Isi pesan |
|---|---|---|
| Simpan transaksi **Lunas** | Tidak | Agar kasir tetap cepat |
| Simpan transaksi dengan **sisa utang** | Ya | Nama pembeli, total, dibayar, sisa utang |
| Catat pelunasan | Ya | Nama pembeli, nominal, sisa setelah bayar |
| Simpan barang masuk | Tidak | Langsung simpan |
| Ubah harga jual (admin) | Ya | Harga lama dan harga baru |
| Reset password kasir (admin) | Ya | Nama akun kasir |
| Nonaktifkan barang (admin) | Ya | Nama barang |
| Kosongkan seluruh keranjang kasir | Ya | Jumlah item yang akan dihapus |
| Keluar (logout) saat keranjang masih berisi | Ya | Peringatan bahwa keranjang belum disimpan |
| Menutup form yang isiannya belum disimpan (barang masuk, pelunasan, form admin) | Ya | Peringatan bahwa isian akan hilang |
| Ubah data barang: nama atau satuan (admin) | Ya | Peringatan bahwa mengubah satuan mengubah arti angka stok |
| Simpan barang masuk dengan harga beli **lebih tinggi** dari harga jual | Ya (peringatan) | Harga beli, harga jual, dan ajakan memeriksa ulang |
| Ubah harga jual **di bawah** harga beli terakhir (admin) | Ya (peringatan) | Harga baru dan harga beli terakhir |
| Hapus satu item dari keranjang kasir | Tidak | Mudah ditambahkan kembali |
| Tambah barang baru (admin) | Tidak | Mudah diubah lagi oleh admin |
| Buat akun kasir (admin) | Tidak | Langsung simpan |
| Aktifkan kembali barang (admin) | Tidak | Langsung simpan |

### Field Form Reusable

Semua isian form memakai **komponen field yang sama**, disimpan di `components/form/`. Tujuannya agar tampilan, pesan error, dan format angka konsisten di seluruh aplikasi, dan form baru bisa dibuat cepat.

**Daftar komponen:**

| Komponen | Fungsi | Dipakai di |
|---|---|---|
| `FormField` | Pembungkus dasar: label, teks bantuan, pesan error | Dipakai semua field di bawah |
| `TextField` | Isian teks | Nama barang, nama pembeli, pemasok, username |
| `PasswordField` | Isian password dengan tombol tampilkan/sembunyikan | Login, buat akun kasir, reset password |
| `PasswordStrengthIndicator` | Indikator kekuatan password (Lemah, Sedang, Kuat) di bawah isian, dipasang lewat pilihan `showStrength` pada `PasswordField` | Buat akun kasir, reset password (tidak di login) |
| `PasswordRequirementsPopover` | Kotak daftar syarat password yang **melayang di atas** isian. Tiap syarat merah (belum terpenuhi) atau hijau (sudah). Dipasang lewat pilihan `showStrength` pada `PasswordField` | Buat akun kasir, reset password (tidak di login) |
| `NumberField` | Isian angka dengan jumlah desimal yang bisa diatur (0 atau 1) | Jumlah barang masuk dan jumlah di kasir (kg beras eceran: satu angka di belakang koma) |
| `RupiahField` | Isian uang, bilangan bulat, tampil seperti "Rp 12.000" | Harga jual, harga beli, jumlah dibayar, nominal pelunasan |
| `SelectField` | Pilihan dari daftar | Satuan barang |
| `DateField` | Isian tanggal | Tanggal barang masuk |
| `FormSubmitButton` | Tombol simpan, nonaktif dan menampilkan penanda proses saat mutasi berjalan | Semua form |
| `FormAlert` | Kotak pesan di atas form untuk error dari server (misal "Stok tidak cukup") | Semua form |

Field yang bergantung pada data fitur tetap dibangun dari komponen di atas, tetapi ditaruh di foldernya: `BarangSelectField` (pilih barang, bisa dicari) di `features/barang/`, dan `PembeliField` (pilih pembeli yang sudah ada atau ketik nama baru) di `features/utang/`. Keduanya dipakai di kasir, barang masuk, dan utang.

**Aturan:**
- **Wajib dipakai.** Semua form (login, barang, barang masuk, kasir, pelunasan, admin) memakai field dari `components/form/`. Jangan membuat isian mentah sendiri di halaman.
- **Field hanya mengurus tampilan dan format**, tanpa aturan bisnis. Aturan isian tetap di `validation/` (Valibot).
- **Pesan error berbahasa Indonesia** ditulis di `validation/`, bukan di komponen field.
- **Nilai disimpan sebagai angka murni**, bukan teks berformat. "Rp 12.000" tampil di layar, tetapi nilainya 12000. Koma desimal (2,5) hanya format tampilan; nilai yang dikirim adalah angka 2.5. Fungsi format dipakai dari `lib/format.ts`.
- **Ramah HP:** isian angka memunculkan keyboard angka, label selalu terlihat (bukan hanya placeholder), dan ukuran sentuh cukup besar.
- **Pesan error** muncul setelah isian disentuh atau saat form dikirim, dan terhubung dengan isiannya agar terbaca pembaca layar.
- **Tampilan memakai kelas DaisyUI** (input, select, label) agar gayanya seragam.
- **Sambungan ke Formisch** mengikuti dokumentasi resminya. Satu field cukup menerima data field dari Formisch dan tidak mengatur status form sendiri.

### SSR (Server-Side Rendering)

**SSR** artinya halaman pertama dibuat di server lalu dikirim ke browser **sudah berisi data**. Setelah tampil, aplikasi berjalan di browser seperti biasa. TanStack Start menyediakannya secara bawaan, dan Kasiar **memakai SSR**.

**Alasan:**
- Halaman tampil lebih cepat di HP, termasuk saat sinyal kurang bagus.
- Pengecekan login dan peran terjadi di server **sebelum** halaman dikirim, jadi tidak ada halaman yang sempat berkedip lalu dialihkan ke login.

**Cara kerja:**
1. Permintaan masuk. Server membuat router dan QueryClient baru (lihat Context Router), lalu `__root.tsx` membaca session dari cookie. `_app.tsx` dan `admin/route.tsx` mengarahkan ke login atau menolak langsung di server.
2. Loader halaman memuat data awal lewat `queries.ts` memakai queryClient dari context. Hasilnya dikirim bersama halaman dan dipulihkan di browser tanpa mengambil ulang. Cara menyambungkan TanStack Query dengan TanStack Start mengikuti dokumentasi resminya.
3. Setelah halaman tampil, perpindahan antarhalaman berjalan di browser dan memakai cache.

**Aturan:**
- **Semua halaman memakai SSR.** Bagian yang hanya hidup di browser, seperti keranjang kasir (TanStack Store), modal konfirmasi, dan isian form yang sedang diketik, tidak boleh bergantung pada server. Kerangka halamannya tetap SSR.
- **Memanggil API Hono saat SSR:** bila memungkinkan dilakukan langsung di dalam proses yang sama (tanpa lewat internet) dan **meneruskan cookie login** dari permintaan asli. `lib/api.ts` menangani dua keadaan: berjalan di server dan berjalan di browser.
- **Jangan di-cache bersama.** Halaman setelah login berisi data toko, jadi diberi pengaturan agar tidak disimpan oleh CDN atau cache bersama (*no-store* atau *private*).
- **Tidak diindeks mesin pencari.** Semua halaman diberi penanda *noindex*, karena ini aplikasi internal.
- **Hindari ketidakcocokan tampilan** (*hydration mismatch*): tanggal, jam, dan format yang bergantung zona waktu dirender di browser setelah halaman dimuat. Waktu disimpan dalam UTC dan ditampilkan mengikuti zona waktu perangkat. Jangan memakai `window` atau penyimpanan browser saat render di server.
- **Kode server tetap di server.** `server/`, `db/`, dan `lib/auth.ts` tidak boleh ikut terkirim ke browser, begitu pula semua rahasia.
- **Halaman pendamping di `__root.tsx`:** indikator memuat (*pending*), halaman error, dan halaman tidak ditemukan, semuanya berbahasa Indonesia.

### Parameter URL (validateSearch)

Pencarian, filter, dan nomor halaman pada daftar disimpan di **alamat halaman (URL)**, misalnya `/utang?status=belum-lunas&halaman=2`. Parameter ini divalidasi memakai `validateSearch` dari TanStack Router, dengan skema Valibot. Valibot bisa dipakai langsung bila versi router mendukung standar validasi (*Standard Schema*); jika tidak, gunakan pembungkus sesuai dokumentasi resminya.

**Manfaatnya:**
- Tombol kembali (*back*) di HP berfungsi sewajarnya, dan menyegarkan halaman tidak menghilangkan filter.
- Hasil pertama dari server (SSR) sudah sesuai filter, karena server ikut membaca parameter.
- Tautan ke daftar yang sudah difilter bisa disalin dan dikirim.

**Parameter per halaman (disetujui Project Owner):**

| Halaman | Parameter | Isi dan nilai bawaan |
|---|---|---|
| `login` | `kembali` | Alamat tujuan setelah login. Hanya alamat internal aplikasi |
| `barang` | `q`, `halaman` | Kata cari nama barang; nomor halaman (bawaan 1) |
| `admin/barang` | `q`, `halaman`, `status` | Sama seperti di atas, ditambah status: aktif (bawaan), nonaktif, atau semua |
| `barang-masuk` | `q`, `dari`, `sampai`, `halaman` | Kata cari barang atau pemasok; rentang tanggal (format `YYYY-MM-DD`); nomor halaman |
| `utang` | `q`, `status`, `pembeli`, `halaman` | Kata cari nama pembeli; status: belum lunas (bawaan) atau semua; pembeli yang rinciannya dibuka; nomor halaman |
| `kasir` | (tidak ada) | Keranjang hanya hidup di browser dan tidak masuk URL |
| `admin/pengguna` | (tidak ada) | |

**Aturan:**
- **Skema ditulis di `validation/search.ts`** (satu skema per halaman) dan dipasang di `validateSearch` route halaman tersebut.
- **Nilai tidak valid diganti nilai bawaan**, bukan menampilkan halaman error. Contoh: `halaman=abc` menjadi `halaman=1`.
- **Batasan nilai:** `halaman` bilangan bulat minimal 1, `q` maksimal 100 karakter, `dari` tidak boleh lebih besar dari `sampai`, dan `status` hanya salah satu dari pilihan yang ada.
- **`kembali` wajib alamat internal**, yaitu diawali satu garis miring `/` dan tidak diawali `//`. Selain itu diabaikan. Ini mencegah pengguna dialihkan ke situs lain (*open redirect*). Saat `_app.tsx` mengarahkan ke login, alamat semula dititipkan di `kembali`.
- **URL jadi sumber kebenaran** untuk filter dan halaman. State tabel (TanStack Table) dibaca dari parameter URL, bukan disimpan terpisah di komponen.
- **Pencarian diketik dengan jeda singkat** (*debounce*) sebelum memperbarui URL, agar tidak berpindah di setiap ketukan.
- **Loader memakai parameter** lewat `loaderDeps`, dan `queries.ts` menerima parameter yang **sudah tervalidasi**. Parameter ikut menjadi bagian kunci query.
- **Paginasi dilakukan di server.** Ukuran halaman tetap, **20 baris**. Server Hono **memvalidasi ulang** parameter yang diterimanya dan tidak mempercayai URL.
- **Jangan menaruh rahasia di URL:** tidak ada password, token, atau data sensitif lain.
- Kondisi modal dan keranjang tidak disimpan di URL.

### Data Table Reusable

Semua daftar (barang, barang masuk, utang, dan daftar pengguna di admin) memakai **satu komponen tabel yang sama**, dibangun dari TanStack Table dan tampilan DaisyUI, disimpan di `components/data-table/`.

**Komponen:**

| Komponen | Fungsi |
|---|---|
| `DataTable` | Tabel utama. Menerima definisi kolom, baris halaman ini, total baris, dan halaman aktif |
| `DataTablePagination` | Kontrol halaman: sebelumnya, berikutnya, nomor halaman, dan keterangan seperti "21 sampai 40 dari 135". Mengubah parameter `halaman` di URL |
| `DataTableSearch` | Kotak cari (`q`) dengan jeda singkat (*debounce*). Saat kata cari berubah, halaman kembali ke 1 |
| `DataTableToolbar` | Tempat kotak cari dan filter lain (status, rentang tanggal) |
| `DataTableStates` | Tampilan **memuat**, **kosong** (misal "Belum ada barang"), dan **error** dengan tombol coba lagi, semuanya Bahasa Indonesia. Dibangun dari `Skeleton`, `EmptyState`, dan `ErrorState` (lihat Komponen Umpan Balik) |
| `cells.tsx` | Sel siap pakai: `RupiahCell`, `JumlahCell` (angka dengan satuan), `TanggalCell`, `StatusBadge` (Lunas, Utang, Aktif, Nonaktif), dan `AksiMenu` |

**Cara kerja:**
1. Kolom **didefinisikan per fitur** di `features/<fitur>/columns.tsx`. `DataTable` tidak tahu soal barang atau utang.
2. Tabel memakai mode **server-side** (*manual pagination* di TanStack Table). Pengurutan, pencarian, dan paginasi dilakukan server, bukan di browser.
3. `DataTable` **tidak menyimpan state halaman atau filter sendiri**. Ia hanya mengubah parameter URL (lihat Parameter URL), lalu loader mengambil data baru lewat `queries.ts`.
4. Semua endpoint daftar mengembalikan **bentuk jawaban yang sama**: baris halaman ini, total baris, halaman aktif, dan ukuran halaman (20). Jumlah halaman dihitung dari total.
5. Jika `halaman` melebihi jumlah halaman, arahkan ke halaman terakhir.
6. Saat berpindah halaman, **data lama tetap tampil** dengan penanda memuat kecil sampai data baru siap, agar tabel tidak berkedip.

**Tampilan di HP dan desktop (disetujui Project Owner):**
- Di **desktop**, tampil sebagai tabel penuh.
- Di **HP**, tiap baris tampil sebagai **kartu**: kolom penting menjadi judul dan keterangan utama, sisanya dilipat atau disembunyikan. Tiap kolom diberi penanda prioritas tampilan HP: `judul`, `detail`, atau `sembunyi`.
- Tombol aksi dan kontrol halaman berukuran cukup besar untuk disentuh.

**Aturan:**
- **Wajib dipakai.** Jangan membuat tabel HTML mentah di halaman.
- **Urutan baris tetap** ditentukan server untuk tiap daftar (misalnya barang masuk dari yang terbaru). Pengurutan oleh pengguna bukan bagian MVP.
- **Format sel** memakai fungsi dari `lib/format.ts` lewat `cells.tsx` (rupiah, kg satu angka di belakang koma, tanggal).
- **Aksi per baris** (ubah harga, nonaktifkan barang, catat pelunasan) berada di kolom aksi dan memakai `useConfirm` sesuai tabel konfirmasi. Kolom aksi khusus admin hanya tampil untuk admin, dan server tetap mengecek peran.
- **Klik baris** bersifat opsional, misalnya di daftar utang untuk membuka rincian pembeli (mengisi parameter `pembeli` di URL).
- Paginasi boleh dimatikan untuk daftar yang pendek (misalnya daftar pengguna di admin).
- Tabel harus punya label yang jelas untuk pembaca layar, dan kontrol halaman memiliki `aria-label` berbahasa Indonesia.

### Toast (Notifikasi Singkat)

**Toast** adalah pesan kecil yang muncul sebentar lalu hilang sendiri, misalnya "Transaksi tersimpan". Dibangun dengan komponen `toast` dan `alert` dari DaisyUI, **tanpa pustaka tambahan**.

**Komponen (`components/toast/`):**
- `toast-provider.tsx` dipasang **sekali** di `__root.tsx` dan menampilkan wadah toast. Wadah ini hanya hidup di browser, tidak dirender saat SSR.
- `use-toast.ts` adalah hook yang dipanggil dari komponen, dengan pilihan jenis: **sukses**, **info**, **peringatan**, dan **error**.

**Aturan:**
- **Dipanggil dari komponen**, setelah mutasi dari `queries.ts` berhasil atau gagal. `queries.ts` **tidak boleh** memanggil `useToast`, sama seperti `useConfirm`.
- **Toast untuk hasil aksi.** Daftar pesannya ada di `PRD.md` bagian 5, "Notifikasi Singkat (Toast)".
- **Error validasi dan error dari server pada form tetap di form** (`FormAlert` atau di bawah field), bukan toast, karena toast hilang sendiri dan kasir bisa tidak sempat membaca pesan seperti "Stok tidak cukup". Toast error hanya untuk kegagalan di luar form, misalnya jaringan terputus atau sesi berakhir.
- **Sesi berakhir** (server menjawab belum login): tampilkan toast lalu arahkan ke halaman login dengan `kembali` berisi alamat semula.
- **Lama tampil:** sukses dan info sekitar 3 detik, peringatan sekitar 5 detik, error tetap tampil sampai ditutup.
- **Maksimal 3 toast** sekaligus. Yang paling lama diganti. Pesan yang sama berturut-turut tidak diulang.
- **Posisi:** di HP di bagian atas tengah agar tidak tertutup keyboard, di desktop di pojok kanan atas.
- **Aksesibilitas:** wadah memakai `aria-live`. Sukses dan info bersifat sopan (*polite*), error bersifat langsung (*assertive*), agar terbaca pembaca layar.
- Pesan singkat, **Bahasa Indonesia**, tanpa istilah teknis.

### Komponen Umpan Balik (Empty State, Skeleton, Error State)

Tiga komponen ini dipakai di seluruh aplikasi untuk keadaan **sedang memuat**, **kosong**, dan **gagal memuat**. Disimpan di `components/feedback/` dan dibangun dengan DaisyUI (kelas `skeleton`) dan ikon Lucide, **tanpa pustaka tambahan**.

| Komponen | Fungsi |
|---|---|
| `EmptyState` | Tampilan kosong: ikon, judul, keterangan singkat, dan tombol aksi (opsional) |
| `Skeleton` | Kerangka abu-abu berdenyut yang menyerupai bentuk isi. Variannya: baris tabel, kartu (HP), blok teks, dan form |
| `ErrorState` | Pesan gagal memuat dengan tombol "Coba lagi" yang mengambil ulang data |

**Aturan `EmptyState`:**
- Bedakan dua keadaan: **belum ada data sama sekali** ("Belum ada barang.") dan **hasil pencarian atau filter tidak ditemukan** ("Tidak ada hasil untuk ..."). Pada keadaan kedua, aksinya adalah "Hapus pencarian", yang mengosongkan parameter URL (lihat Parameter URL).
- **Sadar peran.** Tombol aksi hanya tampil untuk pengguna yang berhak. Contoh: admin melihat tombol "Tambah barang", sedangkan kasir melihat petunjuk "Hubungi admin untuk menambahkan barang".
- Ikon bersifat dekoratif, dan teksnya Bahasa Indonesia yang singkat dan ramah.
- Daftar pesan per layar ada di `PRD.md` bagian 5, "Tampilan Memuat dan Kosong".

**Aturan `Skeleton`:**
- **Meniru bentuk isi sebenarnya** agar tata letak tidak melompat saat data tiba.
- **Hanya untuk pemuatan pertama** saat belum ada data. Saat berpindah halaman daftar, data lama tetap tampil dengan penanda memuat kecil (lihat Data Table Reusable).
- Ditampilkan lewat komponen *pending* tiap route. Skeleton baru muncul bila memuat lebih lama dari jeda singkat (sekitar 200 milidetik, lewat pengaturan *pendingMs* dan *pendingMinMs* di TanStack Router, ikuti dokumentasi resminya), agar data yang cepat datang tidak membuat layar berkedip.
- Dengan SSR, halaman pertama sudah berisi data, jadi skeleton terutama muncul saat berpindah halaman di browser.
- **Tidak ada layar putaran penuh** (*full-screen spinner*). Tombol yang sedang menyimpan memakai penanda proses di `FormSubmitButton`, bukan skeleton.
- **Aksesibilitas:** area yang memuat diberi `aria-busy` dan teks tersembunyi "Memuat..." untuk pembaca layar. Animasi dikurangi bagi pengguna yang mengaktifkan pengaturan *reduce motion*.

**Aturan `ErrorState`:**
- Dipakai di `DataTableStates`, komponen error route (`errorComponent` di `__root.tsx`), dan area lain yang gagal memuat.
- Pesan umum berbahasa Indonesia ("Data gagal dimuat."), tanpa detail teknis. Tombol "Coba lagi" mengambil ulang data.

**Pemakaian bersama:** `DataTableStates` dibangun dari `Skeleton`, `EmptyState`, dan `ErrorState` ini, sehingga tampilannya seragam dengan bagian lain aplikasi.

### Form dengan Formisch

**Setiap form di Kasiar memakai Formisch** dengan skema Valibot, tanpa tag form buatan sendiri dan tanpa pengelolaan state isian manual. Cara memakai Formisch mengikuti dokumentasi resminya.

**Daftar form:**

| Form | Halaman | Isian utama | Skema (`validation/`) | Aksi setelah valid |
|---|---|---|---|---|
| Login | `login` | Username, password | `login.ts` | Masuk lewat Better Auth (`lib/auth-client.ts`, bukan `queries.ts`) |
| Tambah/ubah barang (admin) | `admin/barang` | Nama, satuan, harga jual, status | `barang.ts` | Mutasi `barang` (konfirmasi saat mengubah) |
| Barang masuk | `barang-masuk` | Tanggal, barang, jumlah, harga beli, pemasok | `barang-masuk.ts` | Mutasi `barang-masuk` (peringatan harga bila perlu) |
| Pembayaran kasir | `kasir` | Jumlah dibayar, pembeli (bila ada sisa) | `transaksi.ts` | Mutasi `transaksi` (konfirmasi bila ada sisa utang) |
| Pelunasan utang | `utang` | Pembeli, nominal | `pelunasan.ts` | Mutasi `utang` (konfirmasi) |
| Buat akun kasir (admin) | `admin/pengguna` | Username, password | `pengguna.ts` | Mutasi `admin` |
| Reset password kasir (admin) | `admin/pengguna` | Password baru | `reset-password.ts` | Mutasi `admin` (konfirmasi) |

Aturan password: **minimal 8 karakter dan tidak boleh Lemah** (kriteria di bawah) untuk buat akun kasir dan reset password. Form login tidak memeriksa panjang maupun kekuatan.

**Alur kirim form (urutan tetap):**
1. Pengguna menekan simpan. Formisch memeriksa isian dengan skema Valibot. Jika ada yang salah, pesan Indonesia tampil di bawah isiannya dan fokus pindah ke isian pertama yang salah.
2. Jika aksi perlu konfirmasi atau peringatan, panggil `useConfirm`.
3. Jalankan mutasi dari `queries.ts`. `FormSubmitButton` nonaktif selama proses.
4. Server **memeriksa ulang dengan skema yang sama**. Error per isian dari server (misal "Username sudah dipakai") tampil di bawah isian itu. Error umum (misal "Stok tidak cukup") tampil di `FormAlert`.
5. Jika berhasil: toast sukses, form kembali ke nilai awal, dan data terkait dimuat ulang.
6. Jika pengguna menutup form yang isiannya belum disimpan, panggil `useConfirm`.

**Aturan:**
- **Satu form, satu skema Valibot**, satu file di `validation/`. Skema yang sama dipakai Formisch di layar dan Hono di server. Tipe data form diturunkan dari skema, tidak ditulis ulang.
- **Satu form, satu file** di folder fiturnya, misalnya `features/barang/barang-form.tsx`. Isiannya memakai field dari `components/form/`.
- **Pencarian dan filter daftar bukan form Formisch.** Keduanya memakai parameter URL (lihat Parameter URL).
- **Kasir:** keranjang tetap di TanStack Store. Saat form pembayaran dikirim, item keranjang digabung dengan isian form dan diperiksa oleh satu skema `transaksi` (minimal 1 item, jumlah lebih dari 0, jumlah dibayar tidak negatif). Server memeriksa ulang.
- **Bentuk error server yang seragam:** pesan umum ditambah pesan per isian. `lib/api.ts` meneruskannya ke Formisch agar tampil di isian yang tepat.
- **Nilai awal ditentukan per form.** Contoh: tanggal barang masuk berisi hari ini, dihitung di browser agar tidak terjadi ketidakcocokan SSR. Setelah barang masuk tersimpan, fokus kembali ke isian barang untuk catatan berikutnya.
- **Password** tidak disimpan di tempat lain selain isian form, dan dikosongkan setelah form berhasil dikirim.
- **Aturan password ditulis di skema** `pengguna.ts` dan `reset-password.ts`: minimal 8 karakter dan penilaian kekuatan **bukan Lemah**, memakai fungsi dari `lib/password-strength.ts`. Pemeriksaan "sama dengan username" membandingkan dua isian sekaligus (cara pemeriksaan lintas isian di Valibot mengikuti dokumentasinya). Skema yang sama dipakai server Hono, jadi password Lemah **ditolak juga di server**. Pengaturan panjang minimal di Better Auth disamakan menjadi 8. Password awal akun admin di `seed.ts` diperiksa dengan aturan yang sama.
- **Indikator kekuatan password** tampil saat admin membuat akun dan mereset password (bukan di login). Dihitung oleh fungsi murni di `lib/password-strength.ts` yang **dipakai bersama oleh layar dan server**, **tanpa pustaka tambahan**, lalu ditampilkan oleh `PasswordStrengthIndicator` yang dipasang lewat pilihan `showStrength` pada `PasswordField`.
- **Kriteria penilaian:** **Lemah** jika kurang dari 8 karakter, hanya satu jenis karakter, atau sama dengan username. **Sedang** jika minimal 8 karakter dan memuat minimal 2 jenis karakter. **Kuat** jika minimal 12 karakter dan memuat minimal 3 jenis karakter (jenis: huruf kecil, huruf besar, angka, simbol). Password dengan penilaian **Lemah ditolak**, baik di layar maupun di server (pesan: "Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol."). **Sedang** dan **Kuat** diterima.
- **Tampilan indikator:** batang tiga segmen berwarna (merah, kuning, hijau) **ditambah teks** "Lemah", "Sedang", atau "Kuat" dan saran singkat, agar tidak bergantung pada warna saja. Teksnya memakai `aria-live` sopan (*polite*) untuk pembaca layar.
- **Daftar syarat melayang (`PasswordRequirementsPopover`):**
  - **Data:** fungsi di `lib/password-strength.ts` menerima password dan username, lalu mengembalikan **tingkat** (Lemah, Sedang, Kuat) dan **daftar syarat**: id, label, kelompok (`wajib` atau `disarankan`), dan terpenuhi atau tidak. Server memakai fungsi yang sama: password diterima bila semua syarat `wajib` terpenuhi. Jika username belum diisi, syarat "tidak sama dengan username" dianggap terpenuhi.
  - **Syarat:** wajib: minimal 8 karakter, tidak sama dengan username, minimal 2 jenis karakter. Disarankan (untuk Kuat): minimal 12 karakter, minimal 3 jenis karakter. Ditambah penanda empat jenis karakter (huruf kecil, huruf besar, angka, simbol), hijau jika ada dan merah jika belum.
  - **Posisi:** melayang **di atas** isian, tidak menutupi isian maupun labelnya. Jika ruang di atas tidak cukup, pindah ke bawah (*flip*). Dibangun dengan CSS dan DaisyUI **tanpa pustaka tambahan**; pembalikan posisi memakai pengukuran sederhana.
  - **Kapan tampil:** muncul saat isian mendapat fokus, hilang saat fokus keluar. Kotak hanya informasi, sehingga tidak menangkap sentuhan atau klik (`pointer-events` dimatikan).
  - **Warna:** hijau memakai token `success` dan merah memakai token `error` dari DaisyUI. Tiap syarat juga memakai ikon (`Check` atau `X` dari Lucide) dan teks. Kontras dijaga di tema terang dan gelap.
  - **Aksesibilitas:** isian memakai `aria-describedby` yang menunjuk ke daftar syarat. Ringkasan tingkat memakai `aria-live` sopan; perubahan tiap syarat tidak diumumkan satu per satu agar tidak berisik.
  - **Props `PasswordField`:** `showStrength` dan `username` (nilai username dari isian form, atau akun yang sedang direset).
  - Pesan galat saat form dikirim ("Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol.") tetap tampil di bawah isian.

### Tema (Dark Mode)

Kasiar mendukung **mode terang dan gelap** memakai tema bawaan DaisyUI (`light` dan `dark`). Tidak ada tema kustom di MVP.

**Pilihan pengguna:** **Ikuti perangkat** (bawaan), **Terang**, atau **Gelap**. Pilihan ini **per perangkat**, bukan per akun, dan disimpan di **cookie** bernama `tema` (nilai `terang` atau `gelap`; tidak ada cookie berarti ikuti perangkat).

**Cara kerja bersama SSR:**
1. Jika ada cookie `tema`, server membacanya saat render dan memasang atribut tema pada elemen `<html>` di `__root.tsx`. Halaman langsung tampil dengan tema yang benar, **tanpa kilatan tema yang salah**.
2. Jika tidak ada cookie, atribut tema tidak dipasang dan DaisyUI **mengikuti pengaturan terang atau gelap milik perangkat** lewat CSS (*prefers-color-scheme*), jadi tidak perlu menunggu JavaScript.
3. Saat pengguna memilih tema lewat `ThemeToggle`, cookie ditulis (berlaku sekitar 1 tahun) dan tampilan berganti seketika tanpa memuat ulang halaman.
4. `__root.tsx` juga memasang `color-scheme` dan penanda `theme-color` (terang dan gelap) agar kontrol bawaan browser dan bilah browser di HP ikut serasi.

Konfigurasi DaisyUI mengikuti dokumentasi versi yang dipakai.

**Komponen (`components/theme/`):**
- `theme-toggle.tsx`: pilihan **Ikuti perangkat / Terang / Gelap**. Dipasang di header semua halaman setelah login dan juga di halaman login.
- Pembaca dan penulis cookie `tema` (server dan browser).

**Aturan:**
- **Dilarang warna tetap.** Semua warna memakai **token DaisyUI** (misalnya `primary`, `base-100`, `base-content`, `success`, `warning`, `error`), bukan kode warna atau kelas warna tetap seperti putih atau abu-abu mentah, supaya otomatis berganti mengikuti tema.
- **Nilai cookie `tema` dibatasi** pada `terang` dan `gelap`. Nilai lain diabaikan (ikuti perangkat), karena nilainya dipakai pada atribut HTML.
- **Kontras cukup di kedua tema** (target rasio kontras teks minimal 4.5:1). Berlaku untuk tabel, kartu HP, `StatusBadge`, toast, kotak konfirmasi, skeleton, dan indikator kekuatan password.
- **Warna tidak menjadi satu-satunya penanda.** Status Lunas/Utang dan kekuatan password tetap memakai teks.
- **Ikon Lucide** mewarisi warna teks, tidak diberi warna sendiri.
- **Cookie tema bukan data sensitif**, jadi tidak dienkripsi. Atribut *SameSite* diatur ke Lax.
- **Pengujian:** setiap halaman dicek di mode terang dan gelap, di HP dan desktop.
- **Grafik (fitur masa depan):** saat Recharts dipakai, warnanya juga diambil dari token DaisyUI.

### Types dan Schema

Kasiar memakai TypeScript dengan prinsip **satu sumber kebenaran**: tipe **diturunkan** dari skema, bukan ditulis ulang. Ada dua jenis skema yang tugasnya berbeda dan tidak boleh dicampur.

| Apa | Letak | Fungsi | Dipakai oleh |
|---|---|---|---|
| **Skema tabel database** (Drizzle) dan tipe baris yang diturunkan darinya | `db/schema/*.ts` | Bentuk data yang tersimpan | `server/services/`, `db/seed.ts` |
| **Skema input** (Valibot) dan tipe yang diturunkan darinya | `validation/*.ts` | Bentuk data yang **masuk**: form, isi permintaan API, parameter URL | Formisch, Hono, `validateSearch` |
| **Tipe bersama** untuk respons API, error, dan session | `types/` | Bentuk data yang **keluar** dan dibagi ke banyak tempat | `queries.ts`, `lib/api.ts`, `server/routes/`, router context |
| **Konstanta dan pilihan tetap** | `lib/konstanta.ts` | Satu daftar nilai yang dipakai di database, validasi, dan tampilan | `db/schema`, `validation`, `components/form` |

**Konstanta yang ditulis sekali di `lib/konstanta.ts`:**
- Satuan barang: `kg`, `pcs`, `pack`, `karung`, `butir`, `rak`
- Peran: `admin`, `kasir`
- Status transaksi: `lunas`, `utang`
- Status barang: aktif dan nonaktif
- Ukuran halaman: 20

Daftar ini dipakai untuk pilihan di tabel database, aturan Valibot (hanya nilai dari daftar yang boleh), dan pilihan di `SelectField`. Menambah satu satuan baru cukup mengubah satu tempat.

**Isi `types/`:**
- Bentuk respons daftar: baris halaman ini, total baris, halaman aktif, ukuran halaman (lihat Data Table Reusable).
- Bentuk error dari server: pesan umum dan pesan per isian (lihat Form dengan Formisch).
- Tipe session untuk router context: id, username, peran (lihat Context Router).
- Tipe `RouterContext` (isi: `queryClient` dan `session`, session boleh kosong) untuk `createRootRouteWithContext` (lihat Context Router).

**Aturan:**
- **Turunkan, jangan tulis ulang.** Tipe baris database diambil dari tabel Drizzle. Tipe input form dan API diambil dari skema Valibot. Jangan menulis tipe manual yang bisa diturunkan.
- **Tipe baris database, tipe input, dan tipe respons itu tiga hal berbeda.** Input form tidak punya `id` atau waktu pencatatan, sedangkan baris database punya. Jangan memakai satu tipe untuk ketiganya.
- **Jangan menyalin skema.** Skema Valibot yang sama dipakai di layar dan di server. Pustaka penghubung Drizzle ke Valibot tidak dipakai kecuali disetujui Project Owner; skema input ditulis manual agar pesan Bahasa Indonesia tetap terkendali.
- **Layar hanya mengimpor tipe, tidak mengimpor tabel Drizzle.** Layar memakai `import type` untuk tipe yang diturunkan dari `db/schema`. Isi tabel Drizzle dan koneksi database tidak boleh ikut ke browser (lihat SSR).
- **Mode ketat.** TypeScript dijalankan dengan pengaturan `strict`. Tidak memakai `any`. Data dari luar (isi API, parameter URL, cookie, hasil database yang belum pasti) bertipe `unknown` lalu divalidasi di batas masuk.
- **Uang dan jumlah tidak memakai angka pecahan biasa (*float*).** Uang disimpan sebagai bilangan bulat rupiah. Jumlah beras eceran (satu angka di belakang koma) disimpan dengan tipe desimal tetap atau bilangan bulat dalam satuan persepuluh kg, pilih satu pendekatan dan konsisten. Driver database bisa mengembalikan desimal sebagai teks, jadi konversi dilakukan **di satu tempat** (`server/services/`), bukan tersebar.
- **Penamaan:** istilah domain memakai Bahasa Indonesia agar sesuai dokumen (`Barang`, `BarangMasuk`, `Transaksi`, `ItemTransaksi`, `Pembeli`, `PembayaranUtang`, `Pengguna`, `hargaJual`, `hargaBeli`). Istilah teknis umum tetap Inggris (`id`, `createdAt`). Gaya penulisan *camelCase* untuk nama field.
- **Klien Hono:** jika klien bawaan Hono dipakai, tipe aplikasi diekspor dari `server/app.ts` sehingga pemanggilan API di `queries.ts` ikut bertipe.
- **Mengubah struktur data:** ubah dulu skema tabel (dan buat migrasi), lalu perbarui skema input bila perlu. Tipe lain akan mengikuti, dan galat kompilasi menandai bagian yang perlu disesuaikan.

### Modal Reusable

Semua kotak dialog (form tambah/ubah barang, buat akun kasir, reset password, pelunasan utang, dan konfirmasi) memakai **satu komponen `Modal`** di `components/modal/`. Dibangun dari komponen `modal` DaisyUI di atas elemen `<dialog>` bawaan browser, **tanpa pustaka tambahan**.

| Komponen | Fungsi |
|---|---|
| `Modal` | Kotak dialog: judul, tombol tutup (X) di pojok, dan isi |
| `ModalBody` | Area isi yang bisa digulir |
| `ModalFooter` | Area tombol aksi |

**Pengaturan `Modal`** (props): terbuka atau tidak, fungsi yang dipanggil saat ditutup, judul, ukuran (kecil, sedang, besar), apakah boleh ditutup (dimatikan saat sedang menyimpan), dan penjaga penutupan (lihat di bawah).

**Tampilan responsif:**
- **HP (lebar di bawah 640px):** muncul dari bawah sebagai **lembar bawah** (*bottom sheet*), lebar penuh, sudut atas membulat, tinggi maksimal sekitar 90% layar. Tinggi memakai satuan `dvh` agar tetap benar saat keyboard layar muncul. Isi bisa digulir, dan area tombol aksi menempel di bawah dengan jarak aman untuk HP berponi atau bilah gestur (*safe area*).
- **Desktop (640px ke atas):** tampil **di tengah layar**. Lebar kecil sekitar 24rem, sedang 32rem, besar 42rem, dan tidak pernah melebihi lebar layar.

**Cara menutup** (ketiganya lewat **satu jalur penutupan** yang sama, yaitu yang melewati penjaga):
- **Tombol tutup (X) di pojok kanan atas** kotak. Ikon Lucide `X`, area sentuh minimal 44 x 44 px, dan `aria-label` "Tutup".
- **Klik atau sentuh di luar kotak** (pada latar gelap). Penutupan hanya terjadi jika tekan **dan** lepas sama-sama di latar. Jika pengguna menyeleksi teks di dalam kotak lalu melepas di luar kotak, kotak tidak menutup.
- **Tombol Esc** pada keyboard.

**Penjaga penutupan:**
- **Sedang menyimpan:** semua cara menutup dinonaktifkan (tombol X redup, klik di luar dan Esc diabaikan), agar proses simpan tidak terputus.
- **Isian belum disimpan:** jika form sudah diubah, panggil `useConfirm` lebih dulu ("Isian yang belum disimpan akan hilang"), sesuai tabel konfirmasi di PRD. Jika form belum diubah, langsung tutup.
- **Konfirmasi** (`ConfirmProvider`) dibangun di atas `Modal` yang sama, ukuran kecil, **tanpa penjaga**: tombol X, klik di luar, dan Esc dianggap **batal**.

**Aturan lain:**
- **Penumpukan:** konfirmasi boleh tampil **di atas** modal lain (diperlukan untuk penjaga isian belum disimpan). Modal biasa **tidak bertumpuk**: hanya satu yang terbuka.
- **Fokus:** saat terbuka, fokus pindah ke isian pertama (pada konfirmasi berbahaya ke tombol Batal) dan terkunci di dalam kotak. Saat ditutup, fokus kembali ke elemen yang membukanya.
- **Gulir:** halaman di belakang tidak ikut bergulir selama modal terbuka. Yang bergulir hanya `ModalBody`.
- **Keyboard HP:** isian yang sedang diketik tidak boleh tertutup keyboard layar.
- **SSR:** modal tidak dirender dalam keadaan terbuka. Status buka dan tutup hanya di browser dan **tidak disimpan di URL**.
- **Aksesibilitas:** judul tertaut lewat `aria-labelledby`, tombol X berlabel, dan animasi singkat serta mengikuti pengaturan *reduce motion*.
- **Tema:** token DaisyUI, tanpa warna tetap. Latar gelap semi transparan cukup kontras di tema terang dan gelap.
- **Tombol kembali Android** yang menutup modal tidak dikerjakan di MVP.

**Pemakaian (usulan):** form tambah/ubah barang, buat akun kasir, reset password, pelunasan utang, dan semua konfirmasi.

## 4. Peran & Hak Akses

| Aksi | Kasir | Admin |
|---|---|---|
| Login | ✅ | ✅ |
| Lihat barang & stok | ✅ | ✅ |
| Tambah barang baru | ❌ | ✅ |
| Ubah data barang (nama, satuan) | ❌ | ✅ |
| Ubah **harga jual** | ❌ | ✅ |
| Catat barang masuk | ✅ | ✅ |
| Buat transaksi (Lunas/sebagian/Utang) | ✅ | ✅ |
| Catat pelunasan utang | ✅ | ✅ |
| Buat akun kasir | ❌ | ✅ |
| Reset password kasir | ❌ | ✅ |
| Buka halaman admin | ❌ | ✅ |

Kasir hanya bisa melihat daftar barang dan stok, serta memilih barang yang sudah ada untuk barang masuk dan transaksi.

Pengecekan peran **wajib dilakukan di server**, bukan hanya dengan menyembunyikan menu.

## 5. Model Data (konseptual, usulan)

Nama tabel dan kolom boleh disesuaikan AI Builder. Yang penting adalah isi dan hubungannya.

**ID bertipe UUID** untuk Transaksi, Item Transaksi, dan Barang Masuk, agar nanti ID bisa dibuat di perangkat untuk fitur offline. Tabel lain bebas.

### Pengguna (dikelola Better Auth)
Username, password (disimpan dalam bentuk terenkripsi, bukan teks asli), peran (admin atau kasir).

### Barang
Nama, satuan (kg, pcs, pack, karung, butir, rak), harga jual, stok saat ini, status aktif.
Setiap varian adalah **barang sendiri**, contoh: "Beras 25 kg" (satuan karung), "Beras eceran" (satuan kg), "Telur (butir)", "Telur (rak)".

### Barang Masuk
Tanggal, barang, jumlah, harga beli, pemasok (cukup teks di MVP), pengguna yang mencatat.
**Waktu dicatat** (`waktuDicatat`, waktu kejadian; di MVP sama dengan waktu server) disimpan terpisah dari **waktu diterima server** (`createdAt`).

### Pembeli
Nama pembeli. Dibuat saat pertama kali berutang, lalu bisa dipilih lagi.

### Transaksi
Tanggal dan jam, total, **jumlah dibayar**, status (**Lunas** jika dibayar penuh, **Utang** jika masih ada sisa), pembeli (wajib jika ada sisa), kasir yang mencatat.
Sisa utang transaksi = total − jumlah dibayar.
**Waktu dicatat** (`waktuDicatat`, waktu kejadian; di MVP sama dengan waktu server) disimpan terpisah dari **waktu diterima server** (`createdAt`).

### Item Transaksi
Transaksi, barang, jumlah, harga satuan saat itu, subtotal.
Harga satuan **disalin** ke sini agar riwayat tidak berubah jika harga jual barang diubah nanti. Harga satuan diambil dari harga jual barang di database dan **tidak bisa diubah kasir** saat transaksi.

### Riwayat Harga Jual
Barang, harga jual, berlaku sejak, admin yang mengubah. Satu baris dibuat saat barang ditambahkan (harga awal) dan **setiap kali admin mengubah harga jual**. Tidak ditampilkan di MVP; dipakai fitur masa depan (kasir offline) untuk memeriksa harga yang pernah berlaku. Harga jual terkini tetap disimpan di Barang.

### Pembayaran Utang
Pembeli, tanggal dan jam, nominal, pengguna yang mencatat.

**Sisa utang pembeli** = jumlah sisa (total − dibayar) dari semua transaksi milik pembeli itu − total pembayaran utangnya. Dihitung dari catatan, tidak diketik manual.

### Hubungan singkat
Pembeli punya banyak Transaksi dan banyak Pembayaran Utang. Transaksi punya banyak Item Transaksi. Item Transaksi, Barang Masuk, dan Riwayat Harga Jual merujuk ke satu Barang.

## 6. Alur Data Penting

### Menyimpan transaksi
1. Server memeriksa pengguna sudah login.
2. Server memeriksa isian (barang ada, jumlah lebih dari 0, jumlah dibayar tidak negatif dan tidak melebihi total, nama pembeli terisi jika ada sisa).
3. Server memeriksa stok cukup untuk **setiap** barang.
4. Dalam **satu transaksi database** (artinya semua langkah berhasil bersamaan atau batal semuanya): simpan transaksi dan itemnya, kurangi stok, dan jika ada sisa, hubungkan ke pembeli.
5. Jika ada yang gagal, **tidak ada** yang tersimpan dan kasir melihat pesan yang jelas.

### Menyimpan barang masuk
Dalam satu transaksi database: simpan catatan barang masuk dan tambah stok barang itu.

### Mencatat pelunasan
Dalam satu transaksi database: periksa nominal tidak melebihi sisa utang, simpan pembayaran, lalu perbarui status pembeli (Lunas jika sisa 0).

## 7. Aturan Integritas Data

- **Tanpa konversi satuan.** Stok tiap varian berdiri sendiri.
- **Stok tidak boleh negatif.**
- **Tanpa hapus permanen.** Koreksi lewat catatan baru. Barang yang tidak dipakai lagi ditandai tidak aktif.
- **Uang disimpan sebagai bilangan bulat rupiah**, tanpa pecahan, agar tidak ada selisih pembulatan.
- Jumlah **beras eceran (kg) boleh desimal dengan satu angka di belakang koma** (misal 2,5 kg). Satuan karung, butir, rak, pcs, dan pack: **bilangan bulat**.
- Setiap catatan menyimpan waktu dan pengguna yang menginput.
- **Riwayat harga:** setiap perubahan harga jual (termasuk harga awal) dicatat di Riwayat Harga Jual dalam proses atomik yang sama dengan perubahan harga di Barang.
- **ID UUID** untuk Transaksi, Item Transaksi, dan Barang Masuk.
- Pengecekan isian dilakukan di **layar dan di server**. Jangan hanya mengandalkan layar.

## 8. Keamanan

- Semua data hanya bisa diakses setelah login.
- Tidak ada pendaftaran mandiri. Akun kasir dibuat admin.
- Tidak ada reset password lewat email. Reset dilakukan admin.
- **Harga jual hanya bisa diubah admin**, dicek di server. Saat menyimpan transaksi, server memakai harga dari database dan mengabaikan harga yang dikirim dari layar.
- Kunci rahasia (alamat database, rahasia login) disimpan di pengaturan lingkungan (*environment variables*) milik Vercel dan **tidak boleh** ditulis di kode atau dikirim ke browser.
- Akun admin pertama dibuat lewat **seed** (data awal yang dijalankan sekali saat penyiapan). Username dan password awal ditentukan Project Owner, diberikan lewat *environment variables*, dan tidak ditulis di kode. Password awal juga minimal 8 karakter dan tidak boleh Lemah.

## 9. Penayangan (Deployment)

- **Aplikasi:** Vercel.
- **Database:** Neon (PostgreSQL). Alternatif: Supabase (juga PostgreSQL), tanpa mengubah struktur aplikasi.
- Perubahan struktur tabel dikelola lewat fitur migrasi Drizzle.
- **SSR di Vercel** berjalan sebagai fungsi server. Gunakan alamat koneksi database yang cocok untuk serverless (alamat *pooled* dari Neon atau *pooler* dari Supabase) agar koneksi tidak habis. Ikuti dokumentasi penyedia database.
- Pilih wilayah (*region*) server Vercel dan database yang **berdekatan**, dan dekat pengguna di Indonesia (misalnya Singapura jika tersedia).
- Permintaan pertama setelah lama tidak dipakai bisa sedikit lebih lambat (*cold start*). Ini wajar pada fungsi serverless.
- Catatan: paket gratis Vercel (Hobby) resmi untuk pemakaian non-komersial. `[Risiko dicatat oleh Project Owner]`
- Batas paket gratis Neon dan Supabase: `[Cek sebelum dipakai, termasuk apakah database dijeda saat lama tidak dipakai]`

## 10. Pertanyaan Terbuka

Lihat bagian "Hal yang Masih Perlu Diputuskan" di `PRD.md`.

## 11. Rencana Masa Depan (Bukan MVP)

Bagian ini **tidak dikerjakan sekarang**. Isinya hanya agar keputusan di MVP tidak menutup kemungkinan berikut. Daftar lengkap fitur masa depan ada di `PRD.md` bagian 4.2.

### Katalog Barang Publik (tanpa login)
- Halaman `katalog` bersifat **hanya lihat** dan **boleh dibuka tanpa login**. Isinya: nama barang, satuan, harga jual, dan **jumlah stok**. Hanya barang aktif yang tampil.
- Dilayani oleh **endpoint publik khusus katalog**, terpisah dari endpoint kasir dan admin. Endpoint ini hanya mengembalikan field di atas. Harga beli, pemasok, dan catatan internal **tidak pernah** ikut terkirim.
- Karena tanpa login: hanya metode baca, **pembatasan jumlah permintaan** (*rate limiting*) agar tidak disalahgunakan, dan parameter pencarian divalidasi dengan aturan Parameter URL.
- Berbeda dari halaman setelah login, katalog **boleh di-cache singkat** karena tidak privat. Tampilkan keterangan "Terakhir diperbarui" agar stok yang usang jelas bagi pembaca.
- Role `customer`: karena katalog bisa dibuka tanpa login, akun customer mungkin tidak diperlukan. `[Apakah role customer tetap dibuat? Belum ditentukan]`
- **Kesiapan di MVP:** pengecekan peran dipusatkan di `server/middleware/`, tidak tersebar dengan pola "jika admin atau kasir", dan daftar peran ada di `lib/konstanta.ts`, agar peran baru mudah ditambahkan.

### PWA
- Aplikasi bisa **dipasang di layar HP** (manifest, ikon, dan service worker). Service worker juga menyimpan kerangka aplikasi agar halaman kasir bisa dibuka tanpa internet.
- **Service worker tidak boleh menyimpan data privat atau halaman setelah login** di cache bersama. Aturan ini selaras dengan aturan *no-store* pada bagian SSR. Hanya kerangka aplikasi dan katalog publik yang boleh di-cache.
- Cara membuat PWA (pustaka atau manual): `[Belum ditentukan. Pustaka baru perlu persetujuan Project Owner]`
- Penanda `theme-color` untuk tema terang dan gelap sudah disiapkan (lihat Tema).

### IndexedDB dengan Dexie
- **Dexie** adalah pembungkus IndexedDB (penyimpanan data di dalam browser). Disetujui untuk fase berikutnya, **belum dipasang di MVP**.
- **Aturan awal:**
  - Dexie **hanya dipakai di browser**. IndexedDB tidak ada di server, jadi tidak boleh diimpor oleh kode yang berjalan saat SSR.
  - **Server tetap sumber kebenaran.** Data lokal hanyalah salinan, kecuali antrean transaksi offline (lihat di bawah) yang menunggu dikirim.
  - **Data lokal dihapus saat logout**, karena bisa berisi data toko. **Pengecualiannya** antrean transaksi yang belum tersinkron: logout ditahan (lihat di bawah).
  - **Tidak menyimpan password atau token** di IndexedDB.
  - Versi struktur data lokal dikelola lewat fitur versi Dexie.
  - Kode Dexie ditaruh terpisah dari kode lain (usulan: `src/lib/local-db/`).

### Kasir Offline dan Sinkronisasi Otomatis
**Cakupan:** kasir bisa **mencatat penjualan (Lunas, bayar sebagian, atau utang) dan barang masuk tanpa internet**. Keduanya **otomatis tersinkron** saat kembali online. **Pelunasan utang tetap perlu online.**

**Yang tersedia di perangkat:** salinan daftar barang (nama, satuan, harga jual, stok) dan daftar pembeli, yang diperbarui setiap kali online, ditambah halaman kasir yang bisa dibuka tanpa internet (lewat PWA).

**Cara kerja:**
1. Saat offline, penjualan dan barang masuk masuk ke **antrean (*outbox*) di Dexie**. Tiap catatan punya **ID unik (UUID) yang dibuat di perangkat**, waktu dicatat (UTC), isi transaksi, dan status: menunggu, mengirim, tersinkron, atau ditolak.
2. Saat kembali online (dan berkala selama online), antrean dikirim **berurutan sesuai waktu dicatat** ke satu endpoint sinkron yang menerima banyak transaksi.
3. Server memproses **setiap transaksi sebagai satu proses atomik tersendiri** dan menjawab **per transaksi**: diterima, duplikat (diabaikan), atau ditolak beserta alasannya.
4. **ID unik membuat pengiriman ulang aman**: jika koneksi putus di tengah jalan lalu dikirim lagi, transaksi yang sama tidak tercatat dua kali.
5. Transaksi yang ditolak tampil jelas agar bisa ditangani, dan stok serta utang di layar diperbarui dari server setelah sinkron.

**Aturan:**
- **Server tetap sumber kebenaran.** Antrean lokal bukan catatan resmi sampai tersinkron.
- Server **memvalidasi ulang** semua isi dengan skema Valibot yang sama dan tidak mempercayai data dari perangkat.
- **Logout ditahan jika masih ada transaksi yang belum tersinkron.** Pengguna diperingatkan lewat `useConfirm`, dan data tidak dihapus diam-diam.
- Jika **sesi berakhir saat offline**, kasir tetap bisa mencatat. Pengiriman menunggu sampai kasir login kembali.
- **Tampilan:** penanda "Offline" dan "N transaksi menunggu sinkron", serta toast saat transaksi tersimpan di perangkat dan saat tersinkron.
- Waktu transaksi memakai waktu perangkat (UTC). Server juga mencatat waktu sinkron.

**Keputusan:**
- **Stok tidak boleh negatif (diputuskan).** Aturan MVP tetap berlaku saat sinkron. Transaksi yang stoknya tidak cukup **ditolak** dan **tidak dihapus**: ia tetap tersimpan di antrean dengan status "ditolak: stok tidak cukup" dan tampil sebagai **perlu ditangani**. Cara menanganinya: kasir mencatat barang masuk yang terlewat lalu menekan **Kirim ulang**, atau **membatalkan** transaksi itu (dengan konfirmasi `useConfirm`, karena barangnya sudah terjual). Transaksi yang ditolak tidak mengubah stok maupun utang di server. Karena hanya ada satu kasir dan antrean diproses berurutan, penolakan seharusnya jarang terjadi.

**Keputusan lanjutan (disetujui Project Owner):**
- **Harga transaksi offline: harga saat dicatat.** Harga yang disepakati dengan pembeli adalah harga yang tampil di perangkat, jadi itu yang dipakai. Server memeriksa bahwa harga tersebut **pernah berlaku** untuk barang itu pada waktu transaksi (butuh riwayat harga jual). Jika tidak cocok, misalnya admin mengubah harga saat kasir sedang offline, transaksi ditolak dengan alasan "harga tidak sesuai" dan ditangani seperti penolakan stok. Harga terbaru di server tidak dipakai, karena uang yang sudah diterima kasir bisa berbeda dari total yang tercatat. Aturan MVP "server memakai harga dari database" tetap berlaku untuk transaksi online.
- **Cakupan offline: penjualan dan barang masuk.** Keduanya memengaruhi stok, jadi masuk dalam **satu antrean yang diproses berurutan sesuai waktu dicatat**. Barang masuk yang dicatat lebih dulu menambah stok sebelum penjualan sesudahnya diproses, sehingga penolakan karena stok berkurang. **Pelunasan utang tetap perlu online**, karena membutuhkan sisa utang terbaru dan tidak mendesak.

**Kesiapan di MVP (disetujui, dikerjakan sejak MVP):** ID Transaksi, Item Transaksi, dan Barang Masuk bertipe UUID sejak MVP agar ID bisa dibuat di perangkat nanti. Waktu transaksi disimpan terpisah dari waktu tercatat di server. **Perubahan harga jual dicatat sebagai riwayat** (barang, harga, berlaku sejak) sejak MVP, agar riwayatnya sudah lengkap saat fitur offline dikerjakan.

**Peringatan:** ini pekerjaan besar karena stok dan utang bisa bentrok. Kerjakan setelah MVP stabil, dengan mengikuti keputusan di atas.
