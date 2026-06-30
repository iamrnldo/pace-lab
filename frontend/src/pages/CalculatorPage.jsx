// src/pages/CalculatorPage.jsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PaceCalculator from "../components/calculators/PaceCalculator";
import RacePredictor from "../components/calculators/RacePredictor";
import TrainingZone from "../components/calculators/TrainingZone";
import VO2MaxCalculator from "../components/calculators/VO2MaxCalculator";
import CalorieCalculator from "../components/calculators/CalorieCalculator";
import clsx from "clsx";

const TABS = [
  {
    id: "pace-calculator",
    emoji: "⚡",
    label: "Pace",
    Component: PaceCalculator,
  },
  {
    id: "race-predictor",
    emoji: "🏆",
    label: "Race",
    Component: RacePredictor,
  },
  { id: "training-zone", emoji: "❤️", label: "Zones", Component: TrainingZone },
  {
    id: "vo2max-calculator",
    emoji: "🫁",
    label: "VO2 Max",
    Component: VO2MaxCalculator,
  },
  {
    id: "calorie-calculator",
    emoji: "🔥",
    label: "Calories",
    Component: CalorieCalculator,
  },
];

export default function CalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("type") || TABS[0].id;
  const [activeId, setActiveId] = useState(defaultTab);

  const { Component } = TABS.find((t) => t.id === activeId) || TABS[0];

  const handleTab = (id) => {
    setActiveId(id);
    setSearchParams({ type: id });
  };

  return (
    <section className="pt-36 pb-24 px-4 max-w-6xl mx-auto">
      {/* heading */}
      <div className="mb-10 animate-slide-up">
        <span className="font-mono text-retro-green text-xs tracking-[0.3em]">
          // TOOLS
        </span>
        <h1 className="font-retro text-5xl md:text-7xl text-retro-white mt-1 leading-none">
          CALCULATOR<span className="text-retro-green animate-blink">_</span>
        </h1>
      </div>

      {/* tab bar */}
      <div className="flex gap-0 mb-8 overflow-x-auto border-b-2 border-retro-gray-light">
        {TABS.map(({ id, emoji, label }) => (
          <button
            key={id}
            onClick={() => handleTab(id)}
            className={clsx(
              "font-retro tracking-widest whitespace-nowrap px-5 py-3 text-sm transition-all duration-150 border-b-2 -mb-0.5",
              activeId === id
                ? "text-retro-black bg-retro-green border-retro-green"
                : "text-retro-white/50 border-transparent hover:text-retro-white hover:bg-retro-gray-mid",
            )}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* active calculator */}
      <div key={activeId} className="animate-fade-in">
        <Component />
      </div>
    </section>
  );
}
