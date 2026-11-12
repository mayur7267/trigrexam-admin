import { Link } from "react-router-dom";
import { Clock, Check, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { Assignment, Submission } from "../lib/types";
import { tally } from "../lib/selectors";
import { cn, dueTone, fmtLeft, fmtWhen, mulberry32 } from "../lib/utils";
import { StackBar } from "./ui";
import { Sparkline } from "./charts";
import { useCountUp } from "../lib/hooks";
import { motionReduced } from "../lib/motion";
import { useMemo, type CSSProperties, type ReactNode } from "react";

export const STATUS_COLOR = {
  reviewed: "var(--color-ok)",
  waiting: "var(--color-warn-dot)",
  redo: "var(--color-amber)",
  progress: "var(--color-sky)",
  missing: "var(--color-bad)",
};

export function ProgressOf({ a, subs, compact }: { a: Assignment; subs: Submission[]; compact?: boolean }) {
  const t = tally(a, subs);
  return (
    <div className="min-w-0">
      <StackBar
        total={t.total}
        height={compact ? 6 : 8}
        parts={[
          { value: t.reviewed, color: STATUS_COLOR.reviewed, label: "reviewed" },
          { value: t.submitted, color: STATUS_COLOR.waiting, label: "waiting for review" },
          { value: t.redo, color: STATUS_COLOR.redo, label: "asked to redo" },
          { value: t.progress, color: STATUS_COLOR.progress, label: "in progress" },
          { value: t.missing, color: STATUS_COLOR.missing, label: "missing" },
        ]}
      />
      <p className="mt-1.5 text-[13px] text-muted tnum">
        <span className="font-bold text-ink">{t.handedIn}</span> of {t.total} handed in
        {t.missing > 0 && <span className="font-semibold text-bad"> · {t.missing} missing</span>}
      </p>
    </div>
  );
}

export function DueLabel({ at, short, className }: { at: number; short?: boolean; className?: string }) {
  const tone = dueTone(at);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-semibold", tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-body", className)}>
      <Clock size={14} />
      {short ? fmtLeft(at) : tone === "bad" ? `Overdue · ${fmtWhen(at)}` : fmtWhen(at)}
    </span>
  );
}

const ICON_TONE = {
  sky: "bg-sky-50 text-sky-600",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  violet: "bg-violet-soft text-violet",
  navy: "bg-navy-50 text-navy",
} as const;

export function StatTile({ label, value, hint, tone = "normal", spark, to, sparkColor, icon: Icon, iconTone = "sky", delta }: {
  label: string; value: ReactNode; hint?: ReactNode; tone?: "normal" | "good" | "warn" | "bad"; spark?: number[]; to?: string; sparkColor?: string;
  icon?: LucideIcon; iconTone?: keyof typeof ICON_TONE; delta?: { text: string; up: boolean; good: boolean };
}) {
  const m = typeof value === "string" ? /^(\d+)(.*)$/.exec(value) : null;
  const num = typeof value === "number" ? value : m ? Number(m[1]) : null;
  const suffix = m ? m[2] : "";
  const shown = useCountUp(num ?? 0);
  const body = (
    <div className="card group relative flex h-full flex-col gap-5 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", ICON_TONE[iconTone])}><Icon size={18} strokeWidth={2.1} /></span>}
          <p className="text-[13px] font-semibold leading-tight text-muted">{label}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[38px] font-bold leading-none tracking-tight text-ink tnum">
            {num !== null ? shown : value}{suffix && <span className="ml-0.5 text-[22px] font-semibold text-muted">{suffix}</span>}
          </p>
          {(hint || delta) && (
            <p className={cn("mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium", tone === "good" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-muted")}>
              {delta && (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", delta.good ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
                  {delta.up ? <TrendingUp size={12} strokeWidth={2.6} /> : <TrendingDown size={12} strokeWidth={2.6} />}{delta.text}
                </span>
              )}
              {hint}
            </p>
          )}
        </div>
        {spark && <span className="hidden shrink-0 sm:block"><Sparkline data={spark} color={sparkColor} /></span>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="block h-full">{body}</Link> : body;
}

/** Decorative hero background: drifting glow, concentric rings and slowly orbiting dots. */
export function HeroArt({ dots = true }: { dots?: boolean }) {
  const still = motionReduced();
  const spin = (dur: number, dir: 1 | -1 = 1) =>
    still ? null : <animateTransform attributeName="transform" type="rotate" from="0 400 170" to={`${360 * dir} 400 170`} dur={`${dur}s`} repeatCount="indefinite" />;
  return (
    <>
      <span aria-hidden className="orb orb-a" />
      <span aria-hidden className="orb orb-b" />
      <svg aria-hidden className="pointer-events-none absolute right-0 top-0 -z-[1] hidden h-full w-[52%] sm:block" viewBox="0 0 520 320" preserveAspectRatio="xMaxYMid slice" fill="none">
        <g stroke="#fff" strokeOpacity="0.15">
          <circle cx="400" cy="170" r="64" /><circle cx="400" cy="170" r="118" /><circle cx="400" cy="170" r="176" /><circle cx="400" cy="170" r="238" /><circle cx="400" cy="170" r="304" />
        </g>
        {dots && (
          <>
            <circle cx="400" cy="170" r="9" fill="#fff" fillOpacity="0.55" />
            <g>{spin(46)}<circle cx="336" cy="170" r="5.5" fill="#7fd4f7" /><circle cx="400" cy="52" r="5" fill="#fff" fillOpacity="0.6" /></g>
            <g>{spin(78, -1)}<circle cx="518" cy="170" r="6.5" fill="#fff" fillOpacity="0.8" /><circle cx="400" cy="408" r="6" fill="#7fd4f7" /></g>
            <g>{spin(120)}<circle cx="190" cy="170" r="4.5" fill="#fff" fillOpacity="0.45" /><circle cx="400" cy="-70" r="5" fill="#7fd4f7" fillOpacity="0.9" /></g>
          </>
        )}
      </svg>
    </>
  );
}

export function DoneNote({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ok"><Check size={15} strokeWidth={3} />{children}</span>;
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/** A short burst of confetti for great results. Hidden for people who prefer less motion. */
export function Confetti() {
  const still = motionReduced();
  const pieces = useMemo(() => {
    const r = mulberry32(11);
    const colors = ["#1ea6e4", "#1f3d7d", "#f0a500", "#23996b", "#6a55c9", "#d5702a"];
    return Array.from({ length: 46 }, (_, i) => ({
      left: 6 + r() * 88, delay: r() * 0.45, dur: 1.5 + r() * 1.3, color: colors[i % colors.length],
      dx: (r() - 0.5) * 180, rot: (r() - 0.5) * 760, w: 6 + r() * 6, h: 8 + r() * 9,
    }));
  }, []);
  if (still) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0">
      {pieces.map((p, i) => (
        <span key={i} className="confetti" style={{ left: `${p.left}%`, width: p.w, height: p.h, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--dx": `${p.dx}px`, "--rot": `${p.rot}deg` } as CSSProperties} />
      ))}
    </div>
  );
}
