// src/components/sections/StatsSection.jsx
import { useEffect, useRef, useState } from "react";

const STATS = [
  { end: 15000, suffix: "+", label: "Calculations" },
  { end: 7, suffix: "", label: "Calculators" },
  { end: 99, suffix: "%", label: "Accuracy" },
  { end: 2500, suffix: "+", label: "Active Users" },
];

function Counter({ end, suffix, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const startTime = performance.now();

          const tick = (now) => {
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(end * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-retro text-5xl md:text-6xl text-retro-green tabular-nums">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="font-sport text-retro-white/40 tracking-widest uppercase text-sm mt-1">
        {label}
      </div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-16 border-y-2 border-retro-green/15 bg-retro-gray/40">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
        {STATS.map((s) => (
          <Counter key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}
