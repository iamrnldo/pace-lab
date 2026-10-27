// src/components/admin/UserLogSection.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import clsx from "clsx";

const ACTION_LABELS = {
  login: "LOGIN",
  logout: "LOGOUT",
  calculation: "CALCULATION",
  profile_update: "PROFILE UPDATE",
  goal_created: "GOAL CREATED",
  goal_completed: "GOAL COMPLETED",
};

const ACTION_COLORS = {
  login: "border-emerald-400/30 text-emerald-400",
  logout: "border-retro-white/20 text-retro-white/40",
  calculation: "border-yellow-400/30 text-yellow-400",
  profile_update: "border-retro-green-light/30 text-retro-green-light",
  goal_created: "border-retro-green/30 text-retro-green",
  goal_completed: "border-emerald-400/30 text-emerald-400",
};

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function UserLogSection() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-logs", page, actionFilter],
    queryFn: () =>
      adminService.getUserLogs({
        page,
        limit: 15,
        action: actionFilter !== "all" ? actionFilter : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="font-retro text-3xl md:text-4xl text-retro-white tracking-wider">
          LOG USER
        </h1>
        <p className="font-mono text-xs text-retro-white/30 tracking-widest mt-1">
          USER ACTIVITY HISTORY
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "login", "logout", "calculation", "profile_update", "goal_created", "goal_completed"].map(
          (action) => (
            <button
              key={action}
              onClick={() => {
                setActionFilter(action);
                setPage(1);
              }}
              className={clsx(
                "btn-retro px-3 py-1.5 text-xs font-sport tracking-wider",
                actionFilter === action
                  ? "bg-retro-green text-retro-black"
                  : ""
              )}
            >
              {action === "all" ? "ALL" : ACTION_LABELS[action] || action.toUpperCase()}
            </button>
          )
        )}
      </div>

      {/* Logs Table */}
      <div className="card-retro overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-retro-green/20 bg-retro-green/5">
                <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                  TIMESTAMP
                </th>
                <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                  USER
                </th>
                <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                  ACTION
                </th>
                <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                  DESCRIPTION
                </th>
                <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                  IP ADDRESS
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-retro-gray-light/10">
                    {[0, 1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-retro-gray-light/10 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center text-retro-white/20">
                      <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-sport text-sm tracking-wider">No logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-retro-gray-light/10 hover:bg-retro-green/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-retro-white/40">
                        {formatDateTime(log.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.avatar_url ? (
                          <img
                            src={log.avatar_url}
                            alt=""
                            className="w-6 h-6 border border-retro-green/20"
                          />
                        ) : (
                          <div className="w-6 h-6 border border-retro-green/20 flex items-center justify-center bg-retro-gray">
                            <span className="font-retro text-[10px] text-retro-green">
                              {log.user_name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        <span className="font-sport text-sm text-retro-white/70">
                          {log.user_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "font-mono text-[10px] tracking-wider px-2 py-0.5 border",
                          ACTION_COLORS[log.action] || "border-retro-white/20 text-retro-white/40"
                        )}
                      >
                        {ACTION_LABELS[log.action] || log.action?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-sport text-sm text-retro-white/50 truncate max-w-xs block">
                        {log.description || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-retro-white/30">
                        {log.ip_address || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-retro-white/30">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-retro px-4 py-1.5 text-sm font-sport tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← PREV
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-retro px-4 py-1.5 text-sm font-sport tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              NEXT →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
