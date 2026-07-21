// src/components/dashboard/HistoryList.jsx
import clsx from "clsx";

const CALC_ICONS = {
  "vcr-calculator": "fa-bolt",
  "race-predictor": "fa-trophy",
  "training-zone": "fa-heart-pulse",
  "vo2max-calculator": "fa-lungs",
  "calorie-calculator": "fa-fire",
  "split-calculator": "fa-chart-bar",
  "finish-time": "fa-flag-checkered",
};

function getIcon(type) {
  return CALC_ICONS[type] || "fa-calculator";
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getCalcSummary(item) {
  const r = item.result_data;
  if (!r) return "—";

  switch (item.calculator_type) {
    case "vcr-calculator":
      return `VCR: ${r.vcrMs?.toFixed(2)} m/s · ${r.basePacePerKm}/km`;
    case "race-predictor":
      return `${r.label || "Race"}: ${r.time || r.predictedTime || "—"} · ${r.pace || "—"}`;
    case "training-zone":
      return `${r.zones?.length || 0} zones calculated`;
    default:
      return "Calculation saved";
  }
}

export default function HistoryList({ history, isLoading, onSelect }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card-retro p-4 animate-pulse">
            <div className="h-4 bg-retro-gray-light/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-retro-gray-light/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card-retro p-12 text-center">
        <div className="flex flex-col items-center text-retro-white/20">
          <i className="fa-solid fa-calculator text-5xl mb-4 text-retro-white/20" />
          <p className="font-retro text-xl tracking-wider mb-2">
            NO CALCULATIONS YET
          </p>
          <p className="font-sport text-sm">
            Start using the calculator to see your history here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => {
        const icon = getIcon(item.calculator_type);
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="card-retro p-4 cursor-pointer group hover:border-retro-green"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 border border-retro-gray-light/30 flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${icon} text-lg text-retro-white`} />
                </div>
                <div className="min-w-0">
                  <p className="font-retro text-lg text-retro-white tracking-wider truncate">
                    {item.calculator_name || item.calculator_type}
                  </p>
                  <p className="font-mono text-xs text-retro-green/60 truncate">
                    {getCalcSummary(item)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-retro-white/25 hidden sm:inline">
                  {formatDateTime(item.created_at)}
                </span>
                <i className="fa-solid fa-chevron-right text-xs text-retro-white/20 group-hover:text-retro-green transition-colors" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
