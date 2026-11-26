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

| Skenario                                  | Cara uji                                                                                                                           | Hasil                                                                                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tanpa session membuka halaman terlindungi | Membuka `/admin?tab=aman` di browser tanpa cookie login                                                                            | Dialihkan ke `/login?kembali=%2Fadmin%3Ftab%3Daman`; form login tampil.                                                                                                                                                    |
| Target internal untuk kembali             | Memeriksa nilai `kembali` setelah pengalihan di atas                                                                               | Target `/admin?tab=aman` dipertahankan. Login yang berhasil diarahkan ke `safeReturnTarget(kembali)` pada kode; satu rangkaian login-browser-ke-halaman-asal belum diuji sebagai skenario end-to-end.                      |
| Login salah                               | Mengisi form browser dengan akun uji yang tidak ada dan password uji yang salah                                                    | Pesan tampil di dalam form: “Username atau password salah. Silakan coba lagi.” Tidak ada rahasia admin yang digunakan untuk tes ini.                                                                                       |
| Session berakhir                          | Memasang cookie palsu yang tidak sensitif di browser uji, lalu membuka halaman terlindungi                                         | Dialihkan ke login dan muncul toast “Sesi Anda berakhir. Silakan masuk kembali.” Parameter penanda dibersihkan, `kembali` tetap ada. Cookie uji dihapus sesudah pengujian.                                                 |
| Validasi Open Redirect                    | Uji fungsi/schema terhadap path lokal, URL absolut, `//host`, `///host`, slash-backslash, karakter kontrol, serta slash ter-encode | Path eksternal dan variasi slash/backslash ditolak; path internal diterima. Path dengan slash persen-terkode tetap ber-origin lokal saat diparse, sehingga tidak menjadi redirect eksternal. Nilai tak valid jatuh ke `/`. |
| Login admin dan logout                    | Memanggil API Better Auth secara langsung dari proses lokal dengan kredensial yang dibaca dari environment privat                  | Login admin menghasilkan session; logout berhasil. Nilai kredensial/session tidak dicetak.                                                                                                                                 |
| Endpoint admin tanpa login                | Memanggil `/api/admin/probe` tanpa cookie                                                                                          | Middleware menolak dengan HTTP 401.                                                                                                                                                                                        |
| Middleware admin dengan session admin     | Memanggil `/api/admin/probe` menggunakan session admin                                                                             | Middleware login dan peran dilewati; hasil HTTP 404 berasal dari tidak adanya endpoint `probe`, bukan penolakan akses. Tidak ada endpoint bisnis/admin pengguna yang ditambahkan.                                          |
| Build dan tipe                            | `npm run build`                                                                                                                    | Lulus, termasuk TypeScript.                                                                                                                                                                                                |
| Lint                                      | `npm run lint`                                                                                                                     | 0 error, 13 warning. Warning adalah warning Fast Refresh (`react/only-export-components`) pada komponen yang mengekspor hook dan komponen dalam satu file.                                                                 |

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

## Pengujian keamanan tambahan (CSRF dan XSS)

Pengujian tambahan dilakukan 24 November 2026 pada modul auth di lingkungan pengembangan. Semua permintaan API negatif memakai akun tak dikenal/password palsu atau cookie sesi palsu yang tidak aktif; tidak ada akun/session nyata yang diubah.

| Uji                                                                              | Hasil                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST `sign-out` memakai cookie palsu dan `Origin: https://evil.example`          | HTTP 403 dari pemeriksaan origin Better Auth.                                                                                                                                                                                                                                                   |
| POST `sign-out` memakai cookie palsu tanpa `Origin`/`Referer`                    | HTTP 403; origin kosong ditolak untuk request cookie-bearing.                                                                                                                                                                                                                                   |
| Form HTML lintas situs (`application/x-www-form-urlencoded`) ke username sign-in | HTTP 415; endpoint hanya menerima JSON, tidak mengeluarkan cookie session dan tidak memantulkan password.                                                                                                                                                                                       |
| CORS preflight dari origin asing untuk username sign-in                          | Tidak memberikan `Access-Control-Allow-Origin`; permintaan tidak dapat dibaca sebagai CORS oleh origin tersebut.                                                                                                                                                                                |
| POST JSON sign-in tanpa cookie dengan origin asing                               | Mencapai validasi kredensial dan menghasilkan 401 untuk username uji yang tidak ada, bukan penolakan origin. Ini tidak membuat session, sedangkan form HTML ditolak 415 dan preflight CORS tidak diizinkan. Catat sebagai batas pengujian/pertahanan berlapis, bukan bukti login CSRF berhasil. |
| Payload `<img onerror=...>` pada parameter `kembali` dan field username          | Tidak ada node image/script yang diinjeksi dan kode uji tidak berjalan; field tetap menampilkan payload sebagai teks, error tetap pesan generik.                                                                                                                                                |
| Header response HTML saat development                                            | Tidak ada `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, atau `Referrer-Policy` yang terdeteksi. Tidak ditemukan XSS pada alur yang diuji, tetapi CSP dan header pertahanan berlapis belum dikonfigurasi.                                                              |
| Atribut cookie session saat login admin lokal                                    | Cookie aktual dikeluarkan dengan `HttpOnly` dan `SameSite=Lax`; `Secure` tidak aktif di server development HTTP. Atribut produksi HTTPS belum diverifikasi. Nilai cookie tidak dicatat.                                                                                                         |

### Catatan konfigurasi sebelum produksi

Better Auth mengeluarkan peringatan karena `BETTER_AUTH_URL`/`baseURL` belum disetel di environment lokal. Jangan mengandalkan alamat host yang datang dari request sebagai konfigurasi origin produksi. Sebelum publikasi, isi `BETTER_AUTH_URL` dengan origin HTTPS resmi aplikasi dan batasi `trustedOrigins` ke origin resmi yang memang digunakan. Nilai domain produksi harus dipilih Project Owner/hosting; jangan menebaknya. Setelah itu, ulangi uji origin asing melalui ingress/hosting aktual. Cookie Better Auth memakai `HttpOnly` dan `SameSite=Lax` pada pengujian; `Secure` tidak aktif pada development HTTP dan belum diverifikasi untuk HTTPS produksi. Hindari menambahkan CSP secara terburu-buru tanpa menyesuaikan kebutuhan script SSR/hydration, lalu uji login dan SSR setelah header diterapkan.
