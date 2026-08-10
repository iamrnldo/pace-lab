# PaceLab — Daniels Implementation Roadmap

> Vault terpisah untuk mencatat logika dari referensi Daniels’ Running Formula yang sudah dianalisis tetapi belum sepenuhnya diterapkan ke generator.
>
> Status saat ini: **ANALYZED — NOT FULLY IMPLEMENTED**

---

## 0. Referensi Utama

```text
Daniels, Jack — Daniels’ Running Formula
Human Kinetics, 2021
```

Bagian referensi yang relevan:

- Bab 4–5: intensitas latihan, pace, VDOT, dan physiological profile.
- Bab 13: program 5K dan 10K.
- Bab 15: Half Marathon dan medium-long distance.
- Bab 16: Marathon training.

---

# 1. Sistem Intensitas Daniels

## Status

```text
[ ] Belum diterapkan sepenuhnya
```

## Target

Pisahkan jenis latihan menjadi:

```text
E = Easy
M = Marathon Pace
T = Threshold
I = Interval
R = Repetition
H = Hard
L = Long Run
Q = Quality Session
```

## Kondisi saat ini

Pace generator saat ini masih terutama menggunakan:

```text
Easy Pace
Tempo Pace
Interval Pace
```

## Implementasi yang dibutuhkan

- Tambahkan `paceType` ke setiap sesi.
- Tambahkan label E/M/T/I/R/H/L/Q.
- Pisahkan pace berdasarkan fungsi fisiologis.
- Simpan kategori pace ke dalam `program_data`.

Contoh target struktur:

```js
{
  activity: "Interval Run",
  paceType: "I",
  pace: "5:20/km"
}
```

---

# 2. Sistem VDOT Daniels

## Status

```text
[SKIP SEMENTARA — SESUAI KEPUTUSAN PRODUK]

```

## Target

Hasil VCR atau hasil lomba digunakan untuk memperkirakan VDOT, kemudian VDOT digunakan untuk menentukan:

```text
E Pace
M Pace
T Pace
I Pace
R Pace
```

## Kondisi saat ini

Generator masih menggunakan hasil VCR dan beberapa persentase percepatan.

## Implementasi yang dibutuhkan

- Buat fungsi konversi VCR/result race → VDOT.
- Buat tabel VDOT → E/M/T/I/R pace.
- Gunakan pace zone, bukan persentase cepat tetap.
- Tambahkan fallback jika VDOT tidak tersedia.

---

# 3. Perbedaan Beginner dan Intermediate

## Status

```text
[~] Sebagian sudah diterapkan — 5K, 10K, dan Half Marathon diperbarui
```

## Sudah ada

- Level Beginner dan Intermediate tersedia untuk semua nomor lomba.
- Intermediate memiliki intensitas lebih tinggi untuk beberapa race.
- 5K memiliki aturan sesi berbeda berdasarkan level dan durasi.

## Belum ada

Intermediate seharusnya dibedakan melalui:

- Jumlah Quality Session.
- Durasi workout.
- Jumlah repetisi.
- Panjang interval.
- Recovery antar repetisi.
- Kompleksitas workout.
- Race-specific training.

Perbedaan tidak seharusnya hanya berupa pace yang lebih cepat.

---

# 4. Struktur Quality Session Q1 dan Q2

## Status

```text
[ ] Belum diterapkan secara eksplisit
```

## Target

Struktur mingguan intermediate:

```text
Q1 = Long Run atau workout utama
Q2 = Tempo / Interval / Repetition
```

Hari lain:

```text
Easy Run
Rest
Strength Training
```

## Prinsip recovery

Jangan menyusun:

```text
Interval → Tempo → Long Run
```

tanpa Easy Day atau Rest di antara sesi berat.

Target struktur:

```text
Q1 → Easy/Rest → Easy → Q2 → Easy → ST → Long Run
```

---

# 5. Struktur Fase Daniels

## Status

```text
[~] Prinsip umum sudah ada, detail belum diterapkan
```

## Target phase

### Phase I

Fokus:

- Aerobic foundation.
- Easy running.
- Strength Training.
- Strides ringan.
- Konsistensi.

### Phase II

Fokus:

- T, I, dan R mulai diperkenalkan.
- Volume dan intensitas dibangun.
- Quality Session mulai terstruktur.

### Phase III

Fokus:

- Race-specific training.
- Kombinasi T, I, R, dan M.
- Volume mulai dikontrol.

### Phase IV

Fokus:

- Taper.
- Volume rendah.
- Intensitas dipertahankan secara terbatas.
- Race Day.

---

# 6. Program Intermediate 5K

## Status

```text
[ ] Belum dibuat sebagai konfigurasi Daniels khusus
```

## Target

Fokus utama:

```text
E + T + I + R
```

Workout yang perlu disiapkan:

- 200m repetitions.
- 400m repetitions.
- 600m intervals.
- 800m intervals.
- 1000m intervals.
- 1200m intervals.
- Pyramid workout.
- Threshold intervals.
- Race-specific session.

---

# 7. Program Intermediate 10K

## Status

```text
[ ] Belum dibuat sebagai konfigurasi Daniels khusus
```

## Target

Fokus utama:

```text
E + T + I
```

Workout yang perlu disiapkan:

- 800m intervals.
- 1000m intervals.
- 1200m intervals.
- 1600m intervals.
- 2000m intervals.
- Tempo intervals.
- 10K race-pace workout.
- Taper-specific workout.

---

# 8. Program Intermediate Half Marathon

## Status

```text
[ ] Belum dibuat sebagai konfigurasi Daniels khusus
```

## Target

Fokus utama:

```text
E + L + T + M
```

Interval tetap dapat digunakan, tetapi tidak menjadi komponen dominan.

Workout yang perlu disiapkan:

- Long Run progresif.
- M Pace blocks.
- T Pace intervals.
- 1000m–2000m controlled intervals.
- Long Tempo.
- Race-specific Half Marathon Pace.

---

# 9. Program Intermediate Marathon

## Status

```text
[ ] Belum dibuat sebagai konfigurasi Daniels khusus
```

## Target

Fokus utama:

```text
E + L + M + T
```

Interval pendek bukan komponen utama setiap minggu.

Workout yang perlu disiapkan:

- Long Run berbasis waktu.
- Long Run dengan M Pace blocks.
- M Pace workout.
- Threshold maintenance.
- Strength Training.
- Two Quality Sessions dengan recovery cukup.
- Peak mileage tinggi.

---

# 10. Long Run Berbasis Waktu

## Status

```text
[ ] Belum diterapkan
```

## Kondisi saat ini

Long Run terutama dihitung berdasarkan persentase mileage mingguan.

## Target Daniels

Gunakan batas ganda:

```text
Long Run = nilai yang lebih kecil antara:
- batas persentase mileage
- batas durasi waktu
```

Contoh:

```text
Long Run maksimal 25% mileage
atau maksimal 120 menit
ambil nilai yang lebih rendah
```

---

# 11. Threshold Workout Berdasarkan Mileage Mingguan

## Status

```text
[ ] Belum diterapkan
```

## Target

### Mileage rendah

```text
20 menit T kontinu
```

### Mileage menengah

```text
5–6 × 6 menit T
2 × 12 menit T
```

### Mileage tinggi

```text
3 × 12 menit T
4 × 10 menit T
```

Total durasi T harus disesuaikan dengan total mileage mingguan.

---

# 12. Recovery antar Jenis Latihan

## Status

```text
[~] Recovery dasar sudah ada, tetapi belum berbasis jenis latihan
```

## Target

```text
R: recovery panjang
I: recovery jog sedang
T: recovery singkat
M: recovery minimal atau tanpa recovery
```

Recovery juga harus disesuaikan dengan:

- Level atlet.
- Nomor lomba.
- Fase latihan.
- Total mileage.
- Jumlah Quality Session.

---

# 13. Repetition Training / R Training

## Status

```text
[ ] Belum dibuat sebagai tipe khusus
```

## Target

Gunakan:

```text
200m
300m
400m
Strides
Hill repetitions
```

Fokus:

- Running economy.
- Mekanika lari.
- Efisiensi gerak.
- Bukan sprint maksimal tanpa kontrol.

---

# 14. Marathon Pace Training

## Status

```text
[ ] Belum diterapkan sebagai tipe khusus
```

## Target

Tambahkan sesi:

```text
M Pace Run
Easy + M Pace
Long Run dengan M Pace blocks
```

Terutama untuk:

```text
Half Marathon
Full Marathon
```

---

# 15. Taper Daniels

## Status

```text
[~] Pengurangan volume sudah ada, tetapi belum sepenuhnya berbasis Daniels
```

## Target

Pada taper:

- Volume turun.
- Intensitas tertentu dipertahankan.
- Repetisi dikurangi.
- Recovery diperpanjang.
- Tidak membuat fatigue baru.
- Shakeout disesuaikan nomor lomba.

---

# 16. Recovery Week

## Status

```text
[~] Recovery week 3:1 sudah ada secara umum
```

## Target

Dukungan recovery perlu disesuaikan dengan:

- Level Beginner/Intermediate.
- Nomor lomba.
- Durasi persiapan.
- Peak mileage.
- Riwayat fatigue.

Struktur dasar:

```text
3 minggu build
1 minggu recovery
```

---

# 17. Penyesuaian Kondisi Eksternal

## Status

```text
[ ] Belum diterapkan
```

Pace perlu dapat disesuaikan terhadap:

- Cuaca panas.
- Kelembapan.
- Angin.
- Elevasi.
- Permukaan lintasan.
- Kelelahan.
- Kualitas tidur.

---

# 18. Durasi Minimal Latihan

## Status

```text
[~] Sebagian sudah ada
```

## Target

- Easy Run memiliki durasi minimal realistis.
- Long Run tidak terlalu pendek.
- Quality Session selalu memiliki warm-up.
- Quality Session selalu memiliki cool-down.
- Recovery sesuai jenis sesi.

---

# 19. Race-Specific Training

## Status

```text
[~] Sudah ada secara umum, belum mengikuti seluruh struktur Daniels
```

Target fokus:

```text
5K:
I + R + T

10K:
I + T + E

Half Marathon:
T + M + L + E

Full Marathon:
M + L + T + E
```

---

# 20. Workout Berdasarkan Total Mileage

## Status

```text
[ ] Belum diterapkan
```

Target kategori:

```text
Mileage rendah
Mileage menengah
Mileage tinggi
Mileage elite
```

Setiap kategori memiliki:

- Jumlah Q session berbeda.
- Durasi T berbeda.
- Jumlah interval berbeda.
- Long Run berbeda.
- Recovery berbeda.

---

# 21. Rekomendasi Workout Otomatis

## Status

```text
[ ] Belum diterapkan
```

Contoh aturan:

```text
Jika mileage rendah:
gunakan workout ringan

Jika mileage menengah:
gunakan kombinasi T dan I

Jika mileage tinggi:
gunakan Q1 dan Q2

Jika Marathon Intermediate:
gunakan M + T + L
```

---

# 22. Updating VDOT / Pace

## Status

```text
[ ] Belum diterapkan
```

Pace harus dapat diperbarui berdasarkan:

- Race result.
- Time trial.
- VCR terbaru.
- Training performance.
- Progress atlet.

---

# 23. Mesocycle

## Status

```text
[ ] Belum diterapkan secara eksplisit
```

Contoh target:

```text
Mesocycle 1: Base
Mesocycle 2: Threshold
Mesocycle 3: Interval
Mesocycle 4: Race Specific
Mesocycle 5: Taper
```

---

# 24. Struktur Data Program

## Status

```text
[ ] Belum diterapkan sepenuhnya
```

Target struktur `program_data`:

```js
{
  week: 1,
  phase: 2,
  qSession: "Q2",
  activity: "Interval Run",
  paceType: "I",
  pace: "5:20/km",
  warmup: {
    duration: 10,
    unit: "minutes"
  },
  mainSet: [
    {
      distance: 800,
      repetitions: 5,
      paceType: "I",
      recovery: "400m jog"
    }
  ],
  cooldown: {
    duration: 10,
    unit: "minutes"
  },
  totalQualityDistance: 4,
  totalSessionDuration: 60
}
```

Saat ini sebagian besar detail masih disimpan sebagai string.

---

# 25. Urutan Implementasi yang Disarankan

## Tahap 1 — Pace Engine

```text
1. VDOT calculation
2. E/M/T/I/R pace mapping
3. Pace validation
```

## Tahap 2 — Workout Engine

```text
4. Q1/Q2 structure
5. Recovery rules
6. Daniels workout library
7. Time-based Long Run
```

## Tahap 3 — Distance Specific

```text
8. Intermediate 5K
9. Intermediate 10K
10. Intermediate Half Marathon
11. Intermediate Marathon
```

## Tahap 4 — Periodization

```text
12. Phase I–IV
13. Mesocycle
14. Recovery week
15. Taper
```

## Tahap 5 — Data Model

```text
16. Structured program_data
17. Export PDF/Excel berdasarkan struktur baru
18. Detail program di My Training Programs
```

## Tahap 6 — Personalization

```text
19. Weather adjustment
20. Fatigue adjustment
21. Race result update
22. VDOT recalculation
```

---

# 26. File Utama yang Akan Diubah

```text
frontend/src/pages/CreateTrainingProgramPage.jsx
frontend/src/pages/MyTrainingProgramsPage.jsx
frontend/src/utils/vcrCalculator.js
frontend/src/utils/vdotCalculator.js       # rencana
frontend/src/utils/danielsPaces.js         # rencana
frontend/src/utils/workoutLibrary.js       # rencana
frontend/src/utils/trainingPeriodization.js # rencana
backend/src/models/TrainingProgram.js
backend/src/controllers/trainingProgramController.js
```

---

# 27. Status Keseluruhan

```text
Analisis referensi: SELESAI
Penerapan prinsip umum: SEBAGIAN SUDAH ADA
Penerapan label E/M/T/I/R pada UI: SEBAGIAN SUDAH ADA
Penerapan Daniels E/M/T/I/R sebagai pace engine: BELUM SELESAI
Penerapan VDOT: BELUM SELESAI
Penerapan Q1/Q2: BELUM SELESAI
Penerapan workout library: BELUM SELESAI
Penerapan Intermediate khusus: SEBAGIAN SUDAH ADA
Penerapan structured program_data: BELUM SELESAI
Penerapan tanggal start/end dan calendar week: SUDAH DITERAPKAN
Penerapan export tanggal PDF/Excel: SUDAH DITERAPKAN
```

## Changelog Terbaru

### 2026-08-10

- VDOT Daniels di-skip sementara sesuai keputusan produk.
- Perbedaan Beginner dan Intermediate diterapkan untuk 5K, 10K, dan Half Marathon.
- Intermediate mendapatkan quality load penuh; Beginner menggunakan sekitar 80% quality load.
- Intermediate dapat menjalankan dua quality sessions (Q1/Q2) dalam fase build.
- Beginner menjalankan Q2 secara bergantian agar recovery lebih longgar.
- Aturan khusus 5K beginner singkat tetap dipertahankan.

- Menambahkan label tipe latihan pada Create Training Program dan My Training Programs:
  - E — Easy
  - M — Marathon Pace
  - T — Threshold
  - I — Interval
  - R — Repetition
  - H — Hard
  - L — Long Run
  - Q — Quality Session
- Label tidak mengubah perhitungan Interval Targets atau pace VCR.
- Menambahkan utilitas `frontend/src/utils/trainingTypes.js`.
- Menambahkan dukungan tanggal aktual pada program dan export PDF/Excel.
- Status Daniels tetap dipisahkan antara label UI dan pace engine; label UI sudah ada, tetapi sistem E/M/T/I/R penuh belum selesai.
- Menambahkan `frontend/src/utils/workoutLibrary.js` berisi tier mileage rendah/menengah/tinggi, library workout per race/level, dan aturan recovery R/I/T/M.
- Generator sekarang menggunakan tier mileage untuk menyesuaikan quality load.
- VDOT tetap di-skip sementara.
- R Training khusus Intermediate tetap di-skip sesuai keputusan produk.
- Menambahkan dokumen pengembangan workout Beginner berdasarkan Q-session Daniels untuk 5K, 10K, Half Marathon, dan Full Marathon.
- Template Beginner sudah dirancang, tetapi belum sepenuhnya dihubungkan ke generator utama.
- Long Run berbasis waktu untuk Beginner General Preparation sudah diterapkan di generator.
- Interval Targets VCR sekarang menampilkan legenda E/M/T/I/R/H/L/Q dan kategori praktis E/T/I/R-H tanpa mengubah perhitungan target.

> Jangan mengklaim implementasi Daniels sudah lengkap sebelum status di atas diperbarui menjadi `SELESAI`.
