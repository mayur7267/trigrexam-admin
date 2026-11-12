import { useEffect, useRef } from "react";
import { motionReduced } from "./motion";

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const prefersReduced = motionReduced;

/**
 * Links an element's visual state to scroll position without re-rendering React.
 * calc() returns progress (0 to 1) from the element's rect, apply() writes styles.
 */
export function useScrollLink<T extends HTMLElement>(calc: (r: DOMRect, vh: number) => number, apply: (el: T, p: number) => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) { apply(el, 1); return; }
    let raf = 0;
    const run = () => { raf = 0; apply(el, clamp01(calc(el.getBoundingClientRect(), window.innerHeight))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}
