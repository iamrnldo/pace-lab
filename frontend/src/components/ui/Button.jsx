// src/components/ui/Button.jsx
import { forwardRef } from "react";
import clsx from "clsx";

const variants = {
  primary: "btn-retro btn-retro-solid text-retro-black",
  outline: "btn-retro text-retro-green",
  ghost:
    "border-2 border-transparent hover:border-retro-green text-retro-white hover:text-retro-green transition-all",
  danger:
    "border-2 border-red-500 text-red-500 shadow-[4px_4px_0px_#EF4444] hover:bg-red-500 hover:text-retro-black transition-all",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
  xl: "px-10 py-5 text-xl",
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    className,
    leftIcon,
    rightIcon,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "font-retro tracking-widest uppercase transition-all duration-150",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
        "flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingDots />
          Processing...
        </span>
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

function LoadingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
