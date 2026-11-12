import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { BellRing, CircleCheck, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";
import { Ring } from "./ui";
import { Sparkline } from "./charts";
import logo from "../assets/trigrexam-logo.png";
import { enableMotion, motionReduced, systemReduced, motionForced } from "../lib/motion";

/** Fades and slides its children in the first time they scroll into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={cn("reveal", on && "in", className)} style={{ "--d": `${delay}ms` } as CSSProperties}>{children}</div>;
}

/** A card with a soft light that follows the cursor. */
export function GlowCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn("glow", className)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}

/** A short branded intro the first time the app opens in a session. */
export function Splash() {
  const [show, setShow] = useState(() => {
    try {
      if (motionReduced()) return false;
      if (new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("embed")) return false;
      if (sessionStorage.getItem("trigrexam-splash")) return false;
      sessionStorage.setItem("trigrexam-splash", "1");
      return true;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [show]);
  if (!show) return null;
  return (
    <div className="splash pointer-events-none" aria-hidden>
      <div className="text-center">
        <img src={logo} alt="" className="splash-logo mx-auto h-12 w-auto brightness-0 invert" />
        <p className="splash-logo mt-3 text-sm font-semibold tracking-wide text-white/70" style={{ animationDelay: "0.25s" }}>Admin dashboard</p>
        <div className="mx-auto mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/20"><div className="splash-bar h-full rounded-full bg-white" /></div>
      </div>
    </div>
  );
}

/** Floating product cards that shift slightly with the mouse, for the hero areas. */
export function HeroScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  };
  const reset = () => { ref.current?.style.setProperty("--px", "0"); ref.current?.style.setProperty("--py", "0"); };
  const layer = (x: number, y: number): CSSProperties => ({ transform: `translate3d(calc(var(--px, 0) * ${x}px), calc(var(--py, 0) * ${y}px), 0)`, transition: "transform 0.25s ease-out" });
  const card = "rounded-2xl bg-white p-4 text-ink shadow-[0_28px_70px_-22px_rgb(0_0_0/0.55)]";

  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={reset} className={cn("relative h-[340px] w-full max-w-[540px]", className)} aria-hidden>
      <div className="absolute left-0 top-2" style={layer(-14, -8)}>
        <div className={cn(card, "float w-[300px]")}>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-warn-soft text-warn"><BellRing size={19} /></span>
            <div className="min-w-0"><p className="text-sm font-bold leading-snug">41 students haven’t handed in</p><p className="text-xs text-muted">Percentage · Practice Set 7 · due in 6 hr</p></div>
          </div>
          <div className="mt-3 flex items-center justify-between"><span className="h-2 w-28 overflow-hidden rounded-full bg-line"><span className="block h-full w-[54%] rounded-full bg-sky" /></span><span className="rounded-lg bg-[#1f3d7d] px-3 py-1.5 text-xs font-bold text-white">Send reminder</span></div>
        </div>
      </div>

      <div className="absolute right-0 top-[78px]" style={layer(18, 10)}>
        <div className={cn(card, "float flex items-center gap-4")} style={{ animationDelay: "-2.4s" }}>
          <Ring value={89} size={66} stroke={8} color="var(--color-ok)" />
          <div><p className="text-sm font-bold">Handed in on time</p><p className="text-xs font-semibold text-ok">Up 4 points</p></div>
        </div>
      </div>

      <div className="absolute bottom-[82px] right-0" style={layer(10, -12)}>
        <div className={cn(card, "float w-[210px] !p-3.5")} style={{ animationDelay: "-5s" }}>
          <p className="flex items-center justify-between text-xs font-semibold text-muted">Work handed in <span className="inline-flex items-center gap-1 text-ok"><TrendingUp size={13} /> 18%</span></p>
          <div className="mt-1 flex items-end justify-between"><p className="text-2xl font-bold tnum">612</p><Sparkline data={[12, 18, 15, 24, 22, 31, 36]} width={96} height={38} color="var(--color-sky)" /></div>
        </div>
      </div>

      <div className="absolute bottom-0 left-10" style={layer(-8, 14)}>
        <div className={cn(card, "float flex items-center gap-3 !px-4 !py-3")} style={{ animationDelay: "-3.8s" }}>
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-ok-soft text-ok"><CircleCheck size={19} /></span>
          <p className="text-sm font-semibold">Aarav handed in <span className="font-bold">Quadratic Worksheet</span></p>
        </div>
      </div>
    </div>
  );
}

/** Shown when the system asks for reduced motion, with a one-tap way to see the full animations. */
export function MotionNotice() {
  const [show, setShow] = useState(() => systemReduced() && !motionForced() && !sessionStorage.getItem("trigrexam-motion-dismissed"));
  if (!show) return null;
  return (
    <div role="status" className="rise fixed inset-x-4 bottom-4 z-[120] mx-auto flex max-w-[560px] items-center gap-3 rounded-2xl border border-black/10 bg-white/95 p-3.5 pl-5 text-[#1d1d1f] shadow-[0_20px_60px_-20px_rgb(0_0_0/0.45)] backdrop-blur-xl">
      <p className="min-w-0 flex-1 text-[13px] leading-snug">Reduce Motion is on for your device, so animations are simplified.</p>
      <button onClick={() => { enableMotion(); window.location.reload(); }} className="shrink-0 rounded-full bg-[#1f3d7d] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#19326a]">Turn animations on</button>
      <button aria-label="Dismiss" onClick={() => { try { sessionStorage.setItem("trigrexam-motion-dismissed", "1"); } catch { /* ignore */ } setShow(false); }} className="shrink-0 rounded-full p-1.5 text-[#6e6e73] hover:bg-black/5">✕</button>
    </div>
  );
}
