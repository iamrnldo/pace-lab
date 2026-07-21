// src/components/admin/AdminLogSection.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import clsx from "clsx";

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function AdminLogSection() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-admin-logs", page],
    queryFn: () =>
      adminService.getAdminLogs({
        page,
        limit: 15,
      }),
    placeholderData: (prev) => prev,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-retro text-3xl md:text-4xl text-retro-white tracking-wider">
            LOG ADMIN
          </h1>
          <p className="font-mono text-xs text-retro-white/30 tracking-widest mt-1">
            ADMINISTRATOR ACTIVITY HISTORY
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-red-400/30 bg-red-400/5 ml-auto">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-mono text-[11px] text-red-400 tracking-widest">
            RESTRICTED ACCESS
          </span>
        </div>
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
                  ADMIN
                </th>
                <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                  ACTION
                </th>
                <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                  DETAILS
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p className="font-sport text-sm tracking-wider">No admin logs found</p>
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
                        <div className="w-6 h-6 border border-red-400/30 flex items-center justify-center bg-red-400/10">
                          <span className="font-retro text-[10px] text-red-400">
                            {log.admin_name?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        </div>
                        <span className="font-sport text-sm text-retro-white/70">
                          {log.admin_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-red-400/30 text-red-400">
                        {log.action?.toUpperCase() || "ADMIN ACTION"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-sport text-sm text-retro-white/50 truncate max-w-sm block">
                        {log.description || log.metadata ? JSON.stringify(log.metadata) : "—"}
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
