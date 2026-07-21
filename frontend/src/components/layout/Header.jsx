import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";

const NAV = [
  { label: "Calculator", path: "/calculator" },
  { label: "How It Works", path: "/#how-it-works" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-retro-black/95 backdrop-blur-sm border-b-2 border-retro-green/40"
          : "bg-retro-black/80 border-b border-retro-gray-light/20",
      )}
    >
      {/* ── top strip — HANYA desktop, tinggi fixed 28px ── */}
      <div className="hidden md:flex items-center justify-between px-6 h-7 border-b border-retro-gray-light/10">
        <span className="font-mono text-[11px] text-retro-white/25 tracking-widest">
          PACELAB PRO // v1.0.0
        </span>
        <span className="font-mono text-[11px] text-retro-green tracking-widest animate-blink">
          {time.toLocaleTimeString("en-US", { hour12: false })}
        </span>
        <span className="font-mono text-[11px] text-retro-white/25 tracking-widest">
          SYSTEM ONLINE ●
        </span>
      </div>

      {/* ── main nav row — tinggi fixed 68px ── */}
      <div className="flex items-center justify-between px-6 h-[68px]">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div
            className="w-9 h-9 border-2 border-retro-green flex items-center justify-center
                       group-hover:bg-retro-green transition-colors duration-150"
          >
            <span
              className="font-retro text-xl text-retro-green
                         group-hover:text-retro-black transition-colors duration-150"
            >
              R
            </span>
          </div>
          <div>
            <p className="font-retro text-2xl text-retro-white leading-none tracking-wider">
              PACE<span className="text-retro-green">LAB</span>
            </p>
            <p className="font-mono text-[9px] text-retro-white/30 tracking-[0.35em]">
              PRO EDITION
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                clsx(
                  "font-retro text-lg tracking-widest px-4 py-2 relative group transition-colors",
                  isActive
                    ? "text-retro-green"
                    : "text-retro-white/60 hover:text-retro-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  <span
                    className={clsx(
                      "absolute bottom-0 left-0 h-0.5 bg-retro-green transition-all duration-200",
                      isActive ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* CTA button */}
        <div className="hidden md:block">
          <Link to="/calculator">
            <button
              className="btn-retro bg-retro-green text-retro-black font-retro
                         tracking-widest px-6 py-2.5 text-base
                         hover:bg-retro-green-dark transition-colors"
            >
              START →
            </button>
          </Link>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={clsx(
                "block h-0.5 bg-retro-green transition-all duration-200",
                i === 1
                  ? menuOpen
                    ? "opacity-0 w-5"
                    : "w-3"
                  : menuOpen
                    ? i === 0
                      ? "rotate-45 translate-y-2 w-5"
                      : "-rotate-45 -translate-y-2 w-5"
                    : "w-5",
              )}
            />
          ))}
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      <div
        className={clsx(
          "md:hidden overflow-hidden transition-all duration-300",
          "border-t border-retro-gray-light/20",
          menuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="flex flex-col p-4 gap-1 bg-retro-black/95">
          {NAV.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className="font-retro text-xl tracking-widest text-retro-white/70
                         hover:text-retro-green py-3
                         border-b border-retro-gray-light/20 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link to="/calculator" onClick={() => setMenuOpen(false)}>
            <button
              className="btn-retro bg-retro-green text-retro-black font-retro
                         tracking-widest px-6 py-3 w-full mt-3 text-lg"
            >
              START CALCULATING →
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
