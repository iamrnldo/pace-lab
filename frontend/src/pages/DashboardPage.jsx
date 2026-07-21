// src/pages/DashboardPage.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import api from "../services/api";
import HistoryList from "../components/dashboard/HistoryList";
import HistoryDetail from "../components/dashboard/HistoryDetail";

const CALCULATOR_TABS = [
  { slug: null, label: "ALL", icon: "📊" },
  { slug: "vcr-calculator", label: "VCR", icon: "⚡" },
  { slug: "race-predictor", label: "RACE", icon: "🏆" },
  { slug: "training-zone", label: "ZONES", icon: "❤️" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  // Stats per calculator type
  const { data: statsData } = useQuery({
    queryKey: ["calc-stats"],
    queryFn: () => api.get("/calculator/stats").then((r) => r.data),
  });

  // History list
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["calc-history", activeTab, page],
    queryFn: () =>
      api
        .get("/calculator/history", {
          params: { type: activeTab || undefined, page, limit: 10 },
        })
        .then((r) => r.data),
  });

  const stats = statsData?.stats || [];
  const history = historyData?.history || [];
  const totalPages = historyData?.totalPages || 1;

  return (
    <div className="min-h-screen pt-[120px] pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Title */}
        <div>
          <h1 className="font-retro text-3xl md:text-4xl text-retro-white tracking-wider">
            DASHBOARD
          </h1>
          <p className="font-mono text-xs text-retro-white/30 tracking-widest mt-1">
            YOUR CALCULATION HISTORY
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.slug}
              onClick={() => {
                setActiveTab(s.slug);
                setPage(1);
                setSelectedItem(null);
              }}
              className={clsx(
                "card-retro p-4 cursor-pointer transition-all",
                activeTab === s.slug &&
                  "border-retro-green shadow-retro bg-retro-green/5"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="font-retro text-sm text-retro-white tracking-wider">
                  {s.name?.replace("Calculator", "").replace("Calculator", "").trim()}
                </span>
              </div>
              <p className="font-retro text-2xl text-retro-green">
                {s.total_calculations || 0}
              </p>
              <p className="font-mono text-[10px] text-retro-white/30 mt-1">
                {s.last_calculated
                  ? new Date(s.last_calculated).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "No data yet"}
              </p>
            </div>
          ))}
        </div>

        {/* Tab Filter */}
        <div className="flex gap-0 overflow-x-auto border-b-2 border-retro-gray-light">
          {CALCULATOR_TABS.map(({ slug, label, icon }) => (
            <button
              key={label}
              onClick={() => {
                setActiveTab(slug);
                setPage(1);
                setSelectedItem(null);
              }}
              className={clsx(
                "font-retro whitespace-nowrap border-b-2 -mb-0.5 px-5 py-3 text-sm tracking-widest transition-all duration-150",
                activeTab === slug
                  ? "border-retro-green bg-retro-green text-retro-black"
                  : "border-transparent text-retro-white/50 hover:bg-retro-gray-mid hover:text-retro-white"
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {selectedItem ? (
          <HistoryDetail
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
          />
        ) : (
          <>
            <HistoryList
              history={history}
              isLoading={isLoading}
              onSelect={setSelectedItem}
            />

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
                    className="btn-retro px-4 py-1.5 text-sm font-sport tracking-wider disabled:opacity-30"
                  >
                    ← PREV
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-retro px-4 py-1.5 text-sm font-sport tracking-wider disabled:opacity-30"
                  >
                    NEXT →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
