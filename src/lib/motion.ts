// Motion preference: follow the system "Reduce Motion" setting, unless the user turns animations on here.
const KEY = "trigrexam-motion";

export const systemReduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const motionForced = () => {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
};

/** True when animations should be simplified. */
export const motionReduced = () => systemReduced() && !motionForced();

export function enableMotion() {
  try { localStorage.setItem(KEY, "on"); } catch { /* storage can be blocked */ }
  document.documentElement.dataset.motion = "on";
}

export function initMotion() {
  if (motionForced()) document.documentElement.dataset.motion = "on";
}
