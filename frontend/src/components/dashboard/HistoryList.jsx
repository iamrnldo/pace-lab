// src/components/dashboard/HistoryList.jsx
import clsx from "clsx";

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

function formatTime(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getCalcSummary(item) {
  const r = item.result_data;
  if (!r) return "—";

  switch (item.calculator_type) {
    case "vcr-calculator":
      return `VCR: ${r.vcrMs?.toFixed(2)} m/s · ${r.basePacePerKm}/km`;
    case "race-predictor":
      return `Predicted: ${r.predictedTime || r.predicted_time || "—"}`;
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
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
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
      {history.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          className="card-retro p-4 cursor-pointer group hover:border-retro-green"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl">{item.icon || "📊"}</span>
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
              <svg
                className="w-4 h-4 text-retro-white/20 group-hover:text-retro-green transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
