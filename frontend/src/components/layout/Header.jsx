// src/components/layout/Header.jsx
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const headerRef = useRef(null);
  const auth = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();

  // Nav items — berubah sesuai login status
  const NAV = user
    ? [
        { label: t("calculator"), path: "/calculator" },
        { label: t("dashboard"), path: "/dashboard" },
        { label: t("myPrograms"), path: "/my-training-programs" },
        { label: t("howItWorks"), path: "/#how-it-works" },
      ]
    : [{ label: "How It Works", path: "/#how-it-works" }];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const handleLogout = async () => {
    if (logout) await logout();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <header
      ref={headerRef}
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-retro-black/95 backdrop-blur-sm border-b-2 border-retro-green/40"
          : "bg-retro-black/80 border-b border-retro-gray-light/20"
      )}
    >
      {/* ── top strip — desktop only ── */}
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

      {/* ── main nav row ── */}
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
                    : "text-retro-white/60 hover:text-retro-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  <span
                    className={clsx(
                      "absolute bottom-0 left-0 h-0.5 bg-retro-green transition-all duration-200",
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* CTA button — berubah sesuai login */}
        <div className="hidden md:flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label="Select language"
            className="bg-retro-black border border-retro-green/40 text-retro-green px-2 py-2 font-mono text-[10px] tracking-widest cursor-pointer"
          >
            <option value="en">ENGLISH</option>
            <option value="id">BAHASA INDONESIA</option>
          </select>
          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-3 border border-retro-green/40 px-3 py-2 hover:bg-retro-green/10 transition-colors" aria-expanded={menuOpen}>
                {user.avatar_url ? <img src={user.avatar_url.startsWith("http") ? user.avatar_url : `${import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:5000"}${user.avatar_url}`} alt="" className="w-8 h-8 border border-retro-green/50 object-cover" /> : <div className="w-8 h-8 border border-retro-green/50 flex items-center justify-center"><span className="font-retro text-xs text-retro-green">{user.name?.charAt(0)?.toUpperCase() || "?"}</span></div>}
                <span className="font-sport text-sm text-retro-white tracking-wider">{user.name || "USER"}</span>
                <span className="text-retro-green">▾</span>
              </button>
              {menuOpen && <div className="absolute right-0 top-full mt-2 w-48 border border-retro-green/40 bg-retro-black shadow-lg p-2 z-50">
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-3 font-retro text-sm tracking-widest text-retro-white hover:bg-retro-green hover:text-retro-black">PROFILE</Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-3 font-retro text-sm tracking-widest text-red-400 hover:bg-red-500 hover:text-white">LOGOUT</button>
              </div>}
            </div>
          ) : (
            /* Not logged in → SIGN IN */
            <Link to="/login">
              <button
                className="btn-retro bg-retro-green text-retro-black font-retro
                  tracking-widest px-6 py-2.5 text-base
                  hover:bg-retro-green-dark transition-colors"
              >
                SIGN IN →
              </button>
            </Link>
          )}
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
                    : "w-5"
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
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col p-4 gap-1 bg-retro-black/95">
          <select value={language} onChange={(e) => changeLanguage(e.target.value)} className="bg-retro-black border border-retro-green/40 text-retro-green px-3 py-3 font-mono text-xs tracking-widest mb-2">
            <option value="en">ENGLISH LANGUAGE</option>
            <option value="id">BAHASA INDONESIA</option>
          </select>
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

          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="font-retro text-xl tracking-widest text-retro-white/70 hover:text-retro-green py-3 border-b border-retro-gray-light/20">
                PROFILE
              </Link>
              <Link to="/calculator" onClick={() => setMenuOpen(false)}>
                <button
                  className="btn-retro bg-retro-green text-retro-black font-retro
                    tracking-widest px-6 py-3 w-full mt-3 text-lg"
                >
                  START CALCULATING →
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="btn-retro border-red-400/40 text-red-400 font-retro
                  tracking-widest px-6 py-3 w-full mt-2 text-lg"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <button
                className="btn-retro bg-retro-green text-retro-black font-retro
                  tracking-widest px-6 py-3 w-full mt-3 text-lg"
              >
                SIGN IN →
              </button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
