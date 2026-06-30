// src/components/sections/HeroSection.jsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  const lineRef = useRef(null);

  /* simple parallax on scroll */
  useEffect(() => {
    const onScroll = () => {
      if (lineRef.current) {
        lineRef.current.style.transform = `translateY(${window.scrollY * 0.15}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-6">
      {/* bg huge text */}
      <div
        ref={lineRef}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <span className="font-retro text-[28vw] text-retro-white/[0.018] whitespace-nowrap leading-none">
          RUNNING
        </span>
      </div>

      {/* left accent lines */}
      <div
        className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2"
        aria-hidden="true"
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{ width: `${16 + i * 10}px`, height: "2px" }}
            className="bg-retro-green/25"
          />
        ))}
      </div>

      {/* content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto animate-slide-up">
        {/* tag */}
        <div className="inline-flex items-center gap-3 mb-6">
          <span className="w-8 h-px bg-retro-green" />
          <span className="font-mono text-retro-green text-xs tracking-[0.3em] uppercase">
            Professional Running Tools
          </span>
          <span className="w-8 h-px bg-retro-green" />
        </div>

        {/* title */}
        <h1 className="font-retro leading-none mb-6">
          <span className="block text-[clamp(3.5rem,11vw,9rem)] text-retro-white tracking-tight">
            CALCULATE
          </span>
          <span
            className="block text-[clamp(3.5rem,11vw,9rem)] text-retro-green tracking-tight"
            style={{ textShadow: "4px 4px 0 rgba(181,211,23,0.25)" }}
          >
            YOUR PACE
          </span>
        </h1>

        {/* sub */}
        <p className="font-sport text-retro-white/55 text-xl max-w-xl mx-auto mb-10 leading-relaxed tracking-wide">
          Professional running calculators for athletes. Track pace, predict
          race times, analyze training zones and optimize your performance.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link to="/calculator">
            <button
              className="btn-retro bg-retro-green text-retro-black font-retro
                               tracking-widest px-8 py-4 text-xl"
            >
              START CALCULATING →
            </button>
          </Link>
          <a href="#how-it-works">
            <button
              className="btn-retro border-retro-white/30 text-retro-white font-retro
                               tracking-widest px-8 py-4 text-xl hover:border-retro-white"
            >
              HOW IT WORKS
            </button>
          </a>
        </div>

        {/* mini stats */}
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { val: "7+", label: "Calculators" },
            { val: "100%", label: "Free" },
            { val: "∞", label: "Calculations" },
          ].map(({ val, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="font-retro text-2xl text-retro-green">
                {val}
              </span>
              <span className="font-sport text-retro-white/40 text-sm tracking-widest uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="font-mono text-[10px] text-retro-white/25 tracking-widest">
          SCROLL
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-retro-green/60 to-transparent animate-bounce-slow" />
      </div>
    </section>
  );
}
