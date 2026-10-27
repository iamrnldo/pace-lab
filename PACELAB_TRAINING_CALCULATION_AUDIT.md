# PaceLab — Audit Rumus dan Alur Perhitungan Program

**Status:** Point 3–5 diterapkan pada Perubahan #80–82  
**Tanggal:** 2026-08-11

Dokumen ini menjelaskan rumus yang saat ini dipakai generator, titik yang sudah konsisten, dan bagian yang masih perlu disatukan agar semua angka di UI berasal dari satu sumber perhitungan.

---

## 1. Input utama

Generator memakai:

```text
Race event
Level pelari
Kondisi latihan 4–6 minggu terakhir
Tanggal mulai / race date
Hari latihan
Hasil VCR untuk pace
```

Kondisi latihan menentukan baseline sebagai persentase peak mileage:

| Kondisi | Beginner | Intermediate |
|---|---:|---:|
| Returning | 60% peak | 65% peak |
| Consistent | 70% peak | 75% peak |
| Structured | 80% peak | 90% peak |

Peak mileage saat ini dipilih dari durasi persiapan di dalam range race/level yang sudah dikonfigurasi.

---

## 2. Peak mileage dan Long Run

| Race | Level | Peak mileage | Peak Long Run |
|---|---|---:|---:|
| 5K | Beginner | 16–25 km | 5–7 km |
| 5K | Intermediate | 24–35 km | 8–10 km |
| 10K | Beginner | 25–35 km | 9–11 km |
| 10K | Intermediate | 30–40 km | 12–15 km |
| HM | Beginner | 32–48 km | 16–19 km |
| HM | Intermediate | 40–60 km | 19–22 km |
| FM | Beginner | 50–64 km | 28–32 km |
| FM | Intermediate | 64–88 km | 32–36 km |

Target Long Run diinterpolasi menurut durasi persiapan. Pada peak week generator juga menerapkan guard `Long Run ≤ 50% weekly mileage`.

---

## 3. Rumus progression mileage

### Build

```text
W_target = planned mileage berdasarkan start → peak
W_actual(n) = jarak inti sesi yang benar-benar ditampilkan pada minggu n
```

Kenaikan dibatasi lebih konservatif dari batas maksimum 10%:

```text
5K / 10K: maksimal +5%
HM:        maksimal +5%
FM:        maksimal +4%
```

Ceiling menggunakan kombinasi minggu sebelumnya dan rolling baseline tiga minggu terakhir.

### Recovery

Recovery week saat ini menurunkan total mileage sekitar 5–10% menurut race, sambil mengurangi frekuensi quality session.

### Taper HM/FM

```text
Taper minggu 1: 70% peak
Taper minggu 2: 50% peak
```

---

## 4. Alokasi sesi mingguan saat ini

| Jenis | Rumus inti |
|---|---|
| Long Run | 30% weekly mileage, dibatasi target peak Long Run |
| Tempo | 10% pada awal Specific → 15% akhir Specific/Pre-Competition |
| Interval | 10% pada awal Specific → maksimal 15% akhir Specific, cap 10 km |
| Repetition | 5% weekly mileage |
| Marathon Pace | 10% weekly mileage bila dijadwalkan |
| Easy Run | Sisa mileage setelah sesi lain |

Untuk sesi kualitas, `Jarak Inti` adalah volume pada target pace. Warm-up, recovery jog, dan cool-down ditampilkan sebagai estimasi fisik, tetapi tidak masuk weekly mileage.

---

## 5. Alur perhitungan sesi

```text
1. Tentukan W_target dari phase / mesocycle.
2. Gunakan W_actual minggu sebelumnya sebagai quality mileage basis.
3. Tentukan volume main set T/I/R/M dari persentase yang aktif.
4. Tentukan Long Run.
5. Easy Run menerima sisa mileage dengan syarat Easy < Long Run.
6. Hitung Total Mileage Program dari jarak inti sesi yang benar-benar tampil.
7. Gunakan Total Mileage Program ini sebagai referensi minggu berikutnya.
```

---

## 6. Ketidaksesuaian yang masih perlu disatukan

### A. Long Run 30% vs target peak Long Run

Saat ini ada dua aturan yang bisa berinteraksi:

```text
Long Run = 30% weekly mileage
Peak Long Run = range race/level
```

Pada peak week, target Long Run dapat membuat hasil berbeda dari 30%. Perlu keputusan produk apakah:

```text
1. Long Run selalu 30%, dengan peak range hanya sebagai cap; atau
2. Peak Long Run boleh override 30% pada peak week.
```

### B. Easy remainder tidak selalu dapat dimuat

Easy Run harus lebih pendek dari Long Run. Bila hari Easy terlalu sedikit, seluruh sisa mileage tidak selalu dapat dibagi tanpa melanggar aturan tersebut. Saat ini sistem menampilkan perbedaan antara `Target phase` dan `Total Mileage Program` secara transparan.

Perlu keputusan apakah sistem boleh:

```text
1. Menambah hari Easy otomatis;
2. Memperpanjang Long Run;
3. Menurunkan Target phase;
4. Mempertahankan selisih target seperti saat ini.
```

### C. Marathon Pace allocation

M-Pace sekarang memakai 10% bila dijadwalkan. Ini adalah kebijakan produk agar pembagian konsisten; Daniels sendiri lebih sering mendeskripsikan M-Pace sebagai blok spesifik di dalam workout/Long Run daripada aturan persen universal.

### D. Persentase T/I pada taper

Policy terbaru memastikan T/I tidak turun di bawah 10% bila sesi dijadwalkan. Ini perlu dikonfirmasi terhadap tujuan taper karena Daniels umumnya mengurangi total stress melalui volume/repetisi walaupun intensitas dipertahankan.

---

## 7. Rumus kanonik yang direkomendasikan

Agar tidak ada mismatch UI, semua modul sebaiknya memakai satu objek mingguan:

```js
{
  targetMileage,
  actualMileage,
  longRunKm,
  tempoKm,
  intervalKm,
  repetitionKm,
  marathonPaceKm,
  easyKm,
  phase,
  mesocycle
}
```

Dengan rumus:

```text
Long Run = min(0.30 × W, peakLongRunCap)
Tempo = pT × W bila T dijadwalkan
Interval = pI × W bila I dijadwalkan
Repetition = 0.05 × W bila R dijadwalkan
M-Pace = pM × W bila M dijadwalkan
Easy = W − L − T − I − R − M
```

Semua detail workout kemudian wajib dibentuk dari angka yang sama, sehingga:

```text
Jarak Inti = jumlah blok/repetisi
Total Mileage Program = jumlah seluruh Jarak Inti
```

---

## 8. Rekomendasi urutan perbaikan

```text
1. Putuskan prioritas Long Run 30% vs peak Long Run pada peak week.
2. Putuskan penanganan Easy remainder bila hari Easy tidak cukup.
3. Jadikan weekly allocation object sebagai single source of truth.
4. Hasilkan detail Tempo/I/R/M dari allocation object tersebut.
5. Tambahkan test matrix untuk memastikan jumlah blok = Jarak Inti = header mileage.
```

### Penjelasan Point 3 — Weekly allocation object sebagai single source of truth

Saat ini beberapa angka masih dapat dihitung di tempat yang berbeda: target fase dihitung lebih awal, detail workout dibentuk kemudian, dan header mileage dibentuk dari sesi yang tampil. Kondisi ini berisiko menghasilkan angka berbeda pada UI.

Perbaikannya adalah membuat **satu objek alokasi per minggu** sebelum membentuk hari latihan:

```js
{
  weeklyMileage: 60,
  longRunKm: 18,
  tempoKm: 9,
  intervalKm: 0,
  repetitionKm: 0,
  marathonPaceKm: 6,
  easyKm: 27,
  phase: "Specific Preparation",
  mesocycle: "Race-Specific"
}
```

Objek tersebut menjadi satu-satunya sumber angka untuk:

```text
- Jarak inti setiap sesi
- Header Total Mileage Program
- Main quality volume T/I/R/M
- Detail workout PDF/Excel
- Structured program_data
- Guardrail volume
```

Dengan contoh di atas, generator tidak boleh membuat Tempo 11 km atau M-Pace 4.5 km secara terpisah, karena angka yang sah sudah ditetapkan sebagai `tempoKm: 9` dan `marathonPaceKm: 6`.

### Penjelasan Point 4 — Detail workout dibentuk dari allocation object

Setelah alokasi ditentukan, detail sesi harus merupakan pemecahan matematis dari jarak inti tersebut.

Contoh Tempo:

```text
Tempo allocation: 9.0 km
T-Pace: 5:00/km
Total durasi T: 45 menit
```

Generator dapat memilih format sesuai fase:

```text
Specific:        45 menit T kontinu
Pre-Competition: 3 × 15 menit T, recovery 2 menit jog
Taper:           volume dialokasikan lebih kecil sesuai aturan taper
```

Contoh Interval:

```text
Interval allocation: 6.0 km
Speed distance fase: 1000 m
Hasil: 6 × 1000 m @ I-Pace
```

Contoh M-Pace:

```text
M allocation: 6.0 km
Hasil: 2 × 3.0 km @ M-Pace
```

Aturan wajibnya:

```text
Jumlah blok/repetisi = Jarak Inti pada kolom tabel
Jarak Inti seluruh sesi = Total Mileage Program
```

Warm-up, recovery jog, dan cool-down tetap ditampilkan sebagai **estimasi total fisik sesi**, tetapi tidak mengubah allocation object atau weekly mileage sesuai kebijakan produk saat ini.

### Penjelasan Point 5 — Test matrix

Test matrix adalah daftar kombinasi program yang harus diuji otomatis, agar setiap perubahan rumus tidak menghasilkan mismatch baru.

Dimensi utama test matrix:

```text
Race:        5K / 10K / HM / FM
Level:       Beginner / Intermediate
Background:  Returning / Consistent / Structured
Duration:    pendek / sedang / panjang
Phase:       GP / SP / PC / MC
Training days: 2 sampai 7 hari
Tier:        Low / Medium / High
```

Setiap kombinasi harus memeriksa aturan berikut:

```text
1. Total Mileage Program = jumlah seluruh Jarak Inti harian.
2. Easy Run < Long Run.
3. Long Run = 30% weekly mileage, kecuali peak cap yang disetujui.
4. Tempo berada pada 10–15% sesuai progress Specific.
5. Interval berada pada 10–15% dan ≤10 km.
6. Repetition berada pada 5%.
7. Blok Tempo/I/R/M selalu berjumlah sama dengan Jarak Inti.
8. Q1/Q2 memiliki Easy/Rest Day di antaranya.
9. Recovery/taper tidak membuat sesi kualitas yang tidak diizinkan.
10. Tidak ada variabel undefined atau sesi dengan jarak negatif/NaN.
```

Contoh satu test:

```text
HM Intermediate + Structured + 4 bulan + Specific + 5 hari latihan

- Peak harus sekitar 50 km.
- Baseline harus sekitar 45 km.
- Long Run harus di bawah peak Long Run dan sekitar 30% weekly mileage.
- Tempo harus 10–15% sesuai minggu Specific.
- M/I secondary hanya ada bila Q-spacing aman.
- Header mileage harus sama dengan penjumlahan Jarak Inti.
```

---

## 9. Snapshot Rumus Aktif — Perubahan #96

### Peak mileage

| Race | Beginner | Intermediate |
|---|---:|---:|
| 5K | 16–25 km | 24–35 km |
| 10K | 25–35 km | 30–40 km |
| HM | 32–48 km | 40–60 km |
| FM | 50–64 km | 64–88 km |

Durasi persiapan memilih nilai di dalam range. Baseline awal memakai persentase peak:

| Background | Beginner | Intermediate |
|---|---:|---:|
| Returning | 60% | 65% |
| Consistent | 70% | 75% |
| Structured | 80% | 90% |

### Long Run

| Race | Beginner peak L | Intermediate peak L |
|---|---:|---:|
| 5K | 5–7 km | 8–10 km |
| 10K | 9–11 km | 12–15 km |
| HM | 16–19 km | 19–22 km |
| FM | 28–32 km | 32–36 km |

```text
L_base = 30% × weekly mileage
L_peak = min(configured peak, 50% × weekly mileage)
L_build = trajectory dari Long Run awal menuju L_peak
L_next ≤ 110% × L_previous
```

### Weekly mileage

```text
Build:     5K/10K/HM ≤ +5%, FM ≤ +4% dari riwayat aktual
Recovery:  tidak turun ekstrem; quality dikurangi/dihilangkan
Taper HM/FM: 70% → 50% peak
```

### Quality volume

```text
Tempo:   10% awal Specific → 12.5% tengah → 15% akhir/PC
Interval: 10% awal Specific → 12.5% tengah → 15% akhir/PC, cap 10 km
Repetition: 5% weekly mileage
M-Pace: 10% weekly mileage bila dijadwalkan
Easy: sisa alokasi; setiap Easy Run < Long Run
```

### Jarak yang dihitung

```text
Total Mileage Program = Easy + Long + Race + Jarak Inti T/I/R/M
Warm-up + recovery jog + cool-down = estimasi fisik, tidak masuk mileage
```

### Recovery Week distance/time cap

| Race | Easy max | Long max |
|---|---:|---:|
| 5K | 30 menit | 45 menit |
| 10K | 35 menit | 55 menit |
| HM | 45 menit | 75 menit |
| FM | 50 menit | 90 menit |

```text
Recovery Long Run ≤ 75% Long Run minggu sebelumnya
```
