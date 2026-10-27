// src/pages/CalculatorPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import VcrCalculator from "../components/calculators/VcrCalculator";
import RacePredictor from "../components/calculators/RacePredictor";
import TrainingZone from "../components/calculators/TrainingZone";
import clsx from "clsx";

const TABS = [
  {
    id: "vcr-calculator",
    label: "VCR",
    Component: VcrCalculator,
  },
  {
    id: "race-predictor",
    label: "Race",
    Component: RacePredictor,
  },
  {
    id: "training-zone",
    label: "Zones",
    Component: TrainingZone,
  },
];

const LEGACY_TAB_MAP = {
  "pace-calculator": "vcr-calculator",
  "race-zones": "race-predictor",
};

export default function CalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const normalizedDefaultTab = useMemo(() => {
    const rawType = searchParams.get("type");
    const mappedType = LEGACY_TAB_MAP[rawType] || rawType;
    return TABS.some((tab) => tab.id === mappedType) ? mappedType : TABS[0].id;
  }, [searchParams]);

  const [activeId, setActiveId] = useState(normalizedDefaultTab);

  useEffect(() => {
    setActiveId(normalizedDefaultTab);
  }, [normalizedDefaultTab]);

  const { Component } = TABS.find((t) => t.id === activeId) || TABS[0];

  const handleTab = (id) => {
    setActiveId(id);
    setSearchParams({ type: id });
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-36 pb-24">
      <div className="mb-10 animate-slide-up">
        <span className="font-mono text-retro-green text-xs tracking-[0.3em]">
          // TOOLS
        </span>
        <h1 className="font-retro text-5xl md:text-7xl text-retro-white mt-1 leading-none">
          CALCULATOR<span className="text-retro-green animate-blink">_</span>
        </h1>
      </div>

      <div className="mb-8 flex gap-0 overflow-x-auto border-b-2 border-retro-gray-light">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTab(id)}
            className={clsx(
              "font-retro whitespace-nowrap border-b-2 -mb-0.5 px-5 py-3 text-sm tracking-widest transition-all duration-150",
              activeId === id
                ? "border-retro-green bg-retro-green text-retro-black"
                : "border-transparent text-retro-white/50 hover:bg-retro-gray-mid hover:text-retro-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div key={activeId} className="animate-fade-in">
        <Component />
      </div>
    </section>
  );
}
