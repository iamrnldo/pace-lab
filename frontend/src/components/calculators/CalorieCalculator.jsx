// src/components/calculators/CalorieCalculator.jsx
import { useState } from "react";
import { calcCalories } from "../../utils/paceUtils";

export default function CalorieCalculator() {
  const [weight, setWeight] = useState(70);
  const [distance, setDistance] = useState(10);
  const [unit, setUnit] = useState("km");
  const [result, setResult] = useState(null);

  const handleCalc = () => {
    const distKm = unit === "miles" ? distance * 1.60934 : distance;
    setResult(calcCalories(Number(weight), distKm));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card-retro p-6">
        <h2 className="font-retro text-2xl text-retro-white tracking-wide mb-6">
          🔥 CALORIE CALCULATOR
        </h2>

        <div className="mb-5">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Body Weight (kg)
          </label>
          <input
            type="number"
            value={weight}
            min={30}
            max={200}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="input-retro py-3 px-4 text-lg w-full"
          />
        </div>

        <div className="mb-5">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Unit
          </label>
          <div className="flex">
            {["km", "miles"].map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`flex-1 py-3 font-retro tracking-widest text-sm border-2 transition-all
                  ${
                    unit === u
                      ? "bg-retro-green text-retro-black border-retro-green"
                      : "text-retro-white/50 border-retro-gray-light hover:border-retro-green"
                  }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
            Distance ({unit})
          </label>
          <div className="relative">
            <input
              type="number"
              value={distance}
              min={0.1}
              step={0.1}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="input-retro py-3 pl-4 pr-16 text-lg w-full"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-retro-white/40">
              {unit}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {[5, 10, 21, 42].map((d) => (
              <button
                key={d}
                onClick={() => setDistance(d)}
                className="font-mono text-xs border border-retro-gray-light text-retro-white/40
                           px-3 py-1 hover:border-retro-green hover:text-retro-green transition-all"
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCalc}
          className="btn-retro bg-retro-green text-retro-black font-retro
                     tracking-widest w-full py-4 text-xl"
        >
          CALCULATE →
        </button>
      </div>

      <div className="card-retro p-6 flex flex-col items-center justify-center">
        {result ? (
          <div className="text-center w-full">
            <p className="font-mono text-[11px] text-retro-white/40 tracking-widest uppercase mb-4">
              Calories Burned
            </p>
            <div className="font-retro text-8xl text-retro-green mb-2 tabular-nums animate-fade-in">
              {result.toLocaleString()}
            </div>
            <p className="font-mono text-retro-white/40 text-sm mb-8">kcal</p>

            {/* equivalents */}
            <div className="w-full space-y-3 text-left">
              <p className="font-mono text-[10px] text-retro-white/30 tracking-widest uppercase mb-2">
                That's equivalent to
              </p>
              {[
                {
                  emoji: "🍕",
                  label: "Pizza slices",
                  count: (result / 285).toFixed(1),
                },
                {
                  emoji: "🍺",
                  label: "Beers",
                  count: (result / 150).toFixed(1),
                },
                {
                  emoji: "🍫",
                  label: "Chocolate bars",
                  count: (result / 230).toFixed(1),
                },
              ].map(({ emoji, label, count }) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-retro-gray-light/20 pb-2"
                >
                  <span className="font-sport text-retro-white/50">
                    {emoji} {label}
                  </span>
                  <span className="font-retro text-retro-green text-lg tabular-nums">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-5xl mb-4 block opacity-20">🔥</span>
            <p className="font-retro text-retro-white/25 text-xl tracking-wider">
              ENTER YOUR DATA
            </p>
            <p className="font-sport text-retro-white/20 text-sm mt-2">
              Calories appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
