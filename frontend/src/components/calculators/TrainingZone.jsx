// src/components/calculators/TrainingZone.jsx
import { useState } from "react";
import { useSaveCalculation } from "../../hooks/useSaveCalculation";
import { calcTrainingZones } from "../../utils/paceUtils";

export default function TrainingZone() {
  const [maxHR, setMaxHR] = useState(185);
  const [age, setAge] = useState(30);
  const [method, setMethod] = useState("max_hr");
  const [zones, setZones] = useState(null);

  const save = useSaveCalculation();

  const handleCalc = () => {
    const mhr = method === "formula" ? 220 - Number(age) : Number(maxHR);
    const z = calcTrainingZones(mhr);
    setZones(z);
    save("training-zone", { max_heart_rate: mhr, method, age }, { zones: z });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
      <div className="card-retro self-start p-6">
        <h2 className="font-retro text-2xl text-retro-white tracking-wide mb-6">
          TRAINING ZONES
        </h2>

        <div className="mb-5">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: "max_hr", label: "Max HR" },
              { val: "formula", label: "220−Age" },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setMethod(val)}
                className={`py-2.5 font-retro tracking-wider text-sm border-2 transition-all
                  ${
                    method === val
                      ? "bg-retro-green text-retro-black border-retro-green"
                      : "bg-transparent text-retro-white/50 border-retro-gray-light hover:border-retro-green"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {method === "formula" ? (
          <div className="mb-5">
            <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
              Age
            </label>
            <input
              type="number"
              value={age}
              min={10}
              max={100}
              onChange={(e) => setAge(Number(e.target.value))}
              className="input-retro py-3 px-4 text-lg w-full"
            />
            <p className="font-mono text-xs text-retro-white/30 mt-1">
              Estimated Max HR: {220 - age} bpm
            </p>
          </div>
        ) : (
          <div className="mb-5">
            <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
              Max Heart Rate (bpm)
            </label>
            <input
              type="number"
              value={maxHR}
              min={100}
              max={230}
              onChange={(e) => setMaxHR(Number(e.target.value))}
              className="input-retro py-3 px-4 text-lg w-full"
            />
          </div>
        )}

        <button
          onClick={handleCalc}
          className="btn-retro bg-retro-green text-retro-black font-retro tracking-widest w-full py-4 text-xl"
        >
          CALCULATE ZONES →
        </button>
      </div>

      <div className="card-retro p-6">
        {zones ? (
          <>
            <p className="font-mono text-[11px] text-retro-white/40 tracking-widest uppercase mb-4">
              Heart Rate Zones
            </p>
            <div className="space-y-3">
              {zones.map(({ z, name, color, minHR, maxHR, pct, tip }) => (
                <div key={z} className="relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <div className="relative flex items-center justify-between p-3 border border-retro-gray-light/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-8 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <p className="font-retro text-retro-white tracking-wide">
                          Z{z} · {name}
                        </p>
                        <p className="font-mono text-[10px] text-retro-white/30">
                          {tip}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-retro text-lg tabular-nums"
                        style={{ color }}
                      >
                        {minHR}–{maxHR}
                      </p>
                      <p className="font-mono text-[10px] text-retro-white/30">
                        {pct}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <p className="font-retro text-retro-white/25 text-xl tracking-wider">
              SET YOUR HR
            </p>
            <p className="font-sport text-retro-white/20 text-sm mt-2">
              Zones appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
