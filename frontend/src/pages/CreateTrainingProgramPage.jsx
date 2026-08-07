import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
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
    prepMonths: 4,
    startMonth: "Agustus",
    endMonth: "November",
    trainingDays: ["Selasa", "Kamis", "Sabtu", "Minggu"],
  });

  const [showProgram, setShowProgram] = useState(false);

  if (!vcrData) {
    return (
      <section className="max-w-4xl mx-auto px-4 pt-36 pb-24 text-center">
        <div className="card-retro p-10">
          <h2 className="font-retro text-3xl text-retro-white mb-4">NO VCR DATA FOUND</h2>
          <p className="text-retro-white/50 mb-8 font-sport">
            Please calculate your VCR first before creating a training program.
          </p>
          <button
            onClick={() => navigate("/calculator")}
            className="btn-retro bg-retro-green px-8 py-3 text-retro-black"
          >
            GO TO CALCULATOR
          </button>
        </div>
      </section>
    );
  }

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter((d) => d !== day)
        : [...prev.trainingDays, day],
    }));
  };

  const generatedProgram = useMemo(() => {
    if (!showProgram) return null;

    // Simplified Jack Daniels' inspired logic
    // Phase 1: 25% of time - Foundation (Easy runs)
    // Phase 2: 25% of time - Early Quality (Easy + Repetitions)
    // Phase 3: 25% of time - Transition Quality (Easy + Intervals)
    // Phase 4: 25% of time - Final Quality (Easy + Threshold + Taper)

    const weeks = formData.prepMonths * 4;
    const program = [];

    const getPace = (label) => {
        const found = vcrData.intervals.find(i => i.label === label);
        return found ? found.pacePerKm : vcrData.basePacePerKm;
    };

    const ePace = getPace("70%");
    const mPace = getPace("80%");
    const tPace = getPace("90%");
    const iPace = getPace("100%");
    const rPace = getPace("110%");

    for (let w = 1; w <= weeks; w++) {
      const phase = Math.ceil((w / weeks) * 4);
      const weekData = {
        week: w,
        phase,
        days: DAYS.map((day) => {
          if (!formData.trainingDays.includes(day)) return { day, activity: "Istirahat", pace: "-" };

          let activity = "Lari Santai (Easy Run)";
          let pace = ePace;
          let details = "30-50 menit kecepatan nyaman";

          // Saturday/Sunday Long Run
          if (day === "Minggu" || (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))) {
             activity = "Lari Jauh (Long Run)";
             details = `${20 + Math.min(w, 10)}% dari total volume mingguan, kecepatan stabil`;
             pace = ePace;
          } else {
              // Quality Sessions
              const trainingDaysInWeek = formData.trainingDays.filter(d => d !== "Minggu" && d !== "Sabtu");
              const isFirstQuality = day === trainingDaysInWeek[0];
              const isSecondQuality = day === trainingDaysInWeek[Math.floor(trainingDaysInWeek.length / 2)] && trainingDaysInWeek.length > 2;

              if (isFirstQuality) {
                  if (phase === 1) {
                      activity = "Lari Santai + Strides";
                      details = "40 menit E + 6-8 x 20 detik lari cepat (strides)";
                      pace = ePace;
                  } else if (phase === 2) {
                      activity = "Sesi Repetisi (R)";
                      pace = rPace;
                      details = "10 x 400m pada pace R dengan 400m jog pemulihan";
                  } else if (phase === 3) {
                      activity = "Sesi Interval (I)";
                      pace = iPace;
                      details = "6 x 800m pada pace I dengan 2-3 menit pemulihan";
                  } else if (phase === 4) {
                      activity = "Sesi Threshold (T)";
                      pace = tPace;
                      details = "20 menit stabil pada pace T atau 4 x 5 menit";
                  }
              } else if (isSecondQuality) {
                  if (phase === 2) {
                      activity = "Lari Santai + Strides";
                      details = "30 menit E + 6 x 30 detik lari cepat (strides)";
                      pace = ePace;
                  } else if (phase === 3) {
                      activity = "Sesi Threshold (T)";
                      pace = tPace;
                      details = "3 x 3km pada pace T dengan 2 menit istirahat";
                  } else if (phase === 4) {
                      activity = "Latihan Pace Lomba";
                      pace = mPace;
                      details = "Latihan pace lomba selama 30-40 menit";
                  }
              }
          }

          // Tapering in last 2 weeks
          if (w > weeks - 2) {
              details = "(Tapering) " + details.replace(/\d+ menit/g, (m) => Math.round(parseInt(m) * 0.7) + " menit");
          }

          return { day, activity, pace, details };
        }),
      };
      program.push(weekData);
    }
    return program;
  }, [showProgram, vcrData, formData]);

  return (
    <section className="max-w-6xl mx-auto px-4 pt-36 pb-24">
      <div className="mb-10 animate-slide-up">
        <span className="font-mono text-retro-green text-xs tracking-[0.3em]">
          // PROGRAM GENERATOR
        </span>
        <h1 className="font-retro text-5xl md:text-7xl text-retro-white mt-1 leading-none">
          TRAINING PROGRAM<span className="text-retro-green animate-blink">_</span>
        </h1>
      </div>

      {!showProgram ? (
        <>
          <div className="card-retro p-8 animate-fade-in">
            <div className="space-y-6">
              <div>
                <Label>Nama Perlombaan</Label>
                <input
                  type="text"
                  value={formData.raceName}
                  onChange={(e) => setFormData({ ...formData, raceName: e.target.value })}
                  placeholder="Contoh: Jakarta Marathon"
                  className="input-retro w-full"
                />
              </div>
              <div>
                <Label>Nomor Perlombaan</Label>
                <select
                  value={formData.raceEvent}
                  onChange={(e) => setFormData({ ...formData, raceEvent: e.target.value })}
                  className="input-retro w-full"
                >
                  <option value="800M">800M</option>
                  <option value="1500M">1500M</option>
                  <option value="3K">3K</option>
                  <option value="5K">5K</option>
                  <option value="10K">10K</option>
                  <option value="Half Marathon">Half Marathon</option>
                  <option value="Full Marathon">Full Marathon</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Durasi (Bulan)</Label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.prepMonths}
                    onChange={(e) =>
                      setFormData({ ...formData, prepMonths: parseInt(e.target.value) })
                    }
                    className="input-retro w-full"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Persiapan (Bulan - Ke)</Label>
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.startMonth}
                      onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                      className="input-retro w-full text-xs"
                    >
                      {MONTHS_LIST.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span className="text-retro-white/50">-</span>
                    <select
                      value={formData.endMonth}
                      onChange={(e) => setFormData({ ...formData, endMonth: e.target.value })}
                      className="input-retro w-full text-xs"
                    >
                      {MONTHS_LIST.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <Label>Frekuensi Latihan (Hari apa saja)</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      className={clsx(
                        "px-2 py-3 font-mono text-[10px] border transition-all text-center",
                        formData.trainingDays.includes(day)
                          ? "border-retro-green bg-retro-green text-retro-black"
                          : "border-retro-gray-light text-retro-white/50 hover:border-retro-white hover:text-retro-white",
                      )}
                    >
                      {day.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => setShowProgram(true)}
              disabled={!formData.raceName || formData.trainingDays.length === 0}
              className="btn-retro w-full bg-retro-green py-4 text-xl font-retro tracking-widest text-retro-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              BUAT PROGRAM LATIHAN →
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-fade-in">
           <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-retro text-3xl text-retro-green">{formData.raceName.toUpperCase()}</h2>
                    <p className="font-mono text-retro-white/60">
                        {formData.raceEvent} · {formData.prepMonths} Bulan ({formData.startMonth} - {formData.endMonth})
                    </p>
                </div>
                <button
                    onClick={() => setShowProgram(false)}
                    className="text-retro-green font-mono text-sm hover:underline"
                >
                    UBAH PENGATURAN
                </button>
           </div>

           <div className="space-y-12">
              {generatedProgram.map((week) => (
                <div key={week.week} className="card-retro overflow-hidden">
                    <div className="bg-retro-gray-mid/50 px-6 py-3 flex justify-between items-center border-b border-retro-gray-light">
                        <span className="font-retro text-xl text-retro-white">MINGGU {week.week}</span>
                        <span className="font-mono text-xs text-retro-green px-2 py-1 border border-retro-green/30">
                            FASE {week.phase}: {
                                week.phase === 1 ? "Fondasi (Base)" :
                                week.phase === 2 ? "Kualitas Awal (Repetition)" :
                                week.phase === 3 ? "Transisi Kualitas (Interval)" : "Kualitas Akhir & Taper"
                            }
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-retro-gray-light/30">
                                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Hari</th>
                                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Aktivitas</th>
                                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Pace</th>
                                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">Detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {week.days.map((d, idx) => (
                                    <tr key={idx} className={clsx(
                                        "border-b border-retro-gray-light/10 last:border-0",
                                        d.activity === "Rest" ? "opacity-30" : ""
                                    )}>
                                        <td className="px-6 py-4 font-retro text-retro-white">{d.day}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "font-sport text-sm",
                                                d.activity.includes("Session") || d.activity.includes("Kualitas") ? "text-retro-green" : "text-retro-white/80"
                                            )}>{d.activity}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-retro-white">{d.pace}</td>
                                        <td className="px-6 py-4 font-mono text-[11px] text-retro-white/50">{d.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              ))}
           </div>

           <div className="flex gap-4">
                <button
                    onClick={() => window.print()}
                    className="btn-retro flex-1 border-retro-white/30 text-retro-white py-4 font-retro tracking-widest hover:border-retro-white"
                >
                    CETAK PROGRAM
                </button>
                <button
                    onClick={() => navigate("/calculator")}
                    className="btn-retro flex-1 bg-retro-green text-retro-black py-4 font-retro tracking-widest"
                >
                    KEMBALI KE KALKULATOR
                </button>
           </div>
        </div>
      )}
    </section>
  );
}
