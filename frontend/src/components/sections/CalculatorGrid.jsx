// src/components/sections/CalculatorGrid.jsx
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const CALCS = [
  {
    id: "pace-calculator",
    icon: "⚡",
    title: "Pace Calculator",
    desc: "Convert time, distance & pace instantly",
    badge: "Popular",
  },
  {
    id: "race-predictor",
    icon: "🏆",
    title: "Race Predictor",
    desc: "Predict finish time from recent results",
    badge: "Hot",
  },
  {
    id: "training-zone",
    icon: "❤️",
    title: "Training Zones",
    desc: "Calculate HR zones for optimal training",
    badge: null,
  },
  {
    id: "vo2max-calculator",
    icon: "🫁",
    title: "VO2 Max",
    desc: "Estimate your aerobic capacity",
    badge: null,
  },
  {
    id: "calorie-calculator",
    icon: "🔥",
    title: "Calorie Burner",
    desc: "Calories burned by distance & weight",
    badge: null,
  },
  {
    id: "split-calculator",
    icon: "📊",
    title: "Split Calculator",
    desc: "Plan even or negative race splits",
    badge: "New",
  },
];

export default function CalculatorGrid() {
  const ref = useRef(null);

  useEffect(() => {
    const cards = ref.current?.querySelectorAll("[data-card]");
    if (!cards) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = "1";
            e.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px)";
      card.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      {/* heading */}
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-px w-12 bg-retro-green" />
          <span className="font-mono text-retro-green text-xs tracking-[0.3em] uppercase">
            Tools
          </span>
        </div>
        <h2 className="font-retro text-5xl md:text-7xl text-retro-white leading-none">
          ALL CALCULATORS
        </h2>
        <p className="font-sport text-retro-white/45 text-lg mt-3 max-w-sm">
          Everything you need to analyze and improve your running
        </p>
      </div>

      {/* grid */}
      <div
        ref={ref}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {CALCS.map(({ id, icon, title, desc, badge }) => (
          <div key={id} data-card>
            <Link to={`/calculator?type=${id}`}>
              <div className="card-retro p-6 h-full group cursor-pointer">
                {/* top row */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{icon}</span>
                  {badge && (
                    <span
                      className="font-retro text-xs tracking-widest px-2 py-0.5
                                     bg-retro-green text-retro-black"
                    >
                      {badge}
                    </span>
                  )}
                </div>

                <h3
                  className="font-retro text-xl text-retro-white tracking-wide mb-2
                               group-hover:text-retro-green transition-colors duration-200"
                >
                  {title}
                </h3>
                <p className="font-sport text-retro-white/45 text-sm leading-relaxed">
                  {desc}
                </p>

                <div
                  className="mt-5 flex items-center gap-1.5 text-retro-green text-sm font-sport
                                tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <span>Open calculator</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
