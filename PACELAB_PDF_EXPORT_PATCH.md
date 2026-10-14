# Patch — Border & Tata Letak PDF Program Latihan

Perubahan ini menyempurnakan **export PDF** (tombol `CETAK / DOWNLOAD PDF` pada modal CETAK PROGRAM):
seluruh blok kini diberi border sehingga hasil cetak rapi dan mudah dibaca.

## File yang berubah (backend)

| File | Status |
| --- | --- |
| `backend/src/utils/pdfProgramLayout.js` | **baru** — seluruh tata letak PDF (border, kotak header, grid tabel) |
| `backend/src/controllers/trainingProgramController.js` | fungsi `exportPDF` kini memanggil `renderTrainingProgramPDF()` |
| `backend/src/__tests__/unit/pdfProgramLayout.test.js` | **baru** — 9 test tata letak PDF |

Tidak ada perubahan pada frontend, endpoint, ataupun format data (`program_data`).

## Yang berubah di PDF

| Bagian | Sebelum | Sesudah |
| --- | --- | --- |
| Halaman | tanpa bingkai, tanpa nomor halaman | **bingkai ganda** di setiap halaman + footer `PACELAB PRO — <nama program>` dan `Halaman n / N` |
| Header program | teks rata tengah tanpa kotak | **kotak** dengan bar biru: judul program + subjudul target/level, lalu **tabel info bergaris** (target lomba, level, durasi, dibuat, periode, total volume) |
| Tiap minggu | satu baris teks bergaris bawah | **blok**: bar minggu berwarna (biru; lebih terang + label `RECOVERY WEEK` saat minggu recovery), baris sub-header (periode + jarak inti + target), **header tabel bergaris** |
| Hari latihan | `tanggal | hari: aktivitas` lalu jarak/pace rata kanan | **tabel 5 kolom** `TANGGAL / HARI / AKTIVITAS / JARAK / PACE` dengan garis grid, baris zebra, dan baris `RACE DAY` disorot |
| Detail latihan | `   Detail: …` teks abu-abu | **baris Detail bergaris** dengan label `DETAIL`, garis aksen di kiri, dan tinggi baris mengikuti panjang teks |
| Perpindahan halaman | potongan baris di tengah | kolom tabel + baris Detail **tidak pernah terpotong** |

## Format cetak (Perubahan #114)

| Aspek | Nilai |
| --- | --- |
| Orientasi default | **A4 Landscape** (841 × 595 pt) |
| Halaman 1 | **Sampul**: kotak judul, tabel info program, **ringkasan semua minggu** (nomor halaman, fase, periode, volume, jarak inti) |
| Halaman 2..N+1 | **tepat 1 minggu per halaman** (7 hari penuh), bukan lagi mengalir bebas |
| Kolom tabel minggu | `TANGGAL \| HARI \| AKTIVITAS \| JARAK \| PACE \| DETAIL` — **DETAIL jadi kolom dengan word wrap** |
| Auto-fit | skala font dicoba dari besar ke kecil; dipilih yang **terbesar namun tetap muat 1 halaman** (isi terpakai ±95% tinggi kertas, teks tidak terpotong) |
| Jaring pengaman | bila satu minggu benar-benar tidak muat (data ekstrem), tabel dilanjutkan ke halaman berikutnya dengan penanda `MINGGU n (lanjutan)` |

## Cara memasang

```bash
cd ~/Downloads/pacelab/pace-lab           # folder repo (bukan frontend)
unzip -o ~/Downloads/pacelab-backend-pdf-update.zip -d .

# wajib: pdfkit versi baru (bufferPages/switchToPage)
cd backend && npm ci && npx jest src/__tests__/unit/pdfProgramLayout.test.js
```

Hasil yang benar: `Tests: 9 passed, 9 total`.

Lalu restart API lalu coba tombol **CETAK / DOWNLOAD PDF**:

```bash
pm2 restart pacelab-api      # atau: npm start
```

> Catatan: `npm test` di folder backend akan tetap melaporkan `4 failed` karena file test lama
> (`authMiddleware/calculatorUtils/paceUtils/validators.test.js`) memang **kosong (0 byte)** di repo ini —
> itu kondisi sebelum perubahan ini, bukan akibat patch. Jalankan test spesifik PDF seperti di atas.

## Verifikasi setelah pasang

1. Buka **My Training Programs → CETAK PROGRAM → CETAK / DOWNLOAD PDF**.
2. PDF harus punya **bingkai di setiap halaman**, kotak judul biru di atas, tabel per minggu bergaris, dan footer `Halaman 1 / N`.
3. Contoh hasil (dibuat dari kode yang sama, program 14 minggu): `PACELAB_CONTOH_EXPORT_PDF.pdf`.
