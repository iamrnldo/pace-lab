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
[~] Label tipe latihan tersedia; pace engine E/M/T/I/R berbasis VDOT belum diterapkan
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
[~] Perbedaan template sudah diterapkan untuk 5K, 10K, Half Marathon, dan Full Marathon; P0 Q1/Q2 spacing sudah aktif
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

## Audit Implementasi — 2026-08-10

### Yang sudah berjalan

- Generator memang memberi `qualityFactor` lebih besar untuk Intermediate (`1`) dibanding Beginner (`0.8`).
- Pada fase build, Intermediate dapat memperoleh dua sesi kualitas (interval dan tempo) bila pilihan hari latihan memungkinkan; Beginner menjalankan Q2 tempo secara bergantian.
- 5K Beginner dengan durasi persiapan singkat membatasi interval dan menunda tempo pada fase awal.
- Tier mileage sudah memengaruhi total quality load secara umum.

### Celah yang belum diterapkan

1. **Profile level belum menjadi konfigurasi eksplisit.** Perbedaan Beginner/Intermediate masih tersebar dalam kondisi inline di `CreateTrainingProgramPage.jsx`; belum ada sumber aturan tunggal untuk jumlah Q, batas durasi, volume T/I/R, dan recovery.
2. **Kompleksitas serta jumlah repetisi belum dibedakan secara konsisten.** Pola interval dipilih terutama dari nomor lomba dan progres minggu. Beginner dan Intermediate dapat menerima pola, panjang repetisi, serta algoritme kombinasi repetisi yang sama.
3. **Recovery belum personal terhadap level.** `RECOVERY_BY_TYPE.I` digunakan sama untuk semua atlet; recovery belum mempertimbangkan Beginner/Intermediate, fase, mileage tier, dan sesi sebelumnya.
4. **Race-specific Intermediate belum tervalidasi per nomor.** 5K/10K/HM/Marathon belum memiliki template Intermediate terpisah yang mengatur prioritas I/R/T/M/L. Full Marathon juga belum memiliki profile workout library khusus.
5. **Aturan ketersediaan hari latihan belum aman sepenuhnya.** Dua Q session hanya layak ketika terdapat jarak recovery memadai; generator belum menurunkan jumlah/jenis Q secara eksplisit saat user memilih hari latihan yang berdekatan atau terlalu sedikit.
6. **Q1 dan Q2 belum menjadi data terstruktur.** Sesi tidak menyimpan identitas `Q1`/`Q2`, tujuan fisiologis, atau alasan pemilihan workout di `program_data`.

### Rekomendasi implementasi bertahap

1. Buat `LEVEL_PROFILES` per race dan level di `frontend/src/utils/workoutLibrary.js`: maksimal Q session, frekuensi Q2, batas volume T/I/R, panjang repetisi, dan recovery dasar.
2. Tambahkan validator jadwal: Intermediate hanya mendapat Q1+Q2 bila ada minimal satu Easy/Rest day di antaranya; jika tidak, turunkan menjadi satu Q session.
3. Buat template race-specific Intermediate: 5K (R/I/T), 10K (I/T), Half Marathon (L/M/T), Full Marathon (L/M/T), lalu hubungkan ke fase latihan.
4. Simpan metadata `qSession`, `paceType`, `warmup`, `mainSet`, `recovery`, dan `cooldown` pada `program_data` agar UI dan export tidak mengandalkan string detail.
5. Tambahkan unit test matriks: race × level × phase × jumlah hari latihan × mileage tier.

### Update implementasi — Perubahan #25

- **P1 diterapkan:** `INTERMEDIATE_RACE_TEMPLATES` kini memberi prioritas sesi khusus per nomor: 5K (rotasi R/I + T), 10K (I + T), Half Marathon (T + M), dan Full Marathon (T + M serta M Pace blocks pada Long Run tertentu).
- **Perubahan #32:** Half Marathon dan Full Marathon Intermediate memperoleh rotasi Interval terkontrol menggunakan 1000–1600 m untuk HM dan 800–1200 m untuk FM.
- **Perubahan #34:** sesuai keputusan produk, T tetap menjadi primary session HM/FM; M dan I berotasi sebagai secondary session (`M → I → M`). Dengan demikian I tidak lagi menjadi sesi primary atau stimulus dominan.
- **P2 diterapkan:** `getRecoveryGuidance()` kini menghasilkan recovery menurut tipe R/I/T/M, level atlet, fase (termasuk taper), dan mileage tier.
- **P0 diterapkan pada Perubahan #31:** Q1/Q2 kini divalidasi dengan minimal satu hari Easy/Rest di antaranya. **P3 tetap di-skip**; `program_data` belum direstrukturisasi penuh.

### Prioritas

```text
P0 — Level profile + validator jarak antar-Q session
P1 — Template Intermediate khusus 5K, 10K, Half Marathon, Marathon
P2 — Recovery berbasis level/fase/mileage
P3 — Structured program_data dan test matrix
```

---

# 4. Struktur Quality Session Q1 dan Q2

## Status

```text
[~] Validator Q1/Q2 diterapkan; Long Run belum diperlakukan sebagai Q session pada validator
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

## Implementasi — Perubahan #31

- `getSafeQualitySchedule()` memilih Q1 dari hari kerja pertama yang dipilih dan hanya mengizinkan Q2 bila jaraknya minimal dua hari kalender.
- Hari di antara Q1 dan Q2 otomatis menjadi Easy Run (bila dipilih sebagai hari latihan) atau Rest (bila tidak dipilih).
- Jika slot aman tidak ada—misalnya user hanya memilih Selasa dan Rabu—Q2 dibatalkan dan volume sesi tersebut dialihkan ke Easy/Recovery; generator tidak lagi memaksakan dua sesi kualitas berurutan.
- Jadwal Q1, Q2, dan alasan keputusan disimpan sebagai metadata minggu `program_data`.

---

# 5. Struktur Fase Daniels

## Status

```text
[~] Empat fase sudah ada pada generator, tetapi definisi, durasi, dan stimulusnya belum selaras penuh dengan Daniels
```

## Audit referensi — 2026-08-11

### Kesimpulan

**Belum sepenuhnya disesuaikan.** Generator memakai nama fase `General Prep → Specific Prep → Pre Competition → Competition`, sedangkan struktur Daniels adalah Phase I–IV dengan isi sesi yang berbeda per nomor lomba dan riwayat latihan atlet. Untuk 5K/10K, referensi utama menjelaskan:

- **Phase I:** bila atlet baru kembali dari jeda, jalankan sekitar 4–6 minggu; bila atlet sudah aktif berlatih untuk event lain, atlet dapat langsung masuk Phase II. Fokusnya E, satu L Run maksimum 25% mileage mingguan, strides, dan resistance training ringan.
- **Phase II:** R training adalah quality work pertama; total R tidak melebihi 5% mileage mingguan.
- **Phase III:** I training menjadi fokus utama; total I per sesi tidak melebihi 8% mileage mingguan atau 10 km, dan maksimal dua sesi I per minggu.
- **Phase IV:** tidak seberat Phase III; T menjadi fokus utama dengan R/I sesekali, serta E days tambahan sebelum/selepas tune-up race.

Referensi: *Daniels' Running Formula* (2021), program 5K/10K, PDF referensi lokal halaman PDF 248–250.

### Perbandingan dengan generator saat ini

| Area | Implementasi saat ini | Kesesuaian |
|---|---|---|
| Masuk General / Phase I | Beginner = sekitar 30% total minggu; Intermediate = sekitar 20%, tanpa melihat riwayat latihan | Belum sesuai; perlu opsi training history dan aturan 4–6 minggu / skip Phase I. |
| Isi General | Easy dan Long Run telah dominan; strength tersedia pada rest day | Sebagian; strides dan hill ringan belum dijadwalkan, dan L Run memakai sekitar 30% mileage pada Phase I, bukan batas Daniels 25%. |
| Specific / Phase II | Quality mulai di Phase II, tetapi dapat langsung berupa I; volume interval dasar sekitar 12% mileage mingguan | Belum sesuai untuk 5K/10K: seharusnya R diperkenalkan terlebih dahulu dengan batas 5%. |
| Pre Competition / Phase III | Selalu dua minggu terakhir sebelum race dengan volume 70% lalu 50% | Belum sesuai: Daniels Phase III adalah fase I-focused, bukan nama untuk taper dua minggu universal. |
| Competition / Phase IV | Hanya minggu lomba terakhir / Race Day | Belum sesuai: Daniels Phase IV adalah blok race-specific dengan penekanan T dan race tune-up, bukan hanya race week. |
| Semua nomor lomba | Proporsi fase memakai rumus yang sama untuk 5K hingga Marathon | Belum sesuai; 5K/10K, HM, dan Marathon memerlukan konfigurasi fase berbeda. |

### Dampak teknis yang perlu dikerjakan

1. Pisahkan **nama fase produk** (General, Specific, Pre-Competition, Competition) dari **Phase I–IV Daniels**, atau ubah mapping agar tidak mengklaim keduanya identik.
2. Tambahkan konfigurasi fase per race dan level, termasuk durasi minimum; jangan memakai persentase global 20%/30% + dua minggu taper untuk semua program.
3. Untuk 5K/10K, terapkan urutan Phase I (E/L/ST) → Phase II (R) → Phase III (I) → Phase IV (T + R/I terbatas) beserta batas 25% L, 5% R, dan 8% I.
4. Buat definisi khusus HM dan Marathon setelah bagian program distance-specific tervalidasi terhadap bab referensi masing-masing.
5. Pertahankan taper sebagai modul terpisah yang ditempatkan mendekati race, bukan sebagai pengganti Phase III Daniels.

### Update implementasi — Perubahan #27

- Penentuan fase kini memakai `trainingPeriodization.js` dengan konfigurasi **per nomor lomba**, bukan lagi rumus global General 20/30% + taper dua minggu.
- Form generator memiliki input **Kondisi Latihan 4–6 Minggu Terakhir**: kembali setelah jeda, rutin Easy Run, atau sedang mengikuti program. Nilai ini menentukan panjang base phase dan disimpan pada setiap minggu `program_data`.
- Taper kini merupakan modul terpisah dengan pengurangan mileage per race: 5K/10K/HM memakai profil 75% → 55%; Full Marathon memakai 80% → 60% → 40%. Minggu race termasuk blok taper terakhir.
- Guardrail volume diterapkan: Long Run Phase I ≤25% mileage mingguan; R ≤5%; I ≤8% atau 10 km; T ≤10% atau 24 km. Guardrail mengontrol volume, sementara VDOT pace engine tetap di-skip.
- Metadata `productPhase` dan `isTaper` disimpan pada setiap minggu dan dipakai pada tampilan serta ekspor. Mapping/label eksplisit Daniels Phase I–IV pada produk tetap di-skip sesuai keputusan saat ini.

### Audit HM dan Marathon — 2026-08-11

- **Half Marathon / 15K–30K:** Bab 15 menyatakan program “alien” tidak berjalan melalui serangkaian training phases, tetapi menyajikan workout yang diulang setiap dua minggu. Karena itu konfigurasi HM menggunakan product phases (Base, Specific, Race-specific, Taper), bukan klaim Phase I–IV Daniels universal.
- **Full Marathon:** Bab 16 menekankan program individual dan menyediakan beberapa pendekatan. Program marathon final memakai blok khusus marathon dan fraction of peak mileage; referensi juga menyarankan menghilangkan strides dalam tiga minggu terakhir. Karena itu Full Marathon memakai base lebih panjang dan taper tiga minggu, terpisah dari label Phase I–IV 5K/10K.
- Referensi: *Daniels' Running Formula* (2021), PDF lokal Bab 15 halaman PDF 283–285 dan Bab 16 halaman PDF 288, 311, 323–324.

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
[~] Template race-specific Intermediate dan P0 Q1/Q2 spacing diterapkan; Long Run belum divalidasi sebagai Q session
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
[~] Template race-specific Intermediate dan P0 Q1/Q2 spacing diterapkan; Long Run belum divalidasi sebagai Q session
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
[~] Template race-specific Intermediate dan P0 Q1/Q2 spacing diterapkan; Long Run belum divalidasi sebagai Q session
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
[~] Template race-specific Intermediate dan P0 Q1/Q2 spacing diterapkan; Long Run belum divalidasi sebagai Q session
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
[~] Long Run berbasis waktu tersedia terbatas untuk Beginner awal dan marathon race week; batas waktu universal belum diterapkan
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
[~] Prescription T per mileage tier diterapkan; validasi pace/VDOT dan test matrix belum diterapkan
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
[~] Recovery kini berbasis tipe, level, fase, dan mileage tier; belum memakai fatigue/sesi sebelumnya
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
[~] Prescription R berbasis tier diterapkan untuk race template; hill repetitions dan test matrix belum diterapkan
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
[~] Prescription M Pace berbasis tier diterapkan untuk HM/FM serta Long Run blocks; validasi pace/VDOT belum diterapkan
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
[~] Modul taper per race dan penurunan volume sudah diterapkan; detail workout taper masih belum lengkap
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

# 15A. Competition Week / Race Week

## Status

```text
[~] Race-week dan kalender post-race recovery diterapkan; readiness otomatis sebelum kembali ke program baru belum diterapkan
```

## Implementasi — Perubahan #28

Competition week tidak lagi hanya menghasilkan `Shakeout Run` sebelum `RACE DAY`. Generator kini memakai jarak hari menuju race (`Race − 6` sampai `Race − 1`) dan hanya menempatkan sesi bila hari tersebut termasuk hari latihan atlet.

- **5K / 10K:** `Race − 5` menjalankan tune-up T ringan (2 × 5 menit); `Race − 3` dan `Race − 2` adalah Easy + strides; `Race − 1` adalah shakeout opsional. Ini mengikuti prinsip Daniels Phase IV: T sebagai fokus dan 2–3 E day menjelang race.
- **Half Marathon:** mengikuti prerace week Bab 15: `Race − 6` = 2/3 Long Run normal, `Race − 3` = 3 × 1 km T dengan recovery 2 menit, dan hari lain adalah E day atau shakeout/rest.
- **Full Marathon:** memakai race-week konservatif dari program marathon Daniels: Long Run Easy pendek pada `Race − 6`, T 20 menit pada `Race − 4`, lalu E day datar/pendek dan shakeout/rest menjelang lomba.
- `RACE DAY` kini selalu dibuat pada tanggal akhir program, walaupun tanggal tersebut tidak termasuk pilihan hari latihan user.

Referensi: *Daniels' Running Formula* (2021), PDF lokal 5K/10K Phase IV halaman PDF 250; 15K–30K prerace week halaman PDF 285–286; marathon final week halaman PDF 340.

---

# 16. Recovery Week

## Status

```text
[~] Recovery week menyesuaikan race, level, tier, dan mesocycle; fatigue/riwayat cedera belum dipakai
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
[~] Guard minimum Easy/quality dan struktur warm-up/cool-down diterapkan; validasi durasi penuh berbasis pace/Long Run belum diterapkan
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
[~] Library race-specific dan aturan progression mesocycle diterapkan; variasi Daniels lengkap dan validasi VDOT belum diterapkan
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
[~] Tier kini mengatur volume T/R/M, quality load, jumlah Q yang direkomendasikan, dan recovery; tier elite belum diterapkan
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
[~] Recommendation engine memilih primary/secondary workout dari race, level, tier, fase, dan minggu; P0 Q1/Q2 spacing aktif, tetapi fatigue/cuaca dan Long Run Q-spacing belum diterapkan
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
[~] Mesocycle eksplisit diterapkan untuk 5K, 10K, HM, dan Full Marathon; readiness/fatigue-driven progression belum diterapkan
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
[~] Structured session data dan test matrix konfigurasi diterapkan; automated test runner penuh belum diintegrasikan
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

# 28. Audit Backlog Implementasi — 2026-08-11

## Belum diterapkan / perlu dilengkapi

### Prioritas produk yang memang di-skip

1. **VDOT dan pace engine penuh** — konversi race/VCR ke VDOT serta E/M/T/I/R pace validasi belum diaktifkan (Section 2).
2. **P0 Q-spacing** — validator yang menjamin Easy/Rest di antara Q1 dan Q2 belum ada (Section 4).
3. **P3 structured `program_data` dan test matrix** — sesi masih terutama menyimpan detail sebagai string (Section 24).
4. **Mapping label eksplisit Daniels Phase I–IV pada produk** — tetap di-skip sesuai keputusan produk.

### Gap implementasi berikutnya

1. **Long Run universal berbasis waktu** — belum ada batas durasi lintas race/level; saat ini hanya ada kasus terbatas (Section 10).
2. **Threshold per mileage tier** — batas volume T sudah ada, namun belum ada resep 20 menit / cruise interval berdasarkan tier (Section 11).
3. **Recovery Week dan post-race recovery** — pola 3:1 masih generik; belum menyesuaikan fatigue, durasi persiapan, peak mileage, atau aturan E day pasca-race (Section 16 dan 15A).
4. **Kondisi eksternal/fatigue** — belum ada penyesuaian cuaca, kelembapan, elevasi, kualitas tidur, atau fatigue (Section 17).
5. **Validasi durasi minimum** — belum ada guard untuk memastikan seluruh quality session selalu memiliki warm-up/cool-down dan Easy/L Run minimum yang realistis (Section 18).
6. **Race-specific library lengkap** — template sudah ada, tetapi variasi workout, tune-up race, dan progression per fase belum lengkap untuk semua race (Sections 6–9 dan 19).
7. **Mesocycle eksplisit** — Base → Threshold → Interval → Race-specific → Taper belum dicatat sebagai entitas program yang terpisah (Section 23).
8. **Pace update berkelanjutan** — belum ada pembaruan dari race result, time trial, VCR baru, atau performa latihan (Section 22).

### Update implementasi — Perubahan #30

- **Section 11:** `getThresholdPrescription()` menerapkan 20 menit kontinu (low), 2 × 12 menit (medium), 3 × 12 menit (high), serta versi pendek untuk taper.
- **Section 13:** `getRepetitionPrescription()` memilih 200/300/400 m dan batas repetisi menurut mileage tier; guardrail R ≤5% tetap berlaku.
- **Section 14:** `getMarathonPacePrescription()` memilih blok M Pace untuk HM/FM menurut tier; atlet endurance high-mileage dan Intermediate dapat menerima secondary M session serta M blocks di Long Run tertentu.
- **Sections 20–21:** `getWorkoutRecommendation()` menjadi sumber pemilihan primary/secondary workout, volume T/R/M, dan jumlah Q yang direkomendasikan berdasarkan race, level, tier, fase, dan minggu.
- **Section 10 tetap di-skip** sesuai keputusan produk.

### Update implementasi — Perubahan #36

- **Recovery Week:** profil recovery kini mengurangi mileage dan quality volume menurut race, level, serta mileage tier; catatan recovery tampil pada minggu recovery.
- **Post-race recovery:** Race Day sekarang memuat protokol setelah race (5K 2 hari, 10K 3 hari, HM 7 hari Easy/recovery, FM 10–14 hari bertahap). Karena tanggal akhir program adalah Race Day, hari recovery belum dibuat sebagai minggu baru.
- **Durasi minimum:** Easy/Shakeout numerik tidak dapat kurang dari 2 km; setiap T/I/R/M yang lolos generator dipastikan memiliki warm-up dan cool-down pada detail sesi.
- **Race-specific library & mesocycle:** setiap minggu kini menyimpan label mesocycle dan objective; UI menampilkannya di header minggu. Library tetap memilih stimulus khusus race melalui recommendation engine.

### Rekomendasi urutan setelah keputusan skip dicabut

```text
1. Long Run time cap + Threshold tier prescription
2. Recovery Week / post-race recovery + duration validation
3. Race-specific workout library dan mesocycle
4. External/fatigue adjustment
5. VDOT pace engine, Q-spacing, structured data, dan test matrix
```

---

## Changelog Terbaru

### 2026-08-11

- **Perubahan #26 — Audit Section 5:** memverifikasi penentuan General, Specific, Pre-Competition, dan Competition terhadap *Daniels' Running Formula* (2021) PDF 5K/10K. Hasilnya: implementasi empat fase saat ini belum sepenuhnya selaras; khususnya mapping Phase II–IV, batas Long Run/R/I, durasi Phase I, dan pemisahan taper dari Phase III. Tidak ada perilaku generator yang diubah pada perubahan ini.
- **Perubahan #27 — Periodization per race, taper, guardrail, dan training background:** menerapkan konfigurasi fase 5K/10K/HM/FM, input kondisi latihan awal, modul taper terpisah, metadata fase pada export, serta batas volume L/R/I/T. Audit Bab 15 dan 16 juga ditambahkan; pemisahan/mapping label Daniels Phase I–IV (rekomendasi #1), P0 validator jarak Q session, dan P3 structured `program_data`/test matrix tetap di-skip.
- **Perubahan #28 — Competition week per race:** mengganti race week yang sebelumnya hampir hanya Shakeout Run menjadi template 5K/10K, Half Marathon, dan Full Marathon berbasis hari menuju race. Race Day kini tetap muncul walaupun tanggal race bukan hari latihan yang dipilih.
- **Perubahan #29 — Audit backlog:** memperbarui status vault yang sudah stale, memulihkan heading Section 16, dan menambahkan daftar gap implementasi serta prioritas lanjutan. Tidak ada perilaku generator yang diubah.
- **Perubahan #30 — Threshold/R/M/tier recommendation engine:** menerapkan prescription Threshold, Repetition, dan Marathon Pace berdasarkan mileage tier; menghubungkan rekomendasi workout otomatis ke race, level, tier, fase, dan minggu. Long Run universal berbasis waktu (Section 10) tetap di-skip.
- **Perubahan #31 — P0 Q1/Q2 validator:** menerapkan pemeriksaan minimal satu hari Easy/Rest di antara dua quality session. Jika slot aman tidak tersedia, Q2 dan volumenya dialihkan ke Easy/Recovery; metadata keputusan jadwal disimpan pada minggu program.
- **Perubahan #32 — Variasi Interval Intermediate:** menambahkan rotasi Interval Run terkontrol ke template Specific Preparation Half Marathon dan Full Marathon Intermediate. I tidak dijadikan stimulus dominan; guardrail I tetap maksimum 8% mileage mingguan atau 10 km.
- **Perubahan #33 — Integrasi interval template:** generator kini benar-benar memakai jarak repetisi dari template Intermediate saat membuat Interval Run: HM 1000/1200/1600 m dan Full Marathon 800/1000/1200 m. Ini memperbaiki generator lama yang masih dapat menghasilkan pola interval generik meskipun template telah dipilih.
- **Perubahan #34 — Interval sebagai secondary HM/FM:** mengubah rotasi HM/FM Intermediate menjadi primary T dengan secondary `M → I → M`. Generator kini dapat merender I session pada slot Q2 dengan guardrail I, sementara M Pace tetap tersedia pada rotasi lain.
- **Perubahan #35 — Audit backlog terbaru:** menyelaraskan status vault setelah P0 diterapkan. Q1/Q2 spacing tidak lagi ditandai di-skip; gap yang tersisa adalah validasi Long Run sebagai Q session, fatigue/cuaca, dan backlog lain yang tercatat pada Section 28.
- **Perubahan #36 — Recovery, duration guard, race library, dan mesocycle:** menerapkan recovery-week profile, panduan post-race pada Race Day, guard warm-up/cool-down serta minimum Easy/Shakeout, dan metadata/UI mesocycle. Long Run time-based universal, fatigue/cuaca, dan VDOT tetap di-skip; structured data diterapkan pada Perubahan #37.
- **Perubahan #37 — Post-race calendar, mesocycle progression, dan structured data:** menambahkan hari kalender post-race setelah Race Day, rule mesocycle yang mengatur volume quality/Long Run/Q-session, `structuredSession` pada tiap hari program, serta konfigurasi test matrix race × level × tier × fase × hari latihan. Long Run time-based universal, fatigue/cuaca, dan VDOT tetap di-skip.
- **Perubahan #38 — HM mesocycle sequence:** mengubah Half Marathon menjadi urutan eksplisit Base & Durability (Minggu 1–4, Minggu 4 Recovery) → Threshold Development (Minggu 5–7) → HM Race-Specific → Sharpening → Taper/Competition. Recovery kini menjadi sub-week Base, tidak lagi diberi label Quality Development.
- **Perubahan #39 — Mesocycle khusus 5K/10K/FM:** menambahkan urutan eksplisit Base (Minggu 1–4, Minggu 4 Recovery) → development → race-specific → sharpening → taper/competition. 5K berfokus R/T lalu I/R/T, 10K T/I lalu I/T, dan Full Marathon endurance/M Pace lalu marathon-specific.
- **Perubahan #40 — Structured background fast track:** bila user memilih `Sedang mengikuti program`, Base mesocycle tidak dipaksakan pada minggu pertama. 5K/10K langsung masuk race-specific I/R/T atau I/T; HM langsung T primary dengan M/I secondary bergantian; FM langsung marathon race-specific. Recovery 3:1 tetap berlaku sebagai deload setelah tiga minggu build.
- **Perubahan #41 — Beginner vs Intermediate program lanjutan 10K/HM/FM:** background `Sedang mengikuti program` kini membedakan level. Intermediate langsung memakai race-specific load dan dua Q bila tier/jadwal aman. Beginner masuk Threshold/Endurance re-entry dengan satu Q; HM/FM Beginner tidak menerima I rutin, dan M Pace hanya dapat muncul pada tier tinggi setelah blok awal. Prinsip ini mengikuti penekanan Daniels pada fondasi E/L/T sebelum I dominan untuk pelari endurance/novice.
- **Perubahan #42 — Konsistensi jarak Threshold:** memperbaiki mismatch antara jarak kolom dan prescription berbasis waktu. Jarak T kini dihitung dari durasi × pace (contoh 2 × 12 menit @ 5:33/km = 4.32 km main set). Weekly mileage otomatis dinaikkan minimal agar volume T tidak melebihi guardrail 10%.
- **Perubahan #43 — Konsistensi jarak seluruh quality workout:** menerapkan perhitungan main set nyata untuk Interval, Repetition, dan Marathon Pace, bukan hanya Threshold. Jarak kolom dan weekly mileage kini disesuaikan dari repetisi × jarak rep (I/R), blok M Pace, atau durasi × pace (T); guardrail I/R/T tetap menaikkan minimum weekly mileage bila diperlukan.
- **Perubahan #44 — Recovery mileage smoothing:** menghapus pemotongan recovery yang sebelumnya terkompound dengan multiplier siklus 0.90. Recovery kini memakai 85–90% planned mileage menurut level/race, quality 75–80%, dan memiliki floor 80% dari actual mileage minggu sebelumnya agar drop tidak terlalu drastis.
- **Perubahan #45 — Mileage progression guardrail:** weekly mileage kini menjadi sumber kebenaran; quality prescription diskalakan ke budget minggu berjalan dan tidak lagi menaikkan weekly mileage secara paksa. Build dibatasi kenaikan maksimal 10% dari actual minggu sebelumnya; T/I/R/M diturunkan/dipecah bila melebihi budget 10%/8%/5%/alokasi M.
- **Perubahan #46 — Rolling mileage baseline:** high mileage kini harus diperoleh dari riwayat tiga minggu terakhir, bukan peak target atau satu workout. Build memakai ceiling dari minggu sebelumnya (+10%) dan rolling baseline (+5%); recovery ditahan pada pengurangan 10–20% dari minggu build sebelumnya.
- **Perubahan #47 — Meaningful quality floor structured Intermediate:** untuk 10K/HM/FM dengan background `Sedang mengikuti program` dan level Intermediate, peak/start mileage memiliki floor 30/35/50 km agar kualitas tidak berupa fragmen <2 km. T/I/R/M tetap diskalakan ke budget yang sudah dibangun dari minggu awal hingga race, bukan menaikkan mileage mendadak.
- **Perubahan #48 — Meaningful quality floor Beginner vs Intermediate:** memperluas floor mileage untuk Beginner yang `Sedang mengikuti program` pada 10K/HM/FM menjadi 25/30/45 km, dengan main set minimal 2 km. Intermediate tetap dibedakan dengan floor 30/35/50 km serta main set minimum 2.5 km (10K) atau 3 km (HM/FM), dua Q bila aman, dan I/M yang lebih kompleks.
- **Perubahan #49 — Daniels percentage quality calculation:** T/I/R/M kini memakai budget dari weekly mileage dan jenis stimulus: T 10%, I 8% (maks. 10 km), R 5%, M 10% allocation. Detail dan jarak main set disinkronkan—contoh 62.9 km dengan T pace 5:33 menghasilkan sekitar 35 menit / 6.3 km T, bukan 3.6 km. Tier tetap menentukan kompleksitas/jumlah Q, bukan memangkas persentase stimulus terpilih.
- **Perubahan #50 — Simple Daniels-informed mileage model:** sesuai keputusan produk, memakai model global sederhana dengan rolling 3-week baseline. Build dibatasi sekitar +5% terhadap minggu sebelumnya dan baseline (bukan +10% setiap minggu); recovery tetap 10–20% di bawah minggu build. Ini menghindari lonjakan sambil mempertahankan prinsip Daniels bahwa mileage tidak dinaikkan agresif setiap minggu.
- **Perubahan #51 — Race-specific mileage stability:** mengganti aturan global dengan hybrid sederhana per race: build maksimum 5% (5K/10K), 4% (HM), 3% (FM); recovery hanya 8% (10K), 7% (HM), 5% (FM) di bawah minggu sebelumnya sambil quality load tetap diturunkan. Di luar recovery/taper, mileage tidak boleh turun tanpa alasan.
- **Perubahan #52 — HM/FM build rate:** sesuai keputusan produk, build rate Half Marathon dinaikkan menjadi maksimum +5% dan Full Marathon menjadi maksimum +4% per minggu; recovery rate tetap tidak berubah.
- **Perubahan #53 — Actual session mileage accounting:** header mingguan kini dihitung dari jarak sesi yang benar-benar tampil di tabel (Easy/L/T/I/R/M dan jarak race), bukan hanya target phase/taper multiplier. Target phase tetap disimpan dan ditampilkan terpisah; rolling progression minggu berikutnya memakai actual listed mileage.
- **Perubahan #54 — Dual mileage display:** menerapkan pilihan produk `Tampilkan keduanya`. Setiap quality session kini menghitung dan menampilkan total sesi (warm-up, main set, recovery jog, cool-down) serta main-set volume terpisah. Header mingguan memakai total running mileage dan menampilkan T/I/R/M main volume; target phase tetap terpisah.
- **Perubahan #55 — Main-set mileage policy:** sesuai keputusan produk, weekly mileage kini hanya menghitung main set untuk T/I/R/M. Warm-up, recovery jog, dan cool-down tetap ditampilkan sebagai total fisik sesi di detail, tetapi tidak masuk header mileage maupun rolling progression.
- **Perubahan #56 — Core vs estimated session labels:** kolom jarak untuk sesi kualitas diberi makna `Jarak Inti` pada target pace. Total warm-up/recovery/cool-down diberi label `Estimasi total fisik sesi` karena merupakan perhitungan kasar dan tidak masuk weekly mileage.
- **Perubahan #57 — Tempo/Interval load policy:** sesuai keputusan produk, Tempo memakai 10% (Beginner/low tier), 12.5% (Intermediate medium), atau 15% (Intermediate high) dari weekly mileage; Interval memakai 10%. Long Run tidak diubah sambil menunggu audit referensi Daniels khusus.
- **Perubahan #58 — Global Tempo/Interval scope:** mengonfirmasi penerapan policy T/I untuk seluruh nomor lomba, level, dan kondisi latihan 4–6 minggu terakhir. Persentase diterapkan saat sesi T/I memang diizinkan oleh fase, mesocycle, dan aturan keamanan; Base/Recovery/Taper tetap dapat menurunkan atau meniadakan sesi kualitas.
- **Perubahan #59 — Beginner HM/FM interval progression:** Beginner HM/FM kini mendapat Interval Run terkontrol secara rutin selang-seling setelah mencapai pertengahan Specific Preparation. HM memakai 800–1000 m dan FM 600–800 m; satu I session menggantikan Tempo pada minggu itu, tanpa menambah Q2, dengan volume I 10% weekly mileage.
- **Perubahan #60 — HM/FM peak Long Run ranges:** menerapkan target peak Long Run HM Beginner 16–18 km, HM Intermediate 18–20 km, FM Beginner 28–32 km, dan FM Intermediate 32–35 km. Target bergerak dalam rentang sesuai durasi persiapan dan hanya dapat dicapai bila tidak melampaui 50% weekly mileage pada peak week.
- **Perubahan #61 — Quality overflow fix:** menghapus redistribusi sisa mileage ke Tempo/Interval/M-Pace yang dapat membuat T volume melampaui persentase (contoh 16.1 km). Pre-Competition kini memakai persentase Tempo yang benar; selisih target tetap terpisah sebagai Target phase, bukan ditambahkan ke quality session.
- **Perubahan #62 — Actual mileage quality basis:** budget T/I/R/M sekarang memakai actual programmed mileage minggu sebelumnya, bukan Target phase. Dengan contoh actual 69 km dan Tempo 15%, main T dibatasi sekitar 10.35 km; target phase 83 km tidak lagi memperbesar quality session.
- **Perubahan #63 — HM/FM mileage & Long Run reference update:** memperbarui HM Beginner peak 24–40 km / L 16–19 km, HM Intermediate 40–60 km / L 19–22 km, FM Beginner peak 40–64 km / L 28–32 km, dan FM Intermediate peak 64–88 km / L 32–36 km. HM/FM taper kini dua minggu 70%→50%; build rate saat ini tetap lebih konservatif dari batas maksimum +10% referensi.
- **Perubahan #64 — Fixed HM mileage progression:** HM Beginner sekarang menggunakan baseline 24 km/minggu dan target peak 40 km/minggu; HM Intermediate baseline 40 km/minggu dan peak 60 km/minggu. Kondisi latihan 4–6 minggu terakhir tetap mengatur panjang Base/Specific serta quality load, bukan mengubah rentang mileage HM yang ditetapkan.
- **Perubahan #65 — Duration-adaptive HM Intermediate:** HM Intermediate kini memiliki baseline 30–40 km/minggu dan peak 40–60 km/minggu menurut durasi persiapan 3–5 bulan. Persiapan pendek menghasilkan 30→40 km, persiapan panjang 40→60 km; nilai di antaranya diinterpolasi bertahap.
- **Perubahan #66 — Final HM/FM peak & background model:** HM Beginner peak 32–48 km, HM Intermediate 40–60 km, FM Beginner 50–64 km, FM Intermediate 64–88 km. Durasi memilih nilai dalam rentang peak; kondisi latihan menentukan baseline sebagai 60% (returning), 70% (consistent), atau 80% (structured) dari peak. Long Run peak tetap mengikuti range per level yang diset sebelumnya.
- **Perubahan #67 — Generator runtime fix:** memperbaiki referensi variabel `structuredRaceRunner` yang sudah tidak digunakan setelah pembaruan model HM/FM. Validasi minimum quality distance kini memakai kondisi `isStructuredEnduranceOrTenK`, sehingga halaman Create Training Program kembali dapat dirender.
- **Perubahan #68 — Generator overflow runtime fix:** memperbaiki referensi `easyRunCap` di luar scope pada perhitungan overflow mileage, yang menyebabkan blue screen ketika membuat program. Perhitungan kini memakai cap Easy Run berdasarkan race event secara langsung.
- **Perubahan #69 — Universal Tempo progression:** Tempo kini selalu naik dari 10% pada awal Specific Preparation menuju 15% pada akhir Specific Preparation untuk semua race, level, dan kondisi latihan 4–6 minggu terakhir. Tier tidak lagi mengubah persentase T; taper tetap mengurangi total melalui mesocycle multiplier.
- **Perubahan #70 — 5K/10K peak & Long Run reference:** menerapkan 5K Beginner 16–25 km / L 5–7 km, 5K Intermediate 24–35 km / L 8–10 km, 10K Beginner 25–35 km / L 9–11 km, dan 10K Intermediate 30–40 km / L 12–15 km. Durasi memilih peak dalam range dan background 4–6 minggu menentukan baseline 60/70/80% peak untuk semua race.
- **Perubahan #71 — Tempo block consistency:** pemecahan Tempo kini dihitung dari Jarak Inti ÷ T-Pace. Pada Pre-Competition/Taper, volume T dibagi menjadi dua blok yang durasinya konsisten dengan jarak inti; label lama `2 × 5 menit` tidak lagi dipakai bila tidak sesuai dengan volume T yang dihitung.
- **Perubahan #72 — Long Run hierarchy:** memperbaiki Easy Run yang dapat menyamai Long Run. Easy Run kini maksimal 80% dari jarak Long Run (minimum 2 km), sehingga Long Run selalu menjadi lari terpanjang dalam minggu tersebut.
- **Perubahan #73 — Easy overflow redistribution:** jika Easy Run akan menyamai/melebihi batas Long Run, kelebihan jarak dialihkan ke Tempo terlebih dahulu, lalu Interval bila ada; bila tidak ada sesi kualitas, kelebihan ditambahkan ke Long Run. Easy tetap maksimal 80% Long Run sehingga L selalu terpanjang.
- **Perubahan #75 — Fixed weekly allocation policy:** Long Run kini dialokasikan 30% weekly mileage; Tempo 10→15%, Interval 10%, dan M Pace 10% bila dijadwalkan. Easy Run menerima sisa mileage dengan batas < Long Run. Overflow Easy tidak lagi dipindahkan ke quality session; blok M Pace dipecah ulang agar jumlah detail selalu sama dengan Jarak Inti.
- **Perubahan #76 — Phase-based speed workout distances:** menerapkan tabel speed workout untuk Beginner dan Intermediate. 5K/10K memakai GP 200/400, SP 400–1000, PC 600–1600, MC 400; HM memakai GP 1000–1600, SP sampai 2000, PC sampai 2400, MC 1000; FM memakai GP 1000–2000, SP sampai 2400, PC sampai 3200, MC 1000.
- **Perubahan #77 — Tempo/Interval minimum progression:** Tempo dan Interval yang dijadwalkan kini mulai dari minimal 10% weekly mileage pada awal Specific Preparation dan meningkat hingga 15% pada akhir Specific/Pre-Competition. Mesocycle tidak lagi memangkas persentase inti T/I di bawah 10%; Recovery tetap meniadakan atau mengurangi frekuensi quality session.
- **Perubahan #78 — Audit rumus generator:** menambahkan `PACELAB_TRAINING_CALCULATION_AUDIT.md`, berisi seluruh alur rumus peak/baseline, progression, alokasi T/I/R/M/L/E, sumber actual mileage, serta konflik yang masih membutuhkan keputusan produk.
- **Perubahan #79 — Klarifikasi audit Point 3–5:** memperluas audit dengan definisi weekly allocation object, contoh pemecahan detail Tempo/I/R/M dari alokasi, dan test matrix beserta invariant yang wajib lulus.
- **Perubahan #80 — Single source of truth:** menambahkan `weeklyAllocation` sebagai objek resmi per minggu berisi target, Long Run, Easy, primary/secondary quality, phase, dan mesocycle. Generator hari, `structuredSession`, actual mileage, serta quality volumes kini menyimpan referensi alokasi yang sama.
- **Perubahan #81 — Detail workout dari allocation object:** Tempo, Interval, Repetition, dan M-Pace kini membentuk blok/detail dari `weeklyAllocation.primary/secondary`, sehingga jumlah blok/repetisi menggunakan Jarak Inti yang sama dengan alokasi dan header quality volume.
- **Perubahan #82 — Automated test matrix:** menambahkan `npm test` berbasis Node test runner dengan matrix race × level × background, validasi konservasi weekly allocation, konsistensi detail workout terhadap Jarak Inti, dan kelengkapan tabel speed workout.
- **Perubahan #83 — Long Run progression guard:** Long Run kini dibatasi kenaikan maksimal 10% dari Long Run minggu sebelumnya. Peak Long Run adalah target/cap akhir, bukan override yang boleh menyebabkan lonjakan satu minggu.
- **Perubahan #84 — Beginner Q2 after recovery:** Beginner pada pertengahan Specific Preparation kini dapat menerima Q2 bila terdapat minimal dua hari Easy/Rest setelah Q1. Untuk 5K/10K Q2 berupa Interval terkontrol; HM/FM memakai M Pace pada minggu Tempo dan tetap satu Q pada minggu Interval. Easy/Rest spacing Beginner dipilih lebih longgar daripada Intermediate.
- **Perubahan #85 — Long Run trajectory planner:** mengganti peak-week override dengan trajectory linear dari Long Run awal menuju target peak sepanjang build weeks. Setiap build week tetap dibatasi +10%; Recovery menahan Long Run agar tidak drop/jump, sehingga semua race, level, dan background membangun Long Run bertahap.
- **Perubahan #86 — VPS updater:** menambahkan `updater-pacelab.sh` untuk menjalankan `git pull`, install backend/frontend, API health check, frontend test, build, PM2 restart, dan login HTTP check dalam satu command.
- **Perubahan #87 — VPS startup wait:** updater kini menunggu API dan frontend hingga 30 detik setelah PM2 restart. Jika gagal, script menampilkan 50 baris PM2 log terakhir agar penyebab deploy dapat langsung ditelusuri.
- **Perubahan #88 — Terminologi level pelari:** label tombol level pelari diperbarui oleh pemilik produk dari `INTERMEDIATE / ELITE` menjadi `INTERMEDIATE`. Tidak ada perubahan pada logika, volume, atau template latihan; istilah level produk sekarang hanya Beginner dan Intermediate.
- **Perubahan #89 — Login tanpa tab:** menghapus tab `USER` dan `ADMIN` pada halaman login. Google login tetap berada di atas, diikuti divider dan form email/password admin di bawahnya.
- **Perubahan #90 — Login form label:** mengganti label divider form dari `ADMIN ACCESS` menjadi `SIGN IN FORM`.
- **Perubahan #91 — Login input copy:** mengubah label menjadi `EMAIL :` dan `PASSWORD :`, placeholder menjadi `Enter Your Email here` serta `Enter Your Password here`, dan tombol dari `ADMIN SIGN IN` menjadi `SIGN IN`.
- **Perubahan #92 — Login order:** memindahkan form Sign In ke bagian atas dan tombol Google ke bawah form. Divider kedua sekarang memakai label `OR CONTINUE WITH GOOGLE`.
- **Perubahan #93 — Intermediate button copy:** menerapkan label tombol Level Pelari di Create Training Program sebagai `INTERMEDIATE`; teks `/ ELITE` telah dihapus dari source workspace.
- **Perubahan #94 — Profile form copy:** memperbarui label dan placeholder Profile Page untuk nama, usia, berat, tinggi, komunitas, dan alamat komunitas; opsi gender `Other` dihapus dan default diubah menjadi `Select Your Gender`.
- **Perubahan #95 — Recovery week distance/time caps:** menambahkan batas durasi Easy Run dan Long Run khusus Recovery Week untuk seluruh race, level, dan background. Quality session tetap ditiadakan/dikurangi; Long Run recovery maksimal 75% Long Run sebelumnya dan dibatasi durasi race-specific.
- **Perubahan #96 — Audit rumus aktif:** memperbarui `PACELAB_TRAINING_CALCULATION_AUDIT.md` dengan snapshot rumus aktif untuk peak/baseline, Long Run trajectory, weekly progression, T/I/R/M/E allocation, dan recovery cap.
- **Perubahan #97 — Post-race 1200 km unit fix:** memperbaiki konversi recovery berbasis menit dengan label `Easy effort`. Sistem kini fallback ke Easy Pace mingguan, sehingga 20 menit dikonversi menjadi beberapa kilometer, bukan 1200 km. Test regresi ditambahkan.
- **Perubahan #98 — Template Color Engine (CSS variables):** palette `retro-*` Tailwind dipindah dari hex statis ke CSS variables `--retro-*` dalam format triplet RGB, sehingga `bg-retro-black`, `text-retro-green`, border, shadow, grid, scrollbar, kartu, tombol, input, modal, dan toast dapat berubah runtime tanpa rebuild. Tema default dipertahankan 100% identik dengan desain lama; variabel ditulis ke `<html>` (zona MAIN) dan di-override per zona lewat inline style pada wrapper HEADER (header + strip marquee), wrapper MAIN (latar halaman, kartu, konten, admin), dan elemen FOOTER. File baru: `frontend/src/utils/themeUtils.js` dan `frontend/src/context/ThemeContext.jsx`; `frontend/src/context/ThemeContext.jsx` sebelumnya file kosong.
- **Perubahan #99 — Modal pengaturan warna template (Header/Main/Footer):** tombol `⚙ TEMPLATE COLORS` ditambahkan di strip atas header tepat di sebelah jam berjalan (desktop), plus entri `TEMPLATE COLORS` pada menu mobile. Modal berisi tiga zona terpisah — HEADER (top bar, navigasi, strip marquee), MAIN AREA (latar halaman, kartu, konten), FOOTER (blok footer) — dan tiap zona dapat diatur warna BACKGROUND, ACCENT, dan TEXT via color picker maupun input hex manual. Tersedia preview mini tiap zona, 7 preset palet (Pocari Blue, Carbon, Terminal Amber, Retro Green, Crimson, Sunset, Monochrome), badge kontras WCAG (OK / KONTRAS RENDAH / TEKS SULIT DIBACA), reset per zona dan reset seluruh tema, serta penyimpanan otomatis ke localStorage (`pacelab_theme`). Perubahan warna langsung terlihat (live) pada aplikasi dan modal, dan toast export ikut menyesuaikan. File baru: `frontend/src/components/layout/ThemeSettingsModal.jsx`; `Modal.jsx` kini menerima prop `subtitle` dan `closeLabel`.
- **Perubahan #100 — Test & verifikasi tema:** menambahkan `frontend/src/__tests__/themeUtils.test.js` (9 test: normalisasi hex, jaminan tema default identik desain lama, variabel RGB valid, isolasi antar zona, sanitize/persistensi localStorage untuk data rusak, penolakan hex invalid, validasi preset, kontras WCAG, penulisan variabel MAIN ke root). Script `npm test` sekarang menjalankan `trainingAllocation.test.js` dan `themeUtils.test.js` (14 test, semua lulus) dan `npm run build` sukses. Smoke test runtime berbasis jsdom (20 check: render header, buka modal, 9 color picker, penerapan variabel per zona, isolate zona, preset, localStorage, reset) dijalankan sekali sebagai verifikasi dan tidak diikutsertakan ke repo. Catatan: dua file test lama `src/__tests__/utils/paceCalculator.test.js` dan `racePredictor.test.js` mengimpor `vitest` yang tidak terpasang (masalah lama), sehingga tidak dimasukkan ke dalam `npm test` agar pipeline updater VPS tetap hijau. Folder `.preview/` (hasil build untuk live preview) ditambahkan ke `.gitignore`.
- **Perubahan #101 — Fix blank screen ThemeProvider (bug deploy):** memperbaiki root aplikasi `frontend/src/main.jsx` yang sebelumnya belum benar-benar membungkus `<App />` dengan `<ThemeProvider>` (import sudah ada, tetapi blok JSX-nya gagal ter-patch), sehingga runtime melempar `useTheme harus dipakai di dalam ThemeProvider` dan halaman menjadi blank. `useTheme()` kini tidak lagi throw: bila provider tidak ditemukan, komponen memakai `createFallbackThemeValue()` (palette default) dan variabel root tetap ditulis ke `<html>` agar scrollbar, selection, overlay modal, dan toast konsisten, disertai satu `console.warn` sebagai peringatan developer. Ditambahkan pula test penjaga `frontend/src/__tests__/themeProviderMount.test.js` (4 test) yang memverifikasi rantai render main.jsx → ThemeProvider → App → MainLayout → Header/Footer, melarang `throw` di `useTheme`, dan menguji keamanan fallback. Total `npm test` = 18 test lulus; smoke test runtime 11 check lulus (termasuk skenario MainLayout tanpa ThemeProvider yang tadinya crash). `npm run build` sukses.
- **Perubahan #102 — Anti blue screen & diagnosa setup:** menambahkan `frontend/src/components/ui/ErrorBoundary.jsx` yang dipasang paling luar di `frontend/src/main.jsx` (membungkus ThemeProvider), sehingga error runtime apa pun tampil sebagai panel `PACELAB PRO // RUNTIME ERROR` berisi pesan error, stack, component stack, petunjuk penyebab umum, serta tombol RELOAD PAGE / COPY ERROR / LIHAT DETAIL — bukan halaman biru kosong. Ditambahkan pula `frontend/scripts/doctor.mjs` (script `npm run doctor`) yang memeriksa 19 titik rawan: kelengkapan file tema, ThemeProvider + ErrorBoundary ter-mount di `main.jsx`, ekspor `themeUtils.js`, `useTheme()` tanpa `throw`, pemakaian `useTheme()`/`ThemeSettingsModal` di tiap layout, variabel `--retro-*` di `tailwind.config.js` dan `index.css`, serta keberadaan `node_modules`. Doctor sudah diuji negatif: ketika `<ThemeProvider>` sengaja dihapus, doctor langsung menunjuk masalahnya. Ditambahkan 3 test penjaga (total `npm test` = 20 test lulus) dan smoke test runtime seluruh aplikasi via jsdom (15 check lulus: home page, header/footer, tombol & modal tema, route `/login`, perubahan warna live, serta uji ErrorBoundary menampilkan panel error saat komponen crash). `npm run build` sukses. Dibuat juga arsip `pacelab-theme-update.zip` (160 KB) berisi seluruh `frontend/src`, `package.json`, `tailwind.config.js`, dan `scripts/` agar penyalinan file tidak lagi parsial/mixed.
- **Perubahan #103 — Vite allowedHosts & verifikasi mode dev:** `frontend/vite.config.js` kini menambahkan `server.allowedHosts: true` (plus blok `preview`) supaya Vite 8 tidak lagi membalas `Blocked request` saat frontend dibuka lewat IP VPS, domain, tunnel, atau preview host — sebelumnya konfigurasi ini belum ada sehingga dev/preview server hanya menerima `localhost`. Verifikasi mode dev dilakukan dengan menjalankan `npm run dev` di sandbox: 12 modul kunci (main.jsx, ThemeContext, themeUtils, Header, MainLayout, Footer, AdminLayout, ThemeSettingsModal, ErrorBoundary, Modal, App, index.css) semua ter-transform HTTP 200 tanpa error, dan host preview diterima setelah restart otomatis Vite. `npm run doctor` diperluas dengan pemeriksaan ke-19 (`vite.config.js mengizinkan host non-lokal`), dan arsip `pacelab-theme-update.zip` diperbarui agar ikut memuat `vite.config.js`.
- **Perubahan #104 — Preset WARM SAND (palette cream/beige):** menambahkan preset tema baru bernama `WARM SAND` dengan palette `#EDEDE9`, `#D6CCC2`, `#F5EBE0`, `#E3D5CA`, `#D5BDAF` (seluruh 5 kode tetap ditampilkan sebagai swatch pada chip preset dan baris PALETTE di modal). Karena semua warna palette ini terang (kontras antar warna hanya 1.0–1.5 sehingga tidak ada pasangan yang terbaca), preset dijalankan sebagai TEMA TERANG: latar memakai cream `#F5EBE0` asli, sedangkan aksen `#766960` (4.51:1) dan teks `#3B3733` (10.02:1) diturunkan lewat helper baru `shadeToContrast()` dari warna palette yang sama sehingga tetap satu keluarga hue (warm, R>G>B). `buildZoneVars` kini mendeteksi tema terang dan membuat turunan accent jadi lebih gelap (hover `#6B6058`, kontras 5.19:1) alih-alih lebih terang; tema gelap custom tidak berubah perilakunya. Chip preset di modal kini menampilkan seluruh swatch palette (bukan hanya 3 slot) beserta tooltip kode warna, dan ditambahkan baris `PALETTE` + hint ramah pengguna bilingual ("Cream & beige hangat — tema terang"). Total `npm test` = 22 test lulus (2 test baru: validasi palette WARM SAND & kontrasnya, serta perilaku `shadeToContrast`), `npm run doctor` 19 pemeriksaan lulus, smoke test jsdom 11 check lulus, dan `npm run build` sukses. Ditambahkan juga `PACELAB_WARM_SAND_PREVIEW.html` (pratinjau visual palette + mockup header/main/footer + tabel kontras WCAG) dan catatan palette pada `COLOR-UPDATE.md`.
- **Perubahan #105 — Verifikasi preset & penanda versi tema:** setelah laporan bahwa preset baru belum terlihat, ditambahkan mekanisme agar salinan lama langsung ketahuan: (1) heading modal kini menampilkan jumlah preset `PRESETS (8)`, chip `WARM SAND` diberi badge `NEW`, dan footer modal menampilkan penanda versi `TEMA ENGINE v2 · 8 PRESETS`; (2) `npm run doctor` menambah 3 pemeriksaan baru — kelengkapan 8 preset (`POCARI BLUE … WARM SAND`, dengan pesan `Belum ada: WARM SAND → salin ulang src/utils/themeUtils.js versi terbaru`), keberadaan `shadeToContrast` + palette cream pada `themeUtils.js`, dan penanda jumlah preset di modal; daftar preset yang terdeteksi juga dicetak agar mudah dibandingkan; (3) test matrix preset diperluas (jumlah minimal 8, urutan & nama preset, flag `isNew`). Uji negatif dijalankan: saat blok WARM SAND sengaja dihapus dari `themeUtils.js`, doctor langsung melaporkan 2 kegagalan dan menyebutkan solusinya. Total `npm test` = 22 test lulus, `npm run doctor` lulus penuh, smoke test jsdom 8 check lulus (8 chip preset, badge NEW, penanda versi, baris PALETTE 5 swatch, penerapan tema terang), dan `npm run build` sukses. `pacelab-theme-update.zip` (164 KB) dibuat ulang dan diverifikasi memuat `warm-sand`, badge `isNew`, dan pemeriksaan doctor terbaru.
- **Perubahan #106 — Penghapusan 3 preset tema:** preset `TERMINAL AMBER`, `RETRO GREEN`, dan `CRIMSON` dihapus dari `THEME_PRESETS` sesuai permintaan pemilik produk, sehingga daftar preset final menjadi 5: `POCARI BLUE`, `CARBON`, `SUNSET`, `MONOCHROME`, dan `WARM SAND`. Badge `NEW` tetap pada `WARM SAND`. Test preset diubah dari "minimal 8" menjadi tepat 5 dengan urutan & nama yang dikunci, sekaligus menegaskan ketiga id yang dihapus tidak boleh terdaftar lagi; uji penerapan preset memakai `SUNSET` (`#2B1055` / `#FF8A3D`). Daftar preset di `npm run doctor` mengikuti (kini mencetak 5 preset). Perilaku aman untuk tema yang sudah tersimpan: warna tersimpan sebagai hex sehingga tampilan tidak rusak walau preset sumbernya dihapus (diverifikasi di smoke test). Hasil verifikasi: `npm test` 22 lulus, `npm run doctor` lulus penuh, smoke test jsdom 9 check lulus (5 chip, tanpa label yang dihapus, penanda versi `TEMA ENGINE v2 · 5 PRESETS`, tanpa sisa warna amber/crimson/hijau neon, tema lama tetap valid), `npm run build` sukses, dan bundle produksi diverifikasi tidak lagi memuat string `TERMINAL AMBER` maupun `CRIMSON`. `COLOR-UPDATE.md` diperbarui dengan tabel daftar preset final.
- **Perubahan #107 — Preset MONOCHROME V2 (versi reverse):** menambahkan preset `MONOCHROME V2` yang diambil dari preset `MONOCHROME` dengan setiap channel warna dibalik (`255 - x`): latar `#101010` → `#EFEFEF`, aksen `#E8E8E8` → `#171717`, teks `#FFFFFF` → `#000000`. Karena latar lebih terang dari teks, preset ini otomatis diperlakukan sebagai tema terang sehingga `buildZoneVars` membuat hover aksen lebih gelap (`#131313`) dan turunan permukaan tetap lebih gelap dari latar (kartu `#CECECE`, tengah `#B1B1B1`, garis `#838383`); rasio kontras 18.26:1 (teks/latar), 15.59:1 (aksen/latar), dan 15.59:1 (teks tombol di atas aksen). Badge `NEW` dipindahkan dari `WARM SAND` ke `MONOCHROME V2` sebagai preset terbaru, chip preset menampilkan 5 tone monochrome (putih → hitam), dan baris PALETTE memakai hint bilingual "Kebalikan monochrome — tema terang". Jumlah preset kini 6 (`POCARI BLUE`, `CARBON`, `SUNSET`, `MONOCHROME`, `MONOCHROME V2`, `WARM SAND`) dengan penanda modal otomatis `PRESETS (6)` / `TEMA ENGINE v2 · 6 PRESETS`. Hasil verifikasi: `npm test` 23 test lulus (test baru memverifikasi inversi channel, peran latar/teks yang bertukar, ambang kontras, dan perilaku hover tema terang), `npm run doctor` lulus penuh dengan daftar 6 preset, smoke test jsdom 12 check lulus (6 chip, badge NEW, swatch hasil pembalikan, penerapan live `16 16 16` ↔ `239 239 239`, isolasi antar preset), `npm run build` sukses, dan `COLOR-UPDATE.md` diperbarui dengan tabel MONOCHROME vs MONOCHROME V2.
- **Perubahan #108 — Penanda versi build & panduan patch manual:** untuk mengakhiri kebingungan "sudah/belum tersalin" saat preset baru tidak terlihat, ditambahkan `frontend/src/constants/appVersion.js` (berisi `APP_VERSION = "1.3.0"`, `THEME_ENGINE_VERSION = 2`, `EXPECTED_PRESET_COUNT = 6`). Header kini menampilkan `PACELAB PRO // v1.3.0` dari konstanta tersebut (versi hardcode `v1.0.0` dihapus, termasuk pada preview mini di dalam modal), dan footer modal memakai `THEME ENGINE v<versi> · <n> PRESETS` secara dinamis (`t("themeEngine")` menggantikan string "TEMA ENGINE v2"). `npm run doctor` sekarang mencetak versi aplikasi di kepala laporan (`PACELAB FRONTEND DOCTOR — app v1.3.0`) dan menambah 4 pemeriksaan: keberadaan `appVersion.js`, pemakaian `APP_VERSION_LABEL` di Header, pemakaian `THEME_ENGINE_VERSION` di modal, serta kecocokan `EXPECTED_PRESET_COUNT` dengan jumlah preset nyata di `themeUtils.js` (total 26 pemeriksaan, semua lulus). Ditambahkan pula test `penanda versi build konsisten (header, modal, doctor)` sehingga versi hardcode lama tidak bisa kembali. Dibuat `PACELAB_PRESET_PATCH.md` berisi dua cara memasang preset terbaru (ekstrak arsip / tempel manual satu blok) plus tabel verifikasi. Hasil: `npm test` 24 test lulus, smoke test jsdom 5/5 (header v1.3.0, `TEMA ENGINE v2 · 6 PRESETS`, chip MONOCHROME V2, penerapan live 239/23/0), `npm run build` sukses, dan preview diperbarui.
- **Perubahan #109 — Rename preset `POCARI BLUE` → `DEFAULT COLOR`:** nama preset pertama diganti sesuai permintaan pemilik produk; kode warna (`#005BAC` latar, `#DFF5FF` aksen, `#FFFFFF` teks), urutan (paling awal), dan perilakunya sebagai tema default aplikasi tidak diubah sama sekali, dan id internal tetap `pocari` agar tidak ada referensi yang putus (id tidak pernah tampil ke pengguna). Ditambahkan hint bilingual singkat (`PaceLab default palette` / `Palette default PaceLab`) yang muncul di baris PALETTE saat preset ini aktif. Test baru `preset default bernama DEFAULT COLOR dengan warna default PaceLab` mengunci tiga hal sekaligus: labelnya `DEFAULT COLOR`, warnanya identik `DEFAULT_ZONE_COLORS` dan menghasilkan `DEFAULT_ZONE_VARS` yang sama, serta nama lama tidak boleh muncul pada teks yang tampil ke pengguna (label/hint/swatch). Daftar preset di `npm run doctor` mengikuti (`DEFAULT COLOR / CARBON / SUNSET / MONOCHROME / MONOCHROME V2 / WARM SAND`). Hasil verifikasi: `npm test` 25 test lulus, `npm run doctor` lulus penuh (26 pemeriksaan), smoke test jsdom 7 check lulus (chip pertama `DEFAULT COLOR`, 3 swatch biru/putih tetap, penerapan live `0 91 172` / `223 245 255` / `255 255 255`, hint EN & ID), `npm run build` sukses, dan bundle produksi tidak lagi memuat string `POCARI BLUE`. `COLOR-UPDATE.md` dan `PACELAB_PRESET_PATCH.md` diperbarui.
- **Perubahan #110 — Tombol gear berputar:** teks `TEMPLATE COLORS` pada tombol di strip atas header diganti dengan **ikon gear yang berputar** (komponen baru `frontend/src/components/ui/GearIcon.jsx`, SVG stroke `currentColor` sehingga otomatis mengikuti palet zona HEADER). Animasi didefinisikan di Tailwind sebagai `gear-spin` (3.6s linear infinite) dan `gear-spin-fast` (1.1s) yang aktif saat hover, plus `motion-reduce:animate-none` untuk pengguna yang memilih reduce motion. Tombol kini ikon-saja, jadi aksesibilitas dijaga lewat `aria-label` + `title` berisi `themeSettings` (bilingual: Template Colors / Warna Template), dan ikon ditandai dekoratif (`aria-hidden`, `role=presentation`) supaya tidak dibaca ganda oleh screen reader. Indikator zona custom dipindah menjadi titik kecil di sudut kanan-atas tombol. Entri di menu mobile tetap memakai label teks (agar tetap jelas saat daftar menu dibuka) dengan teks `⚙ SET` diganti ikon gear berputar. Test baru mengunci perilaku ini (teks tombol hilang, `GearIcon` + `animate-gear-spin` dipakai, `aria-label` wajib ada, dan keyframes `gearSpin` ada di Tailwind). Hasil verifikasi: `npm test` 26 test lulus, `npm run doctor` lulus penuh, smoke test jsdom 14 check lulus (tombol tanpa teks, tooltip, klik membuka/menutup modal, indikator custom, entri mobile, dan mode berlabel GearIcon), `npm run build` sukses dengan CSS mengeluarkan `@keyframes gearSpin` serta varian hover, dan mockup `PACELAB_WARM_SAND_PREVIEW.html` diperbarui memakai ikon gear.
- **Perubahan #111 — Gear mobile di samping hamburger:** ikon gear (Template Colors) kini juga tampil pada tampilan mobile, tepat di sebelah kiri tombol hamburger pada baris navigasi. Tombol hamburger dibungkus dalam grup `md:hidden flex items-center gap-3` bersama tombol gear mobile, sehingga keduanya hanya muncul di layar kecil dan tidak bertabrakan dengan strip atas (desktop) yang sudah punya gear sendiri. Gear mobile memakai ukuran ikon 20px dengan area sentuh `p-2` (±36px), tetap berputar, ikon-saja dengan `aria-label` + `title` bilingual, indikator zona custom berupa titik di sudut, serta menutup menu hamburger otomatis saat ditekan. Entri teks `TEMPLATE COLORS` di dropdown mobile dihapus karena tombol gear sekarang selalu terlihat (tidak ada lagi duplikasi). Tombol hamburger kini juga memakai `aria-expanded`. Test permanen diperluas: minimal 2 pemakaian `GearIcon`, grup `md:hidden` wajib ada, dan urutan di dalam grup harus gear → hamburger, serta memastikan teks `templateColors` tidak lagi dirender di dropdown. Hasil verifikasi: `npm test` 26 test lulus, `npm run doctor` lulus penuh (26 pemeriksaan), smoke test jsdom 12 check lulus (gear tepat di sebelah kiri hamburger, ikon-saja + tooltip, gear desktop & mobile berbeda elemen, entri dropdown hilang, klik membuka modal `PRESETS (6)` dengan menu tetap tertutup, hamburger tetap berfungsi), `npm run build` sukses, dan preview diperbarui.
- **Perubahan #112 — Hapus 4 kartu statistik Dashboard:** kartu `VO2 Max`, `Calorie`, `Split`, dan `Finish Time` (selalu tampil `0` / `No data yet`) dihapus dari Dashboard sesuai permintaan pemilik produk. Penyaringan dilakukan di frontend lewat util baru `frontend/src/utils/dashboardStats.js` (`HIDDEN_DASHBOARD_STAT_SLUGS` + `filterVisibleStats()`), sehingga backend/API dan database tidak perlu diubah dan kartu bisa dikembalikan kapan saja cukup dengan menghapus slug dari daftar. `DashboardPage` kini memakai `filterVisibleStats(statsData?.stats)`, entri `CALC_ICONS` untuk keempat kalkulator tersebut dihapus, dan grid kartu disesuaikan menjadi `grid-cols-1 sm:grid-cols-3` (3 kartu tersisa: VCR Calculator, Race Predictor, Training Zones) supaya tidak ada kolom kosong. Kartu yang tersisa tetap berfungsi sebagai filter riwayat, dan filter tab (ALL/VCR/RACE/ZONES) tidak berubah. Test baru `frontend/src/__tests__/dashboardStats.test.js` (5 test) mengunci daftar slug yang disembunyikan, perilaku penyaringan (termasuk saat kalkulator yang disembunyikan punya data), ketahanan terhadap data kosong/rusak, serta memastikan `DashboardPage` tidak lagi menyebut keempat slug tersebut. Hasil verifikasi: `npm test` 31 test lulus, `npm run doctor` lulus penuh, smoke test jsdom dengan API tiruan (respons 7 kalkulator seperti backend asli) 15 check lulus — hanya 3 kartu dirender, keempat nama kartu hilang, tidak ada lagi teks `No data yet` di dashboard, nilai 12/5/3 tetap tampil, dan kartu tetap bisa diklik sebagai filter. `npm run build` sukses dan preview diperbarui.
- **Perubahan #113 — Border & tata letak PDF export:** export PDF program latihan dirombak agar setiap blok berborder dan rapi. Logika tata letak dipindah ke modul baru `backend/src/utils/pdfProgramLayout.js` (`renderTrainingProgramPDF`) dan `trainingProgramController.exportPDF` kini hanya menyiapkan stream + metadata PDF (`bufferPages`, Title/Author/Subject, nama file disanitasi). Yang diterapkan: (1) **bingkai ganda halaman** di setiap halaman (garis biru 1.4pt + garis dalam 0.4pt) plus footer `PACELAB PRO — <program>` dan `Halaman n / N`; (2) **kotak header program** berisi bar biru dengan judul + target/level, dan tabel info 4 kolom bergaris (Target Lomba, Level, Durasi, Dibuat, Periode, Total Volume) yang dihitung otomatis (`buildInfoRows`); (3) **blok per minggu** berupa bar berwarna (biru; teks putih `MINGGU n` / fase / `TOTAL n Km`, dengan label `RECOVERY WEEK` dan warna berbeda pada minggu recovery), sub-header periode + `Jarak inti` + `Target` dalam pita accent, dan header tabel bergaris; (4) **tabel 5 kolom** `TANGGAL / HARI / AKTIVITAS / JARAK / PACE` dengan garis grid, baris zebra, dan baris `RACE DAY` disorot; (5) **baris Detail bergaris** dengan label `DETAIL` + garis aksen kiri dan tinggi baris adaptif. Aturan pemenggalan halaman dibuat aman: kolom tidak terpotong di antara halaman, tabel lanjutan mengulang bar + header tabel dan diberi penanda `MINGGU n (lanjutan)`, dan seluruh isi selalu berada di dalam bingkai. Bug lama yang ikut diperbaiki: header tabel (baris awal) yang hilang di tiap halaman dan `week.mileage` yang tidak terdefinisi pada blok minggu. Test baru `backend/src/__tests__/unit/pdfProgramLayout.test.js` (9 test) memverifikasi PDF valid, jumlah halaman, keberadaan bingkai & grid, kelengkapan teks (judul, label kolom, fase, RACE DAY, DETAIL), isi baris Detail, dan bahwa semua teks berada dalam area kertas A4; `PDF_DEBUG_OUT=<path>` bisa dipakai untuk menyimpan PDF hasil test. Verifikasi: `npx jest src/__tests__/unit/pdfProgramLayout.test.js` → 9 lulus; uji end-to-end `controller.exportPDF` dengan model tiruan (tanpa DB) menghasilkan PDF 2 halaman valid (`Content-Type: application/pdf`, EOF benar); render 8 halaman contoh diperiksa visual dengan PyMuPDF (termasuk halaman recovery week dan halaman Race Day) dan disimpan sebagai `PACELAB_CONTOH_EXPORT_PDF.pdf`. Panduan pasang + tabel perbandingan sebelum/sesudah ada di `PACELAB_PDF_EXPORT_PATCH.md`, dan arsip `pacelab-backend-pdf-update.zip` (12 KB) berisi 3 file backend terkait. Catatan: `npm test` backend tetap melaporkan 4 suite gagal karena file test lama (`authMiddleware/calculatorUtils/paceUtils/validators`) memang 0 byte di repo — kondisi sebelum perubahan ini.
- **Perubahan #114 — PDF landscape & 1 halaman = 1 minggu (kolom DETAIL word wrap):** format ekspor PDF diubah sesuai permintaan produk. (1) **Default landscape A4** (`layout: "landscape"` pada `PDFDocument`, 841×595 pt); (2) **satu halaman = satu minggu** — halaman 1 dipakai sebagai **sampul** (kotak judul, tabel info program, dan tabel `RINGKASAN PROGRAM` berisi hal/fase/periode/volume/jarak inti untuk semua minggu), halaman 2..N+1 masing-masing memuat satu minggu penuh (7 hari) dengan bar `MINGGU n / N`; (3) **kolom DETAIL memakai word wrap** sehingga detail panjang dibungkus ke bawah, bukan lagi baris terpisah di bawah tabel — tabel kini 6 kolom (`TANGGAL | HARI | AKTIVITAS | JARAK | PACE | DETAIL`) dengan lebar 0.09/0.08/0.17/0.11/0.12/0.43 dan tinggi baris dihitung dari sel tertinggi; (4) **auto-fit** diperluas: skala font dicoba dari besar ke kecil (1.6 → 0.78) dan dipilih skala terbesar yang masih muat satu halaman, dengan batas atas ukuran huruf agar tetap wajar dicetak — hasilnya halaman minggu terpakai ±95% tinggi kertas tanpa teks terpotong; (5) jaring pengaman tetap ada: bila satu minggu benar-benar tidak muat, tabel berlanjut dengan penanda `MINGGU n (lanjutan)`. Info format cetak juga dicetak di tabel info (`A4 Landscape • 1 halaman = 1 minggu`) dan di catatan sampul. Test diperluas menjadi **12 test** (landscape MediaBox 841.89×595.28, jumlah halaman = jumlah minggu + 1, tiap halaman minggu memuat `MINGGU n / N`, sampul memuat ringkasan 14 minggu, kolom DETAIL wajib `wrap: true`, ukuran huruf/posisi seluruh teks masih di dalam area cetak, plus pengukuran rasio isi halaman dari render gambar). Verifikasi: `npx jest src/__tests__/unit/pdfProgramLayout.test.js` → 12 lulus; uji end-to-end `controller.exportPDF` (model tiruan, tanpa DB) menghasilkan PDF landscape 4 halaman (1 sampul + 3 minggu) dengan isi terpakai 95.5% per halaman; contoh 15 halaman diperiksa visual dan diperbarui di `PACELAB_CONTOH_EXPORT_PDF.pdf`; arsip `pacelab-backend-pdf-update.zip` (16 KB) diperbarui.
- **Perubahan #115 — Penguncian menu sampai profil lengkap:** pengguna baru (mis. daftar lewat Google) kini tidak bisa mengakses menu aplikasi sebelum data pelarinya lengkap. Ditambahkan aturan kelengkapan profil di `frontend/src/utils/profileCompletion.js` (`REQUIRED_PROFILE_FIELDS`: nama, usia, jenis kelamin, berat, tinggi; komunitas opsional) dengan validasi nilai (usia bilangan bulat 1–119, berat 1–399 kg, tinggi 1–299 cm, gender male/female/other), plus `getProfileCompletion()` yang mengembalikan `isComplete/isLocked/missing/percent`. `AuthContext` mengekspor `profileCompletion`, `isProfileComplete`, dan `isProfileLocked`; `App.jsx` memakai komponen `Protected` yang merangkai `AuthGuard` + **`ProfileGuard` (baru)** sehingga rute `/calculator`, `/dashboard`, `/create-training-program`, dan `/my-training-programs` dialihkan ke `/profile` selama profil belum lengkap — rute `/profile` sendiri (`requireProfile={false}`) dan area `/admin` tetap terbuka. Header mengunci menu (ikon gembok `LockIcon` baru) dan menampilkan chip `PROFIL BELUM LENGKAP n/5` di strip atas; klik menu terkunci memunculkan toast “Lengkapi profil dulu…” lalu diarahkan ke `/profile`; pada mobile tombol CTA berubah menjadi `LENGKAPI PROFIL →`. `LoginPage` mengarahkan pengguna dengan profil belum lengkap ke `/profile` (bukan dashboard). `ProfilePage` menampilkan banner `AKSES TERKUNCI` dengan progress bar, daftar field yang kosong, badge `WAJIB`/`OK` per field, border kuning pada input yang belum diisi, form otomatis terbuka dalam mode edit, dan setelah tersimpan lengkap menampilkan toast khusus serta **kembali otomatis ke menu yang tadi dituju**. Sebagai bonus kebersihan: `checkAuth` di `AuthContext` dibungkus `useCallback` dan sisa lint error di `ProfilePage`/`AuthContext` dibersihkan. Verifikasi: `npm test` **45 test lulus** (12 test baru: matriks kelengkapan, batas nilai, angka berbentuk string, gender `other`, admin tidak dikunci, serta pemeriksaan statis bahwa keempat rute memakai `ProfileGuard`, halaman profile dikecualikan, Header/ProfilePage/LoginPage memakai status kunci). Smoke test jsdom end-to-end 25 check lulus (akses `/calculator` dengan profil kosong → dialihkan ke Profile, banner + `1/5` + 4 badge WAJIB, 4 ikon gembok di nav, chip `PROFILE INCOMPLETE 4/5`, klik menu terkunci tetap di `/profile`, lalu setelah profil dilengkapi menu kembali aktif dan `/calculator` serta `/dashboard` bisa dibuka). `npm run build` sukses, `npm run doctor` lulus. Ditambahkan dokumen `PACELAB_PROFILE_LOCK.md` (aturan + cara mengubah field wajib) dan pratinjau `PACELAB_PROFILE_LOCK_PREVIEW.html`. Arsip frontend diganti nama menjadi `pacelab-frontend-update.zip` (berisi seluruh `src` terbaru) agar mencakup fitur ini.
- **Perubahan #116 — Perbaikan keterbacaan UI kunci pada tema terang:** dilaporkan teks `PROFILE INCOMPLETE 4/5`, `ACCESS LOCKED — COMPLETE YOUR PROFILE`, dan daftar field wajib (AGE/GENDER/WEIGHT/HEIGHT) tidak terlihat saat tema berlatar cerah. Penyebabnya warna peringatan di-hardcode `amber-200/300/400` — terukur hanya **1.23:1** pada WARM SAND dan **1.25:1** pada MONOCHROME V2 (ambang WCAG AA = 4.5:1). Perbaikan: (1) helper baru `ensureContrast()` di `themeUtils.js` yang menggelapkan **atau** menerangkan warna (memilih perubahan terdekat) sampai ambang kontras terpenuhi; (2) token tema baru `--retro-warn` (default `255 205 83`) yang dihitung per zona untuk SEMUA palette, hasilnya: DEFAULT COLOR `#FFCD53` (4.56:1), CARBON `#FBBF24` (11.51:1), SUNSET `#FBBF24` (9.62:1), MONOCHROME `#FBBF24` (11.40:1), MONOCHROME V2 `#886819` (4.52:1), WARM SAND `#856618` (4.56:1); (3) seluruh kelas `amber-*` pada Header, ProfilePage, dan badge kontras di ThemeSettingsModal diganti token `retro-warn` (28 pemakaian), ditambah dukungan `retro.warn` di `tailwind.config.js` dan fallback di `index.css`; karena teks tombol memakai warna latar (`text-retro-black`), kontras teks tombol peringatan otomatis memenuhi ambang yang sama (≥4.5:1) di semua preset. `APP_VERSION` dinaikkan ke `1.4.0`. Verifikasi: `npm test` **48 test lulus** (2 test baru: kontras `--retro-warn` untuk semua preset dengan pengecekan khusus bahwa pada tema terang tokennya harus lebih gelap dari latar, perilaku dua arah `ensureContrast`, plus 1 test statis yang melarang kelas `amber-*` kembali di tiga berkas UI tersebut). Smoke test jsdom 18 check lulus, termasuk penerapan keenam preset satu per satu dan pengukuran kontras warn pada tema terang WARM SAND (`#856618` vs `#F5EBE0` = 4.56:1, terverifikasi lebih gelap dari latar). `npm run build` sukses (`.text-retro-warn` dan `.bg-retro-warn/10` terbit di CSS), `npm run doctor` lulus, dan `PACELAB_PROFILE_LOCK.md` serta pratinjau `PACELAB_PROFILE_LOCK_PREVIEW.html` diperbarui dengan tabel kontras dan pratinjau tema terang.
- **Perubahan #74 — Global Beginner/Intermediate load differentiation:** semua race dan background kini membedakan baseline volume: Beginner 60/70/80% peak versus Intermediate 65/75/90% untuk returning/consistent/structured. Beginner dibatasi satu quality stimulus, sedangkan Intermediate medium/high dapat dua Q bila P0 aman; metadata load profile ditampilkan pada program.

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
- Menambahkan detail terstruktur untuk setiap hari `Istirahat` pada generator program:
  - Satu hari non-lari per minggu menggunakan panduan **Easy Day + Strength Training** (pemanasan, contoh latihan, set/repetisi, intensitas, dan pendinginan).
  - Hari istirahat lain menggunakan panduan **Rest Day + Active Recovery** (mobilitas opsional, tidur, hidrasi, nutrisi, dan tanda untuk istirahat total).
  - Hari istirahat pada minggu lomba menggunakan panduan **Rest & Race Readiness** tanpa strength berat.
- Detail recovery disimpan dalam `program_data`, sehingga ikut tampil pada preview, My Training Programs, serta ekspor PDF/Excel.
- Tampilan baris `Istirahat` tidak lagi dibuat transparan; kini menggunakan penanda background ringan agar instruksi recovery tetap terbaca.
- Menghapus aset sumber tak terpakai `frontend/src/assets/pace-lab.png` untuk mengurangi ukuran workspace; folder `referensi_training_program/` dan PDF Daniels tetap dipertahankan sebagai referensi utama analisis AI.
- **Perubahan #24 — Audit Section 3:** menambahkan analisis kesenjangan Beginner vs Intermediate, kondisi yang sudah berjalan, prioritas implementasi P0–P3, dan rancangan validasi jadwal Q session. Tidak ada perilaku generator yang diubah pada perubahan ini.
- **Perubahan #25 — P1 dan P2 diterapkan:** menambahkan template Intermediate race-specific untuk 5K, 10K, Half Marathon, dan Full Marathon; menambahkan M Pace blocks pada Long Run HM/FM tertentu; serta recovery R/I/T/M yang menyesuaikan level, fase, dan mileage tier. P0 (validator jarak antar-Q session) serta P3 (structured `program_data` dan test matrix) tetap di-skip.

> Jangan mengklaim implementasi Daniels sudah lengkap sebelum status di atas diperbarui menjadi `SELESAI`.
