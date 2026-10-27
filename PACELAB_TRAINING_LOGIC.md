# PaceLab — Training Program Logic Vault

> Dokumen referensi untuk developer/AI. Sumber utama generator program saat ini adalah `frontend/src/pages/CreateTrainingProgramPage.jsx`.

## 1. Alur Utama

1. User menghitung VCR dari VCR Calculator.
2. Hasil VCR dikirim melalui route state ke `CreateTrainingProgramPage`.
3. User memilih:
   - Nama perlombaan
   - Nomor perlombaan
   - Level pelari
   - Durasi persiapan
   - Bulan mulai dan selesai
   - Hari latihan
4. `generatedProgram` membuat program mingguan berdasarkan `formData`, `vcrData`, dan `showProgram`.
5. Program dapat disimpan ke backend sebagai `program_data`.
6. Program tersimpan ditampilkan di `MyTrainingProgramsPage`.

## 2. Nomor Perlombaan

Nilai `raceEvent` yang digunakan:

```text
5K
10K
Half Marathon
Full Marathon
```

Jarak referensi untuk Shakeout Run:

```js
5K = 5 km
10K = 10 km
Half Marathon = 21.1 km
Full Marathon = 42.195 km
```

## 3. Level Pelari

Level tersedia untuk semua nomor perlombaan:

```text
beginner
intermediate
```

Label UI:

```text
BEGINNER
INTERMEDIATE / ELITE
```

Level memengaruhi:

- Durasi General Preparation.
- Target peak mileage Marathon.
- Pemilihan sesi latihan 5K.
- Intensitas pace untuk 10K, Half Marathon, dan Full Marathon Intermediate.

## 4. Durasi Persiapan

Durasi panduan yang digunakan:

| Race | Persiapan singkat | Persiapan ideal/lama |
|---|---:|---:|
| 5K | 2 bulan | 3 bulan |
| 10K | 2 bulan | 4 bulan |
| Half Marathon | 3 bulan | 5 bulan |
| Full Marathon Beginner | 4 bulan | 6 bulan |
| Full Marathon Intermediate | 4 bulan | 8 bulan |

Rumus normalisasi durasi:

```js
progress = clamp(
  (prepMonths - shortPrepMonths) /
  (longPrepMonths - shortPrepMonths),
  0,
  1
)
```

`progress = 0` berarti menggunakan batas minimum peak mileage.
`progress = 1` berarti diarahkan ke batas maksimum peak mileage.

## 5. Peak Mileage

Peak mileage dicapai pada akhir fase Specific Preparation.

| Race | Beginner | Intermediate |
|---|---:|---:|
| 5K | 16–24 km | 16–24 km |
| 10K | 25–30 km | 25–30 km |
| Half Marathon | 31–50 km | 31–50 km |
| Full Marathon | 50–64 km | 100–110 km |

Rumus:

```js
peakMileage = peakMin + (peakMax - peakMin) * durationProgress
```

Mileage awal General Preparation tidak langsung sama dengan peak:

```js
startMileage = min(baseMileage * 0.6, peakMileage * 0.6)
```

Artinya program dimulai sekitar 60% dari peak mileage dan meningkat bertahap.

## 6. Fase Program

Fase ditentukan berdasarkan minggu:

```js
phase =
  week === competitionWeek ? 4 :
  week > lastSpecificPrepWeek ? 3 :
  week <= foundationWeeks ? 1 :
  2
```

### Phase 1 — General Preparation

Tujuan:

- Membangun aerobic base.
- Meningkatkan kapasitas kerja.
- Membentuk konsistensi latihan.
- Memperkuat otot, tendon, dan jaringan pendukung.

Karakter:

- Mayoritas Easy Run.
- Long Run ringan.
- Strength Training.
- Intensitas rendah sampai sedang.

### Phase 2 — Specific Preparation

Tujuan:

- Mencapai peak mileage.
- Meningkatkan race-specific fitness.
- Memasukkan Tempo Run dan Interval Run.
- Meningkatkan pace secara progresif.

Karakter:

- Volume meningkat.
- Tempo dan interval lebih konsisten.
- Long Run berada sekitar 35–40% mileage mingguan.
- Peak mileage dicapai pada minggu terakhir fase ini.

### Phase 3 — Pre Competition / Tapering

Tujuan:

- Mengurangi kelelahan.
- Mempertahankan stimulus intensitas.
- Menjaga race sharpness.
- Menyiapkan tubuh untuk race day.

Karakter:

- Volume menurun.
- Long Run sekitar 30% mileage mingguan.
- Tempo tetap dipertahankan secara lebih singkat.
- Interval tidak lagi mendapat tambahan overflow mileage.
- Shakeout dan recovery lebih diprioritaskan.

### Phase 4 — Competition

Tujuan:

- Race day.
- Menjaga tubuh tetap segar.
- Mengurangi fatigue.
- Mempertahankan kesiapan neuromuskular.

Karakter:

- Race Day pada minggu terakhir.
- Shakeout Run sesuai aturan race.
- Hari lain Rest atau Strength Training ringan.

## 7. Long Run

Rasio Long Run berdasarkan fase:

```text
General Preparation: 30%
Specific Preparation: 35–40%
Pre Competition: 30%
Competition: 30% atau dibatasi race week
```

Pada minggu terakhir Specific Preparation:

```js
longRunRatio = 0.40
```

Batas maksimal Long Run:

| Race | Maksimum |
|---|---:|
| 5K | 7 km |
| 10K | 9 km |
| Half Marathon | 18 km |
| Full Marathon | 35 km |

Untuk Half Marathon, meskipun 40% dari peak mileage dapat melebihi 18 km, batas 18 km tetap diprioritaskan.

## 8. Easy Run

Batas maksimal Easy Run:

| Race | Maksimum Easy Run |
|---|---:|
| 5K | 4 km |
| 10K | 7 km |
| Half Marathon | 21 km |
| Full Marathon | 42 km |

Easy Run juga dibatasi agar tidak lebih panjang daripada Long Run pada minggu yang sama:

```js
easyDistance = min(
  calculatedEasyDistance,
  easyRunCap,
  longRunMileage
)
```

Jika mileage masih tersisa setelah Easy Run dibatasi, sisa dialihkan ke:

- Interval Run.
- Tempo Run.

Sisa mileage tidak boleh membuat sesi kualitas kurang dari 1 km.

## 9. Program 5K Berdasarkan Level dan Durasi

### Beginner — Persiapan singkat

Persiapan singkat = maksimal 2 bulan.

Minggu awal:

- Easy Run.
- Long Run.
- Tidak ada Interval Run.
- Tempo Run belum diberikan.

Empat minggu terakhir:

- Easy Run.
- Long Run.
- Tempo Run mulai diberikan.
- Tempo minimal 1 km.

Minggu lomba:

- Satu Shakeout Run.
- Hari lain Rest atau Strength Training.

### Beginner — Persiapan ideal/lama

Semua sesi tersedia:

- Easy Run.
- Long Run.
- Tempo Run.
- Interval Run.
- Satu Shakeout Run pada minggu lomba.

### Intermediate / Elite — Persiapan singkat

- Easy Run.
- Long Run.
- Interval Run.
- Tidak ada Tempo Run.
- Satu Shakeout Run pada minggu lomba.

### Intermediate / Elite — Persiapan ideal/lama

- Easy Run.
- Long Run.
- Tempo Run.
- Interval Run.
- Satu Shakeout Run pada minggu lomba.

## 10. Program 10K

Shakeout Run 10K:

```text
70% × 10 km = 7 km total
7 km / 2 hari = 3.5 km per hari
```

Shakeout diberikan pada dua hari sebelum Race Day yang tersedia dalam jadwal latihan.

### Perbedaan Intensitas 10K

| Sesi | Beginner | Intermediate / Elite |
|---|---|---|
| Easy Run | Pace dasar VCR | 5% lebih cepat sesuai implementasi terbaru |
| Long Run | Pace Easy | 3% lebih cepat |
| Tempo Run | T-Pace standar | 5% lebih cepat |
| Interval pendek | T-Pace lebih terkendali | I-Pace, 8% lebih cepat |
| Interval panjang | T-Pace standar | T-Pace progresif lebih cepat |

## 11. Program Half Marathon

Shakeout Run Half Marathon:

```text
70% × 21.1 km = 14.77 km total
14.77 km / 2 hari ≈ 7.4 km per hari
```

Shakeout diberikan pada dua hari terakhir sebelum Race Day yang tersedia dalam jadwal latihan.

Intermediate / Elite menggunakan intensitas lebih tinggi:

```text
Easy Run: 3% lebih cepat
Long Run: 3% lebih cepat
Tempo Run: 5% lebih cepat
Interval pendek: 8% lebih cepat
Interval panjang: T-Pace progresif
```

## 12. Progression Pace

Pace meningkat setiap 2 minggu.

Rumus dasar:

```js
cycles = floor((week - 1) / 2)
adjustedSeconds = baseSeconds * (1 - min(cycles * 0.01, 0.10))
```

Batas peningkatan progresif default adalah 10% dari pace awal.

Untuk Intermediate / Elite pada 10K, Half Marathon, dan Full Marathon, terdapat tambahan intensifikasi berdasarkan sesi.

## 13. Interval Training

Interval dimulai progresif dan tidak langsung 1000m:

```text
400m
600m
800m
1000m
1200m
1600m
2000m
3000m
4000m
```

Progression jarak berganti setiap 2 minggu.

Contoh pola:

```text
400m repeats
600m repeats
800m repeats
1000m repeats
400m + 800m
200m-400m-600m-800m-600m-400m-200m
```

Target interval dihitung dengan kombinasi agar tidak menyisakan jarak:

```text
Target 2.3 km → 400m x6 = 2.4 km
Target 3.8 km → 600m x5 + 400m x2 = 3.8 km
```

Algoritma memilih kombinasi dengan overshoot paling kecil.

Jika terdapat beberapa jenis jarak dalam satu sesi, pace ditampilkan per jenis:

```text
800m x2 @ pace A
1000m x3 @ pace B
```

Interval di bawah 1 km tidak dibuat sebagai sesi utama. Mileage-nya dialihkan ke Tempo Run atau Easy Run sesuai aturan level/fase.

## 14. Format Sesi Interval

```text
Warm-up: Easy jog 5 mins
Dynamic stretching + running drills

Program inti: [kombinasi interval] @ [target pace]
Recovery: [waktu recovery]
Total interval sekitar [jarak] km

Cool-Down: 10 mins easy jog
Static stretching
```

## 15. Rest dan Strength Training

Setiap minggu hanya satu hari Rest yang mendapatkan catatan ST:

```text
Catatan mingguan: lakukan ST (strength training) ringan,
fokus core, glutes, dan stabilitas.
```

Hari Rest lain hanya menampilkan:

```text
Istirahat
```

## 16. Shakeout Run

### 5K

```text
40% × 5 km = 2 km
```

Hanya satu Shakeout Run pada minggu lomba.

### 10K

```text
70% × 10 km / 2 hari = 3.5 km per hari
```

### Half Marathon

```text
70% × 21.1 km / 2 hari ≈ 7.4 km per hari
```

### Full Marathon

Menggunakan perhitungan standar sebelumnya sampai aturan khusus ditetapkan.

## 17. Data VCR

Pace diambil dari `vcrData.intervals`:

```js
getPace("70%") → Easy Pace
getPace("90%") → Tempo Pace
getPace("100%") → Interval Pace
```

Jika interval tidak ditemukan, sistem menggunakan:

```js
vcrData.basePacePerKm
```

## 18. File Penting

```text
frontend/src/pages/CreateTrainingProgramPage.jsx
frontend/src/pages/MyTrainingProgramsPage.jsx
frontend/src/utils/vcrCalculator.js
frontend/src/components/training/ExportModal.jsx
backend/src/models/TrainingProgram.js
backend/src/controllers/trainingProgramController.js
backend/src/routes/trainingProgramRoutes.js
```

## 19. Catatan Perubahan Program Lama

`program_data` disimpan saat user klik Save Program. Perubahan generator tidak mengubah program lama yang sudah tersimpan.

Untuk melihat logika terbaru:

1. Buat program baru.
2. Periksa seluruh minggu.
3. Simpan program baru.
4. Hapus program lama jika sudah tidak digunakan.

## 20. Prinsip Keselamatan

Generator adalah template latihan, bukan pengganti pelatih atau pemeriksaan medis. Program harus disesuaikan dengan:

- Riwayat cedera.
- Usia dan pengalaman atlet.
- Respons tubuh.
- Kualitas tidur dan recovery.
- Kondisi cuaca dan medan.

Jika atlet mengalami nyeri tajam, kelelahan ekstrem, atau gejala tidak normal, sesi harus dikurangi atau dihentikan.
