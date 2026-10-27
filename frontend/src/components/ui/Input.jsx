// src/components/ui/Input.jsx
import { forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    prefix,
    suffix,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  return (
    <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label className="font-retro text-sm tracking-widest text-retro-white/70 uppercase">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 font-mono text-retro-green text-sm">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            "input-retro w-full py-3 text-base",
            prefix ? "pl-10" : "pl-4",
            suffix ? "pr-10" : "pr-4",
            error && "border-red-500 focus:border-red-500",
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 font-mono text-retro-white/50 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="font-sport text-red-400 text-sm flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="font-sport text-retro-white/40 text-sm">{hint}</p>
      )}
    </div>
  );
});
