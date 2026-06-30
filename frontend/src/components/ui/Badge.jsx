// src/components/ui/Badge.jsx
import clsx from "clsx";

const variants = {
  green: "bg-retro-green text-retro-black",
  white: "bg-retro-white text-retro-black",
  dark: "bg-retro-gray-mid text-retro-white border border-retro-gray-light",
  danger: "bg-red-500/20 text-red-400 border border-red-500/50",
};

export function Badge({ children, variant = "green", className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5",
        "font-retro text-xs tracking-wider uppercase",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
