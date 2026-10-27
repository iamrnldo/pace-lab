// src/components/ui/Card.jsx
import clsx from "clsx";

export function Card({
  children,
  className,
  hover = true,
  glow = false,
  ...props
}) {
  return (
    <div
      className={clsx(
        "card-retro p-6 relative overflow-hidden",
        hover && "cursor-pointer",
        glow && "animate-pulse-green",
        className,
      )}
      {...props}
    >
      {/* corner accents */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-retro-green" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-retro-green" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-retro-green" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-retro-green" />
      {children}
    </div>
  );
}
