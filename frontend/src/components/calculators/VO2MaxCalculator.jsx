// src/components/calculators/VO2MaxCalculator.jsx
import { useState } from "react";
import { calcVO2Max } from "../../utils/paceUtils";

const FITNESS = [
  { min: 0, max: 29, label: "Poor", color: "#EF4444" },
  { min: 30, max: 39, label: "Fair", color: "#F59E0B" },
  { min: 40, max: 49, label: "Good", color: "#00AEEF" },
  { min: 50, max: 59, label: "Excellent", color: "#008DCE" },
  { min: 60, max: 999, label: "Superior", color: "#005BAC" },
];

export default function VO2MaxCalculator() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(22);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(5);
  const [vo2, setVo2] = useState(null);

  const handleCalc = () => {
    const totalSec =
      Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    setVo2(calcVO2Max(totalSec, Number(distance)));
  };

  const fitness = vo2
    ? FITNESS.find((f) => vo2 >= f.min && vo2 <= f.max)
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div className="card-retro self-start p-6">
        <h2 className="font-retro text-2xl text-retro-white tracking-wide mb-2">
          VO2 MAX
        </h2>
        <p className="font-sport text-retro-white/40 text-sm mb-6">
          Estimated from race performance
        </p>

        <div className="mb-5">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Recent Race Time
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: hours, set: setHours, ph: "HH" },
              { val: minutes, set: setMinutes, ph: "MM" },
              { val: seconds, set: setSeconds, ph: "SS" },
            ].map(({ val, set, ph }) => (
              <input
                key={ph}
                type="number"
                min={0}
                value={val}
                onChange={(e) => set(Number(e.target.value))}
                placeholder={ph}
                className="input-retro py-3 px-4 text-center text-lg"
              />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Distance (km)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 21.0975, 42.195].map((d) => (
              <button
                key={d}
                onClick={() => setDistance(d)}
                className={`py-3 font-retro tracking-wider text-sm border-2 transition-all
                  ${
                    distance === d
                      ? "bg-retro-green text-retro-black border-retro-green"
                      : "text-retro-white/50 border-retro-gray-light hover:border-retro-green"
                  }`}
              >
                {d === 5
                  ? "5K"
                  : d === 10
                    ? "10K"
                    : d === 21.0975
                      ? "Half"
                      : "Full"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCalc}
          className="btn-retro bg-retro-green text-retro-black font-retro tracking-widest w-full py-4 text-xl"
        >
          ESTIMATE VO2 MAX →
        </button>
      </div>

      <div className="card-retro p-6 flex flex-col items-center justify-center">
        {vo2 ? (
          <div className="text-center w-full">
            <p className="font-mono text-[11px] text-retro-white/40 tracking-widest uppercase mb-4">
              Estimated VO2 Max
            </p>
            <div
              className="font-retro text-8xl mb-2 tabular-nums animate-fade-in"
              style={{ color: fitness?.color || "#00AEEF" }}
            >
              {vo2}
            </div>
            <p className="font-mono text-retro-white/40 text-sm mb-6">
              ml/kg/min
            </p>

            <div
              className="inline-block px-6 py-2 border-2 font-retro text-2xl tracking-widest mb-8"
              style={{ borderColor: fitness?.color, color: fitness?.color }}
            >
              {fitness?.label?.toUpperCase()}
            </div>

            <div className="w-full space-y-2">
              {FITNESS.map(({ min, max, label, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: color,
                      width: `${min === 0 ? 20 : Math.min((max - 20) * 2, 100)}%`,
                      opacity: label === fitness?.label ? 1 : 0.3,
                    }}
                  />
                  <span
                    className="font-sport text-xs tracking-wide whitespace-nowrap"
                    style={{
                      color:
                        label === fitness?.label
                          ? color
                          : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {label} ({min}–{max === 999 ? "60+" : max})
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-retro text-retro-white/25 text-xl tracking-wider">
              ENTER RACE DATA
            </p>
            <p className="font-sport text-retro-white/20 text-sm mt-2">
              VO2 Max appears here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
