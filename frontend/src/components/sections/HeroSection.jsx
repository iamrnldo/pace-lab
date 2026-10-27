// src/components/sections/HeroSection.jsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import OptimizedImage from "../ui/OptimizedImage";
import hero640 from "../../assets/optimized/pace-lab-640.webp";
import hero960 from "../../assets/optimized/pace-lab-960.webp";
import hero1280 from "../../assets/optimized/pace-lab-1280.webp";
import hero1600 from "../../assets/optimized/pace-lab-1600.webp";
import heroFallback from "../../assets/optimized/pace-lab-fallback.png";
import heroPlaceholder from "../../assets/optimized/pace-lab-placeholder.png";

const HERO_IMAGE_SIZES =
  "(max-width: 640px) 88vw, (max-width: 768px) 470px, (max-width: 1024px) 580px, 760px";
const HERO_IMAGE_SRCSET = `${hero640} 640w, ${hero960} 960w, ${hero1280} 1280w, ${hero1600} 1600w`;

export default function HeroSection() {
  const lineRef = useRef(null);
  const auth = useAuth();
  const user = auth?.user;

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
    <section className="relative flex items-center overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[92vh] lg:px-10 lg:py-12">
      {/* bg huge text */}
      <div
        ref={lineRef}
        aria-hidden="true"
        className="absolute inset-0 hidden items-center justify-center pointer-events-none select-none sm:flex"
      >
        <span className="font-retro text-[26vw] text-retro-white/[0.018] whitespace-nowrap leading-none lg:text-[20vw]">
          RUNNING
        </span>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-16 xl:gap-20">
        {/* content */}
        <div className="order-1 text-center animate-slide-up lg:order-2 lg:text-left">
          {/* tag */}
          <div className="mb-5 inline-flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <span className="h-px w-6 bg-retro-green sm:w-8" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-retro-green sm:text-xs sm:tracking-[0.3em]">
              Professional Running Tools
            </span>
            <span className="h-px w-6 bg-retro-green sm:w-8" />
          </div>

          {/* title */}
          <h1 className="mb-5 font-retro leading-[0.92] sm:mb-6">
            <span className="block text-[clamp(2.7rem,12vw,7rem)] tracking-tight text-retro-white">
              CALCULATE
            </span>
            <span
              className="block text-[clamp(2.7rem,12vw,7rem)] tracking-tight text-retro-green"
              style={{ textShadow: "4px 4px 0 rgba(223,245,255,0.28)" }}
            >
              YOUR PACE
            </span>
          </h1>

          {/* sub */}
          <p className="mx-auto mb-8 max-w-xl font-sport text-base leading-relaxed tracking-wide text-retro-white/75 sm:mb-10 sm:text-lg md:text-xl lg:mx-0 lg:max-w-[34rem] lg:pr-6">
            Professional running calculators for athletes. Track pace,
            predict race times, analyze training zones and optimize your
            performance.
          </p>

          {/* CTAs — berubah sesuai login status */}
          <div className="mb-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
            {user ? (
              /* Sudah login → START CALCULATING */
              <Link to="/calculator" className="w-full sm:w-auto">
                <button
                  className="btn-retro w-full bg-retro-green px-6 py-3.5 text-lg font-retro
                    tracking-widest text-retro-black sm:px-8 sm:py-4 sm:text-xl"
                >
                  START CALCULATING →
                </button>
              </Link>
            ) : (
              /* Belum login → SIGN IN */
              <Link to="/login" className="w-full sm:w-auto">
                <button
                  className="btn-retro w-full bg-retro-green px-6 py-3.5 text-lg font-retro
                    tracking-widest text-retro-black sm:px-8 sm:py-4 sm:text-xl"
                >
                  SIGN IN TO START →
                </button>
              </Link>
            )}

            <a href="#how-it-works" className="w-full sm:w-auto">
              <button
                className="btn-retro w-full border-retro-white/30 px-6 py-3.5 text-lg font-retro
                  tracking-widest text-retro-white hover:border-retro-white sm:px-8 sm:py-4 sm:text-xl"
              >
                HOW IT WORKS
              </button>
            </a>
          </div>

          {/* mini stats */}
          <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-8 lg:justify-start lg:gap-10">
            {[
              { val: "7+", label: "Calculators" },
              { val: "100%", label: "Free" },
              { val: "∞", label: "Calculations" },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:gap-2 lg:items-start lg:text-left"
              >
                <span className="font-retro text-2xl text-retro-green sm:text-3xl">
                  {val}
                </span>
                <span className="font-sport text-xs uppercase tracking-[0.22em] text-retro-white/55 sm:text-sm sm:tracking-widest">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* visual */}
        <div className="order-2 flex justify-center animate-slide-up lg:order-1 lg:justify-start">
          <div className="relative w-full max-w-[360px] sm:max-w-[470px] md:max-w-[580px] lg:max-w-[760px]">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-transparent via-retro-black/10 to-transparent blur-3xl" />
            <OptimizedImage
              alt="Pace calculator and running athlete visual"
              fallbackSrc={heroFallback}
              sources={[{ type: "image/webp", srcSet: HERO_IMAGE_SRCSET }]}
              placeholderSrc={heroPlaceholder}
              sizes={HERO_IMAGE_SIZES}
              width={1600}
              height={1600}
              priority
              wrapperClassName="relative z-10 w-full rounded-[2rem] overflow-hidden"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
