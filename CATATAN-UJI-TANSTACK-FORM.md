# Audit dan catatan uji TanStack Form — Prompt A

## Ringkasan tahap

Pekerjaan dilakukan pada cabang `migrasi-tanstack-form`, dibuat dari `main` bersih. `@tanstack/react-form` dipasang dengan versi tepat `1.33.6`; Formisch tetap terpasang. Tidak ada form fitur yang diubah atau dimigrasikan, dan tidak ada paket lain yang ditambahkan secara langsung.

Audit menemukan **tujuh form fitur yang masih memakai Formisch**. Jadi, migrasi satu per form pada tahap berikutnya tetap diperlukan. Dua form contoh juga masih memakai Formisch.

Enam pola percobaan lulus melalui interaksi browser pada komponen halaman uji. Untuk menghindari bypass login, harness sementara memuat komponen `UjiKomponenPage` yang sama secara langsung dan tidak menjalankan loader aplikasi. Route produksi `/uji-komponen` tetap berada di bawah `_app` dan mewarisi pemeriksaan akses aplikasi.

**Batas baseline:** `/uji-komponen` tidak ada di `main` pada source saat ini, walaupun tercantum di `public/manus-routes.json`. Karena `DATABASE_URL` juga tidak tersedia di lingkungan ini, server TanStack Start mengembalikan HTTP 500 sebelum route dirender. Jadi, uji baseline route normal tidak dapat dinyatakan lulus. Pemeriksaan tipe dan build baseline lulus setelah `npm ci` memasang dependensi yang hilang dari instalasi lokal.

## Hasil audit pemakaian Formisch

| Berkas                                                  | Komponen atau form                                                | Jenis                   |
| ------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------- |
| `src/routes/login.tsx`                                  | Form login                                                        | Form fitur              |
| `src/routes/_app/kasir.tsx`                             | Form pembayaran kasir                                             | Form fitur              |
| `src/features/barang/barang-form.tsx`                   | Form tambah/ubah barang                                           | Form fitur              |
| `src/features/barang-masuk/barang-masuk-form.tsx`       | Form barang masuk                                                 | Form fitur              |
| `src/features/pengguna/pengguna-form.tsx`               | Form buat akun kasir                                              | Form fitur              |
| `src/features/pengguna/reset-password-form.tsx`         | Form reset password kasir                                         | Form fitur              |
| `src/features/utang/pelunasan-form.tsx`                 | Form pelunasan utang                                              | Form fitur              |
| `src/components/form/fields.tsx`                        | Field reusable yang menerima data field dari lapisan Formisch     | Field reusable          |
| `src/components/form/utils.ts`                          | `FormFieldStore`, `FieldElementProps`, dan helper field           | Utilitas field reusable |
| `src/features/utang/pembeli-field.tsx`                  | `PembeliField`, pemilih/ketik nama pembeli bertipe field Formisch | Field reusable fitur    |
| `src/components/form/password-requirements-samples.tsx` | Contoh form syarat password                                       | Halaman/contoh uji      |
| `src/features/contoh/mutation-query-sample.tsx`         | Contoh form dan mutasi                                            | Halaman/contoh uji      |

## Enam pola yang diuji

| Pola                                     | Hasil browser                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valibot langsung dan aturan lintas isian | Lulus. `v.forward(v.partialCheck(...), ["password"])` meletakkan pesan “Kata sandi tidak boleh sama dengan nama pengguna.” pada field password.                                                                                                                                                                                                                                                                                                           |
| Bentuk error skema dan satu penerjemah   | Lulus. Error runtime Valibot berbentuk objek dengan properti `message`. `FormField` menormalkan bentuk objek itu (serta teks biasa) menjadi pesan yang ditampilkan dalam Bahasa Indonesia. Penanda DOM yang dipakai untuk memeriksa tipe error telah dihapus.                                                                                                                                                                                             |
| Error server untuk field dan umum        | Lulus. Satu blok `catch` memetakan error `ApiError` lewat `formApi.setErrorMap({ onSubmit: { form, fields } })`, lalu mengirim pesan umum ke `FormAlert`. Pemicu `uji-gagal-isian` menampilkan error password dan pesan umum; `uji-gagal-umum` menampilkan pesan umum tanpa error field.                                                                                                                                                                  |
| Status dirty dan penjaga Modal           | Lulus. Setelah nilai berubah, status menampilkan “Isian berubah: ya”. Tombol Batal memunculkan konfirmasi; “Tetap mengisi” membiarkan form tetap terbuka.                                                                                                                                                                                                                                                                                                 |
| Waktu validasi                           | Lulus dengan `revalidateLogic({ mode: "blur", modeAfterSubmission: "change" })` dan satu skema `onDynamic`. Error muncul saat field ditinggalkan dan saat submit kosong. Sesudah submit pertama, aturan lintas isian muncul segera ketika dua nilai dibuat sama, lalu hilang segera setelah password diubah. Atribut input memakai `aria-required`, bukan validasi native HTML, agar submit benar-benar diproses oleh satu jalur TanStack Form + Valibot. |
| Status pending dari TanStack Query       | Lulus. Saat mutasi tiruan pending, tombol berubah menjadi “Menyimpan...” dan tombol simpan serta Batal nonaktif. Menekan Escape atau tombol X tidak menutup Modal sampai mutasi selesai.                                                                                                                                                                                                                                                                  |

## Pola yang dipilih

**Error skema:** validator Valibot dipasang satu kali di `validators.onDynamic`. Komponen `FormField` menjadi satu-satunya tempat yang menerima string atau objek `{ message }`, memilih pesannya, dan menampilkannya.

**Error server:** satu handler submit menangkap `ApiError`. Pesan field yang dikenal dipasang pada `onSubmit.fields` melalui `setErrorMap`; pesan umum dipasang pada `onSubmit.form` dan ditampilkan lewat `FormAlert`. Tidak ada toast untuk error form.

**Waktu validasi:** satu skema dipakai dengan `revalidateLogic({ mode: "blur", modeAfterSubmission: "change" })`: blur sebelum submit pertama, validasi submit, lalu validasi ulang saat mengetik setelah submit pertama.

## Tahap yang sudah dan belum dikerjakan

| Tahap                                                 | Status                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fase 0 — audit, cabang, pemeriksaan dasar             | Audit dan cabang selesai. Pemeriksaan tipe/build dasar lulus. Uji baseline route tidak tersedia karena route belum ada di `main` dan database tidak tersedia. |
| Fase 1 — percobaan kecil                              | Selesai: versi stabil dipin, form uji dibuat, dan keenam pola terbukti lewat browser.                                                                         |
| Infrastruktur form menyeluruh                         | Belum dikerjakan. Helper yang ada hanya untuk percobaan ini.                                                                                                  |
| Migrasi form fitur                                    | Belum dikerjakan. Tujuh form fitur pada tabel tetap memakai Formisch.                                                                                         |
| Pembersihan Formisch dan perubahan dokumen arsitektur | Belum dikerjakan; sesuai ruang Prompt A, Formisch tidak dihapus.                                                                                              |

## Pemeriksaan akhir dan catatan

Pemeriksaan format pada berkas yang disentuh, `npm run typecheck`, dan `npm run build` lulus. Perintah `npm run format:check` untuk seluruh repository tidak lulus karena menandai 123 berkas repository dan hasil build di luar lingkup sebagai belum terformat. Tidak dilakukan pemformatan massal agar perubahan tetap terbatas pada Prompt A.

Saat pemasangan dependensi, npm melaporkan empat kerentanan tingkat moderate. Kerentanan tersebut belum diperbaiki pada tahap ini.

## Versi dan dokumentasi resmi

Versi terpasang di `package.json` dan `package-lock.json` adalah `@tanstack/react-form` `1.33.6`, dipin tanpa rentang versi. Metadata npm yang diperiksa menunjukkan `latest: 1.33.6` dan `alpha: 2.0.0-alpha.3`; versi alpha tidak digunakan. API `createFormHook`/`createFormHookContexts`, validasi Standard Schema, validasi dinamis, dan error form dibandingkan dengan dokumentasi resmi sebelum dipakai. [1] [2] [3] [4] [5] [6]

Aturan lintas field Valibot mengikuti API resmi `partialCheck` dan `forward`. [7] [8]

## Rujukan

[1]: https://www.npmjs.com/package/%40tanstack/react-form/v/1.33.6 "TanStack React Form 1.33.6"
[2]: https://tanstack.com/form/latest/docs/framework/react/quick-start "TanStack Form React Quick Start"
[3]: https://tanstack.com/form/latest/docs/framework/react/guides/form-composition "TanStack Form Composition"
[4]: https://tanstack.com/form/latest/docs/framework/react/guides/validation "TanStack Form Validation"
[5]: https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation "TanStack Form Dynamic Validation"
[6]: https://tanstack.com/form/latest/docs/framework/react/guides/custom-errors "TanStack Form Custom Errors"
[7]: https://valibot.dev/api/partialCheck/ "Valibot partialCheck"
[8]: https://valibot.dev/api/forward/ "Valibot forward"
