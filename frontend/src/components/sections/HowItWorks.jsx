// src/components/sections/HowItWorks.jsx
const STEPS = [
  {
    num: "01",
    title: "Choose Calculator",
    desc: "Pick from 7 professional running calculators designed for all levels.",
  },
  {
    num: "02",
    title: "Input Your Data",
    desc: "Enter your time, distance, or heart rate. Switch between km and miles.",
  },
  {
    num: "03",
    title: "Get Results",
    desc: "Instant accurate results with projected times for all race distances.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto">
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-px w-12 bg-retro-green" />
          <span className="font-mono text-retro-green text-xs tracking-[0.3em] uppercase">
            Process
          </span>
        </div>
        <h2 className="font-retro text-5xl md:text-7xl text-retro-white leading-none">
          HOW IT WORKS
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map(({ num, title, desc }, i) => (
          <div key={num} className="relative">
            {/* connector line */}
            {i < STEPS.length - 1 && (
              <div
                className="hidden md:block absolute top-8 left-full w-full h-px
                              bg-gradient-to-r from-retro-green/40 to-transparent z-0"
              />
            )}

            <div className="relative z-10">
              <div className="font-retro text-7xl text-retro-green/15 leading-none mb-2 select-none">
                {num}
              </div>
              <div className="w-10 h-0.5 bg-retro-green mb-4" />
              <h3 className="font-retro text-2xl text-retro-white tracking-wide mb-3">
                {title}
              </h3>
              <p className="font-sport text-retro-white/45 leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
