// src/components/calculators/PaceCalculator.jsx
import { useState } from "react";
import { calcPace } from "../../utils/paceUtils";
import clsx from "clsx";

const PRESETS = [
  { label: "5K", km: 5 },
  { label: "10K", km: 10 },
  { label: "Half", km: 21.0975 },
  { label: "Full", km: 42.195 },
];

export default function PaceCalculator() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(10);
  const [unit, setUnit] = useState("km");
  const [result, setResult] = useState(null);

  const handleCalc = () => {
    const totalSec =
      Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    const distKm = unit === "miles" ? distance * 1.60934 : distance;
    setResult(calcPace(totalSec, distKm));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Input ── */}
      <div className="card-retro p-6">
        <h2 className="font-retro text-2xl text-retro-white tracking-wide mb-6">
          ⚡ PACE CALCULATOR
        </h2>

        {/* time */}
        <div className="mb-5">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Finish Time
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

        {/* unit */}
        <div className="mb-5">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Unit
          </label>
          <div className="flex">
            {["km", "miles"].map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={clsx(
                  "flex-1 py-3 font-retro tracking-widest text-sm border-2 transition-all",
                  unit === u
                    ? "bg-retro-green text-retro-black border-retro-green"
                    : "bg-transparent text-retro-white/50 border-retro-gray-light hover:border-retro-green hover:text-retro-white",
                )}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* distance */}
        <div className="mb-6">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Distance
          </label>
          <div className="relative">
            <input
              type="number"
              min={0.1}
              step={0.01}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="input-retro py-3 pl-4 pr-16 text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-retro-white/40">
              {unit}
            </span>
          </div>
          {/* presets */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {PRESETS.map(({ label, km }) => (
              <button
                key={label}
                onClick={() =>
                  setDistance(
                    unit === "miles" ? +(km / 1.60934).toFixed(2) : km,
                  )
                }
                className="font-mono text-xs border border-retro-gray-light text-retro-white/40
                           px-3 py-1 hover:border-retro-green hover:text-retro-green transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCalc}
          className="btn-retro bg-retro-green text-retro-black font-retro tracking-widest
                     w-full py-4 text-xl"
        >
          CALCULATE →
        </button>
      </div>

      {/* ── Result ── */}
      <div className="flex flex-col gap-4">
        {result ? (
          <>
            {/* main pace */}
            <div className="card-retro p-6 animate-pulse-green">
              <p className="font-mono text-[11px] text-retro-green/60 tracking-widest uppercase mb-2">
                Your Pace
              </p>
              <div className="font-retro text-7xl text-retro-green animate-fade-in tabular-nums">
                {result.pacePerKm}
              </div>
              <p className="font-mono text-retro-white/35 text-sm mt-2">
                per km &nbsp;·&nbsp; {result.pacePerMile} per mile
              </p>
            </div>

            {/* speed */}
            <div className="card-retro p-5">
              <p className="font-mono text-[11px] text-retro-white/40 tracking-widest uppercase mb-3">
                Speed
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: result.speedKmh, unit: "km/h" },
                  { val: result.speedMph, unit: "mph" },
                ].map(({ val, unit: u }) => (
                  <div key={u}>
                    <span className="font-retro text-3xl text-retro-white tabular-nums">
                      {val}
                    </span>
                    <span className="font-mono text-retro-white/35 text-xs ml-1">
                      {u}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* projections */}
            <div className="card-retro p-5">
              <p className="font-mono text-[11px] text-retro-white/40 tracking-widest uppercase mb-4">
                Projected Times
              </p>
              {result.projections.map(({ label, time }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2.5
                             border-b border-retro-gray-light/25 last:border-0"
                >
                  <span className="font-sport text-retro-white/55 tracking-wide">
                    {label}
                  </span>
                  <span className="font-retro text-retro-green text-xl tabular-nums">
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card-retro p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            <span className="text-5xl mb-4 opacity-20">⚡</span>
            <p className="font-retro text-retro-white/25 text-xl tracking-wider">
              ENTER YOUR TIME
            </p>
            <p className="font-sport text-retro-white/20 text-sm mt-2">
              Results appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
