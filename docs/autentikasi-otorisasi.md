# Ringkasan Pengujian Autentikasi dan Otorisasi

Tanggal pengujian: 24 November 2026  
Cakupan: Tahap 2 Kasiar (login username/password, session, guard, dan peran).  
Lingkungan: database pengembangan Neon; pengujian UI memakai server pengembangan. Rahasia dan kredensial tidak dicatat di dokumen ini.

## Gambaran alur

1. Better Auth menerima login username dan password. Password minimum 8 karakter ditetapkan di sisi autentikasi. Pendaftaran mandiri dimatikan dan tidak ada reset password melalui email.
2. Session dibaca di server dari cookie pada `beforeLoad` root, lalu ringkasan session (ID, username, dan peran) diteruskan melalui RouterContext. Isi cookie tidak diteruskan ke browser.
3. Layout `/_app` mengalihkan pengguna tanpa session ke `/login`. Target halaman asal disimpan pada parameter `kembali`, dan hanya path internal yang diterima.
4. Route `/admin` juga memeriksa peran pada route. Middleware Hono memeriksa session untuk `/api/*` dan peran `admin` untuk `/api/admin/*`; pemeriksaan server ini menjadi batas keamanan, bukan sekadar penyembunyian menu.
5. Jika cookie session masih dikirim tetapi session tidak lagi valid, SSR meneruskan hanya tanda boolean ke context. Pengalihan menuju login membawa penanda `sesiBerakhir`; halaman login menampilkan toast lalu membersihkan penanda tersebut sambil mempertahankan `kembali`.

## Hasil pengujian

| Skenario | Cara uji | Hasil |
|---|---|---|
| Tanpa session membuka halaman terlindungi | Membuka `/admin?tab=aman` di browser tanpa cookie login | Dialihkan ke `/login?kembali=%2Fadmin%3Ftab%3Daman`; form login tampil. |
| Target internal untuk kembali | Memeriksa nilai `kembali` setelah pengalihan di atas | Target `/admin?tab=aman` dipertahankan. Login yang berhasil diarahkan ke `safeReturnTarget(kembali)` pada kode; satu rangkaian login-browser-ke-halaman-asal belum diuji sebagai skenario end-to-end. |
| Login salah | Mengisi form browser dengan akun uji yang tidak ada dan password uji yang salah | Pesan tampil di dalam form: “Username atau password salah. Silakan coba lagi.” Tidak ada rahasia admin yang digunakan untuk tes ini. |
| Session berakhir | Memasang cookie palsu yang tidak sensitif di browser uji, lalu membuka halaman terlindungi | Dialihkan ke login dan muncul toast “Sesi Anda berakhir. Silakan masuk kembali.” Parameter penanda dibersihkan, `kembali` tetap ada. Cookie uji dihapus sesudah pengujian. |
| Login admin dan logout | Memanggil API Better Auth secara langsung dari proses lokal dengan kredensial yang dibaca dari environment privat | Login admin menghasilkan session; logout berhasil. Nilai kredensial/session tidak dicetak. |
| Endpoint admin tanpa login | Memanggil `/api/admin/probe` tanpa cookie | Middleware menolak dengan HTTP 401. |
| Middleware admin dengan session admin | Memanggil `/api/admin/probe` menggunakan session admin | Middleware login dan peran dilewati; hasil HTTP 404 berasal dari tidak adanya endpoint `probe`, bukan penolakan akses. Tidak ada endpoint bisnis/admin pengguna yang ditambahkan. |
| Build dan tipe | `npm run build` | Lulus, termasuk TypeScript. |
| Lint | `npm run lint` | 0 error, 12 warning. Warning adalah warning Fast Refresh (`react/only-export-components`) pada komponen yang mengekspor hook dan komponen dalam satu file. |

## Hal yang belum diuji

- Peran `kasir` belum diuji, sesuai rencana: akun kasir dan fitur terkait akan diuji pada tahap berikutnya.
- Belum ada uji browser lengkap yang memasukkan akun admin, login berhasil, lalu membuktikan browser kembali ke `/admin?tab=aman`. Nilai `kembali` sudah terbukti ada pada URL login dan handler sukses memakai nilai yang sudah divalidasi.
- `/api/admin/probe` bukan fitur produk; HTTP 404 setelah middleware lolos hanya dipakai untuk membedakan akses yang melewati pemeriksaan dengan akses tanpa session.

## Berkas implementasi terkait

- `src/lib/auth.ts`: konfigurasi Better Auth, plugin username, minimum password, dan pembacaan session.
- `src/routes/__root.tsx`: pembacaan cookie/session di server dan flag session-cookie yang tidak berisi nilai cookie.
- `src/routes/_app.tsx` dan `src/routes/_app/admin/route.tsx`: guard halaman serta pengalihan login.
- `src/routes/login.tsx`: form login, pesan kesalahan, dan toast session berakhir.
- `src/server/app.ts`: middleware Hono untuk login dan admin.
- `src/validation/login.ts` dan `src/validation/search.ts`: validasi login dan parameter `kembali`/penanda sesi.

## Menjalankan pemeriksaan ulang

Di lingkungan pengembangan yang sudah disiapkan, jalankan `npm run build` dan `npm run lint`. Uji manual alur browser melalui `/admin?tab=aman`; gunakan hanya kredensial pengujian yang sah dan jangan menyalinnya ke tiket, log, atau dokumen. Untuk mensimulasikan sesi berakhir, pakai cookie uji sementara yang tidak berisi token aktif, lalu hapus cookie sesudah tes.
