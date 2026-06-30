// src/components/layout/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-retro-green/20 mt-24">
      {/* top green strip */}
      <div className="bg-retro-green py-1 overflow-hidden">
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="font-retro text-retro-black text-xs tracking-[0.3em] mx-8"
              >
                RUN FAST · TRAIN SMART · CALCULATE BETTER ·
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* brand */}
        <div>
          <p className="font-retro text-3xl text-retro-white mb-1">
            RUN<span className="text-retro-green">CALC</span>
          </p>
          <p className="font-mono text-[10px] text-retro-white/25 tracking-[0.3em] mb-4">
            PRO EDITION
          </p>
          <p className="font-sport text-retro-white/40 text-sm leading-relaxed">
            Professional running calculators for serious athletes. Free,
            accurate, and fast.
          </p>
        </div>

        {/* calculators */}
        <div>
          <h4 className="font-retro tracking-widest text-retro-green text-sm mb-4 uppercase">
            Calculators
          </h4>
          <ul className="space-y-2">
            {[
              ["Pace Calculator", "pace-calculator"],
              ["Race Predictor", "race-predictor"],
              ["Training Zones", "training-zone"],
              ["VO2 Max", "vo2max-calculator"],
              ["Calorie Burner", "calorie-calculator"],
            ].map(([label, type]) => (
              <li key={type}>
                <Link
                  to={`/calculator?type=${type}`}
                  className="font-sport text-retro-white/40 text-sm hover:text-retro-green transition-colors tracking-wide"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* links */}
        <div>
          <h4 className="font-retro tracking-widest text-retro-green text-sm mb-4 uppercase">
            Links
          </h4>
          <ul className="space-y-2">
            {[
              ["Home", "/"],
              ["Calculator", "/calculator"],
              ["Login", "/login"],
            ].map(([label, path]) => (
              <li key={path}>
                <Link
                  to={path}
                  className="font-sport text-retro-white/40 text-sm hover:text-retro-green transition-colors tracking-wide"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-retro-gray-light/10 px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-[11px] text-retro-white/20 tracking-widest">
          © {year} RUNCALC PRO. ALL RIGHTS RESERVED.
        </span>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-mono text-[11px] text-retro-green/40 hover:text-retro-green transition-colors tracking-widest"
        >
          ↑ TOP
        </button>
      </div>
    </footer>
  );
}
