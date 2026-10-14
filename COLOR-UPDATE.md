# Update warna: Pocari blue + putih

Perubahan yang sudah dilakukan di repo ini:

## Palette baru
- Primary blue: `#00AEEF`
- Dark blue: `#005BAC`
- Hover / darker blue: `#008DCE`
- Soft blue: `#DFF5FF`
- White base: `#FFFFFF`

## File yang diubah
- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `frontend/src/styles/globals.css`
- `frontend/src/App.jsx`
- `frontend/src/components/sections/HeroSection.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/utils/paceUtils.js`
- `frontend/src/utils/trainingZone.js`
- `frontend/src/components/calculators/VO2MaxCalculator.jsx`

## Cek build
Build frontend berhasil dijalankan dengan sukses.

```bash
cd frontend
npm run build
```

## Preset WARM SAND (tema terang)

Palette cream/beige yang ditambahkan sebagai preset tema (`WARM SAND`):

- `#EDEDE9`, `#D6CCC2`, `#F5EBE0`, `#E3D5CA`, `#D5BDAF`

Karena seluruh warna palette ini terang (kontras antar warna 1.0–1.5), preset dijalankan
sebagai tema terang:

| Slot tema | Warna | Keterangan |
| --- | --- | --- |
| Latar (`--retro-black`) | `#F5EBE0` | cream asli dari palette |
| Aksen (`--retro-green`) | `#766960` | shade dari `#D5BDAF` (kontras 4.51:1) |
| Teks (`--retro-white`) | `#3B3733` | shade dari `#D6CCC2` (kontras 10.02:1) |

Turunan otomatis: kartu `#DBD2C8`, permukaan tengah `#C5BCB3`, garis `#A19A92`, dan
hover aksen `#6B6058` (pada tema terang hover dibuat lebih gelap, bukan lebih terang).

Pratinjau warna: `PACELAB_WARM_SAND_PREVIEW.html`.

## Daftar preset final (6)

| # | Nama | Tipe |
| --- | --- | --- |
| 1 | POCARI BLUE | tema gelap (default) |
| 2 | CARBON | tema gelap |
| 3 | SUNSET | tema gelap |
| 4 | MONOCHROME | tema gelap |
| 5 | MONOCHROME V2 | tema terang (kebalikan MONOCHROME) |
| 6 | WARM SAND | tema terang (palette cream/beige) |

### MONOCHROME V2 — versi reverse dari MONOCHROME

Setiap channel warna dimiliki MONOCHROME dibalik (`255 - x`):

| Slot | MONOCHROME | MONOCHROME V2 | Kontras di V2 |
| --- | --- | --- | --- |
| Latar | `#101010` | `#EFEFEF` | — |
| Aksen | `#E8E8E8` | `#171717` | 15.59:1 |
| Teks | `#FFFFFF` | `#000000` | 18.26:1 |

Turunan otomatis: kartu `#CECECE`, permukaan tengah `#B1B1B1`, garis `#838383`, hover aksen
`#131313` (pada tema terang hover dibuat lebih gelap).

Preset `TERMINAL AMBER`, `RETRO GREEN`, dan `CRIMSON` dihapus sesuai permintaan pemilik produk.

Catatan: tema yang sudah tersimpan di localStorage tetap berlaku walaupun preset sumbernya dihapus
(warnanya tersimpan sebagai kode hex), jadi tidak ada tampilan yang rusak. Chip preset hanya akan
tersorot bila warnanya sama persis dengan salah satu dari 5 preset di atas.
