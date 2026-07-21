import RacePredictor from "./RacePredictor";
import TrainingZone from "./TrainingZone";

export default function RaceZonesCalculator() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4">
          <span className="font-mono text-[11px] uppercase tracking-widest text-retro-green/70">
            COMBINED TOOL
          </span>
          <h2 className="mt-1 font-retro text-3xl tracking-wide text-retro-white">
            RACE &amp; ZONES
          </h2>
          <p className="mt-2 font-sport text-sm leading-relaxed text-retro-white/45">
            Predict race performance and calculate heart-rate training zones in
            one section.
          </p>
        </div>
        <RacePredictor />
      </div>

      <div className="h-px w-full bg-retro-gray-light/25" />

      <div>
        <TrainingZone />
      </div>
    </div>
  );
}
