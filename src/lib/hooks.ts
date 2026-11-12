import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/store";
import { ME_STUDENT } from "../data/seed";
import { motionReduced } from "./motion";
import { shownStatus, type ShownStatus } from "./selectors";
import type { Assignment, Submission } from "./types";

export interface Mine { a: Assignment; s: Submission; shown: ShownStatus }

/** The signed-in student's assignments, joined with their own submission. */
export function useMine(): Mine[] {
  const { assignments, submissions } = useStore();
  return useMemo(() => {
    const now = Date.now();
    const out: Mine[] = [];
    for (const s of submissions) {
      if (s.studentId !== ME_STUDENT) continue;
      const a = assignments.find((x) => x.id === s.assignmentId);
      if (!a || a.status === "draft" || a.status === "scheduled") continue;
      out.push({ a, s, shown: shownStatus(a, s, now) });
    }
    return out;
  }, [assignments, submissions]);
}

/** Animates a number from 0 up to the target, unless the user prefers reduced motion. */
export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (motionReduced()) { setV(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** False on the first paint, true a frame later. Lets bars and rings animate in from zero. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}
