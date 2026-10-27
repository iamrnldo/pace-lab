// src/components/admin/Analytics.jsx
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";

function RecentActivityRow({ log }) {
  const actionColors = {
    login: "text-retro-green",
    logout: "text-retro-white/40",
    calculation: "text-yellow-400",
    profile_update: "text-retro-green-light",
    goal_created: "text-retro-green",
    goal_completed: "text-emerald-400",
    admin_action: "text-red-400",
  };

  const actionLabels = {
    login: "LOGIN",
    logout: "LOGOUT",
    calculation: "CALC",
    profile_update: "PROFILE",
    goal_created: "GOAL+",
    goal_completed: "GOAL✓",
    admin_action: "ADMIN",
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-retro-gray-light/10 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`font-mono text-[10px] tracking-wider px-2 py-0.5 border ${
            actionColors[log.action] || "text-retro-white/40"
          } border-current/30 shrink-0`}
        >
          {actionLabels[log.action] || log.action?.toUpperCase()}
        </span>
        <span className="font-sport text-sm text-retro-white/60 truncate">
          {log.user_name || log.description || "—"}
        </span>
      </div>
      <span className="font-mono text-[10px] text-retro-white/25 shrink-0 ml-3">
        {log.created_at
          ? new Date(log.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "—"}
      </span>
    </div>
  );
}

export default function Analytics() {
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminService.getDashboardStats(),
  });

  const recentActivity = data?.recent_activity || [];

  return (
    <div className="card-retro p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 border-2 border-retro-green/40 flex items-center justify-center">
          <svg className="w-4 h-4 text-retro-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="font-retro text-xl text-retro-white tracking-wider">
            RECENT ACTIVITY
          </h2>
          <p className="font-mono text-[10px] text-retro-white/30 tracking-widest">
            LATEST SYSTEM EVENTS
          </p>
        </div>
      </div>

      {recentActivity.length > 0 ? (
        <div className="space-y-0">
          {recentActivity.slice(0, 8).map((log, idx) => (
            <RecentActivityRow key={log.id || idx} log={log} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-retro-white/20">
          <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="font-mono text-xs tracking-wider">No activity yet</p>
        </div>
      )}
    </div>
  );
}
