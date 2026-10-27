// src/components/admin/AdminSidebar.jsx
import { NavLink, Link } from "react-router-dom";
import clsx from "clsx";

const MENU = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    end: true,
  },
  {
    label: "Management User",
    path: "/admin/users",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "Log User",
    path: "/admin/logs/user",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Log Admin",
    path: "/admin/logs/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Admin Profile",
    path: "/admin/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {/* Overlay — mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col",
          "bg-retro-gray border-r-2 border-retro-green/30",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-[96px] flex items-center px-6 border-b border-retro-green/20">
          <Link to="/admin" className="group flex items-center gap-3" onClick={onClose}>
            <div
              className="w-9 h-9 border-2 border-retro-green flex items-center justify-center
                group-hover:bg-retro-green transition-colors duration-150"
            >
              <span className="font-retro text-xl text-retro-green group-hover:text-retro-black transition-colors duration-150">
                A
              </span>
            </div>
            <div>
              <p className="font-retro text-2xl text-retro-white leading-none tracking-wider">
                PACE<span className="text-retro-green">LAB</span>
              </p>
              <p className="font-mono text-[9px] text-retro-green/60 tracking-[0.35em]">
                ADMIN PANEL
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {MENU.map(({ label, path, icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-3 font-sport text-[15px] tracking-wider transition-all duration-200",
                  isActive
                    ? "bg-retro-green/10 text-retro-green border-l-3 border-retro-green"
                    : "text-retro-white/50 hover:text-retro-white hover:bg-retro-green/5 border-l-3 border-transparent"
                )
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-retro-green/20">
          <Link
            to="/"
            className="flex items-center gap-2 text-retro-white/40 hover:text-retro-green font-sport text-sm tracking-wider transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  );
}
