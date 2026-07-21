import { useState } from "react";
import clsx from "clsx";
import { calcVcrProfile } from "../../utils/vcrCalculator";

const TEST_PRESETS = [15, 30, 45, 60];

const DISTANCE_PRESETS = [3000, 5000, 9000, 12000];

export default function PaceCalculator() {
  const [testMinutes, setTestMinutes] = useState(45);
  const [distanceMeters, setDistanceMeters] = useState(9000);
  const [result, setResult] = useState(null);

  const handleCalc = () => {
    setResult(calcVcrProfile(testMinutes, distanceMeters));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card-retro p-6">
        <h2 className="mb-2 font-retro text-2xl tracking-wide text-retro-white">
          VCR CALCULATOR
        </h2>
        <p className="mb-6 font-sport text-sm leading-relaxed text-retro-white/45">
          Formula: VCR = distance (meters) ÷ total test time (seconds).
          Based on the VCR spreadsheet for middle and long distance tests.
        </p>

        <div className="mb-5">
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-retro-white/50">
            Test Duration (Minutes)
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              step={1}
              value={testMinutes}
              onChange={(e) => setTestMinutes(Number(e.target.value))}
              className="input-retro py-3 pl-4 pr-20 text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-retro-white/40">
              min
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEST_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setTestMinutes(preset)}
                className={clsx(
                  "border px-3 py-1 font-mono text-xs transition-all",
                  testMinutes === preset
                    ? "border-retro-green bg-retro-green text-retro-black"
                    : "border-retro-gray-light text-retro-white/45 hover:border-retro-green hover:text-retro-green",
                )}
              >
                {preset} MIN
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-retro-white/50">
            Distance (Meters)
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              step={1}
              value={distanceMeters}
              onChange={(e) => setDistanceMeters(Number(e.target.value))}
              className="input-retro py-3 pl-4 pr-20 text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-retro-white/40">
              m
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {DISTANCE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setDistanceMeters(preset)}
                className={clsx(
                  "border px-3 py-1 font-mono text-xs transition-all",
                  distanceMeters === preset
                    ? "border-retro-green bg-retro-green text-retro-black"
                    : "border-retro-gray-light text-retro-white/45 hover:border-retro-green hover:text-retro-green",
                )}
              >
                {preset} M
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCalc}
          className="btn-retro w-full bg-retro-green py-4 text-xl font-retro tracking-widest text-retro-black"
        >
          CALCULATE VCR →
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {result ? (
          <>
            <div className="card-retro p-6 animate-pulse-green">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-retro-green/60">
                VCR RESULT
              </p>
              <div className="font-retro text-6xl text-retro-green tabular-nums sm:text-7xl">
                {result.vcrMs.toFixed(2)}
              </div>
              <p className="mt-2 font-mono text-sm text-retro-white/40">
                m/s · {result.vcrKmh.toFixed(2)} km/h · {result.basePacePerKm}
                /km
              </p>
              <p className="mt-3 font-sport text-sm text-retro-white/50">
                60-minute equivalent distance: {result.vcr60Km.toFixed(2)} km
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="card-retro p-5">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                  Pace Training Zone
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {result.trainingZones.map((zone) => (
                    <div
                      key={zone.label}
                      className="border border-retro-gray-light/30 bg-retro-black/10 p-3"
                    >
                      <p className="font-mono text-[11px] tracking-widest text-retro-white/45">
                        {zone.label}
                      </p>
                      <p className="mt-1 font-retro text-2xl text-retro-green tabular-nums">
                        {zone.pacePerKm}
                      </p>
                      <p className="font-mono text-[10px] text-retro-white/30">
                        per km
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-retro p-5">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                  Test Summary
                </p>
                <div className="space-y-3">
                  {[
                    ["Test Duration", `${result.testMinutes} min`],
                    ["Distance", `${result.distanceMeters.toLocaleString()} m`],
                    ["Base Pace", `${result.basePacePerKm}/km`],
                    ["VCR 100%", `${result.vcrMs.toFixed(2)} m/s`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-retro-gray-light/20 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="font-sport tracking-wide text-retro-white/55">
                        {label}
                      </span>
                      <span className="font-retro text-lg text-retro-white tabular-nums">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-retro p-5">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                Interval Targets
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-retro-gray-light/30 text-retro-white/45">
                      {[
                        "%",
                        "VCR",
                        "Pace /km",
                        "1000 m",
                        "400 m",
                        "200 m",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-2 py-2 font-mono text-[11px] uppercase tracking-widest first:pl-0"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.intervals.map((item) => (
                      <tr
                        key={item.label}
                        className="border-b border-retro-gray-light/15 last:border-0"
                      >
                        <td className="px-2 py-2 pl-0 font-retro text-retro-green">
                          {item.label}
                        </td>
                        <td className="px-2 py-2 font-mono text-sm text-retro-white tabular-nums">
                          {item.vcrMs.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 font-retro text-retro-white tabular-nums">
                          {item.pacePerKm}
                        </td>
                        <td className="px-2 py-2 font-retro text-retro-white/85 tabular-nums">
                          {item.time1000}
                        </td>
                        <td className="px-2 py-2 font-retro text-retro-white/85 tabular-nums">
                          {item.time400}
                        </td>
                        <td className="px-2 py-2 font-retro text-retro-white/85 tabular-nums">
                          {item.time200}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="card-retro p-5">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                  Middle Distance Targets
                </p>
                <div className="space-y-3">
                  {result.middleDistanceTargets.map((target) => (
                    <div
                      key={target.label}
                      className="flex items-center justify-between border-b border-retro-gray-light/20 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-retro text-lg text-retro-green">
                          {target.label}
                        </p>
                        <p className="font-mono text-[10px] tracking-widest text-retro-white/30">
                          {Math.round(target.multiplier * 100)}% · {target.pacePerKm}/km
                        </p>
                      </div>
                      <span className="font-retro text-2xl text-retro-white tabular-nums">
                        {target.totalTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-retro p-5">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                  Long Distance Targets
                </p>
                <div className="space-y-3">
                  {result.longDistanceTargets.map((target) => (
                    <div
                      key={target.label}
                      className="flex items-center justify-between border-b border-retro-gray-light/20 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-retro text-lg text-retro-green">
                          {target.label}
                        </p>
                        <p className="font-mono text-[10px] tracking-widest text-retro-white/30">
                          {Math.round(target.multiplier * 100)}% · {target.pacePerKm}/km
                        </p>
                      </div>
                      <span className="font-retro text-2xl text-retro-white tabular-nums">
                        {target.totalTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card-retro flex min-h-[320px] flex-col items-center justify-center p-6 text-center">
            <p className="font-retro text-xl tracking-wider text-retro-white/25">
              ENTER TEST DATA
            </p>
            <p className="mt-2 font-sport text-sm text-retro-white/20">
              VCR, interval targets, and distance projections appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
