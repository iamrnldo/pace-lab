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
