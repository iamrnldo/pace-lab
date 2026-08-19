import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import clsx from "clsx";
import { getTrainingType } from "../utils/trainingTypes";
import { buildStructuredSession, buildWeeklyAllocation, calculateSessionMetrics, ensureWorkoutMinimums, getMileageTier, getRecoveryGuidance, getWorkoutRecommendation } from "../utils/workoutLibrary";
import { getMesocycle, getPeriodization, getPostRaceRecoveryPlan, getPostRaceRecoverySchedule, getRecoveryWeekProfile, getSafeQualitySchedule, getTaperMultiplier, TRAINING_BACKGROUNDS } from "../utils/trainingPeriodization";
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

/**
 * Rest tetap merupakan bagian terencana dari program. Detail ini sengaja
 * disimpan di program_data agar tampil konsisten di preview, program tersimpan,
 * serta ekspor PDF/Excel.
 */
const getRestDayDetails = ({ isStrengthDay, phase, isRecoveryWeek }) => {
  if (phase === 4) {
    return "REST & RACE READINESS\nTidak ada latihan lari atau strength berat. Prioritaskan tidur, hidrasi, makan seperti biasa, dan siapkan perlengkapan lomba. Jalan santai 10–15 menit hanya bila tubuh terasa lebih nyaman bergerak.";
  }

  if (isStrengthDay) {
    return `EASY DAY + STRENGTH TRAINING${isRecoveryWeek ? " (volume ringan)" : ""}\nTujuan: membangun stabilitas tanpa menambah kelelahan lari.\n• Pemanasan: 5–10 menit jalan santai atau mobility pinggul/pergelangan kaki.\n• Strength: 2–3 set × 8–12 repetisi: squat atau split squat, glute bridge, calf raise, plank, dan dead bug.\n• Intensitas: ringan–sedang; sisakan 2–3 repetisi, jangan sampai gagal.\n• Pendinginan: mobility lembut 5 menit. Hentikan atau kurangi bila kaki masih berat dari sesi kualitas/long run.`;
  }

  return `REST DAY + ACTIVE RECOVERY\nTidak ada lari terjadwal. Fokus pada adaptasi tubuh setelah latihan.\n• Pilihan: jalan santai 20–30 menit atau mobility ringan 10 menit bila terasa enak.\n• Recovery: tidur cukup, hidrasi, dan makan seimbang dengan protein serta karbohidrat.\n• Hindari: interval, long run, strength berat, atau aktivitas baru yang membuat pegal.\n• Jika ada nyeri tajam, nyeri yang mengubah pola lari, atau lelah berlebih: istirahat total dan evaluasi kondisi.`;
};

export default function CreateTrainingProgramPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const vcrData = location.state?.vcrData;

  const [formData, setFormData] = useState({
    raceName: "",
    raceEvent: "5K",
    level: "beginner",
    trainingBackground: "consistent",
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
      "5K": { beginner: 16, intermediate: 24 },
      "10K": { beginner: 25, intermediate: 30 },
      "Half Marathon": { beginner: 24, intermediate: 40 },
      "Full Marathon": { beginner: 30, intermediate: 50 },
    };

    const baseMileage = mileageMap[formData.raceEvent]?.[formData.level] || 20;
    const phasePlan = getPeriodization({ raceEvent: formData.raceEvent, weeks, trainingBackground: formData.trainingBackground });
    const foundationWeeks = phasePlan.filter((item) => item.phase === 1).length;
    const taperWeeks = phasePlan.filter((item) => item.isTaper).length;
    const lastSpecificPrepWeek = Math.max(1, phasePlan.reduce((last, item, index) => (!item.isTaper && item.phase <= 2 ? index + 1 : last), 1));
    const is5K = formData.raceEvent === "5K";
    const isShortPreparation = is5K && dateDuration.months <= 2;
    const isBeginner = formData.level === "beginner";
    const shakeoutDay5K = formData.trainingDays.includes("Sabtu") ? "Sabtu" : formData.trainingDays.filter((d) => d !== "Minggu").slice(-1)[0];
    const tenKShakeoutDays = formData.trainingDays.filter((d) => d !== "Minggu").slice(-2);
    const halfMarathonShakeoutDays = formData.trainingDays.filter((d) => d !== "Minggu").slice(-2);

    const getPace = (label) => {
      const found = vcrData.intervals.find((i) => i.label === label);
      return found ? found.pacePerKm : vcrData.basePacePerKm;
    };

    const baseEPace = getPace("70%"), baseMPace = getPace("80%"), baseTPace = getPace("90%"), baseIPace = getPace("100%");

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

    const paceToSeconds = (pace) => {
      const [minutes, seconds] = String(pace || "").split(":").map(Number);
      return Number.isFinite(minutes) && Number.isFinite(seconds) ? (minutes * 60) + seconds : null;
    };
    const durationDistanceKm = (minutes, pace) => {
      const secondsPerKm = paceToSeconds(pace);
      return secondsPerKm ? (Number(minutes) * 60) / secondsPerKm : 0;
    };
    const raceDistanceKm = { "5K": 5, "10K": 10, "Half Marathon": 21.1, "Full Marathon": 42.195 };
    // Header mileage is calculated from the sessions actually shown in the
    // table (main-set/run distance + race distance), not only a phase target.
    const getListedDistanceKm = (session, easyPace) => calculateSessionMetrics({
      ...session, easyPace: easyPace || baseEPace, raceDistanceKm: raceDistanceKm[formData.raceEvent] || 0,
    }).mainDistanceKm;

    // Target peak mileage dicapai di akhir fase Specific Preparation.
    const peakRanges = {
      "5K": { beginner: [16, 25], intermediate: [24, 35] },
      "10K": { beginner: [25, 35], intermediate: [30, 40] },
      "Half Marathon": { beginner: [32, 48], intermediate: [40, 60] },
      "Full Marathon": {
        beginner: [50, 64],
        intermediate: [64, 88],
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
    const calculatedPeakMileage = peakMin + (peakMax - peakMin) * durationProgress;
    // Mileage awal general preparation harus berada di bawah peak.
    // Peak 5K 16–24 km hanya dicapai di akhir Specific Preparation.
    // Duration selects a point inside each peak range. Training background
    // selects the starting baseline for every race and level.
    const peakMileage = calculatedPeakMileage;
    const backgroundStartFractions = {
      beginner: { returning: 0.60, consistent: 0.70, structured: 0.80 },
      intermediate: { returning: 0.65, consistent: 0.75, structured: 0.90 },
    };
    const backgroundStartFraction = backgroundStartFractions[formData.level]?.[formData.trainingBackground] || 0.70;
    const startMileage = peakMileage * backgroundStartFraction;
    let previousWeeklyMileage = null;
    const recentWeeklyMileages = [];

    for (let w = 1; w <= weeks; w++) {
      const phaseInfo = phasePlan[w - 1];
      const phase = phaseInfo.phase;
      const isTaper = phaseInfo.isTaper;
      const mesocycle = getMesocycle({ productPhase: phaseInfo.productPhase, raceEvent: formData.raceEvent, week: w, totalWeeks: weeks, trainingBackground: formData.trainingBackground, level: formData.level });
      const isIntermediate = formData.level === "intermediate";
      const trainingLoadProfile = isIntermediate
        ? { label: formData.trainingBackground === "structured" ? "Intermediate / Structured Load" : "Intermediate Load", maxQualitySessions: 2, notes: "Volume awal lebih tinggi, Q2 tersedia bila aman, dan workout lebih kompleks." }
        : { label: "Beginner Load", maxQualitySessions: 1, notes: "Satu quality stimulus, progression konservatif, dan recovery lebih panjang." };
      const isIntermediateDistance = ["10K", "Half Marathon"].includes(formData.raceEvent) && isIntermediate;
      const mileageTier = getMileageTier(formData.raceEvent, formData.level, peakMileage);
      const specificWeek = phase === 2 ? w - foundationWeeks : 0;
      const specificProgress = phase === 2 ? specificWeek / Math.max(1, lastSpecificPrepWeek - foundationWeeks) : 0;
      const workoutRecommendation = getWorkoutRecommendation({ raceEvent: formData.raceEvent, level: formData.level, mileageTier, phase, week: w, specificProgress, specificWeek });
      const qualitySchedule = getSafeQualitySchedule(formData.trainingDays);
      const allowPrimaryQuality = Boolean(qualitySchedule.q1);
      const allowSecondaryQuality = workoutRecommendation.recommendedQualitySessions > 1 && mesocycle.maxQualitySessions > 1 && qualitySchedule.hasSafeSecondary;
      // Tier selects workout complexity and number of Q sessions. Volume of a
      // selected Daniels quality type is calculated from its own percentage.
      const qualityFactor = isIntermediate ? 1 : 0.8;
      const ePace = intensifyPace(progressivePace(baseEPace, w), isIntermediateDistance ? 0.03 : 0);
      const mPace = intensifyPace(progressivePace(baseMPace, w), isIntermediateDistance ? 0.02 : 0);
      const tPace = intensifyPace(progressivePace(baseTPace, w), isIntermediateDistance ? 0.05 : 0);
      const iPace = intensifyPace(progressivePace(baseIPace, w), isIntermediateDistance ? 0.08 : 0);
      const thresholdPrescriptionDistance = durationDistanceKm(
        workoutRecommendation.threshold.blocks * workoutRecommendation.threshold.minutes,
        tPace,
      );
      // 3. MILLEAGE LOGIC (Mesocycle 3:1)
      const weekInCycle = (w - 1) % 4;
      const defaultRecoveryWeek = weekInCycle === 3 && w !== lastSpecificPrepWeek && phase < 3;
      let isRecoveryWeek = typeof mesocycle.isRecovery === "boolean" ? mesocycle.isRecovery : defaultRecoveryWeek;
      const recoveryProfile = getRecoveryWeekProfile({ raceEvent: formData.raceEvent, level: formData.level, mileageTier });
      const effectiveQualityFactor = qualityFactor * mesocycle.qualityMultiplier * (isRecoveryWeek ? recoveryProfile.qualityMultiplier : 1);
      let weeklyMileage;

      if (isTaper) {
          const taperIndex = phasePlan.slice(0, w).filter((item) => item.isTaper).length - 1;
          weeklyMileage = peakMileage * getTaperMultiplier({ raceEvent: formData.raceEvent, taperIndex, taperWeeks });
          isRecoveryWeek = false;
      } else {
          // Naik bertahap dari mileage awal menuju peak mileage.
          // Peak tercapai tepat di minggu terakhir Specific Preparation.
          const buildProgress = Math.min(1, w / Math.max(1, lastSpecificPrepWeek));
          const plannedMileage = startMileage + (peakMileage - startMileage) * buildProgress;
          const cycleMultiplier = [1.0, 1.05, 1.1, 1.0][weekInCycle];
          weeklyMileage = plannedMileage * (isRecoveryWeek ? recoveryProfile.mileageMultiplier : cycleMultiplier);
          // Do not let a recovery week drop more than 20% from the actual
          // preceding week. This uses the final prescribed mileage, not a raw plan.
          const rollingMileageBaseline = recentWeeklyMileages.length
            ? recentWeeklyMileages.reduce((sum, mileage) => sum + mileage, 0) / recentWeeklyMileages.length
            : null;
          // Source-informed hybrid: Marathon builds more conservatively than
          // 10K, while HM sits between them. Volume is kept stable; recovery
          // reduces quality first and only slightly lowers total mileage.
          const buildRates = { "5K": 0.05, "10K": 0.05, "Half Marathon": 0.05, "Full Marathon": 0.04 };
          const recoveryReductions = { "5K": 0.10, "10K": 0.08, "Half Marathon": 0.07, "Full Marathon": 0.05 };
          const buildRate = buildRates[formData.raceEvent] || 0.05;
          const recoveryReduction = recoveryReductions[formData.raceEvent] || 0.08;
          if (isRecoveryWeek && previousWeeklyMileage) {
            // Keep a recovery week 2–10% below the preceding build week,
            // rather than creating an abrupt mileage collapse.
            weeklyMileage = Math.min(
              Math.max(weeklyMileage, previousWeeklyMileage * (1 - recoveryReduction)),
              previousWeeklyMileage * 0.98,
            );
          }
          if (w === lastSpecificPrepWeek) weeklyMileage = peakMileage;
          if (previousWeeklyMileage && !isRecoveryWeek) {
            const earnedMileageCeiling = Math.min(
              previousWeeklyMileage * (1 + buildRate),
              (rollingMileageBaseline || previousWeeklyMileage) * (1 + buildRate),
            );
            // Outside taper/recovery, avoid an unexplained mileage decline.
            weeklyMileage = Math.max(previousWeeklyMileage, Math.min(weeklyMileage, earnedMileageCeiling));
          }
      }

      const peakLongRunRanges = {
        "5K": { beginner: [5, 7], intermediate: [8, 10] },
        "10K": { beginner: [9, 11], intermediate: [12, 15] },
        "Half Marathon": { beginner: [16, 19], intermediate: [19, 22] },
        "Full Marathon": { beginner: [28, 32], intermediate: [32, 36] },
      };
      const configuredPeakLongRun = peakLongRunRanges[formData.raceEvent]?.[formData.level];
      const targetPeakLongRun = configuredPeakLongRun
        ? configuredPeakLongRun[0] + ((configuredPeakLongRun[1] - configuredPeakLongRun[0]) * durationProgress)
        : null;
      const longRunCaps = {
        "5K": targetPeakLongRun || 7,
        "10K": targetPeakLongRun || 11,
        "Half Marathon": targetPeakLongRun || 18,
        "Full Marathon": targetPeakLongRun || 35,
      };
      const easyRunCaps = { "5K": 4, "10K": 7, "Half Marathon": 21, "Full Marathon": 42 };
      // Core weekly allocation policy: Long Run receives 30% of weekly
      // mileage; taper/recovery still reduce it through mesocycle rules.
      const longRunRatio = 0.30;
      // HM tetap dibatasi maksimal 18 km sesuai batas yang ditetapkan.
      let longRunMileage = Math.min(
        weeklyMileage * (phase === 1 ? Math.min(longRunRatio, 0.25) : longRunRatio),
        longRunCaps[formData.raceEvent] || weeklyMileage * longRunRatio,
      ) * mesocycle.longRunMultiplier;
      // Peak long run follows the configured HM/FM range, while keeping a
      // hard upper bound of 50% weekly mileage at the single peak week.
      if (formData.raceEvent === "Half Marathon" && formData.level === "beginner" && phase === 1) {
        longRunMileage = Math.max(6, Math.min(8, longRunMileage));
      }
      if (w === lastSpecificPrepWeek && targetPeakLongRun) {
        longRunMileage = Math.min(targetPeakLongRun, weeklyMileage * 0.5);
      }
      const beginnerShortTempoWindow = !is5K || !isBeginner || !isShortPreparation || w > weeks - 4;
      const allowInterval = !is5K || !isBeginner || !isShortPreparation;
      const allowTempo = beginnerShortTempoWindow;
      const primaryType = workoutRecommendation.primarySession.type;
      const secondaryType = workoutRecommendation.secondarySession.type;
      const defaultIntervalReps = { "5K": [400, 600, 800], "10K": [800, 1000, 1200, 1600], "Half Marathon": [1000, 1200, 1600], "Full Marathon": [800, 1000, 1200] };
      const getRoundedIntervalMainSet = (targetKm, repsOptions) => {
        const options = repsOptions?.length ? repsOptions : (defaultIntervalReps[formData.raceEvent] || defaultIntervalReps["5K"]);
        const repDistance = options[Math.max(0, w - foundationWeeks - 1) % options.length];
        const repetitions = Math.floor((Number(targetKm) * 1000) / repDistance);
        return { repDistance, repetitions, distanceKm: (repetitions * repDistance) / 1000 };
      };
      const isStructuredEnduranceOrTenK = formData.trainingBackground === "structured" && ["10K", "Half Marathon", "Full Marathon"].includes(formData.raceEvent);
      const minimumQualityDistance = isStructuredEnduranceOrTenK
        ? (formData.level === "intermediate"
          ? (["Half Marathon", "Full Marathon"].includes(formData.raceEvent) ? 3 : 2.5)
          : 2)
        : 1;
      // Tempo progresses universally from 10% at the start of Specific
      // Preparation to 15% at its end, regardless of race/level/background.
      // Taper can still reduce the final session through mesocycle multiplier.
      const tempoProgress = phase === 2
        ? Math.min(1, Math.max(0, specificProgress))
        : phase >= 3 ? 1 : 0;
      const tempoFraction = 0.10 + (0.05 * tempoProgress);
      // Interval follows the same 10%→15% progression when it is prescribed.
      const intervalFraction = 0.10 + (0.05 * tempoProgress);
      const danielsVolumeFraction = { T: tempoFraction, I: intervalFraction, R: 0.05, M: 0.10 };
      const primaryQualityFraction = danielsVolumeFraction[primaryType] || 0.10;
      const secondaryQualityFraction = danielsVolumeFraction[secondaryType] || 0.10;
      // In Pre-Competition the sole quality session is Tempo, even when the
      // normal secondary workout would be M Pace. Use the T percentage.
      const activeTempoFraction = phase === 3 ? tempoFraction : secondaryQualityFraction;
      // Use the previous actual programmed mileage as the quality budget.
      // Phase target is only a planning reference and must not inflate T/I/R/M.
      const qualityMileageBasis = previousWeeklyMileage || weeklyMileage;
      const intervalCap = primaryType === "I" ? Math.min(qualityMileageBasis * primaryQualityFraction, 10) : qualityMileageBasis * primaryQualityFraction;
      const tempoCap = secondaryType === "I" && phase !== 3 ? Math.min(qualityMileageBasis * activeTempoFraction, 10) : Math.min(qualityMileageBasis * activeTempoFraction, 24);
      // T/I percentages are core volume rules and never dip below 10% once
      // the session is scheduled; mesocycle still controls session frequency.
      const primaryLoadMultiplier = ["T", "I"].includes(primaryType) ? 1 : mesocycle.qualityMultiplier;
      const activeTempoType = phase === 3 ? "T" : secondaryType;
      const secondaryLoadMultiplier = ["T", "I"].includes(activeTempoType) ? 1 : mesocycle.qualityMultiplier;
      let intervalMileage = (phase === 2 && !isRecoveryWeek && allowInterval) ? Math.min(qualityMileageBasis * primaryQualityFraction * primaryLoadMultiplier, intervalCap) : 0;
      let tempoMileage = ((phase === 2 || phase === 3) && !isRecoveryWeek && allowTempo) ? Math.min(qualityMileageBasis * activeTempoFraction * secondaryLoadMultiplier, tempoCap) : 0;
      // Weekly mileage is the source of truth. Quality prescriptions are
      // scaled to the available weekly budget instead of inflating the week.
      let appliedThreshold = workoutRecommendation.threshold;
      let appliedMarathonBlocks = workoutRecommendation.marathonPace.blocks;
      const fitThresholdToBudget = (budgetKm) => {
        const distanceKm = Math.max(0, budgetKm);
        const totalSeconds = Math.max(0, Math.round(distanceKm * paceToSeconds(tPace)));
        // Pre-Competition/Taper uses two controlled blocks; earlier phases can
        // stay continuous unless the library already prescribes intervals.
        const blocks = phase >= 3 && totalSeconds >= 600 ? 2 : 1;
        const blockSeconds = Math.floor(totalSeconds / blocks);
        const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
        const fittedDistance = (blockSeconds * blocks) / paceToSeconds(tPace);
        return {
          distanceKm: fittedDistance,
          workout: {
            ...appliedThreshold,
            blocks,
            minutes: Math.floor(blockSeconds / 60),
            label: blocks > 1
              ? `${blocks} × ${formatDuration(blockSeconds)} menit T (sesuai ${Math.round((fittedDistance / qualityMileageBasis) * 100)}% mileage mingguan)`
              : `${formatDuration(blockSeconds)} menit T kontinu (sesuai ${Math.round((fittedDistance / qualityMileageBasis) * 100)}% mileage mingguan)`,
          },
        };
      };
      const fitMarathonBlocksToBudget = (budgetKm) => {
        const blockCount = Math.max(1, workoutRecommendation.marathonPace.blocks.length);
        const total = Math.max(0, budgetKm);
        const perBlock = Number((total / blockCount).toFixed(1));
        const blocks = Array.from({ length: blockCount }, () => perBlock);
        // Correct final block for decimal rounding so displayed blocks equal budget.
        blocks[blocks.length - 1] = Number((total - blocks.slice(0, -1).reduce((sum, block) => sum + block, 0)).toFixed(1));
        return blocks.filter((block) => block > 0);
      };
      if (primaryType === "T" && intervalMileage > 0) {
        const fitted = fitThresholdToBudget(Math.min(intervalMileage, qualityMileageBasis * primaryQualityFraction));
        intervalMileage = fitted.distanceKm;
        appliedThreshold = fitted.workout;
      }
      if (primaryType === "I" && intervalMileage > 0) {
        const mainSet = getRoundedIntervalMainSet(Math.min(intervalMileage, weeklyMileage * 0.08), workoutRecommendation.primarySession.reps);
        intervalMileage = mainSet.distanceKm;
      }
      if (primaryType === "R" && intervalMileage > 0) {
        const rPlan = workoutRecommendation.repetition;
        const repetitions = Math.min(rPlan.maxReps, Math.floor((Number(intervalMileage) * 1000) / rPlan.repDistance));
        intervalMileage = repetitions > 0 ? (repetitions * rPlan.repDistance) / 1000 : 0;
      }
      if (secondaryType === "T" && allowSecondaryQuality && tempoMileage > 0) {
        const fitted = fitThresholdToBudget(Math.min(tempoMileage, qualityMileageBasis * secondaryQualityFraction));
        tempoMileage = fitted.distanceKm;
        appliedThreshold = fitted.workout;
      }
      if (secondaryType === "I" && allowSecondaryQuality && tempoMileage > 0) {
        const mainSet = getRoundedIntervalMainSet(Math.min(tempoMileage, weeklyMileage * 0.08), workoutRecommendation.secondarySession.reps);
        tempoMileage = mainSet.distanceKm;
      }
      if (secondaryType === "M" && allowSecondaryQuality && tempoMileage > 0) {
        appliedMarathonBlocks = fitMarathonBlocksToBudget(tempoMileage);
        tempoMileage = appliedMarathonBlocks.reduce((sum, block) => sum + block, 0);
      }
      let easyMileage = weeklyMileage - longRunMileage - intervalMileage - tempoMileage;
      if (!allowPrimaryQuality) {
        easyMileage += intervalMileage;
        intervalMileage = 0;
      }
      if (!allowSecondaryQuality && (phase === 2 || !allowPrimaryQuality)) {
        easyMileage += tempoMileage;
        tempoMileage = 0;
      }
      // Jangan membuat sesi kualitas di bawah 1 km; pindahkan volumenya ke sesi lain.
      if (intervalMileage > 0 && intervalMileage < minimumQualityDistance) {
        tempoMileage >= minimumQualityDistance ? (tempoMileage += intervalMileage) : (easyMileage += intervalMileage);
        intervalMileage = 0;
      }
      if (tempoMileage > 0 && tempoMileage < minimumQualityDistance) {
        easyMileage += tempoMileage;
        tempoMileage = 0;
      }
      const easyDays = Math.max(1, formData.trainingDays.filter((d) => d !== "Minggu" && d !== "Sabtu").length - ((intervalMileage > 0 ? 1 : 0) + (tempoMileage > 0 ? 1 : 0)));
      // Easy Run must stay below Long Run. Any excess is assigned to an
      // existing quality session; if no quality session exists it extends L.
      const perEasyRunCap = Math.min(easyRunCaps[formData.raceEvent] || 8, Math.max(2, longRunMileage * 0.8));
      const easyCapacity = easyDays * perEasyRunCap;
      const overflowMileage = Math.max(0, easyMileage - easyCapacity);
      easyMileage = Math.min(easyMileage, easyCapacity);
      // Easy mileage remains the remainder. It is never redistributed into
      // Tempo/Interval/M-Pace, so quality percentages stay exact. If available
      // easy days cannot absorb the target while remaining below Long Run, the
      // displayed Total Mileage Program stays below Target phase transparently.
      if (overflowMileage > 0) {
        // Keep the unallocated amount out of quality sessions by design.
      }
      // Pastikan perubahan distribusi tidak membuat quality session di bawah 1 km.
      if (intervalMileage > 0 && intervalMileage < minimumQualityDistance) {
        if (allowTempo) tempoMileage += intervalMileage;
        else easyMileage += intervalMileage;
        intervalMileage = 0;
      }
      if (tempoMileage > 0 && tempoMileage < minimumQualityDistance) {
        easyMileage += tempoMileage;
        tempoMileage = 0;
      }

      const weeklyAllocation = buildWeeklyAllocation({
        targetMileage: weeklyMileage,
        longRunKm: longRunMileage,
        easyKm: easyMileage,
        primaryType,
        primaryKm: intervalMileage,
        secondaryType: phase === 3 ? "T" : secondaryType,
        secondaryKm: tempoMileage,
        phase: phaseInfo.productPhase,
        mesocycle: mesocycle.name,
      });
      const strengthDay = DAYS.find((day) => !formData.trainingDays.includes(day)) || null;
      program.push({
        week: w,
        mileage: weeklyMileage.toFixed(1),
        phase,
        productPhase: phaseInfo.productPhase,
        isTaper,
        trainingBackground: formData.trainingBackground,
        trainingLoadProfile,
        qualitySchedule: { q1: qualitySchedule.q1, q2: qualitySchedule.q2, note: qualitySchedule.reason },
        mesocycle,
        weeklyAllocation,
        recoveryNote: isRecoveryWeek ? recoveryProfile.note : null,
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
          if (date === formData.endDate) return { day, date, activity: "RACE DAY", pace: "Target Lomba", distance: formData.raceEvent, details: `RACE DAY — mulai terkendali, ikuti strategi pace, dan berikan yang terbaik.\n\nRecovery pasca-race: ${getPostRaceRecoveryPlan(formData.raceEvent)}` };
          if (!formData.trainingDays.includes(day)) {
            return {
              day, date, activity: "Istirahat", pace: "-", distance: "-",
              details: getRestDayDetails({ isStrengthDay: day === strengthDay, phase, isRecoveryWeek }),
            };
          }

          let activity = "Easy Run", pace = ePace, details = "Lari santai, fokus pada form dan pernapasan.";
          
          const daysToRace = Math.round((new Date(`${formData.endDate}T00:00:00`) - calendarDate) / 86400000);
          // Competition week follows race-specific Daniels guidance rather than
          // reducing every pre-race session to a shakeout run.
          if (daysToRace >= 1 && daysToRace <= 6) {
            const easyDistance = Math.max(2, Math.min(Number(weeklyAllocation.longRunKm.toFixed(1)) * 0.35, 8)).toFixed(1);
            const isShortRace = ["5K", "10K"].includes(formData.raceEvent);

            if (isShortRace && daysToRace === 5) {
              return { day, date, activity: "Tempo Run", pace: tPace, distance: "3.0 Km", details: `RACE TUNE-UP 5K/10K
Warm-up: 10–15 menit Easy
Program inti: 2 × 5 menit @ T-Pace (${tPace}/km), recovery 2 menit jog ringan.
Cool-Down: 10 menit Easy.
Referensi Phase IV Daniels: T menjadi fokus; sisakan 2–3 Easy day sebelum race.` };
            }
            if (isShortRace && [3, 2].includes(daysToRace)) {
              return { day, date, activity: "Easy Run + Strides", pace: ePace, distance: `${easyDistance} Km`, details: "Easy day pre-race. Lari sangat nyaman; setelahnya 4–6 strides × 15–20 detik dengan recovery penuh. Bukan sprint dan hentikan bila kaki terasa berat." };
            }

            if (formData.raceEvent === "Half Marathon") {
              if (daysToRace === 6) return { day, date, activity: "Long Run", pace: ePace, distance: `${(Number(weeklyAllocation.longRunKm.toFixed(1)) * (2 / 3)).toFixed(1)} Km`, details: "PRERACE HM — 2/3 dari Long Run normal pada Easy effort. Referensi Daniels 15K–30K prerace week: Race −6 days = 2/3 normal L Run." };
              if (daysToRace === 3) return { day, date, activity: "Tempo Run", pace: tPace, distance: "3.0 Km", details: `PRERACE HM — 3 × 1 km @ T-Pace (${tPace}/km), recovery 2 menit jog ringan. Referensi Daniels: Race −3 days = 3 × 1 T dengan 2 menit recovery.` };
              if ([5, 4, 2].includes(daysToRace)) return { day, date, activity: "Easy Run", pace: ePace, distance: `${easyDistance} Km`, details: "Easy day prerace Half Marathon. Jaga langkah santai dan akhiri saat tubuh terasa segar." };
            }

            if (formData.raceEvent === "Full Marathon") {
              if (daysToRace === 6) return { day, date, activity: "Long Run", pace: ePace, distance: "60–90 menit", details: "MARATHON RACE WEEK — Long Run Easy pendek dan terkontrol; jangan mengejar jarak. Terinspirasi minggu terakhir program marathon Daniels yang masih mempertahankan L Run Easy, tetapi lebih pendek." };
              if (daysToRace === 4) return { day, date, activity: "Tempo Run", pace: tPace, distance: "20 menit", details: `MARATHON RACE WEEK — 20 menit @ T-Pace (${tPace}/km) setelah pemanasan Easy, lalu cool-down. Jaga stimulus tanpa menambah fatigue.` };
              if ([5, 3, 2].includes(daysToRace)) return { day, date, activity: "Easy Run", pace: ePace, distance: `${easyDistance} Km`, details: "Easy day marathon prerace: lari rileks di rute datar, tanpa strides atau latihan baru." };
            }

            if (daysToRace === 1) return { day, date, activity: "Shakeout Run", pace: ePace, distance: "20–30 menit", details: "SHAKEOUT PRE-RACE — sangat ringan untuk menjaga kaki tetap segar. Tidak ada pace target, interval, atau strength berat." };
            return { day, date, activity: "Easy Run", pace: ePace, distance: `${easyDistance} Km`, details: "Easy day pre-race. Fokus pada kesegaran, hidrasi, dan tidur; jangan mengejar mileage." };
          }

          // P0: Q2 hanya tersedia jika ada minimal satu Easy/Rest day di antara Q1 dan Q2.
          const { q1, q2 } = qualitySchedule;

          let distance = 0;
          if (day === "Minggu" || (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))) {
            activity = "Long Run";
            const timeBasedLongRun = isBeginner && phase === 1 && w <= 2;
            const longRunTimeByRace = { "5K": 40, "10K": 45, "Half Marathon": 50, "Full Marathon": 60 };
            const longRunMinutes = (longRunTimeByRace[formData.raceEvent] || 40) + ((w - 1) * 5);
            if (timeBasedLongRun) pace = "-";
            distance = timeBasedLongRun ? `${longRunMinutes} menit` : weeklyAllocation.longRunKm.toFixed(1);
            const hasMarathonBlocks = (isIntermediate || mileageTier === "high") && ["Half Marathon", "Full Marathon"].includes(formData.raceEvent) && phase === 2 && w % 2 === 0;
            const blockDistance = Math.max(1, Number(weeklyAllocation.longRunKm.toFixed(1)) * 0.2).toFixed(1);
            details = timeBasedLongRun
              ? `Long Run berbasis waktu: ${longRunMinutes} menit Easy effort. Fokus durasi, bukan mengejar jarak atau pace.`
              : hasMarathonBlocks
                ? `Long Run race-specific: Easy effort dengan 2 × ${blockDistance} km @ M-Pace (${mPace}/km). Antarblok lakukan ${getRecoveryGuidance({ paceType: "M", level: formData.level, phase, mileageTier })}`
                : (w === lastSpecificPrepWeek) ? "PEAK LONGRUN: Jarak maksimal sebelum tapering." : "Steady pace, membangun daya tahan aerobik.";
          } else if (day === q1 && (weeklyAllocation.primary.km > 0 || (phase === 3 && weeklyAllocation.secondary.km > 0))) {
            if (weeklyAllocation.primary.km > 0) {
              const primarySession = workoutRecommendation.primarySession;
              if (primarySession?.type === "R") {
                activity = "Repetition Run"; pace = iPace; distance = weeklyAllocation.primary.km.toFixed(1);
                const { repDistance, maxReps, focus } = workoutRecommendation.repetition;
                const reps = Math.max(4, Math.min(maxReps, Math.round((Number(distance) * 1000) / repDistance)));
                const total = (reps * repDistance) / 1000;
                details = `Warm-up: 12 menit Easy jog + drills\n\nProgram inti: ${reps} × ${repDistance}m @ R-Pace (${iPace}/km)\nFokus: ${focus}.\n${getRecoveryGuidance({ paceType: "R", level: formData.level, phase, mileageTier })}\nTotal repetition sekitar ${total.toFixed(1)} km (maksimal 5% mileage mingguan)\n\nCool-Down: 10 menit Easy jog.`;
              } else if (primarySession?.type === "T") {
                activity = "Tempo Run"; pace = tPace; distance = weeklyAllocation.primary.km.toFixed(1);
                const threshold = appliedThreshold;
                details = `Warm-up: 12 menit Easy jog\nProgram inti: ${threshold.label} @ T-Pace (${tPace}/km)\nFokus: ${primarySession.focus}.\nRecovery antarblok: ${threshold.recovery}. ${getRecoveryGuidance({ paceType: "T", level: formData.level, phase, mileageTier })}\nCool-Down: 8–10 menit Easy jog.`;
              } else {
                activity = "Interval Run"; pace = iPace; distance = weeklyAllocation.primary.km.toFixed(1);
              const defaultReps = { "5K": [400, 600, 800], "10K": [800, 1000, 1200, 1600], "Half Marathon": [1000, 1200, 1600], "Full Marathon": [800, 1000, 1200] };
              const availableReps = primarySession?.reps || defaultReps[formData.raceEvent] || defaultReps["5K"];
              const intervalWeek = Math.max(0, w - foundationWeeks - 1);
              const repDistance = availableReps[intervalWeek % availableReps.length];
              const targetMeters = Math.round(Number(distance) * 1000);
              const reps = Math.max(2, Math.ceil(targetMeters / repDistance));
              const totalMeters = reps * repDistance;
              pace = iPace;
              details = `Warm-up: 12 menit Easy jog + drills\n\nProgram inti: ${reps} × ${repDistance}m @ I-Pace (${iPace}/km)\nFokus: ${primarySession?.focus || "aerobic power terkontrol"}.\n${getRecoveryGuidance({ paceType: "I", level: formData.level, phase, mileageTier })}\nTotal interval sekitar ${(totalMeters / 1000).toFixed(1)} km (maksimal 8% mileage mingguan atau 10 km)\n\nCool-Down: 10 menit Easy jog.`;
              }
            } else {
              activity = "Tempo Run"; pace = tPace; distance = weeklyAllocation.secondary.km.toFixed(1);
              const threshold = appliedThreshold;
              details = `Warm-up: 12 menit Easy | Program inti: ${threshold.label} @ T-Pace (${tPace}/km) | Recovery antarblok: ${threshold.blocks > 1 ? "2 menit jog ringan" : "tanpa jeda"} | ${getRecoveryGuidance({ paceType: "T", level: formData.level, phase, mileageTier })} | Cool-Down: 8–10 menit Easy jog.`;
              if (phase === 3) details = "(Pre-Competition) Menjaga intensitas dengan volume terkontrol. " + details;
            }
          } else if (day === q2 && weeklyAllocation.secondary.km > 0 && (phase === 2 || phase === 3) && allowSecondaryQuality) {
             const secondarySession = workoutRecommendation.secondarySession;
             distance = weeklyAllocation.secondary.km.toFixed(1);
             if (secondarySession?.type === "M") {
               activity = "Marathon Pace"; pace = mPace;
               const mPlan = workoutRecommendation.marathonPace;
               details = `Warm-up: 12 menit Easy jog\nProgram inti: ${appliedMarathonBlocks.map((block) => `${block} km`).join(" + ")} @ M-Pace (${mPace}/km)\nFokus: ${mPlan.focus}. Recovery antarblok: ${mPlan.recovery}.\n${getRecoveryGuidance({ paceType: "M", level: formData.level, phase, mileageTier })}\nCool-Down: 8–10 menit Easy jog.`;
             } else if (secondarySession?.type === "I") {
               activity = "Interval Run"; pace = iPace;
               const mainSet = getRoundedIntervalMainSet(Number(distance), secondarySession.reps);
               const { repDistance, repetitions: reps } = mainSet;
               details = `Warm-up: 12 menit Easy jog + drills\nProgram inti: ${reps} × ${repDistance}m @ I-Pace (${iPace}/km)\nFokus: ${secondarySession.focus}.\n${getRecoveryGuidance({ paceType: "I", level: formData.level, phase, mileageTier })}\nTotal interval sekitar ${((reps * repDistance) / 1000).toFixed(1)} km (maksimal 8% mileage mingguan atau 10 km)\nCool-Down: 10 menit Easy jog.`;
             } else {
               activity = "Tempo Run"; pace = tPace;
               const threshold = appliedThreshold;
               details = `Main: ${threshold.label} @ T-Pace (${tPace}/km)\nRecovery antarblok: ${threshold.recovery}. ${getRecoveryGuidance({ paceType: "T", level: formData.level, phase, mileageTier })}`;
             }
          } else {
            const qualityUsed = (day === q1 && (weeklyAllocation.primary.km > 0 || (phase === 3 && weeklyAllocation.secondary.km > 0))) || (day === q2 && weeklyAllocation.secondary.km > 0 && phase === 2);
            const qualityDaysCount = (weeklyAllocation.primary.km > 0 ? 1 : 0) + (weeklyAllocation.secondary.km > 0 && allowSecondaryQuality && q2 ? 1 : 0);
            const easyRunCaps = { "5K": 6.0, "10K": 8.0, "Half Marathon": 12.0, "Full Marathon": 16.0 };
            const easyRunCap = easyRunCaps[formData.raceEvent] || 8.0;
            const easyRunDistance = weeklyAllocation.easyKm / Math.max(1, formData.trainingDays.length - 1 - qualityDaysCount);
            // Long Run must remain the longest scheduled run of the week.
            // Easy runs are capped at 80% of Long Run distance (minimum 2 km).
            const easyVsLongRunCap = Math.max(2, weeklyAllocation.longRunKm * 0.8);
            distance = Math.min(easyRunDistance, easyRunCap, easyVsLongRunCap).toFixed(1);
          }
          const validatedWorkout = ensureWorkoutMinimums({ activity, distance, details });
          return { day, date, activity, pace, distance: validatedWorkout.distance + " Km", details: validatedWorkout.details };
        }),
      });
      const generatedWeek = program[program.length - 1];
      const listedMileage = generatedWeek.days.reduce((sum, session) => sum + getListedDistanceKm(session), 0);
      generatedWeek.targetMileage = weeklyMileage.toFixed(1);
      generatedWeek.mileage = listedMileage.toFixed(1);
      // Next week progresses from work actually prescribed in the table.
      previousWeeklyMileage = listedMileage;
      recentWeeklyMileages.push(listedMileage);
      if (recentWeeklyMileages.length > 3) recentWeeklyMileages.shift();
    }
    // Kalender pemulihan ditambahkan setelah Race Day tanpa mengubah endDate lomba.
    const recoveryDays = getPostRaceRecoverySchedule(formData.raceEvent);
    recoveryDays.forEach((recovery, index) => {
      const recoveryDate = new Date(`${formData.endDate}T00:00:00`);
      recoveryDate.setDate(recoveryDate.getDate() + index + 1);
      const recoveryWeekIndex = weeks + Math.floor(index / 7);
      const weekNumber = recoveryWeekIndex + 1;
      let recoveryWeek = program.find((item) => item.week === weekNumber);
      if (!recoveryWeek) {
        recoveryWeek = { week: weekNumber, mileage: "Recovery", phase: 5, productPhase: "Post-Race Recovery", mesocycle: { name: "Post-Race Recovery", objective: "pulih sebelum kembali ke latihan terstruktur" }, isRecoveryWeek: true, isPostRaceRecovery: true, days: [] };
        program.push(recoveryWeek);
      }
      recoveryWeek.days.push({ day: DAYS[(recoveryDate.getDay() + 6) % 7], date: toDateInput(recoveryDate), ...recovery });
    });

    return program.map((week) => {
      const enhancedDays = week.days.map((day) => {
        const metrics = calculateSessionMetrics({
          ...day,
          easyPace: week.easyPace || baseEPace,
          raceDistanceKm: raceDistanceKm[formData.raceEvent] || 0,
        });
        const quality = ["Tempo Run", "Interval Run", "Repetition Run", "Marathon Pace"].includes(day.activity);
        const totalDistance = metrics.totalDistanceKm;
        const details = quality
          ? `Jarak inti @ target pace (masuk mileage): ${metrics.mainDistanceKm.toFixed(1)} km | Estimasi total fisik sesi: ~${totalDistance.toFixed(1)} km (perkiraan warm-up ${metrics.warmupKm.toFixed(1)} km + recovery ${metrics.recoveryKm.toFixed(1)} km + cool-down ${metrics.cooldownKm.toFixed(1)} km; tidak masuk weekly mileage)\n\n${day.details}`
          : day.details;
        return {
          ...day,
          mainSetDistance: metrics.mainDistanceKm.toFixed(1),
          distance: metrics.mainDistanceKm > 0 ? `${metrics.mainDistanceKm.toFixed(1)} Km` : day.distance,
          details,
          structuredSession: buildStructuredSession({ activity: day.activity, pace: day.pace, distance: day.distance, details: day.details, qSession: day.day === week.qualitySchedule?.q1 ? "Q1" : day.day === week.qualitySchedule?.q2 ? "Q2" : null, metrics }),
        };
      });
      const totalMileage = enhancedDays.reduce((sum, day) => sum + (day.structuredSession.metrics?.mainDistanceKm || 0), 0);
      const intensityVolumes = enhancedDays.reduce((volumes, day) => {
        const type = day.structuredSession.paceType;
        if (["T", "I", "R", "M"].includes(type)) volumes[type] += day.structuredSession.metrics?.mainDistanceKm || 0;
        return volumes;
      }, { T: 0, I: 0, R: 0, M: 0 });
      return {
        ...week,
        targetMileage: week.targetMileage || week.mileage,
        mileage: totalMileage > 0 ? totalMileage.toFixed(1) : week.mileage,
        intensityVolumes,
        weeklyAllocation: {
          ...week.weeklyAllocation,
          actualMileage: totalMileage,
          qualityVolumes: intensityVolumes,
        },
        days: enhancedDays,
      };
    });
  }, [showProgram, vcrData, formData, dateDuration]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/training-program", {
        name: formData.raceName, race_event: formData.raceEvent, level: formData.level,
        prep_months: dateDuration.months, prep_days: dateDuration.days, start_month: formData.startDate, end_month: formData.endDate,
        training_days: formData.trainingDays, training_background: formData.trainingBackground, program_data: generatedProgram,
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
            <div><Label>Kondisi Latihan 4–6 Minggu Terakhir</Label><select value={formData.trainingBackground} onChange={(e) => setFormData({ ...formData, trainingBackground: e.target.value })} className="input-retro w-full">{TRAINING_BACKGROUNDS.map((background) => <option key={background.value} value={background.value}>{background.label}</option>)}</select><p className="mt-2 font-mono text-[10px] text-retro-white/40">Menentukan panjang fase base sebelum sesi spesifik dimulai.</p></div>
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
                <div><span className="font-retro text-2xl text-retro-white uppercase">MINGGU {week.week}</span><p className="font-mono text-[10px] text-retro-white/50 mt-1 uppercase tracking-widest">Total Mileage Program: {week.mileage} Km</p>{week.targetMileage && week.targetMileage !== week.mileage && <p className="font-mono text-[9px] text-retro-white/35 mt-1">Target phase: {week.targetMileage} Km</p>}{week.intensityVolumes && <p className="font-mono text-[9px] text-retro-white/35 mt-1">Main quality: T {week.intensityVolumes.T.toFixed(1)} · I {week.intensityVolumes.I.toFixed(1)} · R {week.intensityVolumes.R.toFixed(1)} · M {week.intensityVolumes.M.toFixed(1)} Km</p>}<p className="font-mono text-[10px] text-retro-white/40 mt-1">{week.startDate || ""} — {week.days?.[6]?.date || ""}</p></div>
                <div className="text-right"><span className="font-mono text-[10px] text-retro-green px-3 py-1 border border-retro-green/30 uppercase">{week.isRecoveryWeek ? `RECOVERY · ${week.mesocycle?.name || ""}` : `${week.productPhase || (week.phase === 1 ? 'General Preparation' : week.phase === 2 ? 'Specific Preparation' : week.phase === 3 ? 'Pre Competition' : 'Competition')}`}</span>{week.mesocycle && <p className="mt-2 font-mono text-[9px] text-retro-white/40">{week.mesocycle.name}: {week.mesocycle.objective}</p>}{week.trainingLoadProfile && <p className="mt-1 font-mono text-[9px] text-retro-white/35">{week.trainingLoadProfile.label} — {week.trainingLoadProfile.notes}</p>}{week.recoveryNote && <p className="mt-1 font-mono text-[9px] text-retro-white/40">{week.recoveryNote}</p>}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead><tr className="border-b border-retro-gray-light/30"><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Hari</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Tanggal</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Aktivitas</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Jarak Inti</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Pace</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Detail Program</th></tr></thead>
                    <tbody>{week.days.map((d, idx) => (<tr key={idx} className={clsx("border-b border-retro-gray-light/10 last:border-0", d.activity === "Istirahat" ? "bg-retro-gray-mid/20" : "")}><td className="px-6 py-4 font-retro text-retro-white">{d.day}</td><td className="px-6 py-4 font-mono text-xs text-retro-white/70">{d.date ? new Date(`${d.date}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td><td className="px-6 py-4"><span className={clsx("font-sport text-sm", d.activity !== "Easy Run" && d.activity !== "Istirahat" && d.activity !== "Shakeout Run" ? "text-retro-green" : "text-retro-white/80")}>{d.activity} {getTrainingType(d.activity) && <span className="ml-2 border border-retro-green/30 px-1 text-[9px] text-retro-green">{getTrainingType(d.activity)}</span>}</span></td><td className="px-6 py-4 font-mono text-sm text-retro-white">{d.distance}</td><td className="px-6 py-4 font-mono text-sm text-retro-white">{d.pace}</td><td className="px-6 py-4 font-mono text-[10px] text-retro-white/50 leading-relaxed italic whitespace-pre-line">{d.details}</td></tr>))}</tbody>
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
