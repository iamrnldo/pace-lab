// src/hooks/useLenisScroll.js
import { useEffect } from "react";
import { useLenis } from "@context/LenisContext";

export function useLenisScroll(callback) {
  const { lenis } = useLenis();

  useEffect(() => {
    if (!lenis || !callback) return;
    lenis.on("scroll", callback);
    return () => lenis.off("scroll", callback);
  }, [lenis, callback]);
}

export function useScrollTo() {
  const { lenis } = useLenis();

  return (target, options = {}) => {
    if (!lenis) return;
    lenis.scrollTo(target, {
      offset: options.offset ?? 0,
      duration: options.duration ?? 1.2,
      easing:
        options.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      ...options,
    });
  };
}
