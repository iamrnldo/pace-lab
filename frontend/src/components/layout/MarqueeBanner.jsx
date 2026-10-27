// src/components/layout/MarqueeBanner.jsx
export default function MarqueeBanner() {
  const ITEMS = [
    "VCR CALCULATOR",
    "RACE PREDICTOR",
    "TRAINING ZONES",
    "SPLIT CALCULATOR",
    "FINISH TIME",
  ];

  const longLoopItems = Array.from({ length: 8 }, () => ITEMS).flat();

  return (
    <div
      data-marquee
      className="fixed left-0 right-0 top-[68px] z-40 h-9 overflow-hidden border-y-2 border-retro-green-dark bg-retro-green md:top-[96px]"
    >
      <div className="marquee-wrap h-full">
        <div className="marquee-track marquee-track-right h-full items-center">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="marquee-group marquee-group-compact h-full items-center"
              aria-hidden={group === 1}
            >
              {longLoopItems.map((item, i) => (
                <span
                  key={`${group}-${i}-${item}`}
                  className="select-none font-retro text-sm tracking-widest text-retro-black"
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
