import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import clsx from "clsx";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const MONTHS_LIST = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
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

  if (!vcrData) {
    return (
      <section className="max-w-4xl mx-auto px-4 pt-36 pb-24 text-center">
        <div className="card-retro p-10">
          <h2 className="font-retro text-3xl text-retro-white mb-4">
            NO VCR DATA FOUND
          </h2>
          <p className="text-retro-white/50 mb-8 font-sport">
            Silakan hitung VCR Anda terlebih dahulu sebelum membuat program
            latihan.
          </p>
          <button
            onClick={() => navigate("/calculator")}
            className="btn-retro bg-retro-green px-8 py-3 text-retro-black"
          >
            KE KALKULATOR
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

    const weeks = formData.prepMonths * 4;
    const program = [];

    const mileageMap = {
      "5K": { beginner: 16, intermediate: 24 },
      "10K": { beginner: 25, intermediate: 30 },
      "Half Marathon": { beginner: 31, intermediate: 50 },
      "Full Marathon": { beginner: 50, intermediate: 100 },
    };

    const startMileage = mileageMap[formData.raceEvent]?.[formData.level] || 20;
    const foundationWeeks =
      formData.level === "beginner"
        ? Math.ceil(weeks * 0.3)
        : Math.ceil(weeks * 0.2);

    const getPace = (label) => {
      const found = vcrData.intervals.find((i) => i.label === label);
      return found ? found.pacePerKm : vcrData.basePacePerKm;
    };

    const ePace = getPace("70%");
    const tPace = getPace("90%");
    const iPace = getPace("100%");

    for (let w = 1; w <= weeks; w++) {
      // 3:1 MESOCYCLE LOGIC (Recovery Week at Week 2)
      const weekInCycle = (w - 1) % 4; // 0=w1, 1=w2, 2=w3, 3=w4
      const cycleNumber = Math.floor((w - 1) / 4);

      let weeklyMileage;
      let isRecoveryWeek = weekInCycle === 1; // Minggu ke-2 sebagai Recovery
      const cycleStartMileage = startMileage * (1 + cycleNumber * 0.1);

      if (isRecoveryWeek) {
        // Recovery week: 85% dari beban dasar untuk transisi yang halus
        weeklyMileage = cycleStartMileage * 0.85;
      } else {
        // Multipliers: W1=1.0, W3=1.1, W4=1.2
        const multipliers = [1.0, 0.85, 1.1, 1.2];
        weeklyMileage = cycleStartMileage * multipliers[weekInCycle];
      }

      const longRunMileage = weeklyMileage * 0.3;
      const tempoMileage = isRecoveryWeek ? 0 : weeklyMileage * 0.15;
      const intervalMileage = isRecoveryWeek ? 0 : weeklyMileage * 0.12;
      const easyMileage =
        weeklyMileage - longRunMileage - tempoMileage - intervalMileage;

      const competitionWeek = weeks;
      const preCompetitionWeeks = 3;

      let phase = 1;
      if (w === competitionWeek) {
        phase = 4;
      } else if (w > competitionWeek - 1 - preCompetitionWeeks) {
        phase = 3;
      } else if (w <= foundationWeeks) {
        phase = 1;
      } else {
        phase = 2;
      }

      const weekData = {
        week: w,
        mileage: weeklyMileage.toFixed(1),
        phase,
        isRecoveryWeek,
        days: DAYS.map((day) => {
          if (!formData.trainingDays.includes(day))
            return { day, activity: "Istirahat", pace: "-", distance: "-" };

          let activity = "Easy Run";
          let pace = ePace;

          if (phase === 4) {
            if (
              day === "Minggu" ||
              (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))
            ) {
              activity = "RACE DAY";
              pace = "Target Lomba";
              return { day, activity, pace, distance: formData.raceEvent };
            }
            return {
              day,
              activity: "Shakeout Run",
              pace: ePace,
              distance: (weeklyMileage * 0.1).toFixed(1) + " Km",
            };
          }

          let distance = (
            easyMileage /
            (formData.trainingDays.length -
              (phase > 1 && !isRecoveryWeek ? 2 : 1))
          ).toFixed(1);

          if (
            day === "Minggu" ||
            (day === "Sabtu" && !formData.trainingDays.includes("Minggu"))
          ) {
            activity = "Long Run";
            pace = ePace;
            distance = longRunMileage.toFixed(1);
          } else if (phase > 1 && !isRecoveryWeek) {
            const trainingDaysInWeek = formData.trainingDays.filter(
              (d) => d !== "Minggu" && d !== "Sabtu",
            );
            if (day === trainingDaysInWeek[0]) {
              if (phase === 2) {
                activity = "Tempo Run";
                pace = tPace;
                distance = tempoMileage.toFixed(1);
              } else if (phase >= 3) {
                activity = "Interval Run";
                pace = iPace;
                distance = intervalMileage.toFixed(1);
              }
            } else if (
              day === trainingDaysInWeek.length > 2
                ? trainingDaysInWeek[Math.floor(trainingDaysInWeek.length / 2)]
                : null
            ) {
              if (phase >= 3) {
                activity = "Tempo Run";
                pace = tPace;
                distance = tempoMileage.toFixed(1);
              }
            }
          }

          return { day, activity, pace, distance: distance + " Km" };
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
          TRAINING PROGRAM
          <span className="text-retro-green animate-blink">_</span>
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
                  onChange={(e) =>
                    setFormData({ ...formData, raceName: e.target.value })
                  }
                  placeholder="Contoh: Jakarta Marathon"
                  className="input-retro w-full"
                />
              </div>
              <div>
                <Label>Nomor Perlombaan</Label>
                <select
                  value={formData.raceEvent}
                  onChange={(e) =>
                    setFormData({ ...formData, raceEvent: e.target.value })
                  }
                  className="input-retro w-full"
                >
                  <option value="5K">5K</option>
                  <option value="10K">10K</option>
                  <option value="Half Marathon">Half Marathon</option>
                  <option value="Full Marathon">Full Marathon</option>
                </select>
              </div>
              <div>
                <Label>Level Pelari</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled={formData.raceEvent !== "Full Marathon"}
                    onClick={() =>
                      setFormData({ ...formData, level: "beginner" })
                    }
                    className={clsx(
                      "btn-retro py-2 text-sm transition-all",
                      formData.level === "beginner"
                        ? "bg-retro-green text-retro-black"
                        : "border-retro-white/30 text-retro-white",
                      formData.raceEvent !== "Full Marathon" &&
                        "opacity-20 cursor-not-allowed",
                    )}
                  >
                    BEGINNER
                  </button>
                  <button
                    type="button"
                    disabled={formData.raceEvent !== "Full Marathon"}
                    onClick={() =>
                      setFormData({ ...formData, level: "intermediate" })
                    }
                    className={clsx(
                      "btn-retro py-2 text-sm transition-all",
                      formData.level === "intermediate"
                        ? "bg-retro-green text-retro-black"
                        : "border-retro-white/30 text-retro-white",
                      formData.raceEvent !== "Full Marathon" &&
                        "opacity-20 cursor-not-allowed",
                    )}
                  >
                    INTERMEDIATE / ELITE
                  </button>
                </div>
                {formData.raceEvent !== "Full Marathon" && (
                  <p className="mt-2 font-mono text-[9px] italic text-retro-white/30">
                    *Level hanya tersedia untuk Full Marathon sesuai pedoman
                    Milleage Science.
                  </p>
                )}
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
                      setFormData({
                        ...formData,
                        prepMonths: parseInt(e.target.value),
                      })
                    }
                    className="input-retro w-full"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Persiapan (Bulan - Ke)</Label>
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.startMonth}
                      onChange={(e) =>
                        setFormData({ ...formData, startMonth: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, endMonth: e.target.value })
                      }
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
              disabled={
                !formData.raceName || formData.trainingDays.length === 0
              }
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
              <h2 className="font-retro text-3xl text-retro-green">
                {formData.raceName.toUpperCase()}
              </h2>
              <p className="font-mono text-retro-white/60">
                {formData.raceEvent} · {formData.prepMonths} Bulan (
                {formData.startMonth} - {formData.endMonth})
              </p>
            </div>
            <button
              onClick={() => setShowProgram(false)}
              className="text-retro-green font-mono text-sm hover:underline"
            >
              UBAH PENGATURAN
            </button>
          </div>

          <div className="mb-8 flex gap-0 overflow-x-auto border-b-2 border-retro-gray-light">
            {generatedProgram.map((week) => (
              <button
                key={week.week}
                onClick={() => setActiveWeek(week.week)}
                className={clsx(
                  "font-retro whitespace-nowrap border-b-2 -mb-0.5 px-5 py-3 text-xs tracking-widest transition-all duration-150",
                  activeWeek === week.week
                    ? "border-retro-green bg-retro-green text-retro-black"
                    : "border-transparent text-retro-white/50 hover:bg-retro-gray-mid hover:text-retro-white",
                )}
              >
                MINGGU {week.week}
              </button>
            ))}
          </div>

          <div className="space-y-12">
            {generatedProgram
              .filter((w) => w.week === activeWeek)
              .map((week) => (
                <div
                  key={week.week}
                  className="card-retro overflow-hidden animate-fade-in"
                >
                  <div className="bg-retro-gray-mid/50 px-6 py-4 flex justify-between items-center border-b border-retro-gray-light">
                    <div>
                      <span className="font-retro text-2xl text-retro-white">
                        MINGGU {week.week}
                      </span>
                      <p className="font-mono text-[10px] text-retro-white/50 mt-1 uppercase tracking-widest">
                        Total Mileage: {week.mileage} Km
                      </p>
                    </div>
                    <span className="font-mono text-xs text-retro-green px-3 py-1 border border-retro-green/30">
                      {week.isRecoveryWeek
                        ? "MINGGU PEMULIHAN (Recovery)"
                        : `FASE ${week.phase}: ${
                            week.phase === 1
                              ? "General Preparation"
                              : week.phase === 2
                                ? "Specific Preparation"
                                : week.phase === 3
                                  ? "Pre Competition"
                                  : "Competition"
                          }`}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-retro-gray-light/30">
                          <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                            Hari
                          </th>
                          <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                            Aktivitas
                          </th>
                          <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                            Jarak
                          </th>
                          <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                            Pace
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {week.days.map((d, idx) => (
                          <tr
                            key={idx}
                            className={clsx(
                              "border-b border-retro-gray-light/10 last:border-0",
                              d.activity === "Istirahat" ? "opacity-30" : "",
                            )}
                          >
                            <td className="px-6 py-4 font-retro text-retro-white">
                              {d.day}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={clsx(
                                  "font-sport text-sm",
                                  d.activity !== "Easy Run" &&
                                    d.activity !== "Istirahat"
                                    ? "text-retro-green"
                                    : "text-retro-white/80",
                                )}
                              >
                                {d.activity}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-retro-white">
                              {d.distance}
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-retro-white">
                              {d.pace}
                            </td>
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
