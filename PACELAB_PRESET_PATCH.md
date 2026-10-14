# Patch cepat — Preset `MONOCHROME V2` & cara memastikan file sudah terbaru

Preset **MONOCHROME V2** (versi reverse/terbalik dari MONOCHROME) sudah ada di kode sumber
workspace, di arsip `pacelab-theme-update.zip`, dan di build preview.

- `frontend/src/utils/themeUtils.js` → `id: "mono-v2"`
- `frontend/src/__tests__/themeUtils.test.js` → test inversi channel
- `frontend/scripts/doctor.mjs` → daftar 6 preset

Kalau di aplikasimu belum muncul, pakai salah satu cara di bawah.

---

## Cara A (disarankan) — ekstrak arsip terbaru

```bash
cd ~/Downloads/pacelab/pace-lab/frontend      # WAJIB di dalam folder frontend

unzip -o ~/Downloads/pacelab-theme-update.zip -d .
rm -rf node_modules/.vite

npm run doctor     # harus: "PACELAB FRONTEND DOCTOR — app v1.3.0" + "Semua pemeriksaan lulus"
npm run dev
```

Lalu **hard refresh** browser: `Ctrl + Shift + R`.

---

## Cara B — tempel manual (1 blok, ±1 menit)

Buka `frontend/src/utils/themeUtils.js`, cari preset berikut:

```js
  {
    id: "mono",
    label: "MONOCHROME",
    colors: { bg: "#101010", accent: "#E8E8E8", text: "#FFFFFF" },
  },
```

Lalu tempel blok ini **tepat setelah** kurung tutupnya (`},`):

```js
  // Versi reverse dari MONOCHROME: setiap channel dibalik (255 - x), sehingga
  // #101010 -> #EFEFEF (latar), #E8E8E8 -> #171717 (aksen), #FFFFFF -> #000000 (teks).
  {
    id: "mono-v2",
    label: "MONOCHROME V2",
    isNew: true,
    hint: {
      en: "Monochrome reversed — light theme",
      id: "Kebalikan monochrome — tema terang",
    },
    swatches: ["#FFFFFF", "#EFEFEF", "#E8E8E8", "#171717", "#101010"],
    colors: { bg: "#EFEFEF", accent: "#171717", text: "#000000" },
  },
```

Terakhir, hapus badge `NEW` dari `WARM SAND` (hilangkan baris `isNew: true,` di preset itu)
supaya badge menempel pada preset terbaru.

---

## Cara memastikan sudah terpasang

| Cek | Yang benar |
| --- | --- |
| Header aplikasi | `PACELAB PRO // v1.3.0` (kalau masih `v1.0.0` → file lama) |
| Modal `⚙ TEMPLATE COLORS` | judul `PRESETS (6)` + chip `MONOCHROME V2` dengan badge `NEW` |
| Footer modal | `TEMA ENGINE v2 · 6 PRESETS` |
| Terminal | `grep -c "mono-v2" src/utils/themeUtils.js` → `1` |
| Terminal | `npm run doctor` → `App v1.3.0`, `Preset tema lengkap (6)`, `preset: DEFAULT COLOR / CARBON / SUNSET / MONOCHROME / MONOCHROME V2 / WARM SAND` |

---

## Isi MONOCHROME V2

Kebalikan tiap channel (`255 − x`) dari MONOCHROME:

| Slot | MONOCHROME | MONOCHROME V2 | Kontras di V2 |
| --- | --- | --- | --- |
| Latar | `#101010` | `#EFEFEF` | — |
| Aksen | `#E8E8E8` | `#171717` | 15.59 : 1 |
| Teks | `#FFFFFF` | `#000000` | 18.26 : 1 |

Karena latar lebih terang dari teks, preset ini otomatis diperlakukan sebagai tema terang:
hover aksen jadi lebih gelap (`#131313`), kartu `#CECECE`, garis `#838383`.

> Kalau yang kamu maksud "terbalik" itu versi dengan latar putih bersih `#FFFFFF` dan teks
> `#101010` (memakai warna MONOCHROME apa adanya, tukar peran), bilang saja — itu satu baris
> ubahan dan langsung saya ganti.
