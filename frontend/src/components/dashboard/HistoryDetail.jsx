// src/components/dashboard/HistoryDetail.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ── VCR Detail ──
function VcrDetail({ input, result }) {
  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="card-retro p-5">
        <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
          INPUT
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[10px] text-retro-white/40 uppercase">
              Test Duration
            </p>
            <p className="font-retro text-xl text-retro-white">
              {input.test_minutes} min
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-retro-white/40 uppercase">
              Distance
            </p>
            <p className="font-retro text-xl text-retro-white">
              {input.distance_meters} m
            </p>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="card-retro p-5 border-retro-green/40">
        <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
          RESULT
        </h3>
        <div className="font-retro text-5xl text-retro-green mb-2">
          {result.vcrMs?.toFixed(2)}
        </div>
        <p className="font-mono text-sm text-retro-white/40">
          m/s · {result.vcrKmh?.toFixed(2)} km/h · {result.basePacePerKm}/km
        </p>
      </div>

      {/* Training Zones */}
      {result.trainingZones?.length > 0 && (
        <div className="card-retro p-5">
          <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
            PACE TRAINING ZONE
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.trainingZones.map((z) => (
              <div key={z.label} className="border border-retro-gray-light/30 p-3">
                <p className="font-mono text-[10px] text-retro-white/40 uppercase">
                  {z.label}
                </p>
                <p className="font-retro text-lg text-retro-white">
                  {z.pace}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interval Targets */}
      {result.intervalTargets?.length > 0 && (
        <div className="card-retro p-5">
          <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
            INTERVAL TARGETS
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.intervalTargets.map((z) => (
              <div key={z.label} className="border border-retro-gray-light/30 p-3">
                <p className="font-mono text-[10px] text-retro-white/40 uppercase">
                  {z.label}
                </p>
                <p className="font-retro text-lg text-retro-white">
                  {z.pace}
                </p>
                {z.time && (
                  <p className="font-mono text-xs text-retro-white/30">{z.time}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Race Detail ──
function RaceDetail({ input, result }) {
  return (
    <div className="space-y-4">
      <div className="card-retro p-5">
        <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
          INPUT
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[10px] text-retro-white/40 uppercase">
              Recent Distance
            </p>
            <p className="font-retro text-xl text-retro-white">
              {input.recentDistance || input.recent_distance_km} km
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-retro-white/40 uppercase">
              Recent Time
            </p>
            <p className="font-retro text-xl text-retro-white">
              {input.recentTime || input.recent_time}
            </p>
          </div>
        </div>
        {input.targetDistance && (
          <div className="mt-3">
            <p className="font-mono text-[10px] text-retro-white/40 uppercase">
              Target Race
            </p>
            <p className="font-retro text-xl text-retro-white">
              {input.targetDistance}
            </p>
          </div>
        )}
      </div>
      <div className="card-retro p-5 border-retro-green/40">
        <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
          PREDICTION
        </h3>
        <div className="font-retro text-4xl text-retro-green mb-2">
          {result.predictedTime || result.predicted_time || "—"}
        </div>
        <p className="font-mono text-sm text-retro-white/40">
          {result.predictedPace || result.predicted_pace || "—"}
        </p>
      </div>
    </div>
  );
}

// ── Training Zone Detail ──
function TrainingZoneDetail({ input, result }) {
  return (
    <div className="space-y-4">
      <div className="card-retro p-5">
        <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
          INPUT
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[10px] text-retro-white/40 uppercase">
              Max Heart Rate
            </p>
            <p className="font-retro text-xl text-retro-white">
              {input.maxHeartRate || input.max_heart_rate} bpm
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-retro-white/40 uppercase">
              Resting HR
            </p>
            <p className="font-retro text-xl text-retro-white">
              {input.restingHR || input.resting_hr} bpm
            </p>
          </div>
        </div>
      </div>
      {result.zones?.length > 0 && (
        <div className="card-retro p-5 border-retro-green/40">
          <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
            HEART RATE ZONES
          </h3>
          <div className="space-y-2">
            {result.zones.map((z) => (
              <div
                key={z.zone}
                className="flex items-center justify-between border border-retro-gray-light/30 p-3"
              >
                <div>
                  <span className="font-retro text-lg text-retro-green mr-2">
                    Z{z.zone}
                  </span>
                  <span className="font-sport text-sm text-retro-white/60">
                    {z.name}
                  </span>
                </div>
                <span className="font-retro text-lg text-retro-white">
                  {z.minHr || z.min_hr}–{z.maxHr || z.max_hr} bpm
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryDetail({ item, onBack }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/calculator/history/${item.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calc-history"] });
      queryClient.invalidateQueries({ queryKey: ["calc-stats"] });
      toast.success("Deleted");
      onBack();
    },
  });

  const renderDetail = () => {
    const input = item.input_data || {};
    const result = item.result_data || {};

    switch (item.calculator_type) {
      case "vcr-calculator":
        return <VcrDetail input={input} result={result} />;
      case "race-predictor":
        return <RaceDetail input={input} result={result} />;
      case "training-zone":
        return <TrainingZoneDetail input={input} result={result} />;
      default:
        return (
          <div className="card-retro p-5">
            <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3">
              INPUT
            </h3>
            <pre className="font-mono text-xs text-retro-white/60 overflow-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
            <h3 className="font-retro text-lg text-retro-green tracking-wider mb-3 mt-4">
              RESULT
            </h3>
            <pre className="font-mono text-xs text-retro-white/60 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-retro px-4 py-2 text-sm font-sport tracking-wider"
        >
          ← BACK
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/calculator?type=${item.calculator_type}`)}
            className="btn-retro px-4 py-2 text-sm font-sport tracking-wider text-retro-green"
          >
            RECALCULATE
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="btn-retro px-4 py-2 text-sm font-sport tracking-wider text-red-400 border-red-400/40"
          >
            DELETE
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="card-retro p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{item.icon || "📊"}</span>
          <div>
            <h2 className="font-retro text-xl text-retro-white tracking-wider">
              {item.calculator_name || item.calculator_type}
            </h2>
            <p className="font-mono text-[11px] text-retro-white/30">
              {formatDateTime(item.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Content */}
      {renderDetail()}
    </div>
  );
}
