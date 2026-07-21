// src/components/admin/AdminHeader.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";

export default function AdminHeader({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 bg-retro-black/95 backdrop-blur-sm border-b-2 border-retro-green/30">
      <div className="flex items-center justify-between px-4 md:px-6 h-[64px]">
        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden flex flex-col gap-1.5 p-1"
            aria-label="Toggle sidebar"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="block w-5 h-0.5 bg-retro-green" />
            ))}
          </button>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-retro-white/30">
            <span>ADMIN</span>
            <span>/</span>
            <span className="text-retro-green">PANEL</span>
          </div>
        </div>

        {/* Right: time + user */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Clock */}
          <div className="hidden md:block font-mono text-[11px] text-retro-green tracking-widest animate-blink">
            {time.toLocaleTimeString("en-US", { hour12: false })}
          </div>

          {/* Status dot */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-retro-white/30 tracking-widest">
            <span className="w-2 h-2 rounded-full bg-retro-green animate-pulse-green" />
            ONLINE
          </div>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-3 group"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 border-2 border-retro-green/50 group-hover:border-retro-green transition-colors"
                />
              ) : (
                <div className="w-8 h-8 border-2 border-retro-green/50 group-hover:border-retro-green flex items-center justify-center bg-retro-gray transition-colors">
                  <span className="font-retro text-sm text-retro-green">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="font-sport text-sm text-retro-white leading-tight">
                  {user?.name || "Admin"}
                </p>
                <p className="font-mono text-[10px] text-retro-green/60 uppercase tracking-wider">
                  Administrator
                </p>
              </div>
              <svg
                className={clsx(
                  "w-4 h-4 text-retro-white/40 transition-transform",
                  dropdownOpen && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-retro-gray border-2 border-retro-green/30 shadow-retro z-50">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/admin/profile");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 font-sport text-sm text-retro-white/70 hover:text-retro-green hover:bg-retro-green/5 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <div className="border-t border-retro-green/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 font-sport text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
