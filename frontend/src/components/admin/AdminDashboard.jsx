// src/components/admin/AdminDashboard.jsx
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import SystemStats from "./SystemStats";
import Analytics from "./Analytics";

// ── Stat Card ────────────────────────────────────
function StatCard({ label, value, icon, color = "green", subtitle }) {
  const colorMap = {
    green: "border-retro-green/40 text-retro-green",
    blue: "border-retro-green-light/40 text-retro-green-light",
    yellow: "border-yellow-400/40 text-yellow-400",
    red: "border-red-400/40 text-red-400",
  };

  return (
    <div className="card-retro p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 border-2 ${colorMap[color]} flex items-center justify-center
            group-hover:bg-retro-green/10 transition-colors`}
        >
          {icon}
        </div>
      </div>
      <p className="font-retro text-3xl text-retro-white tracking-wider">
        {value ?? "—"}
      </p>
      <p className="font-sport text-sm text-retro-white/50 tracking-wider mt-1">
        {label}
      </p>
      {subtitle && (
        <p className="font-mono text-[10px] text-retro-green/50 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminService.getDashboardStats(),
    placeholderData: {
      total_users: 0,
      active_users: 0,
      total_calculations: 0,
      calculations_today: 0,
    },
  });

  const stats = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-retro text-3xl md:text-4xl text-retro-white tracking-wider">
            DASHBOARD
          </h1>
          <p className="font-mono text-xs text-retro-white/30 tracking-widest mt-1">
            SYSTEM OVERVIEW & REAL-TIME STATISTICS
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-retro-green/30 bg-retro-green/5">
          <span className="w-2 h-2 rounded-full bg-retro-green animate-pulse" />
          <span className="font-mono text-[11px] text-retro-green tracking-widest">
            LIVE
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL USERS"
          value={stats.total_users}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          subtitle="Registered accounts"
        />
        <StatCard
          label="ACTIVE USERS"
          value={stats.active_users}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          subtitle="Currently active"
        />
        <StatCard
          label="TOTAL CALCULATIONS"
          value={stats.total_calculations}
          color="yellow"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          subtitle="All time"
        />
        <StatCard
          label="TODAY"
          value={stats.calculations_today}
          color="red"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          subtitle="Calculations today"
        />
      </div>

      {/* System Stats & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SystemStats />
        <Analytics />
      </div>
    </div>
  );
}
