# Aturan: Menu Terkunci sampai Profil Lengkap

Pengguna baru (mis. daftar lewat Google) belum punya data antropometri, sehingga
perhitungan program latihan tidak bisa akurat. Karena itu seluruh menu aplikasi
dikunci sampai profil pelari lengkap dan pengguna diarahkan ke halaman Profile.

## Field wajib

| Field | Kunci data | Validasi |
| --- | --- | --- |
| Nama | `name` | teks, minimal 2 karakter |
| Usia | `age` | bilangan bulat 1–119 |
| Jenis kelamin | `gender` | `male` / `female` / `other` |
| Berat | `weight_kg` | angka > 0 dan < 400 |
| Tinggi | `height_cm` | angka > 0 dan < 300 |
| Nama komunitas | `community_name` | **opsional** |
| Asal komunitas | `community_origin` | **opsional** |

Mengubah daftar wajib: edit `REQUIRED_PROFILE_FIELDS` di
`frontend/src/utils/profileCompletion.js`. Untuk menjadikan komunitas wajib,
pindahkan entrinya dari `OPTIONAL_PROFILE_FIELDS` ke `REQUIRED_PROFILE_FIELDS`
dan tambahkan fungsi `validate`.

## Perilaku

| Aspek | Perilaku |
| --- | --- |
| Rute terkunci | `/calculator`, `/dashboard`, `/create-training-program`, `/my-training-programs` |
| Tetap bisa diakses | `/profile`, halaman publik (`/`, `/login`), dan area `/admin` |
| Kelengkapan | `1/5` pada contoh pengguna baru tanpa data (nama sudah ada dari Google) |
| Header desktop | Item menu jadi tombol berikon gembok + chip `PROFIL BELUM LENGKAP n/5` di strip atas |
| Header mobile | Item menu terkunci, tombol `START CALCULATING` → `LENGKAPI PROFIL →` |
| Klik menu terkunci | Toast “Lengkapi profil dulu untuk membuka menu aplikasi.” lalu diarahkan ke `/profile` |
| Setelah login | Profil belum lengkap → langsung ke `/profile` (bukan dashboard) |
| Halaman Profile | Banner `AKSES TERKUNCI`, progress bar, daftar field kosong, badge `WAJIB`/`OK`, form otomatis terbuka |
| Setelah disimpan | Bila lengkap: toast “Profil lengkap — semua menu terbuka!” dan otomatis kembali ke menu yang tadi dituju |
| Admin | Tidak dikunci (memakai area admin terpisah) |

## Keterbacaan di semua tema (token `--retro-warn`)

UI kunci profil **tidak memakai warna amber tetap**, karena amber di atas latar terang
praktis tidak terlihat (terukur hanya 1.2:1 pada WARM SAND / MONOCHROME V2). Warna
peringatan kini diambil dari token tema `--retro-warn`:

| Preset | Latar | `--retro-warn` | Kontras |
| --- | --- | --- | --- |
| DEFAULT COLOR | `#005BAC` | `#FFCD53` | 4.56 : 1 |
| CARBON | `#0B0F14` | `#FBBF24` | 11.51 : 1 |
| SUNSET | `#2B1055` | `#FBBF24` | 9.62 : 1 |
| MONOCHROME | `#101010` | `#FBBF24` | 11.40 : 1 |
| MONOCHROME V2 | `#EFEFEF` | `#886819` | 4.52 : 1 |
| WARM SAND | `#F5EBE0` | `#856618` | 4.56 : 1 |

Nilainya dihitung oleh `ensureContrast()` (menggelapkan atau menerangkan warna sampai
minimal 4.5:1 terhadap latar zona) di `frontend/src/utils/themeUtils.js`. Karena teks
tombol memakai warna latar (`text-retro-black`), kontras tombol peringatan otomatis
memenuhi ambang yang sama. Ada test yang mengunci rasio ini untuk **semua** preset,
termasuk tema terang.

## Berkas terkait

| Berkas | Peran |
| --- | --- |
| `frontend/src/utils/profileCompletion.js` | aturan & validasi kelengkapan profil |
| `frontend/src/components/auth/ProfileGuard.jsx` | guard rute → redirect ke `/profile` |
| `frontend/src/components/ui/LockIcon.jsx` | ikon gembok |
| `frontend/src/context/AuthContext.jsx` | mengekspor `profileCompletion`, `isProfileComplete`, `isProfileLocked` |
| `frontend/src/App.jsx` | komponen `Protected` yang merangkai `AuthGuard` + `ProfileGuard` |
| `frontend/src/components/layout/Header.jsx` | menu terkunci + chip status |
| `frontend/src/pages/ProfilePage.jsx` | banner, penanda field wajib, redirect setelah lengkap |
| `frontend/src/__tests__/profileGuard.test.js` | 12 test untuk aturan ini |

Pratinjau tampilan: `PACELAB_PROFILE_LOCK_PREVIEW.html`.

## Catatan

Penguncian ini berjalan di sisi frontend (UX). Endpoint API belum menolak
permintaan dari pengguna yang profilnya belum lengkap — kalau ingin penjagaan
berlapis, langkah berikutnya adalah menambahkan middleware `requireCompleteProfile`
di backend untuk rute calculator & training program.
