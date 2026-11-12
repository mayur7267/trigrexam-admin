import type { SubjectId } from "./types";

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export const SUBJECTS: Record<SubjectId, { name: string; short: string; color: string; soft: string }> = {
  quant: { name: "Quantitative Aptitude", short: "Quant", color: "var(--color-sky-600)", soft: "var(--color-sky-50)" },
  reasoning: { name: "Reasoning", short: "Reasoning", color: "var(--color-violet)", soft: "var(--color-violet-soft)" },
  english: { name: "English", short: "English", color: "var(--color-amber)", soft: "var(--color-amber-soft)" },
  ga: { name: "General Awareness", short: "GA", color: "var(--color-leaf)", soft: "var(--color-leaf-soft)" },
};

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
const longDayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });

export const fmtTime = (t: number) => timeFmt.format(t).replace("am", "AM").replace("pm", "PM");
export const fmtDay = (t: number) => dayFmt.format(t);
export const fmtLongDay = (t: number) => longDayFmt.format(t);

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const dayDiff = (t: number, now = Date.now()) => Math.round((startOfDay(t) - startOfDay(now)) / DAY);

export function fmtWhen(t: number, now = Date.now()) {
  const dd = dayDiff(t, now);
  if (dd === 0) return `Today, ${fmtTime(t)}`;
  if (dd === 1) return `Tomorrow, ${fmtTime(t)}`;
  if (dd === -1) return `Yesterday, ${fmtTime(t)}`;
  return `${fmtDay(t)}, ${fmtTime(t)}`;
}

export const lowerDay = (s: string) => s.replace(/^(Today|Tomorrow|Yesterday)/, (m) => m.toLowerCase());

export function fmtAgo(t: number, now = Date.now()) {
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export function fmtLeft(t: number, now = Date.now()) {
  const diff = t - now;
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60_000);
  const h = Math.round(abs / HOUR);
  const d = Math.round(abs / DAY);
  const span = m < 60 ? `${m} min` : h < 48 ? `${h} hr` : `${d} days`;
  return diff >= 0 ? `${span} left` : `${span} overdue`;
}

export function fmtIn(t: number, now = Date.now()) {
  const abs = Math.abs(t - now);
  const m = Math.max(1, Math.round(abs / 60_000));
  const h = Math.round(abs / HOUR);
  const d = Math.round(abs / DAY);
  if (m < 60) return `${m} ${m === 1 ? "minute" : "minutes"}`;
  if (h < 48) return `${h} ${h === 1 ? "hour" : "hours"}`;
  return `${d} days`;
}

/** How urgent a due date feels, used to colour the label. */
export function dueTone(t: number, now = Date.now()): "bad" | "warn" | "normal" {
  const diff = t - now;
  if (diff < 0) return "bad";
  if (diff < 24 * HOUR) return "warn";
  return "normal";
}

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const AVATAR_TINTS = [
  ["#dff1fb", "#0b6fa0"],
  ["#e8e6fa", "#5342b3"],
  ["#fdeadb", "#b45a1e"],
  ["#dff3ea", "#157a53"],
  ["#fbe4ea", "#b02d48"],
  ["#e6ecf8", "#2b4a8f"],
  ["#fff0cf", "#946000"],
  ["#e4f1f1", "#1f7373"],
];

export function tintFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
