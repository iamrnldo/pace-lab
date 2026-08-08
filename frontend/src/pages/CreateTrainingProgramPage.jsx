import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import clsx from "clsx";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
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
    prepMonths: 4,
    startMonth: "Agustus",
    endMonth: "November",
    trainingDays: ["Selasa", "Kamis", "Sabtu", "Minggu"],
  });

  const [showProgram, setShowProgram] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

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

  const generatedProgram = useMemo(() => {
    if (!showProgram) return null;

    const weeks = formData.prepMonths * 4;
    const program = [];

    // 1. MILLEAGE SCIENCE MAP
    const mileageMap = {
      "5K": { beginner: 16, intermediate: 24 },
      "10K": { beginner: 25, intermediate: 30 },
      "Half Marathon": { beginner: 31, intermediate: 50 },
      "Full Marathon": { beginner: 50, intermediate: 100 },
    };

    const startMileage = mileageMap[formData.raceEvent]?.[formData.level] || 20;
    const foundationWeeks = formData.level === "beginner" ? Math.ceil(weeks * 0.3) : Math.ceil(weeks * 0.2);
    const competitionWeek = weeks;
    const preCompetitionWeeks = 2; // Tapering 2 minggu
    const lastSpecificPrepWeek = competitionWeek - preCompetitionWeeks - 1;

    const getPace = (label) => {
      const found = vcrData.intervals.find((i) => i.label === label);
      return found ? found.pacePerKm : vcrData.basePacePerKm;
    };

    const ePace = getPace("70%"), tPace = getPace("90%"), iPace = getPace("100%");

    // Calculate Peak Reference (Volume tertinggi di akhir Fase 2)
    const peakCycleNumber = Math.floor((lastSpecificPrepWeek - 1) / 4);
    const peakMileage = startMileage * (1 + peakCycleNumber * 0.1) * 1.2;

    for (let w = 1; w <= weeks; w++) {
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
          const cycleStartMileage = startMileage * (1 + cycleNumber * 0.1);
          const multipliers = [1.0, 1.1, 1.2, 1.1]; 
          const effectiveMultiplier = (w === lastSpecificPrepWeek) ? 1.2 : multipliers[weekInCycle];
          weeklyMileage = cycleStartMileage * effectiveMultiplier;
      }

      const longRunMileage = weeklyMileage * 0.30;
      const intervalMileage = (phase === 2 && !isRecoveryWeek) ? weeklyMileage * 0.12 : 0;
      const tempoMileage = ((phase === 2 || phase === 3) && !isRecoveryWeek) ? weeklyMileage * 0.15 : 0;
      const easyMileage = weeklyMileage - longRunMileage - intervalMileage - tempoMileage;

      program.push({
        week: w,
        mileage: weeklyMileage.toFixed(1),
        phase,
        isRecoveryWeek,
        days: DAYS.map((day) => {
          if (!formData.trainingDays.includes(day)) return { day, activity: "Istirahat", pace: "-", distance: "-", details: "-" };

          let activity = "Easy Run", pace = ePace, details = "Lari santai, fokus pada form dan pernapasan.";
          
          if (phase === 4) {
            if (day === "Minggu" || (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))) {
              return { day, activity: "RACE DAY", pace: "Target Lomba", distance: formData.raceEvent, details: "BERIKAN YANG TERBAIK!" };
            }
            return { day, activity: "Shakeout Run", pace: ePace, distance: (weeklyMileage * 0.08).toFixed(1) + " Km", details: "Lari sangat ringan menjaga kesegaran otot." };
          }

          // Quality Day Placement (Ensuring spacing)
          const trainingDaysInWeek = formData.trainingDays.filter((d) => d !== "Minggu" && d !== "Sabtu");
          const q1 = trainingDaysInWeek[0];
          let q2 = (trainingDaysInWeek.length >= 2) ? (trainingDaysInWeek.find(d => DAYS.indexOf(d) >= DAYS.indexOf(q1) + 2) || trainingDaysInWeek[trainingDaysInWeek.length - 1]) : null;
          if (q2 === q1) q2 = null;

          let distance = 0;
          if (day === "Minggu" || (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))) {
            activity = "Long Run"; distance = longRunMileage.toFixed(1);
            details = (w === lastSpecificPrepWeek) ? "PEAK LONGRUN: Jarak maksimal sebelum tapering." : "Steady pace, membangun daya tahan aerobik.";
          } else if (day === q1 && (intervalMileage > 0 || (phase === 3 && tempoMileage > 0))) {
            if (intervalMileage > 0) {
              activity = "Interval Run"; pace = iPace; distance = intervalMileage.toFixed(1);
              const phase2Start = foundationWeeks + 1;
              const progressRatio = (w - phase2Start + 1) / Math.max(1, lastSpecificPrepWeek - phase2Start + 1);
              let repDist = progressRatio <= 0.25 ? 0.4 : progressRatio <= 0.5 ? 0.6 : progressRatio <= 0.75 ? 0.8 : 1.0;
              const reps = Math.floor((distance - 2.0) / repDist);
              details = `W-up: 1km Easy | Main: ${reps}x ${repDist < 1 ? repDist*1000+'m' : '1km'} @ I-Pace (Rest ${repDist <= 0.6 ? '2m':'3m'}*) | C-down: 1km Easy. *Istirahat disesuaikan kondisi atlet.`;
            } else {
              activity = "Tempo Run"; pace = tPace; distance = tempoMileage.toFixed(1);
              const blocks = distance > 7 ? 3 : 2; const distPerBlock = (distance / blocks).toFixed(1);
              details = `W-up: 12m Easy | Main: ${blocks}x ${distPerBlock}km @ T-Pace (Rest 2m*) | C-down: 8m Recovery jog. *Istirahat disesuaikan kondisi atlet.`;
              if (phase === 3) details = "(Tapering) Menjaga intensitas. " + details;
            }
          } else if (day === q2 && tempoMileage > 0 && phase === 2) {
             activity = "Tempo Run"; pace = tPace; distance = tempoMileage.toFixed(1);
             const blocks = distance > 7 ? 3 : 2; const distPerBlock = (distance / blocks).toFixed(1);
             details = `Main: ${blocks}x ${distPerBlock}km @ T-Pace (Rest 2m*).`;
          } else {
            const qualityUsed = (day === q1 && (intervalMileage > 0 || (phase === 3 && tempoMileage > 0))) || (day === q2 && tempoMileage > 0 && phase === 2);
            const qualityDaysCount = (intervalMileage > 0 ? 1 : 0) + (tempoMileage > 0 && phase === 2 && q2 ? 1 : (phase === 3 && tempoMileage > 0 ? 1 : 0));
            distance = (easyMileage / Math.max(1, formData.trainingDays.length - 1 - qualityDaysCount)).toFixed(1);
          }
          return { day, activity, pace, distance: distance + " Km", details };
        }),
      });
    }
    return program;
  }, [showProgram, vcrData, formData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/training-program", {
        name: formData.raceName, race_event: formData.raceEvent, level: formData.level,
        prep_months: formData.prepMonths, start_month: formData.startMonth, end_month: formData.endMonth,
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
                  <button type="button" disabled={formData.raceEvent !== "Full Marathon"} onClick={() => setFormData({ ...formData, level: "beginner" })} className={clsx("btn-retro py-2 text-sm transition-all", formData.level === "beginner" ? "bg-retro-green text-retro-black" : "border-retro-white/30 text-retro-white", formData.raceEvent !== "Full Marathon" && "opacity-20 cursor-not-allowed")}>BEGINNER</button>
                  <button type="button" disabled={formData.raceEvent !== "Full Marathon"} onClick={() => setFormData({ ...formData, level: "intermediate" })} className={clsx("btn-retro py-2 text-sm transition-all", formData.level === "intermediate" ? "bg-retro-green text-retro-black" : "border-retro-white/30 text-retro-white", formData.raceEvent !== "Full Marathon" && "opacity-20 cursor-not-allowed")}>INTERMEDIATE / ELITE</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Durasi (Bulan)</Label><input type="number" min="1" max="12" value={formData.prepMonths} onChange={(e) => setFormData({ ...formData, prepMonths: parseInt(e.target.value) })} className="input-retro w-full" /></div>
              <div className="col-span-2"><Label>Persiapan (Bulan - Ke)</Label>
                <div className="flex gap-2">
                  <select value={formData.startMonth} onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })} className="input-retro w-full text-xs">{MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}</select>
                  <select value={formData.endMonth} onChange={(e) => setFormData({ ...formData, endMonth: e.target.value })} className="input-retro w-full text-xs">{MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
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
            <div><h2 className="font-retro text-3xl text-retro-green">{formData.raceName.toUpperCase()}</h2><p className="font-mono text-retro-white/60">{formData.raceEvent} · {formData.prepMonths} Bulan</p></div>
            <button onClick={() => setShowProgram(false)} className="text-retro-green font-mono text-sm hover:underline">UBAH PENGATURAN</button>
          </div>
          <div className="mb-8 flex gap-0 overflow-x-auto border-b-2 border-retro-gray-light">
            {generatedProgram.map(w => <button key={w.week} onClick={() => setActiveWeek(w.week)} className={clsx("font-retro whitespace-nowrap border-b-2 -mb-0.5 px-5 py-3 text-xs tracking-widest transition-all duration-150", activeWeek === w.week ? "border-retro-green bg-retro-green text-retro-black" : "border-transparent text-retro-white/50 hover:bg-retro-gray-mid hover:text-retro-white")}>MINGGU {w.week}</button>)}
          </div>
          {generatedProgram.filter(w => w.week === activeWeek).map(week => (
            <div key={week.week} className="card-retro overflow-hidden p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div><span className="font-retro text-2xl text-retro-white uppercase">MINGGU {week.week}</span><p className="font-mono text-[10px] text-retro-white/50 mt-1 uppercase tracking-widest">Mileage: {week.mileage} Km</p></div>
                <span className="font-mono text-[10px] text-retro-green px-3 py-1 border border-retro-green/30 uppercase">{week.isRecoveryWeek ? "RECOVERY" : `FASE ${week.phase}: ${week.phase === 1 ? 'General Prep' : week.phase === 2 ? 'Specific Prep' : week.phase === 3 ? 'Pre Competition' : 'Competition'}`}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead><tr className="border-b border-retro-gray-light/30"><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Hari</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Aktivitas</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Jarak</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Pace</th><th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Detail Program</th></tr></thead>
                    <tbody>{week.days.map((d, idx) => (<tr key={idx} className={clsx("border-b border-retro-gray-light/10 last:border-0", d.activity === "Istirahat" ? "opacity-30" : "")}><td className="px-6 py-4 font-retro text-retro-white">{d.day}</td><td className="px-6 py-4"><span className={clsx("font-sport text-sm", d.activity !== "Easy Run" && d.activity !== "Istirahat" && d.activity !== "Shakeout Run" ? "text-retro-green" : "text-retro-white/80")}>{d.activity}</span></td><td className="px-6 py-4 font-mono text-sm text-retro-white">{d.distance}</td><td className="px-6 py-4 font-mono text-sm text-retro-white">{d.pace}</td><td className="px-6 py-4 font-mono text-[10px] text-retro-white/50 leading-relaxed italic">{d.details}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-4 sm:flex-row">
            <button onClick={() => window.print()} className="btn-retro flex-1 border border-retro-white/30 text-retro-white py-4 font-retro tracking-widest hover:border-retro-white">CETAK PROGRAM</button>
            <button onClick={handleSave} disabled={isSaving} className="btn-retro flex-1 bg-retro-blue text-retro-white py-4 font-retro tracking-widest disabled:opacity-50">{isSaving ? "SAVING..." : "SIMPAN PROGRAM"}</button>
            <button onClick={() => navigate("/calculator")} className="btn-retro flex-1 bg-retro-green text-retro-black py-4 font-retro tracking-widest">KEMBALI KE KALKULATOR</button>
          </div>
        </div>
      )}
    </section>
  );
}