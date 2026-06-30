// src/hooks/useScrollReveal.js
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const {
      y = 40,
      opacity = 0,
      duration = 0.8,
      delay = 0,
      stagger = 0,
      start = "top 85%",
      markers = false,
      children = false,
    } = options;

    const targets = children ? el.querySelectorAll("[data-reveal]") : el;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start,
        markers,
        once: true,
      },
    });

    tl.fromTo(
      targets,
      { y, opacity, filter: "blur(4px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration,
        delay,
        ease: "power3.out",
        stagger,
      },
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return ref;
}
