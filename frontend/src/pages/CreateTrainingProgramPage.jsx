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
            Please calculate your VCR first before creating a training program.
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
    const mileageMap = { "5K": { beginner: 16, intermediate: 24 }, "10K": { beginner: 25, intermediate: 30 }, "Half Marathon": { beginner: 31, intermediate: 50 }, "Full Marathon": { beginner: 50, intermediate: 100 } };

    const startMileage = mileageMap[formData.raceEvent]?.[formData.level] || 20;
    const foundationWeeks = formData.level === "beginner" ? Math.ceil(weeks * 0.3) : Math.ceil(weeks * 0.2);
    const competitionWeek = weeks;
    const preCompetitionWeeks = 2; 
    const lastSpecificPrepWeek = competitionWeek - preCompetitionWeeks - 1;

    const getPace = (l) => vcrData.intervals.find(i => i.label === l)?.pacePerKm || vcrData.basePacePerKm;
    const ePace = getPace("70%"), tPace = getPace("90%"), iPace = getPace("100%");

    const peakCycleNumber = Math.floor((lastSpecificPrepWeek - 1) / 4);
    const peakMileage = startMileage * (1 + peakCycleNumber * 0.1) * 1.2;

    for (let w = 1; w <= weeks; w++) {
      let phase = w === competitionWeek ? 4 : w > lastSpecificPrepWeek ? 3 : w <= foundationWeeks ? 1 : 2;
      const weekInCycle = (w - 1) % 4;
      let isRecoveryWeek = weekInCycle === 3 && w !== lastSpecificPrepWeek && phase < 3;
      let weeklyMileage;

      if (phase === 3) weeklyMileage = peakMileage * (w - lastSpecificPrepWeek === 1 ? 0.7 : 0.5);
      else if (phase === 4) weeklyMileage = peakMileage * 0.35;
      else {
        const cycleBase = startMileage * (1 + Math.floor((w - 1) / 4) * 0.1);
        weeklyMileage = cycleBase * (w === lastSpecificPrepWeek ? 1.2 : [1.0, 1.1, 1.2, 1.1][weekInCycle]);
      }

      const longRunMileage = weeklyMileage * 0.30;
      const intervalMileage = (phase === 2 && !isRecoveryWeek) ? weeklyMileage * 0.12 : 0;
      const tempoMileage = ((phase === 2 || phase === 3) && !isRecoveryWeek) ? weeklyMileage * 0.15 : 0;
      const easyMileage = weeklyMileage - longRunMileage - intervalMileage - tempoMileage;

      program.push({
        week: w, mileage: weeklyMileage.toFixed(1), phase, isRecoveryWeek,
        days: DAYS.map((day) => {
          if (!formData.trainingDays.includes(day)) return { day, activity: "Istirahat", pace: "-", distance: "-", details: "-" };
          let activity = "Easy Run", pace = ePace, details = "Lari santai, fokus form.";
          if (phase === 4 && (day === "Minggu" || (day === "Sabtu" && !formData.trainingDays.includes("Minggu")))) {
            return { day, activity: "RACE DAY", pace: "Target Lomba", distance: formData.raceEvent, details: "BERIKAN YANG TERBAIK!" };
          }
          const tDays = formData.trainingDays.filter(d => d !== "Minggu" && d !== "Sabtu");
          const q1 = tDays[0], q2 = tDays.length >= 2 ? (tDays.find(d => DAYS.indexOf(d) >= DAYS.indexOf(q1) + 2) || tDays[tDays.length - 1]) : null;
          let dist = 0;
          if (day === "Minggu" || (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))) {
            activity = "Long Run"; dist = longRunMileage.toFixed(1); details = w === lastSpecificPrepWeek ? "PEAK LONGRUN!" : "Steady pace.";
          } else if (day === q1 && (intervalMileage > 0 || (phase === 3 && tempoMileage > 0))) {
            if (intervalMileage > 0) {
              activity = "Interval Run"; pace = iPace; dist = intervalMileage.toFixed(1);
              let rDist = (w - (foundationWeeks + 1) + 1) / (lastSpecificPrepWeek - foundationWeeks) <= 0.25 ? 0.4 : 0.8;
              details = `Main: ${Math.floor((dist - 2) / rDist)}x ${rDist < 1 ? rDist * 1000 + 'm' : '1km'} @ I-Pace. *Istirahat sesuai kondisi.`;
            } else {
              activity = "Tempo Run"; pace = tPace; dist = tempoMileage.toFixed(1); details = `Main: Blocks @ T-Pace.`;
            }
          } else if (day === q2 && tempoMileage > 0 && phase === 2) {
            activity = "Tempo Run"; pace = tPace; dist = tempoMileage.toFixed(1); details = `Main: ${dist}km @ T-Pace.`;
          } else {
            dist = (easyMileage / Math.max(1, formData.trainingDays.length - 1 - (intervalMileage > 0 ? 1 : 0) - (tempoMileage > 0 ? 1 : 0))).toFixed(1);
          }
          return { day, activity, pace, distance: dist + " Km", details };
        })
      });
    }
    return program;
  }, [showProgram, vcrData, formData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/training-program", { name: formData.raceName, race_event: formData.raceEvent, level: formData.level, prep_months: formData.prepMonths, start_month: formData.startMonth, end_month: formData.endMonth, training_days: formData.trainingDays, program_data: generatedProgram });
      toast.success("Program saved successfully!"); navigate("/my-training-programs");
    } catch (e) { toast.error("Failed to save."); } finally { setIsSaving(false); }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-36 pb-24">
      <h1 className="font-retro text-5xl text-retro-white mb-10 tracking-tight">TRAINING PROGRAM<span className="text-retro-green animate-blink">_</span></h1>
      {!showProgram ? (
        <div className="card-retro p-8">
          <div className="space-y-6">
            <Label>Nama Perlombaan</Label><input type="text" value={formData.raceName} onChange={(e) => setFormData({ ...formData, raceName: e.target.value })} placeholder="Jakarta Marathon" className="input-retro w-full" />
            <div className="grid md:grid-cols-2 gap-6">
              <div><Label>Nomor</Label><select value={formData.raceEvent} onChange={(e) => setFormData({ ...formData, raceEvent: e.target.value })} className="input-retro w-full"><option value="5K">5K</option><option value="10K">10K</option><option value="Half Marathon">Half Marathon</option><option value="Full Marathon">Full Marathon</option></select></div>
              <div><Label>Level</Label><div className="grid grid-cols-2 gap-2"><button disabled={formData.raceEvent !== "Full Marathon"} onClick={() => setFormData({ ...formData, level: "beginner" })} className={clsx("btn-retro py-2", formData.level === "beginner" ? "bg-retro-green text-retro-black" : "text-retro-white opacity-40")}>BEGINNER</button><button disabled={formData.raceEvent !== "Full Marathon"} onClick={() => setFormData({ ...formData, level: "intermediate" })} className={clsx("btn-retro py-2", formData.level === "intermediate" ? "bg-retro-green text-retro-black" : "text-retro-white opacity-40")}>INTER / ELITE</button></div></div>
            </div>
            <button onClick={() => setShowProgram(true)} disabled={!formData.raceName || formData.trainingDays.length === 0} className="btn-retro w-full bg-retro-green py-4 text-xl text-retro-black mt-8">GENERATE PROGRAM →</button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto border-b border-retro-gray-light/20 pb-2">
            {generatedProgram.map(w => <button key={w.week} onClick={() => setActiveWeek(w.week)} className={clsx("px-4 py-2 border font-retro text-xs transition-all", activeWeek === w.week ? "bg-retro-green text-retro-black border-retro-green" : "text-retro-white/40 border-transparent hover:text-retro-white")}>WEEK {w.week}</button>)}
          </div>
          {generatedProgram.filter(w => w.week === activeWeek).map(week => (
            <div key={week.week} className="card-retro p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-retro text-2xl text-retro-white uppercase">WEEK {week.week} Summary</h2>
                <span className="text-retro-green font-mono text-sm">TOTAL: {week.mileage} Km</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-retro-gray-light/30">
                            <th className="py-3 font-mono text-[10px] uppercase text-retro-white/40">Day</th>
                            <th className="py-3 font-mono text-[10px] uppercase text-retro-white/40">Activity</th>
                            <th className="py-3 font-mono text-[10px] uppercase text-retro-white/40">Dist</th>
                            <th className="py-3 font-mono text-[10px] uppercase text-retro-white/40">Pace</th>
                        </tr>
                    </thead>
                    <tbody>
                        {week.days.map((d, i) => (
                            <tr key={i} className="border-b border-retro-gray-light/10 last:border-0">
                                <td className="py-4 font-retro text-retro-white text-sm">{d.day}</td>
                                <td className="py-4">
                                    <p className={clsx("font-sport text-sm", d.activity !== "Easy Run" && d.activity !== "Istirahat" ? "text-retro-green" : "text-retro-white")}>{d.activity}</p>
                                    <p className="text-[10px] text-retro-white/30 italic">{d.details}</p>
                                </td>
                                <td className="py-4 font-mono text-sm text-retro-white">{d.distance}</td>
                                <td className="py-4 font-mono text-sm text-retro-white">{d.pace}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="flex flex-col md:flex-row gap-4">
            <button onClick={handleSave} className="btn-retro flex-1 bg-retro-blue text-retro-white py-4 font-retro tracking-widest">{isSaving ? "SAVING..." : "SAVE PROGRAM"}</button>
            <button onClick={() => setShowProgram(false)} className="btn-retro flex-1 border border-retro-white/30 text-retro-white py-4 font-retro tracking-widest">CHANGE SETTINGS</button>
          </div>
        </div>
      )}
    </section>
  );
}