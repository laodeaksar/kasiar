# RENCANA MIGRASI: Formisch ke TanStack Form

> **Tujuan:** mengganti **Formisch** dengan **TanStack Form** (`@tanstack/react-form`) sebagai satu-satunya library form di Kasiar, tanpa mengubah perilaku yang dilihat pengguna.
> **Status:** rencana. Belum ada dokumen atau kode yang diubah.
> **Valibot tetap dipakai** untuk skema validasi. Yang diganti hanya "mesin form".

---

## 1. Ringkasan untuk Project Owner

- **Apa yang berubah:** cara kerja di balik layar form (pengelolaan isian, validasi, kirim). Tampilan dan aturan bisnis (misalnya password minimal 8 dan tidak boleh Lemah) **tidak berubah**.
- **Kapan paling murah:** **sekarang**, selama form belum dibuat. Jika belum ada form yang dikerjakan, migrasi hanya berupa **perubahan dokumen dan prompt**, tanpa membongkar kode. Setiap form yang sudah jadi menambah biaya migrasi.
- **Rekomendasi:** lakukan migrasi **sebelum Tahap 1 selesai** (komponen field form). Jika Tahap 1 sudah selesai, migrasikan komponen field lebih dulu, baru fitur lain, sesuai Fase 2 sampai 4.
- **Risiko utama:** API TanStack Form masih berkembang. Dokumentasi resminya sudah memuat versi "alpha" dengan cara validasi yang berbeda dari versi stabil. **Pakai versi stabil, kunci (pin) versinya, dan jangan mencampur** dua gaya API.

## 2. Mengapa Cocok (dan Apa Imbalannya)

**Nilai tambah untuk Kasiar:**
- **Satu ekosistem.** Sudah memakai TanStack Start, Router, Query, Table, dan Store. Satu keluarga library lebih mudah dirawat dan dipahami.
- **Cocok dengan rancangan field reusable.** TanStack Form punya mekanisme resmi untuk membuat form dan field yang bisa dipakai ulang dan tetap bertipe (`createFormHook` menghasilkan `useAppForm`, ditambah `withForm` untuk memecah form besar). Ini hampir identik dengan arsitektur `components/form/` yang sudah kita rancang.
- **Mendukung skema standar.** Valibot bisa dipasang langsung sebagai validator, jadi `validation/*.ts` dan aturan password tidak perlu ditulis ulang.
- **Mendukung galat dari server per isian**, sesuai kebutuhan kita memetakan `ApiError` ke isian.

**Imbalan yang harus diterima:**
- **API lebih "verbose"** dibanding library form lain. Ini diredam dengan `createFormHook` dan field reusable.
- **Beberapa hal tidak otomatis** dan harus kita buat sendiri: memfokuskan isian pertama yang salah, serta menerjemahkan bentuk galat skema ke teks pesan (lihat Fase 2).
- **API berkembang cepat**, jadi pin versi dan baca catatan rilis sebelum memperbarui.

## 3. Keputusan yang Perlu Disetujui

| # | Keputusan | Rekomendasi |
|---|---|---|
| 1 | Mengganti Formisch dengan TanStack Form | **Ya**, jika belum banyak form yang dibuat |
| 2 | Memakai pola **`createFormHook` + `useAppForm` + `withForm`** untuk semua form | **Ya** (satu pola, tidak ada `useForm` mentah di halaman) |
| 3 | Mempertahankan **Valibot** sebagai skema, dipasang langsung sebagai validator | **Ya** |
| 4 | Memakai **API stabil** ("latest") dan menolak API alpha | **Ya** |
| 5 | Paket baru `@tanstack/react-form` disetujui, paket Formisch dihapus | **Ya** (perlu persetujuan karena mengubah daftar pustaka) |

## 4. Inventaris Dampak

Hasil pemeriksaan dokumen saat ini (jumlah penyebutan "Formisch"):

| Berkas | Penyebutan | Perubahan |
|---|---|---|
| `PRD.md` | 1 | Baris tabel tech-stack "Form & validasi" |
| `ARCHITECTURE.md` | 14 | Tabel peran pustaka, tabel "siapa memegang apa", Field Form Reusable, **seluruh bagian "Form dengan Formisch"**, TanStack Query (urutan baku, pemetaan galat), Types dan Schema |
| `AGENTS.md` | 4 | Daftar tech-stack wajib dan aturan form |
| `PROMPT-TAHAP.md` | 6 | Tahap 1 (field form), Tahap 2 (login), dan tahap yang memuat form |
| `PROMPT-PASSWORD-SYARAT.md` | 1 | Sambungan field password |
| `PROMPT-MODAL.md` | 1 | Penjaga isian belum disimpan |
| `PROMPT-TANSTACK-QUERY.md` | 2 | Pemetaan galat dan contoh alur mutasi |
| `PROMPT-AWAL.md` | 1 | Usang (project dasar sudah ada), cukup dicatat atau diarsipkan |

**Kode (jika sudah ada):** semua komponen di `components/form/`, setiap `*-form.tsx` di `features/`, halaman uji komponen, dan paket di `package.json`.

## 5. Pemetaan Konsep: Formisch ke TanStack Form

Nama API TanStack Form di bawah berasal dari dokumentasi resminya (versi stabil). **Pastikan ulang terhadap versi yang terpasang.**

| Kebutuhan Kasiar | Formisch (sekarang) | TanStack Form (target) |
|---|---|---|
| Membuat form | Hook form dari Formisch | `useAppForm` dari `createFormHook` |
| Nilai awal | Nilai awal pada form | `defaultValues` |
| Memasang skema Valibot | Skema diberikan ke form | Skema Valibot dipasang di `validators` (Standard Schema) |
| Field reusable (`TextField`, `RupiahField`, dan seterusnya) | Menerima data field dari Formisch | Didaftarkan di `fieldComponents`, memakai konteks field (`useFieldContext`) |
| Tombol simpan, `FormAlert` | Komponen biasa | Didaftarkan di `formComponents`, dipakai lewat `form.AppForm` |
| Memecah form besar | Komponen biasa | `withForm` |
| Pesan error per isian | Dari status field | Dari status meta field (`errors`) |
| Galat dari server per isian | Memetakan `ApiError` ke isian | Mengembalikan struktur `{ form, fields }` dari validator submit asinkron, atau mengatur galat isian lewat API form |
| Status "isian berubah" (penjaga Modal) | Status dirty Formisch | `isDirty` pada status form (dibaca lewat `form.Subscribe`) |
| Status "sedang menyimpan" | Status submitting | `isSubmitting` dan `isPending` mutasi TanStack Query |
| Mengosongkan form | Reset | `form.reset()` |
| Fokus ke isian pertama yang salah | Bawaan atau pembantu | **Dibuat sendiri** (pembantu kecil di `components/form/`) |

## 6. Fase Migrasi

### Fase 0: Persiapan (tanpa mengubah kode)
1. **Setujui keputusan** di bagian 3.
2. **Catat kondisi saat ini:** tahap mana yang sudah dikerjakan, dan form mana yang sudah dibuat dengan Formisch. Ini menentukan apakah Fase 3 diperlukan.
3. **Buat cabang khusus** di GitHub, misalnya `migrasi-tanstack-form`. Jangan mengubah `main` langsung.
4. Pastikan **pemeriksaan tipe, build, dan halaman uji komponen** lulus sebelum mulai (sebagai garis dasar).
5. **Catat perilaku yang harus tetap sama** (daftar di bagian 8). Ini menjadi daftar uji.

### Fase 1: Percobaan Kecil (*spike*)
Tujuan: membuktikan pola sebelum menyentuh semua form. Buat **satu form uji** di halaman `/uji-komponen` (bukan form fitur) yang memakai:
1. `createFormHookContexts` dan `createFormHook`, dengan satu `TextField` dan satu `FormSubmitButton`.
2. Skema **Valibot** langsung sebagai validator, termasuk satu aturan **lintas isian** (password tidak boleh sama dengan username).
3. **Bentuk galat skema:** periksa apakah galat berupa teks atau objek berisi `message`, lalu tentukan **satu tempat** (`FormField`) yang mengubahnya menjadi teks Indonesia.
4. **Galat server per isian**, dengan fungsi pengirim tiruan yang gagal membawa pesan per isian dan pesan umum. Pilih **satu pola** pemetaan (lihat bagian 5), lalu tulis di satu tempat.
5. **Status dirty** terbaca oleh penjaga `Modal`.
6. **Waktu validasi:** validasi saat isian ditinggalkan dan saat kirim, lalu validasi ulang saat mengetik setelah ada error. Atur sesuai dokumentasi versi yang dipakai.

**Keluaran Fase 1:** catatan singkat pola yang dipilih untuk poin 3, 4, dan 6. Jika ada pola yang tidak berfungsi, **berhenti dan laporkan** sebelum lanjut.

### Fase 2: Infrastruktur Form
1. **Pasang paket:** tambahkan `@tanstack/react-form` (versi stabil, di-*pin*). **Hapus** paket Formisch setelah Fase 3 selesai, bukan sebelumnya.
2. **`components/form/`:**
   - Buat konteks form dan field (`createFormHookContexts`) dan hook `useAppForm` (`createFormHook`) di **satu berkas**, dan ekspor `useAppForm`, `withForm`, serta pembantu konteks dari sana.
   - **Ubah semua field reusable** agar mengambil datanya dari konteks field: `FormField`, `TextField`, `PasswordField` (beserta `PasswordStrengthIndicator` dan `PasswordRequirementsPopover`), `NumberField`, `RupiahField`, `SelectField`, `DateField`.
   - **Ubah `FormSubmitButton` dan `FormAlert`** menjadi komponen form (didaftarkan di `formComponents`).
   - **`BarangSelectField` dan `PembeliField`** (di `features/`) ikut disesuaikan.
3. **Pembantu baru:** pemfokus isian pertama yang salah, dan penerjemah galat skema ke teks.
4. **Kontrak tampilan tidak berubah:** props publik yang dipakai halaman (misalnya `showStrength`, `username`) dipertahankan sejauh mungkin.
5. **Perbarui `/uji-komponen`** agar semua field diuji dengan TanStack Form.

### Fase 3: Migrasi Per Form (hanya jika form sudah ada)
Urutan dari risiko rendah ke tinggi:
1. **Login** (dua isian, tanpa pemeriksaan kekuatan password).
2. **Buat akun kasir** dan **reset password** (menguji indikator dan syarat password, serta aturan lintas isian).
3. **Tambah/ubah barang** (admin), termasuk konfirmasi dan peringatan harga.
4. **Barang masuk** (jumlah mengikuti satuan, peringatan harga, fokus kembali ke isian barang).
5. **Pelunasan utang** (nominal tidak boleh melebihi sisa).
6. **Pembayaran kasir** (paling kompleks: keranjang dari TanStack Store digabung dengan isian form dalam satu skema `transaksi`).

Untuk **tiap form**: migrasikan, jalankan **daftar uji perilaku** (bagian 8), lalu commit. **Satu form per commit** agar mudah dibatalkan.

### Fase 4: Validasi dan Galat Server
1. Pastikan **skema Valibot yang sama** tetap dipakai di server Hono. **Skema tidak boleh disalin** ke tempat lain.
2. Pastikan pesan error tetap **Bahasa Indonesia** dan sama persis dengan sebelumnya.
3. Pastikan **galat server** tetap tampil di tempat yang sama: per isian di bawah isian, dan umum di `FormAlert`, **tanpa toast ganda** (penanda `meta` pada mutasi form tetap berlaku).

### Fase 5: Pembersihan
1. **Hapus paket Formisch** dan semua `import`-nya. Pastikan pencarian "formisch" di kode tidak menemukan apa pun.
2. **Perbarui dokumen** (bagian 7) dan semua prompt.
3. Jalankan seluruh **daftar uji perilaku** sekali lagi, pemeriksaan tipe, dan build produksi.
4. Gabungkan cabang ke `main` setelah Project Owner mencoba di HP dan desktop.

## 7. Perubahan Dokumen (dikerjakan di Fase 5, atau lebih awal jika form belum dibuat)

| Berkas | Perubahan |
|---|---|
| `PRD.md` | "Formisch + Valibot" menjadi "TanStack Form + Valibot" di tabel tech-stack |
| `ARCHITECTURE.md` | Ganti nama di tabel peran pustaka dan tabel "siapa memegang apa". Tulis ulang bagian **"Form dengan Formisch"** menjadi "Form dengan TanStack Form" (pola `createFormHook`, `useAppForm`, `withForm`). Perbarui "Field Form Reusable" (field mengambil data dari konteks field), urutan baku di bagian TanStack Query, dan pemetaan galat server |
| `AGENTS.md` | Daftar tech-stack wajib dan aturan "Setiap form memakai ..." |
| `PROMPT-TAHAP.md`, `PROMPT-PASSWORD-SYARAT.md`, `PROMPT-MODAL.md`, `PROMPT-TANSTACK-QUERY.md` | Ganti penyebutan Formisch dan rujukan bagian ARCHITECTURE yang diganti nama |
| `PROMPT-AWAL.md` | Diarsipkan atau diberi catatan "usang" |

**Aturan baru yang perlu ditulis:**
- Semua form **wajib** lewat `useAppForm` dan field dari `components/form/`. Tidak ada `useForm` mentah di halaman.
- **Versi `@tanstack/react-form` di-pin.** Pembaruan versi hanya setelah membaca catatan rilis dan menjalankan daftar uji.
- **Dilarang memakai API alpha** atau mencampur dua gaya validasi.
- Penerjemahan galat skema ke teks dan pemfokusan isian salah dilakukan **di satu tempat**.

## 8. Daftar Uji Perilaku (harus sama sebelum dan sesudah migrasi)

**Validasi dan pesan:**
- [ ] Pesan error Bahasa Indonesia tampil di bawah isian yang tepat, setelah isian ditinggalkan atau saat kirim.
- [ ] Saat kirim dengan isian salah, fokus pindah ke isian pertama yang salah.
- [ ] Password: minimal 8 karakter, tidak sama dengan username, minimal 2 jenis karakter. **Password Lemah ditolak** di layar dan di server.
- [ ] Daftar syarat password melayang dan indikator kekuatan tetap berubah saat mengetik, dan **tidak** muncul di login.
- [ ] Beras eceran menerima satu angka di belakang koma, satuan lain bilangan bulat.
- [ ] Jumlah dibayar tidak negatif, dan pelunasan tidak melebihi sisa utang.

**Kirim dan galat server:**
- [ ] Tombol simpan nonaktif selama proses, dan tidak ada transaksi ganda saat ditekan berulang.
- [ ] Galat per isian dari server tampil di isiannya. Galat umum (misalnya "Stok tidak cukup") tampil di `FormAlert`, **tanpa toast**.
- [ ] Sesi berakhir (401) menampilkan satu toast lalu mengarahkan ke login.
- [ ] Sukses menampilkan toast, form kembali ke nilai awal, dan data terkait dimuat ulang.

**Modal dan alur:**
- [ ] Menutup modal form yang sudah diubah meminta konfirmasi, dan yang belum diubah langsung tertutup.
- [ ] Modal tidak bisa ditutup saat menyimpan.
- [ ] Barang masuk: setelah simpan, fokus kembali ke isian barang.
- [ ] Kasir: keranjang dan isian pembayaran digabung benar, dan server memeriksa ulang.

**Tampilan:**
- [ ] Semua field benar di mode terang dan gelap, HP dan desktop.
- [ ] Tidak ada ketidakcocokan tampilan pada pemuatan pertama (SSR).

## 9. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| API berubah antar versi, dan dokumentasi memuat gaya alpha yang berbeda | Pin versi, pakai API stabil, baca catatan rilis sebelum memperbarui |
| Galat skema berupa objek, bukan teks, sehingga pesan tidak tampil | Diperiksa di Fase 1 dan diterjemahkan di satu tempat (`FormField`) |
| Aturan lintas isian (password vs username) tidak terpetakan ke isian yang benar | Diuji di Fase 1 sebelum migrasi form |
| Pola galat server berbeda dan memicu toast ganda | Satu pola dipilih di Fase 1, dan penanda `meta` pada mutasi form dipertahankan |
| Penjaga isian belum disimpan tidak mendeteksi perubahan | Diuji di Fase 1 dengan `Modal` |
| Fokus ke isian salah hilang | Pembantu pemfokus dibuat sendiri di Fase 2 |
| Form setengah dimigrasi (dua library hidup bersamaan) | Satu form per commit, cabang khusus, dan Formisch baru dihapus setelah semua form selesai |
| Rendering ulang berlebihan | Gunakan `form.Subscribe` untuk membaca bagian status yang dibutuhkan saja |

## 10. Rencana Mundur (Rollback)

- Seluruh pekerjaan ada di **cabang khusus**, jadi `main` tetap aman.
- Jika Fase 1 gagal, **batalkan** dan tetap memakai Formisch. Tidak ada kerugian selain waktu percobaan.
- Selama Fase 3, tiap form punya commit sendiri, sehingga satu form bisa dikembalikan tanpa membatalkan yang lain.
- Paket Formisch **baru dihapus di Fase 5**, sehingga jalan mundur tetap terbuka hingga akhir.

## 11. Kriteria Selesai

- [ ] Tidak ada penyebutan atau `import` Formisch di kode, `package.json`, dokumen, maupun prompt.
- [ ] Semua form memakai `useAppForm` dan field dari `components/form/`.
- [ ] Seluruh daftar uji perilaku (bagian 8) lulus.
- [ ] Pemeriksaan tipe lulus, build produksi berhasil, dan halaman uji komponen benar di terang dan gelap.
- [ ] Versi `@tanstack/react-form` di-pin, dan aturan baru tertulis di `AGENTS.md`.
- [ ] Project Owner sudah mencoba di HP dan desktop, lalu cabang digabung ke `main`.
