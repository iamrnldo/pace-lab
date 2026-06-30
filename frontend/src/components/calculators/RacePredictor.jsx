// src/components/calculators/RacePredictor.jsx
import { useState } from "react";
import { riegelPredict, formatTime } from "../../utils/paceUtils";
import clsx from "clsx";

const TARGETS = [
  { label: "5K", km: 5 },
  { label: "10K", km: 10 },
  { label: "Half Marathon", km: 21.0975 },
  { label: "Marathon", km: 42.195 },
];

export default function RacePredictor() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(10);
  const [results, setResults] = useState(null);

  const handleCalc = () => {
    const totalSec =
      Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    const distKm = Number(distance);
    const preds = TARGETS.map(({ label, km }) => {
      const predSec = riegelPredict(totalSec, distKm, km);
      const paceKm = predSec / km;
      const m = Math.floor(paceKm / 60);
      const s = Math.floor(paceKm % 60);
      return {
        label,
        km,
        time: formatTime(Math.round(predSec)),
        pace: `${m}:${String(s).padStart(2, "0")}/km`,
        isSource: km === distKm,
      };
    });
    setResults(preds);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card-retro p-6">
        <h2 className="font-retro text-2xl text-retro-white tracking-wide mb-1">
          🏆 RACE PREDICTOR
        </h2>
        <p className="font-sport text-retro-white/40 text-sm mb-6">
          Using Riegel Formula (T2 = T1 × (D2/D1)^1.06)
        </p>

        {/* recent time */}
        <div className="mb-5">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Recent Finish Time
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: hours, set: setHours, ph: "HH", max: 23 },
              { val: minutes, set: setMinutes, ph: "MM", max: 59 },
              { val: seconds, set: setSeconds, ph: "SS", max: 59 },
            ].map(({ val, set, ph, max }) => (
              <input
                key={ph}
                type="number"
                min={0}
                max={max}
                value={val}
                onChange={(e) =>
                  set(Math.max(0, Math.min(max, Number(e.target.value))))
                }
                placeholder={ph}
                className="input-retro py-3 px-4 text-center text-lg"
              />
            ))}
          </div>
        </div>

        {/* distance selector */}
        <div className="mb-6">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Recent Race Distance
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TARGETS.map(({ label, km }) => (
              <button
                key={label}
                onClick={() => setDistance(km)}
                className={clsx(
                  "py-3 font-retro tracking-widest text-sm border-2 transition-all",
                  distance === km
                    ? "bg-retro-green text-retro-black border-retro-green"
                    : "bg-transparent text-retro-white/50 border-retro-gray-light hover:border-retro-green",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCalc}
          className="btn-retro bg-retro-green text-retro-black font-retro
                     tracking-widest w-full py-4 text-xl"
        >
          PREDICT →
        </button>
      </div>

      {/* results */}
      <div className="card-retro p-6 flex flex-col">
        {results ? (
          <>
            <p className="font-mono text-[11px] text-retro-white/40 tracking-widest uppercase mb-4">
              Predicted Finish Times
            </p>
            <div className="space-y-3">
              {results.map(({ label, time, pace, isSource }) => (
                <div
                  key={label}
                  className={clsx(
                    "flex items-center justify-between p-4 border-l-4 transition-all",
                    isSource
                      ? "border-retro-green bg-retro-green/10"
                      : "border-retro-gray-light bg-retro-gray-mid/40",
                  )}
                >
                  <div>
                    <p className="font-retro text-retro-white text-lg tracking-wide">
                      {label}
                    </p>
                    <p className="font-mono text-retro-white/35 text-xs">
                      {pace}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-retro text-retro-green text-2xl tabular-nums">
                      {time}
                    </p>
                    {isSource && (
                      <p className="font-mono text-retro-green/50 text-[10px] tracking-widest">
                        SOURCE
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <span className="text-5xl mb-4 opacity-20">🏆</span>
            <p className="font-retro text-retro-white/25 text-xl tracking-wider">
              ENTER YOUR RESULT
            </p>
            <p className="font-sport text-retro-white/20 text-sm mt-2">
              Predictions appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
