import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import clsx from "clsx";
import { getTrainingType } from "../utils/trainingTypes";
import { getMileageTier, RECOVERY_BY_TYPE } from "../utils/workoutLibrary";
import ExportModal from "../components/training/ExportModal";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const toDateInput = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const MONTHS_LIST = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const Label = ({ children }) => (
  <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-retro-white/50">
    {children}
  </label>
);

export default function CreateTrainingProgramPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const vcrData = location.state?.vcrData;

  const [formData, setFormData] = useState({
    raceName: "",
    raceEvent: "5K",
    level: "beginner",
    trainingDays: ["Selasa", "Kamis", "Sabtu", "Minggu"],
    startDate: toDateInput(new Date()),
    endDate: toDateInput(new Date(new Date().setMonth(new Date().getMonth() + 4))),
  });

  const [showProgram, setShowProgram] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (!vcrData) {
    return (
      <section className="max-w-4xl mx-auto px-4 pt-36 pb-24 text-center">
        <div className="card-retro p-10">
          <h2 className="font-retro text-3xl text-retro-white mb-4">NO VCR DATA FOUND</h2>
          <p className="text-retro-white/50 mb-8 font-sport">
            Silakan hitung VCR Anda terlebih dahulu sebelum membuat program latihan.
          </p>
          <button onClick={() => navigate("/calculator")} className="btn-retro bg-retro-green px-8 py-3 text-retro-black">
            GO TO CALCULATOR
          </button>
        </div>
      </section>
    );
  }

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day) ? prev.trainingDays.filter((d) => d !== day) : [...prev.trainingDays, day],
    }));
  };

  const dateDuration = useMemo(() => {
    const start = new Date(`${formData.startDate}T00:00:00`);
    const end = new Date(`${formData.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return { months: 0, days: 0 };
    const days = Math.floor((end - start) / 86400000) + 1;
    const months = Math.max(1, Math.round(days / 30.4375));
    return { months, days };
  }, [formData.startDate, formData.endDate]);

  const generatedProgram = useMemo(() => {
    if (!showProgram) return null;

    const programStart = new Date(`${formData.startDate}T00:00:00`);
    const startDayOffset = (programStart.getDay() + 6) % 7;
    const calendarStart = new Date(programStart);
    calendarStart.setDate(calendarStart.getDate() - startDayOffset);
    const programEnd = new Date(`${formData.endDate}T00:00:00`);
    const calendarDays = Math.floor((programEnd - calendarStart) / 86400000) + 1;
    const weeks = Math.max(1, Math.ceil(calendarDays / 7));
    const program = [];

    // 1. MILLEAGE SCIENCE MAP
    const mileageMap = {
      "5K": { beginner: 16, intermediate: 16 },
      "10K": { beginner: 25, intermediate: 25 },
      "Half Marathon": { beginner: 31, intermediate: 31 },
      "Full Marathon": { beginner: 50, intermediate: 100 },
    };

    const baseMileage = mileageMap[formData.raceEvent]?.[formData.level] || 20;
    const foundationWeeks = formData.level === "beginner" ? Math.ceil(weeks * 0.3) : Math.ceil(weeks * 0.2);
    const competitionWeek = weeks;
    const preCompetitionWeeks = 2; // Tapering 2 minggu
    const is5K = formData.raceEvent === "5K";
    const isShortPreparation = is5K && dateDuration.months <= 2;
    const isBeginner = formData.level === "beginner";
    const shakeoutDay5K = formData.trainingDays.includes("Sabtu") ? "Sabtu" : formData.trainingDays.filter((d) => d !== "Minggu").slice(-1)[0];
    const tenKShakeoutDays = formData.trainingDays.filter((d) => d !== "Minggu").slice(-2);
    const halfMarathonShakeoutDays = formData.trainingDays.filter((d) => d !== "Minggu").slice(-2);
    const lastSpecificPrepWeek = competitionWeek - preCompetitionWeeks - 1;

    const getPace = (label) => {
      const found = vcrData.intervals.find((i) => i.label === label);
      return found ? found.pacePerKm : vcrData.basePacePerKm;
    };

    const baseEPace = getPace("70%"), baseTPace = getPace("90%"), baseIPace = getPace("100%");

    // Pace progression: setiap 2 minggu target pace meningkat sekitar 1%.
    // Pace dibuat sedikit lebih cepat (waktu/km berkurang), dengan batas aman 10%.
    const progressivePace = (pace, week) => {
      if (!pace || pace === "-") return pace;
      const [minutes, seconds] = pace.split(":").map(Number);
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return pace;
      const baseSeconds = minutes * 60 + seconds;
      const cycles = Math.floor((week - 1) / 2);
      const adjusted = Math.max(baseSeconds * 0.9, baseSeconds * (1 - Math.min(cycles * 0.01, 0.1)));
      const rounded = Math.round(adjusted);
      const resultMinutes = Math.floor(rounded / 60);
      const resultSeconds = rounded % 60;
      return `${resultMinutes}:${String(resultSeconds).padStart(2, "0")}`;
    };

    const intensifyPace = (pace, percent) => {
      if (!pace || pace === "-") return pace;
      const [minutes, seconds] = pace.split(":").map(Number);
      const total = Math.max(1, Math.round((minutes * 60 + seconds) * (1 - percent)));
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
    };

    // Target peak mileage dicapai di akhir fase Specific Preparation.
    const peakRanges = {
      "5K": { beginner: [16, 24], intermediate: [16, 24] },
      "10K": { beginner: [25, 30], intermediate: [25, 30] },
      "Half Marathon": { beginner: [31, 50], intermediate: [31, 50] },
      "Full Marathon": {
        beginner: [50, 64],
        intermediate: [100, 110],
      },
    };
    const [peakMin, peakMax] = peakRanges[formData.raceEvent]?.[formData.level] || [20, 30];
    // Rentang persiapan berdasarkan nomor lomba dan level atlet.
    // Batas bawah = persiapan singkat, batas atas = persiapan ideal/lama.
    const durationGuides = {
      "5K": { beginner: [2, 3], intermediate: [2, 3] },
      "10K": { beginner: [2, 4], intermediate: [2, 4] },
      "Half Marathon": { beginner: [3, 5], intermediate: [3, 5] },
      "Full Marathon": { beginner: [4, 6], intermediate: [4, 8] },
    };
    const [shortPrepMonths, longPrepMonths] = durationGuides[formData.raceEvent]?.[formData.level] || [2, 6];
    const durationProgress = Math.min(1, Math.max(0, (dateDuration.months - shortPrepMonths) / Math.max(1, longPrepMonths - shortPrepMonths)));
    const peakMileage = peakMin + (peakMax - peakMin) * durationProgress;
    // Mileage awal general preparation harus berada di bawah peak.
    // Peak 5K 16–24 km hanya dicapai di akhir Specific Preparation.
    const startMileage = Math.min(baseMileage * 0.6, peakMileage * 0.6);

    for (let w = 1; w <= weeks; w++) {
      const isIntermediate = formData.level === "intermediate";
      const isIntermediateDistance = ["10K", "Half Marathon"].includes(formData.raceEvent) && isIntermediate;
      const mileageTier = getMileageTier(formData.raceEvent, formData.level, peakMileage);
      const tierQualityFactor = { low: 0.75, medium: 0.9, high: 1 }[mileageTier];
      const qualityFactor = (isIntermediate ? 1 : 0.8) * tierQualityFactor;
      const ePace = intensifyPace(progressivePace(baseEPace, w), isIntermediateDistance ? 0.03 : 0);
      const tPace = intensifyPace(progressivePace(baseTPace, w), isIntermediateDistance ? 0.05 : 0);
      const iPace = intensifyPace(progressivePace(baseIPace, w), isIntermediateDistance ? 0.08 : 0);
      // 2. PHASE DETERMINATION
      let phase = (w === competitionWeek) ? 4 : (w > lastSpecificPrepWeek) ? 3 : (w <= foundationWeeks) ? 1 : 2;

      // 3. MILLEAGE LOGIC (Mesocycle 3:1)
      const weekInCycle = (w - 1) % 4;
      const cycleNumber = Math.floor((w - 1) / 4);
      let isRecoveryWeek = (weekInCycle === 3 && w !== lastSpecificPrepWeek && phase < 3);
      let weeklyMileage;

      if (phase === 3) {
          const taperWeekNum = w - lastSpecificPrepWeek;
          weeklyMileage = peakMileage * (taperWeekNum === 1 ? 0.7 : 0.5);
          isRecoveryWeek = false;
      } else if (phase === 4) {
          weeklyMileage = peakMileage * 0.35;
          isRecoveryWeek = false;
      } else {
          // Naik bertahap dari mileage awal menuju peak mileage.
          // Peak tercapai tepat di minggu terakhir Specific Preparation.
          const buildProgress = Math.min(1, w / Math.max(1, lastSpecificPrepWeek));
          const plannedMileage = startMileage + (peakMileage - startMileage) * buildProgress;
          const cycleMultiplier = [1.0, 1.05, 1.1, 0.9][weekInCycle];
          weeklyMileage = plannedMileage * cycleMultiplier;
          if (w === lastSpecificPrepWeek) weeklyMileage = peakMileage;
      }

      const longRunCaps = { "5K": 7, "10K": 9, "Half Marathon": 18, "Full Marathon": 35 };
      const easyRunCaps = { "5K": 4, "10K": 7, "Half Marathon": 21, "Full Marathon": 42 };
      // Long run berada di kisaran 30–40% mileage mingguan sesuai fase.
      const longRunRatio = phase === 2
        ? (w === lastSpecificPrepWeek ? 0.40 : 0.35 + Math.min(0.05, (w / Math.max(1, lastSpecificPrepWeek)) * 0.05))
        : phase === 1 ? 0.30 : phase === 3 ? 0.30 : 0.30;
      // HM tetap dibatasi maksimal 18 km sesuai batas yang ditetapkan.
      const longRunMileage = Math.min(weeklyMileage * longRunRatio, longRunCaps[formData.raceEvent] || weeklyMileage * longRunRatio);
      const beginnerShortTempoWindow = !is5K || !isBeginner || !isShortPreparation || w > weeks - 4;
      const allowInterval = !is5K || !isBeginner || !isShortPreparation;
      const allowTempo = beginnerShortTempoWindow;
      let intervalMileage = (phase === 2 && !isRecoveryWeek && allowInterval) ? weeklyMileage * 0.12 * qualityFactor : 0;
      let tempoMileage = ((phase === 2 || phase === 3) && !isRecoveryWeek && allowTempo) ? weeklyMileage * 0.15 * qualityFactor : 0;
      let easyMileage = weeklyMileage - longRunMileage - intervalMileage - tempoMileage;
      // Jangan membuat sesi kualitas di bawah 1 km; pindahkan volumenya ke sesi lain.
      if (intervalMileage > 0 && intervalMileage < 1) {
        tempoMileage >= 1 ? (tempoMileage += intervalMileage) : (easyMileage += intervalMileage);
        intervalMileage = 0;
      }
      if (tempoMileage > 0 && tempoMileage < 1) {
        easyMileage += tempoMileage;
        tempoMileage = 0;
      }
      const easyDays = Math.max(1, formData.trainingDays.filter((d) => d !== "Minggu" && d !== "Sabtu").length - ((intervalMileage > 0 ? 1 : 0) + (tempoMileage > 0 ? 1 : 0)));
      const easyCapacity = easyDays * (easyRunCaps[formData.raceEvent] || 8);
      const overflowMileage = Math.max(0, easyMileage - easyCapacity);
      easyMileage = Math.min(easyMileage, easyCapacity);
      // Sisa mileage dialihkan ke sesi kualitas, bukan menambah Easy Run.
      if (overflowMileage > 0 && !isRecoveryWeek) {
        if (allowInterval && phase === 2) intervalMileage += overflowMileage * 0.5;
        else if (allowTempo) tempoMileage += overflowMileage;
        else easyMileage += overflowMileage;
      }
      // Pastikan perubahan distribusi tidak membuat quality session di bawah 1 km.
      if (intervalMileage > 0 && intervalMileage < 1) {
        if (allowTempo) tempoMileage += intervalMileage;
        else easyMileage += intervalMileage;
        intervalMileage = 0;
      }
      if (tempoMileage > 0 && tempoMileage < 1) {
        easyMileage += tempoMileage;
        tempoMileage = 0;
      }

      const strengthDay = DAYS.find((day) => !formData.trainingDays.includes(day)) || null;
      program.push({
        week: w,
        mileage: weeklyMileage.toFixed(1),
        phase,
        isRecoveryWeek,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: Array.from({ length: Math.min(7, calendarDays - ((w - 1) * 7)) }, (_, dayIndex) => {
          const calendarDate = new Date(calendarStart);
          calendarDate.setDate(calendarDate.getDate() + ((w - 1) * 7) + dayIndex);
          const date = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-${String(calendarDate.getDate()).padStart(2, "0")}`;
          const day = DAYS[(calendarDate.getDay() + 6) % 7];
          if (date < formData.startDate) return { day, date, activity: "Belum Mulai", pace: "-", distance: "-", details: "Program belum dimulai pada tanggal ini." };
          if (date > formData.endDate) return { day, date, activity: "Di luar periode", pace: "-", distance: "-", details: "Tanggal berada di luar periode program." };
          if (!formData.trainingDays.includes(day)) return { day, date, activity: "Istirahat", pace: "-", distance: "-", details: day === strengthDay ? "Catatan mingguan: lakukan ST (strength training) ringan, fokus core, glutes, dan stabilitas." : "-" };

          let activity = "Easy Run", pace = ePace, details = "Lari santai, fokus pada form dan pernapasan.";
          
          if (phase === 4) {
            if (date === formData.endDate) {
              return { day, date, activity: "RACE DAY", pace: "Target Lomba", distance: formData.raceEvent, details: "BERIKAN YANG TERBAIK!" };
            }
            const isShakeoutDay = is5K ? day === shakeoutDay5K : formData.raceEvent === "10K" ? tenKShakeoutDays.includes(day) : formData.raceEvent === "Half Marathon" ? halfMarathonShakeoutDays.includes(day) : true;
            if ((is5K || formData.raceEvent === "10K" || formData.raceEvent === "Half Marathon") && !isShakeoutDay) {
              return { day, date, activity: "Istirahat", pace: "-", distance: "-", details: day === strengthDay ? "Catatan mingguan: lakukan ST (strength training) ringan, fokus core, glutes, dan stabilitas." : "-" };
            }
            const shakeoutDistance = is5K ? 5 * 0.4 : formData.raceEvent === "10K" ? (10 * 0.7) / 2 : formData.raceEvent === "Half Marathon" ? (21.1 * 0.7) / 2 : weeklyMileage * 0.08;
            const shakeoutDetails = is5K
              ? `Shakeout Run 40% dari jarak lomba (${shakeoutDistance.toFixed(1)} km), sangat ringan menjaga kesegaran otot.`
              : formData.raceEvent === "10K" || formData.raceEvent === "Half Marathon"
                ? `Shakeout Run hari ${day}: 70% total jarak lomba dibagi 2 hari (${shakeoutDistance.toFixed(1)} km), sangat ringan.`
                : "Lari sangat ringan menjaga kesegaran otot.";
            return { day, date, activity: "Shakeout Run", pace: ePace, distance: shakeoutDistance.toFixed(1) + " Km", details: shakeoutDetails };
          }

          // Quality Day Placement (Ensuring spacing)
          const trainingDaysInWeek = formData.trainingDays.filter((d) => d !== "Minggu" && d !== "Sabtu");
          const q1 = trainingDaysInWeek[0];
          let q2 = (trainingDaysInWeek.length >= 2) ? (trainingDaysInWeek.find(d => DAYS.indexOf(d) >= DAYS.indexOf(q1) + 2) || trainingDaysInWeek[trainingDaysInWeek.length - 1]) : null;
          if (q2 === q1) q2 = null;

          let distance = 0;
          if (day === "Minggu" || (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))) {
            activity = "Long Run";
            const timeBasedLongRun = isBeginner && phase === 1 && w <= 2;
            const longRunTimeByRace = { "5K": 40, "10K": 45, "Half Marathon": 50, "Full Marathon": 60 };
            const longRunMinutes = (longRunTimeByRace[formData.raceEvent] || 40) + ((w - 1) * 5);
            if (timeBasedLongRun) pace = "-";
            distance = timeBasedLongRun ? `${longRunMinutes} menit` : longRunMileage.toFixed(1);
            details = timeBasedLongRun
              ? `Long Run berbasis waktu: ${longRunMinutes} menit Easy effort. Fokus durasi, bukan mengejar jarak atau pace.`
              : (w === lastSpecificPrepWeek) ? "PEAK LONGRUN: Jarak maksimal sebelum tapering." : "Steady pace, membangun daya tahan aerobik.";
          } else if (day === q1 && (intervalMileage > 0 || (phase === 3 && tempoMileage > 0))) {
            if (intervalMileage > 0) {
              activity = "Interval Run"; pace = iPace; distance = intervalMileage.toFixed(1);
              const phase2Start = foundationWeeks + 1;
              const progressRatio = (w - phase2Start + 1) / Math.max(1, lastSpecificPrepWeek - phase2Start + 1);
              let repDist = progressRatio <= 0.25 ? 0.4 : progressRatio <= 0.5 ? 0.6 : progressRatio <= 0.75 ? 0.8 : 1.0;
              const reps = Math.floor((distance - 2.0) / repDist);
              const targetMeters = Math.round(Number(distance) * 1000);
              // Interval progression: jarak naik setiap 2 minggu, mulai dari 400 m.
              // Pola dibuat bertahap agar volume dan stimulus meningkat tanpa langsung melompat ke 1 km.
              const workoutPatterns = {
                "5K": [
                  { reps: [400], rest: "90 detik", pace: "I-Pace" },
                  { reps: [600], rest: "2 menit", pace: "I-Pace" },
                  { reps: [800], rest: "2 menit", pace: "5K Pace" },
                  { reps: [1000], rest: "2 menit", pace: "5K Pace" },
                  { reps: [400, 800], rest: "90 detik", pace: "progresif" },
                  { reps: [200, 400, 600, 800, 600, 400, 200], rest: "90 detik", pace: "meningkat bertahap" },
                ],
                "10K": [
                  { reps: [400], rest: "90 detik", pace: "I-Pace" },
                  { reps: [600], rest: "2 menit", pace: "I-Pace" },
                  { reps: [800], rest: "2 menit", pace: "5K Pace" },
                  { reps: [1000], rest: "2 menit", pace: "5K Pace" },
                  { reps: [1200], rest: "2 menit", pace: "10K Pace" },
                  { reps: [1600], rest: "3 menit", pace: "10K Pace" },
                  { reps: [1000, 2000, 1000], rest: "3 menit", pace: "progresif" },
                ],
                "Half Marathon": [
                  { reps: [400], rest: "90 detik", pace: "I-Pace" },
                  { reps: [600], rest: "2 menit", pace: "I-Pace" },
                  { reps: [800], rest: "2 menit", pace: "5K Pace" },
                  { reps: [1000], rest: "2 menit", pace: "5K Pace" },
                  { reps: [1200], rest: "2 menit", pace: "10K Pace" },
                  { reps: [1600], rest: "3 menit", pace: "10K Pace" },
                  { reps: [2000], rest: "3 menit", pace: "Half Marathon Pace" },
                  { reps: [3000, 2000, 1000], rest: "3 menit", pace: "progresif" },
                ],
                "Full Marathon": [
                  { reps: [400], rest: "90 detik", pace: "I-Pace" },
                  { reps: [600], rest: "2 menit", pace: "I-Pace" },
                  { reps: [800], rest: "2 menit", pace: "5K Pace" },
                  { reps: [1000], rest: "2 menit", pace: "10K Pace" },
                  { reps: [1600], rest: "3 menit", pace: "10K Pace" },
                  { reps: [2000], rest: "3 menit", pace: "Half Marathon Pace" },
                  { reps: [3000], rest: "4 menit", pace: "Half Marathon Pace" },
                  { reps: [4000, 3000, 2000], rest: "4 menit", pace: "Marathon Pace" },
                ],
              };
              const patterns = workoutPatterns[formData.raceEvent] || workoutPatterns["5K"];
              // Progression interval dimulai ulang dari 400 m saat memasuki fase specific preparation.
              // Jadi awal fase baru tidak langsung melompat ke 800 m atau 1000 m.
              const intervalWeek = phase === 2 ? w - foundationWeeks : w;
              const pattern = patterns[Math.floor(Math.max(0, intervalWeek - 1) / 2) % patterns.length];
              // Cari kombinasi repetisi terdekat di atas target agar jarak tidak melonjak.
              // Contoh 3,8 km akan menjadi 600m x5 + 400m x2 = 3,8 km.
              const intervalDistances = [400, 600, 800, 1000, 1200, 1600, 2000];
              let best = null;
              const maxRepeats = Math.ceil(targetMeters / 400) + 2;
              for (let a = 0; a <= maxRepeats; a += 1) {
                for (let b = 0; b <= maxRepeats; b += 1) {
                  for (let c = 0; c <= maxRepeats; c += 1) {
                    for (let d = 0; d <= maxRepeats; d += 1) {
                      const counts = [a, b, c, d];
                      const total = counts.reduce((sum, count, index) => sum + count * intervalDistances[index], 0);
                      if (total < targetMeters || total === 0) continue;
                      const overshoot = total - targetMeters;
                      const reps = counts.reduce((sum, count) => sum + count, 0);
                      if (!best || overshoot < best.overshoot || (overshoot === best.overshoot && reps < best.reps)) {
                        best = { counts, total, overshoot, reps };
                      }
                    }
                  }
                }
              }
              const parts = best.counts.map((count, index) => {
                if (!count) return null;
                const distance = intervalDistances[index];
                // Repetisi pendek sedikit lebih cepat; repetisi panjang memakai pace yang lebih terkendali.
                const targetPace = distance <= 800
                  ? (formData.raceEvent === "10K" && isBeginner ? tPace : iPace)
                  : tPace;
                return `${distance}m x${count} @ ${targetPace}/km`;
              }).filter(Boolean);
              const mainSet = parts.join(" + ");
              pace = parts.length > 1 ? "Mixed Pace" : progressivePace(baseIPace, w);
              details = `Warm-up: Easy jog 5 mins\nDynamic stretching + running drills\n\nProgram inti: ${mainSet}\nRecovery: ${RECOVERY_BY_TYPE.I}\nTotal interval sekitar ${(best.total / 1000).toFixed(1)} km\n\nCool-Down: 10 mins easy jog\nStatic stretching\n*Istirahat disesuaikan kondisi atlet.`;
            } else {
              activity = "Tempo Run"; pace = tPace; distance = tempoMileage.toFixed(1);
              const blocks = distance > 7 ? 3 : 2; const distPerBlock = (distance / blocks).toFixed(1);
              details = `W-up: 12m Easy | Main: ${blocks}x ${distPerBlock}km @ T-Pace (Rest 2m*) | C-down: 8m Recovery jog. *Istirahat disesuaikan kondisi atlet.`;
              if (phase === 3) details = "(Tapering) Menjaga intensitas. " + details;
            }
          } else if (day === q2 && tempoMileage > 0 && (phase === 2 || phase === 3) && (isIntermediate || w % 2 === 0)) {
             activity = "Tempo Run"; pace = tPace; distance = tempoMileage.toFixed(1);
             const blocks = distance > 7 ? 3 : 2; const distPerBlock = (distance / blocks).toFixed(1);
             details = `Main: ${blocks}x ${distPerBlock}km @ T-Pace (Rest 2m*).`;
          } else {
            const qualityUsed = (day === q1 && (intervalMileage > 0 || (phase === 3 && tempoMileage > 0))) || (day === q2 && tempoMileage > 0 && phase === 2);
            const qualityDaysCount = (intervalMileage > 0 ? 1 : 0) + (tempoMileage > 0 && phase === 2 && q2 ? 1 : (phase === 3 && tempoMileage > 0 ? 1 : 0));
            const easyRunCaps = { "5K": 6.0, "10K": 8.0, "Half Marathon": 12.0, "Full Marathon": 16.0 };
            const easyRunCap = easyRunCaps[formData.raceEvent] || 8.0;
            const easyRunDistance = easyMileage / Math.max(1, formData.trainingDays.length - 1 - qualityDaysCount);
            distance = Math.min(easyRunDistance, easyRunCap, longRunMileage).toFixed(1);
          }
          return { day, date, activity, pace, distance: distance + " Km", details };
        }),
      });
    }
    return program;
  }, [showProgram, vcrData, formData, dateDuration]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/training-program", {
        name: formData.raceName, race_event: formData.raceEvent, level: formData.level,
        prep_months: dateDuration.months, prep_days: dateDuration.days, start_month: formData.startDate, end_month: formData.endDate,
        training_days: formData.trainingDays, program_data: generatedProgram,
      });
      toast.success("Program Berhasil Disimpan!");
      navigate("/my-training-programs");
    } catch (e) { toast.error("Gagal menyimpan program."); } finally { setIsSaving(false); }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-36 pb-24">
      <div className="mb-10 animate-slide-up">
        <span className="font-mono text-retro-green text-xs tracking-[0.3em]">// PROGRAM GENERATOR</span>
        <h1 className="font-retro text-5xl md:text-7xl text-retro-white mt-1 leading-none">
          TRAINING PROGRAM<span className="text-retro-green animate-blink">_</span>
        </h1>
      </div>

      {!showProgram ? (
        <div className="card-retro p-8 animate-fade-in">
          <div className="space-y-6">
            <div><Label>Nama Perlombaan</Label><input type="text" value={formData.raceName} onChange={(e) => setFormData({ ...formData, raceName: e.target.value })} placeholder="Contoh: Jakarta Marathon" className="input-retro w-full" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Nomor Perlombaan</Label><select value={formData.raceEvent} onChange={(e) => setFormData({ ...formData, raceEvent: e.target.value })} className="input-retro w-full"><option value="5K">5K</option><option value="10K">10K</option><option value="Half Marathon">Half Marathon</option><option value="Full Marathon">Full Marathon</option></select></div>
              <div><Label>Level Pelari</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setFormData({ ...formData, level: "beginner" })} className={clsx("btn-retro py-2 text-sm transition-all", formData.level === "beginner" ? "bg-retro-green text-retro-black" : "border-retro-white/30 text-retro-white")}>BEGINNER</button>
                  <button type="button" onClick={() => setFormData({ ...formData, level: "intermediate" })} className={clsx("btn-retro py-2 text-sm transition-all", formData.level === "intermediate" ? "bg-retro-green text-retro-black" : "border-retro-white/30 text-retro-white")}>INTERMEDIATE / ELITE</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><Label>Tanggal Mulai</Label><input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-retro w-full" /></div>
              <div><Label>Tanggal Selesai</Label><input type="date" value={formData.endDate} min={formData.startDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-retro w-full" /></div>
              <div><Label>Durasi (Bulan)</Label><input type="text" readOnly value={dateDuration.months ? `${dateDuration.months} bulan` : "-"} className="input-retro w-full opacity-80" /></div>
              <div><Label>Durasi (Hari)</Label><input type="text" readOnly value={dateDuration.days ? `${dateDuration.days} hari` : "-"} className="input-retro w-full opacity-80" /></div>
            </div>
            <div><Label>Frekuensi Latihan (Hari apa saja)</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {DAYS.map(day => (<button key={day} onClick={() => handleDayToggle(day)} className={clsx("px-2 py-3 font-mono text-[10px] border transition-all text-center", formData.trainingDays.includes(day) ? "border-retro-green bg-retro-green text-retro-black" : "border-retro-gray-light text-retro-white/50 hover:border-retro-white hover:text-retro-white")}>{day.toUpperCase()}</button>))}
              </div>
            </div>
          </div>
          <button onClick={() => setShowProgram(true)} disabled={!formData.raceName || formData.trainingDays.length === 0} className="btn-retro w-full bg-retro-green py-4 text-xl font-retro text-retro-black mt-8">BUAT PROGRAM LATIHAN →</button>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-end">
            <div><h2 className="font-retro text-3xl text-retro-green">{formData.raceName.toUpperCase()}</h2><p className="font-mono text-retro-white/60">{formData.raceEvent} · {dateDuration.months} Bulan</p></div>
            <button onClick={() => setShowProgram(false)} className="text-retro-green font-mono text-sm hover:underline">UBAH PENGATURAN</button>
          </div>
          <div className="mb-8 flex gap-0 overflow-x-auto border-b-2 border-retro-gray-light">
            {generatedProgram.map(w => <button key={w.week} onClick={() => setActiveWeek(w.week)} className={clsx("font-retro whitespace-nowrap border-b-2 -mb-0.5 px-5 py-3 text-xs tracking-widest transition-all duration-150", activeWeek === w.week ? "border-retro-green bg-retro-green text-retro-black" : "border-transparent text-retro-white/50 hover:bg-retro-gray-mid hover:text-retro-white")}>MINGGU {w.week}</button>)}
          </div>
          {generatedProgram.filter(w => w.week === activeWeek).map(week => (
            <div key={week.week} className="card-retro overflow-hidden p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div><span className="font-retro text-2xl text-retro-white uppercase">MINGGU {week.week}</span><p className="font-mono text-[10px] text-retro-white/50 mt-1 uppercase tracking-widest">Mileage: {week.mileage} Km</p><p className="font-mono text-[10px] text-retro-white/40 mt-1">{week.startDate || ""} — {week.days?.[6]?.date || ""}</p></div>
                <span className="font-mono text-[10px] text-retro-green px-3 py-1 border border-retro-green/30 uppercase">{week.isRecoveryWeek ? "RECOVERY" : `FASE ${week.phase}: ${week.phase === 1 ? 'General Prep' : week.phase === 2 ? 'Specific Prep' : week.phase === 3 ? 'Pre Competition' : 'Competition'}`}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead><tr className="border-b border-retro-gray-light/30"><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Hari</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Tanggal</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Aktivitas</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Jarak</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Pace</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Detail Program</th></tr></thead>
                    <tbody>{week.days.map((d, idx) => (<tr key={idx} className={clsx("border-b border-retro-gray-light/10 last:border-0", d.activity === "Istirahat" ? "opacity-30" : "")}><td className="px-6 py-4 font-retro text-retro-white">{d.day}</td><td className="px-6 py-4 font-mono text-xs text-retro-white/70">{d.date ? new Date(`${d.date}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td><td className="px-6 py-4"><span className={clsx("font-sport text-sm", d.activity !== "Easy Run" && d.activity !== "Istirahat" && d.activity !== "Shakeout Run" ? "text-retro-green" : "text-retro-white/80")}>{d.activity} {getTrainingType(d.activity) && <span className="ml-2 border border-retro-green/30 px-1 text-[9px] text-retro-green">{getTrainingType(d.activity)}</span>}</span></td><td className="px-6 py-4 font-mono text-sm text-retro-white">{d.distance}</td><td className="px-6 py-4 font-mono text-sm text-retro-white">{d.pace}</td><td className="px-6 py-4 font-mono text-[10px] text-retro-white/50 leading-relaxed italic whitespace-pre-line">{d.details}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-4 sm:flex-row">
            <button onClick={() => setIsExportOpen(true)} className="btn-retro flex-1 border border-retro-green/60 text-retro-green py-4 font-retro tracking-widest hover:bg-retro-green hover:text-retro-black">CETAK PROGRAM</button>
            <button onClick={handleSave} disabled={isSaving} className="btn-retro flex-1 bg-retro-blue text-retro-white py-4 font-retro tracking-widest disabled:opacity-50">{isSaving ? "SAVING..." : "SIMPAN PROGRAM"}</button>
            <button onClick={() => navigate("/calculator")} className="btn-retro flex-1 bg-retro-green text-retro-black py-4 font-retro tracking-widest">KEMBALI KE KALKULATOR</button>
          </div>
        </div>
      )}
    <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} program={{ name: formData.raceName, race_event: formData.raceEvent, level: formData.level, prep_months: dateDuration.months, prep_days: dateDuration.days, start_month: formData.startDate, end_month: formData.endDate, program_data: generatedProgram }} />
    </section>
  );
}
