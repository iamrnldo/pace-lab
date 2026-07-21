import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import Lenis from "@studio-freight/lenis";

const ANIMATION_DURATION = 180;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  panelClassName,
}) {
  const [rendered, setRendered] = useState(isOpen);
  const [active, setActive] = useState(false);
  const scrollWrapperRef = useRef(null);
  const scrollContentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      let frameA = 0;
      let frameB = 0;
      frameA = requestAnimationFrame(() => {
        frameB = requestAnimationFrame(() => setActive(true));
      });
      return () => {
        cancelAnimationFrame(frameA);
        cancelAnimationFrame(frameB);
      };
    }

    setActive(false);
    const timeout = setTimeout(() => setRendered(false), ANIMATION_DURATION);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!rendered) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const stopWindowScroll = (event) => {
      if (!scrollWrapperRef.current?.contains(event.target)) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", stopWindowScroll, { passive: false });
    window.addEventListener("touchmove", stopWindowScroll, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", stopWindowScroll);
      window.removeEventListener("touchmove", stopWindowScroll);
    };
  }, [rendered, onClose]);

  useEffect(() => {
    if (!rendered || !isOpen) return undefined;

    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    if (!wrapper || !content) return undefined;

    const lenis = new Lenis({
      wrapper,
      content,
      wheelEventsTarget: wrapper,
      duration: 1.05,
      smoothWheel: true,
      smoothTouch: false,
      gestureOrientation: "vertical",
    });

    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const stopPropagation = (event) => event.stopPropagation();
    wrapper.addEventListener("wheel", stopPropagation, { passive: false });
    wrapper.addEventListener("touchmove", stopPropagation, { passive: false });

    return () => {
      cancelAnimationFrame(rafId);
      wrapper.removeEventListener("wheel", stopPropagation);
      wrapper.removeEventListener("touchmove", stopPropagation);
      lenis.destroy();
    };
  }, [rendered, isOpen]);

  if (!rendered) return null;

  return createPortal(
    <div
      className={clsx("retro-modal-overlay", active && "is-open")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      aria-hidden={!isOpen}
    >
      <div
        className={clsx(
          "retro-modal-panel w-[min(94vw,1100px)]",
          active && "is-open",
          panelClassName,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Modal"}
      >
        <div className="flex items-start justify-between gap-4 border-b border-retro-gray-light/25 px-5 py-4 sm:px-6">
          <div>
            {title && (
              <h3 className="font-retro text-2xl tracking-wide text-retro-white sm:text-3xl">
                {title}
              </h3>
            )}
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-retro-green/70 sm:text-[11px]">
              Detailed calculation breakdown
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-retro px-4 py-2 text-sm font-retro tracking-widest text-retro-white hover:border-retro-white"
          >
            CLOSE
          </button>
        </div>

        <div
          ref={scrollWrapperRef}
          className="retro-modal-content max-h-[80vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
        >
          <div ref={scrollContentRef}>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
