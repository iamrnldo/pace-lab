// src/components/calculators/RacePredictor.jsx
import { useMemo, useState } from "react";
import { riegelPredict, formatTime } from "../../utils/paceUtils";
import clsx from "clsx";

const TARGETS = [
  { label: "5K", km: 5 },
  { label: "10K", km: 10 },
  { label: "Half Marathon", km: 21.0975 },
  { label: "Marathon", km: 42.195 },
];

const ROW_COUNT = 12;

const UNIT_OPTIONS = [
  { value: "km", label: "Kilometers", toKm: 1 },
  { value: "m", label: "Meters", toKm: 0.001 },
  { value: "mi", label: "Miles", toKm: 1.60934 },
];

const createInitialRows = () =>
  Array.from({ length: ROW_COUNT }, () => ({
    distance: "",
    unit: "km",
    time: "",
  }));

function parseTimeInput(value) {
  if (!value?.trim()) return null;

  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part) || part < 0)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function formatSegmentDistance(distanceKm) {
  if (distanceKm >= 1) return `${distanceKm.toFixed(2)} km`;
  return `${Math.round(distanceKm * 1000)} m`;
}

function buildAutoDetailRows(distanceKm, totalSeconds) {
  const maxCheckpoints = ROW_COUNT;
  const step = distanceKm <= maxCheckpoints ? 1 : Math.ceil(distanceKm / (maxCheckpoints - 1));
  const checkpoints = [];

  let current = step;
  while (current < distanceKm && checkpoints.length < maxCheckpoints - 1) {
    checkpoints.push(Number(current.toFixed(3)));
    current += step;
  }

  const roundedDistance = Number(distanceKm.toFixed(3));
  if (!checkpoints.length || checkpoints[checkpoints.length - 1] !== roundedDistance) {
    checkpoints.push(roundedDistance);
  }

  const filledRows = checkpoints.slice(0, maxCheckpoints).map((checkpoint) => ({
    distance: checkpoint % 1 === 0 ? String(checkpoint.toFixed(0)) : String(checkpoint),
    unit: "km",
    time: formatTime((totalSeconds * checkpoint) / distanceKm),
  }));

  return [
    ...filledRows,
    ...Array.from({ length: Math.max(0, maxCheckpoints - filledRows.length) }, () => ({
      distance: "",
      unit: "km",
      time: "",
    })),
  ];
}

function calculateDetailResults(rows, preferredPaceUnit) {
  let previousDistanceKm = 0;
  let previousTimeSec = 0;
  const segments = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const hasDistance = String(row.distance).trim() !== "";
    const hasTime = String(row.time).trim() !== "";

    if (!hasDistance && !hasTime) continue;
    if (!hasDistance || !hasTime) {
      return { error: `Row ${index + 1} must have both distance and time.` };
    }

    const unit = UNIT_OPTIONS.find((option) => option.value === row.unit);
    const distanceValue = Number(row.distance);
    const timeSec = parseTimeInput(row.time);

    if (!unit || Number.isNaN(distanceValue) || distanceValue <= 0 || !timeSec) {
      return { error: `Row ${index + 1} contains invalid data.` };
    }

    const cumulativeDistanceKm = distanceValue * unit.toKm;

    if (cumulativeDistanceKm <= previousDistanceKm) {
      return {
        error: `Row ${index + 1} distance must be greater than the previous point.`,
      };
    }

    if (timeSec <= previousTimeSec) {
      return {
        error: `Row ${index + 1} time must be greater than the previous point.`,
      };
    }

    const segmentDistanceKm = cumulativeDistanceKm - previousDistanceKm;
    const segmentTimeSec = timeSec - previousTimeSec;
    const pacePerKmSec = segmentTimeSec / segmentDistanceKm;
    const paceSec =
      preferredPaceUnit === "mi" ? pacePerKmSec * 1.60934 : pacePerKmSec;

    segments.push({
      point: index + 1,
      cumulativeDistanceLabel: `${distanceValue} ${unit.label}`,
      cumulativeTime: formatTime(timeSec),
      segmentDistanceLabel: formatSegmentDistance(segmentDistanceKm),
      segmentTime: formatTime(segmentTimeSec),
      pace: `${formatTime(paceSec)}/${preferredPaceUnit === "mi" ? "mi" : "km"}`,
      speedKmh: ((segmentDistanceKm / segmentTimeSec) * 3600).toFixed(2),
    });

    previousDistanceKm = cumulativeDistanceKm;
    previousTimeSec = timeSec;
  }

  if (!segments.length) {
    return { error: "Please fill at least one valid checkpoint row." };
  }

  return {
    segments,
    totalDistanceKm: previousDistanceKm,
    totalTime: formatTime(previousTimeSec),
    averagePace: `${formatTime(
      preferredPaceUnit === "mi"
        ? (previousTimeSec / previousDistanceKm) * 1.60934
        : previousTimeSec / previousDistanceKm,
    )}/${preferredPaceUnit === "mi" ? "mi" : "km"}`,
  };
}

export default function RacePredictor() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(10);
  const [result, setResult] = useState(null);

  const [detailRows, setDetailRows] = useState(createInitialRows);
  const [preferredPaceUnit, setPreferredPaceUnit] = useState("mi");
  const [detailResults, setDetailResults] = useState(null);
  const [detailError, setDetailError] = useState("");

  const selectedRace = useMemo(
    () => TARGETS.find(({ km }) => km === distance) || TARGETS[1],
    [distance],
  );

  const handleCalc = () => {
    const totalSec =
      Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    const distKm = Number(distance);
    const predSec = riegelPredict(totalSec, distKm, distKm);
    const paceKm = predSec / distKm;
    const m = Math.floor(paceKm / 60);
    const s = Math.floor(paceKm % 60);

    const autoRows = buildAutoDetailRows(distKm, Math.round(predSec));
    const autoDetailResults = calculateDetailResults(autoRows, preferredPaceUnit);

    setResult({
      label: selectedRace.label,
      distanceKm: distKm,
      time: formatTime(Math.round(predSec)),
      pace: `${m}:${String(s).padStart(2, "0")}/km`,
    });
    setDetailRows(autoRows);
    if (autoDetailResults.error) {
      setDetailResults(null);
      setDetailError(autoDetailResults.error);
    } else {
      setDetailResults(autoDetailResults);
      setDetailError("");
    }
  };

  const updateDetailRow = (index, field, value) => {
    setDetailRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleDetailCalc = () => {
    const computed = calculateDetailResults(detailRows, preferredPaceUnit);
    if (computed.error) {
      setDetailResults(null);
      setDetailError(computed.error);
      return;
    }

    setDetailResults(computed);
    setDetailError("");
  };

  const handleDetailClear = () => {
    setDetailRows(createInitialRows());
    setDetailResults(null);
    setDetailError("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="card-retro self-start p-6">
          <h2 className="font-retro text-2xl text-retro-white tracking-wide mb-1">
            RACE PREDICTOR
          </h2>
          <p className="font-sport text-retro-white/40 text-sm mb-6">
            Using Riegel Formula (T2 = T1 × (D2/D1)^1.06)
          </p>

          <div className="mb-5">
            <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
              Recent Finish Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: hours, set: setHours, ph: "HH", max: 23 },
                { val: minutes, set: setMinutes, ph: "MM", max: 59 },
                { val: seconds, set: setSeconds, ph: "SS", max: 59 },
              ].map(({ val, set, ph, max }) => (
                <input
                  key={ph}
                  type="number"
                  min={0}
                  max={max}
                  value={val}
                  onChange={(e) =>
                    set(Math.max(0, Math.min(max, Number(e.target.value))))
                  }
                  placeholder={ph}
                  className="input-retro py-3 px-4 text-center text-lg"
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="font-mono text-[11px] text-retro-white/50 tracking-widest uppercase block mb-2">
              Recent Race Distance
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TARGETS.map(({ label, km }) => (
                <button
                  key={label}
                  onClick={() => setDistance(km)}
                  className={clsx(
                    "py-3 font-retro tracking-widest text-sm border-2 transition-all",
                    distance === km
                      ? "bg-retro-green text-retro-black border-retro-green"
                      : "bg-transparent text-retro-white/50 border-retro-gray-light hover:border-retro-green",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCalc}
            className="btn-retro bg-retro-green text-retro-black font-retro tracking-widest w-full py-4 text-xl"
          >
            PREDICT →
          </button>
        </div>

        <div className="card-retro p-6 flex flex-col min-h-[320px] justify-center">
          {result ? (
            <>
              <p className="font-mono text-[11px] text-retro-white/40 tracking-widest uppercase mb-4">
                Race Result
              </p>
              <div className="border-l-4 border-retro-green bg-retro-green/10 p-5">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-retro text-retro-white text-2xl tracking-wide">
                      {result.label}
                    </p>
                    <p className="font-mono text-retro-white/35 text-xs mt-1">
                      {result.distanceKm} km · {result.pace}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-retro text-retro-green text-4xl tabular-nums">
                      {result.time}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <p className="font-retro text-retro-white/25 text-xl tracking-wider">
                ENTER YOUR RESULT
              </p>
              <p className="font-sport text-retro-white/20 text-sm mt-2">
                Result appears here
              </p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <>
          <div className="card-retro p-6">
            <h3 className="font-retro text-2xl text-retro-white tracking-wide mb-2">
              MULTIPOINT PACE DETAIL
            </h3>
            <p className="font-sport text-retro-white/40 text-sm mb-6 leading-relaxed">
              Result from the race predictor is auto-filled below. You can edit
              the checkpoints and calculate again.
            </p>

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[50px_1fr_180px_180px] gap-2 mb-2 px-1">
                  <div />
                  <p className="font-mono text-[11px] uppercase tracking-widest text-retro-white/45">
                    Distance
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-retro-white/45">
                    Unit
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-retro-white/45">
                    Time (hh:mm:ss)
                  </p>
                </div>

                <div className="space-y-2">
                  {detailRows.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[50px_1fr_180px_180px] gap-2 items-center"
                    >
                      <span className="font-retro text-lg text-retro-white/80 text-center">
                        {index + 1}.
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.distance}
                        onChange={(e) =>
                          updateDetailRow(index, "distance", e.target.value)
                        }
                        className="input-retro py-2.5 px-3 text-base"
                        placeholder="Distance"
                      />
                      <select
                        value={row.unit}
                        onChange={(e) =>
                          updateDetailRow(index, "unit", e.target.value)
                        }
                        className="input-retro py-2.5 px-3 text-base"
                      >
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={row.time}
                        onChange={(e) =>
                          updateDetailRow(index, "time", e.target.value)
                        }
                        className="input-retro py-2.5 px-3 text-base"
                        placeholder="hh:mm:ss"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-retro-white/45">
                  Preferred Pace Unit
                </label>
                <select
                  value={preferredPaceUnit}
                  onChange={(e) => setPreferredPaceUnit(e.target.value)}
                  className="input-retro min-w-[220px] py-2.5 px-3 text-base"
                >
                  <option value="km">Per Kilometer</option>
                  <option value="mi">Per Mile</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDetailCalc}
                  className="btn-retro bg-retro-green px-6 py-3 text-lg font-retro tracking-widest text-retro-black"
                >
                  CALCULATE
                </button>
                <button
                  type="button"
                  onClick={handleDetailClear}
                  className="btn-retro border-retro-white/35 px-6 py-3 text-lg font-retro tracking-widest text-retro-white hover:border-retro-white"
                >
                  CLEAR
                </button>
              </div>
            </div>

            {detailError && (
              <p className="mt-4 font-sport text-sm text-red-300">{detailError}</p>
            )}
          </div>

          {detailResults && (
            <div className="card-retro p-6">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-retro text-2xl tracking-wide text-retro-white">
                    DETAIL RESULT
                  </p>
                  <p className="mt-1 font-sport text-sm text-retro-white/45">
                    Total distance {detailResults.totalDistanceKm.toFixed(2)} km ·
                    Total time {detailResults.totalTime} · Avg pace {detailResults.averagePace}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-retro-gray-light/30 text-retro-white/45">
                      {[
                        "Point",
                        "Cumulative Distance",
                        "Cumulative Time",
                        "Segment Distance",
                        "Segment Time",
                        "Pace",
                        "Speed",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-2 py-2 font-mono text-[11px] uppercase tracking-widest first:pl-0"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailResults.segments.map((segment) => (
                      <tr
                        key={`${segment.point}-${segment.cumulativeTime}`}
                        className="border-b border-retro-gray-light/15 last:border-0"
                      >
                        <td className="px-2 py-2 pl-0 font-retro text-retro-green">
                          {segment.point}
                        </td>
                        <td className="px-2 py-2 font-mono text-sm text-retro-white">
                          {segment.cumulativeDistanceLabel}
                        </td>
                        <td className="px-2 py-2 font-retro text-retro-white tabular-nums">
                          {segment.cumulativeTime}
                        </td>
                        <td className="px-2 py-2 font-mono text-sm text-retro-white/85">
                          {segment.segmentDistanceLabel}
                        </td>
                        <td className="px-2 py-2 font-retro text-retro-white/85 tabular-nums">
                          {segment.segmentTime}
                        </td>
                        <td className="px-2 py-2 font-retro text-retro-green tabular-nums">
                          {segment.pace}
                        </td>
                        <td className="px-2 py-2 font-mono text-sm text-retro-white/85 tabular-nums">
                          {segment.speedKmh} km/h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
