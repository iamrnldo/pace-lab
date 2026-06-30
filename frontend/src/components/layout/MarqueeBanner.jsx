// src/components/layout/MarqueeBanner.jsx
import { useState, useEffect } from "react";

export default function MarqueeBanner() {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const header = document.querySelector("header");
      setHeaderHeight(header?.offsetHeight || 0);
    };

    const timer = setTimeout(calculate, 30);
    window.addEventListener("resize", calculate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculate);
    };
  }, []);

  const ITEMS = [
    "⚡ PACE CALCULATOR",
    "🏆 RACE PREDICTOR",
    "❤️ TRAINING ZONES",
    "🫁 VO2 MAX",
    "🔥 CALORIES",
    "📊 SPLIT CALCULATOR",
    "🏁 FINISH TIME",
  ];

  const repeated = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div
      data-marquee // ← penting untuk selector di MainLayout
      style={{ top: `${headerHeight}px` }}
      className="fixed left-0 right-0 z-40 bg-retro-green overflow-hidden border-y-2 border-retro-green-dark py-1.5"
    >
      <div className="marquee-wrap">
        <div className="marquee-track">
          {repeated.map((item, i) => (
            <span
              key={i}
              className="font-retro text-retro-black text-sm tracking-widest mx-8 select-none"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
