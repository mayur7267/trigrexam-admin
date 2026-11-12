import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Bookmark, Briefcase, Check, ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, GraduationCap, Library, Mail,
  MapPin, Menu, Phone, Presentation, School, Settings2, Users, Wallet, X, type LucideIcon,
} from "lucide-react";
import { CONTACT, INCLUDED, PLANS, rupees } from "../data/plans";
import { Button } from "../components/ui";
import { Reveal } from "../components/fx";
import { AreaChart, Donut, HBars } from "../components/charts";
import { useCountUp } from "../lib/hooks";
import { clamp01, easeOut, useScrollLink } from "../lib/scroll";
import { motionReduced } from "../lib/motion";
import { cn } from "../lib/utils";
import logo from "../assets/trigrexam-logo.png";

const NAV = [["story", "How it works"], ["highlights", "Highlights"], ["features", "Features"], ["customers", "Customers"], ["pricing", "Pricing"], ["contact", "Contact"]] as const;
const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
const GREY = "text-[#6e6e73]";

/* ---------------------------------- shared bits ---------------------------------- */

function AppWindow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[22px] bg-white text-left shadow-[0_60px_120px_-40px_rgb(0_0_0/0.45),0_0_0_1px_rgb(0_0_0/0.08)]", className)}>
      <div className="flex h-11 items-center gap-2 border-b border-black/5 bg-[#fbfbfd] px-4">
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} className="size-3 rounded-full" style={{ background: c }} />)}
        <div className="mx-auto hidden items-center gap-1 sm:flex">{["Home", "Assignments", "Students", "Reports"].map((t, i) => <span key={t} className={cn("rounded-full px-3 py-1 text-[11px] font-medium", i === 0 ? "bg-black/[.06] text-[#1d1d1f]" : "text-[#6e6e73]")}>{t}</span>)}</div>
        <span className="w-14" />
      </div>
      {children}
    </div>
  );
}

function CountOnView({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const v = useCountUp(on ? to : 0, 1700);
  return <span ref={ref}>{v}{suffix}</span>;
}

/** Words that turn from light grey to black as you scroll through them. */
function ScrollWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  const ref = useScrollLink<HTMLParagraphElement>((r, vh) => (vh * 0.82 - r.top) / (vh * 0.42 + r.height * 0.6), (el, p) => el.style.setProperty("--p", String(p)));
  return (
    <p ref={ref} className={className} style={{ "--n": words.length } as CSSProperties}>
      {words.map((w, i) => (
        <span key={i} style={{ "--i": i, opacity: "clamp(0.18, calc(0.18 + (var(--p, 0) * var(--n) - var(--i)) * 0.9), 1)", transition: "opacity 0.25s linear" } as CSSProperties}>{w} </span>
      ))}
    </p>
  );
}

/* ---------------------------------- hero product window ---------------------------------- */

function DashMock() {
  return (
    <AppWindow>
      <div className="bg-[#f5f5f7] p-5 sm:p-8">
        <p className="text-[12px] font-medium text-[#6e6e73]">Thursday, 5 November</p>
        <p className="mt-1 text-[26px] font-bold tracking-[-0.035em] text-[#1d1d1f] sm:text-[40px]">Good afternoon, <span className="gradient-text">Anil</span>.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Waiting for review", "73", "text-[#a86400]"], ["Handed in on time", "88%", "text-[#168a5b]"], ["Active this week", "146", "text-[#1d1d1f]"], ["Class attendance", "79%", "text-[#1d1d1f]"]].map(([l, v, c]) => (
            <div key={l} className="rounded-2xl bg-white p-4"><p className="text-[11px] font-medium text-[#6e6e73]">{l}</p><p className={cn("mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] tnum", c)}>{v}</p></div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl bg-white p-4"><p className="mb-3 text-[13px] font-semibold text-[#1d1d1f]">Work handed in</p><AreaChart height={150} labels={["23 Oct", "25 Oct", "27 Oct", "29 Oct", "31 Oct", "2 Nov", "4 Nov"]} series={[{ name: "On time", color: "var(--color-sky)", data: [34, 41, 38, 52, 46, 58, 64] }, { name: "Late", color: "var(--color-warn-dot)", data: [9, 11, 8, 12, 9, 10, 8] }]} min={0} /></div>
          <div className="hidden rounded-2xl bg-white p-4 lg:block">
            <p className="mb-3 text-[13px] font-semibold text-[#1d1d1f]">Needs your attention</p>
            {[["41 students haven’t handed in", "Send reminder"], ["Neha has 26 reviews waiting", "Send a nudge"], ["3 asked for more time", "Review"]].map(([t, b]) => (
              <div key={t} className="flex items-center justify-between gap-2 border-t border-black/5 py-2.5 first:border-t-0 first:pt-0"><p className="text-[12px] font-medium leading-snug text-[#1d1d1f]">{t}</p><span className="shrink-0 rounded-full bg-[#1f3d7d] px-3 py-1 text-[10px] font-semibold text-white">{b}</span></div>
            ))}
          </div>
        </div>
      </div>
    </AppWindow>
  );
}

function HeroShowcase() {
  const ref = useScrollLink<HTMLDivElement>(
    (r, vh) => (vh * 0.97 - r.top) / (vh * 0.62),
    (el, p) => {
      const e = easeOut(p);
      el.style.transform = `perspective(1800px) rotateX(${(1 - e) * 20}deg) scale(${0.9 + e * 0.1})`;
      el.style.opacity = String(0.55 + e * 0.45);
    },
  );
  return <div ref={ref} className="mx-auto max-w-[1120px] origin-bottom will-change-transform"><DashMock /></div>;
}

/* ---------------------------------- the stacking deck ---------------------------------- */

const STORY: { eyebrow: string; title: string; body: string; glow: string; tint: string }[] = [
  { eyebrow: "Create", title: "One screen. Done in a minute.", body: "Type a title, tick a batch and publish. Due dates, reminders and marking are already set up for you.", glow: "rgb(30 166 228 / 0.5)", tint: "#5cc8f5" },
  { eyebrow: "Learn", title: "Students always know what is next.", body: "A simple to-do list that feels right on a phone. Start, answer, done. Quizzes mark themselves.", glow: "rgb(125 105 255 / 0.5)", tint: "#b9a8ff" },
  { eyebrow: "Review", title: "A calm place to mark.", body: "One student at a time, with marks and feedback side by side. Teachers only see the work that needs a human.", glow: "rgb(35 153 107 / 0.5)", tint: "#6fe3b0" },
  { eyebrow: "Track", title: "Everything comes together on its own.", body: "Progress, late work and reminders update by themselves. Admins only see what needs them.", glow: "rgb(240 165 0 / 0.42)", tint: "#ffc46b" },
];

const k = (n: number) => ({ "--k": n }) as CSSProperties;

function ScreenCreate({ live }: { live: boolean }) {
  return (
    <div className="h-[430px] bg-white p-7">
      <p className="asm text-[11px] font-semibold uppercase tracking-wider text-[#0b83bd]" style={k(3)}>1 · What is it?</p>
      <div className="asm mt-3 rounded-2xl border border-[#d2d2d7] px-4 py-3.5 text-[17px] font-medium text-[#1d1d1f]" style={k(4)}>{live ? <span className="typing">Percentage · Practice Set 8</span> : <span className="opacity-0">.</span>}<span className="caret" /></div>
      <div className="asm mt-4 flex flex-wrap gap-2" style={k(6)}>{["Quant", "Reasoning", "English", "GA"].map((t, i) => <span key={t} className={cn("rounded-full border px-3.5 py-1.5 text-[12px] font-semibold", i === 0 ? "border-[#1f3d7d] bg-[#eaf0fb] text-[#1f3d7d]" : "border-[#d2d2d7] text-[#6e6e73]")}>{t}</span>)}</div>
      <p className="asm mt-6 text-[11px] font-semibold uppercase tracking-wider text-[#0b83bd]" style={k(8)}>2 · Who gets it?</p>
      <div className="mt-3 grid grid-cols-2 gap-3">{[["CGL Morning", "48 students", true], ["Bank PO", "36 students", true], ["CGL Evening", "41 students", false], ["NTPC Weekend", "29 students", false]].map(([n, c, on], i) => (
        <div key={n as string} className={cn("asm flex items-center justify-between rounded-2xl border px-3.5 py-3", on ? "border-[#1f3d7d] bg-[#eaf0fb]" : "border-[#d2d2d7]")} style={k(9 + i)}><div><p className="text-[13px] font-bold text-[#1d1d1f]">{n as string}</p><p className="text-[11px] text-[#6e6e73]">{c as string}</p></div><span className={cn("inline-flex size-5 items-center justify-center rounded-md border", on ? "border-[#1f3d7d] bg-[#1f3d7d] text-white" : "border-[#d2d2d7]")}>{on && <Check size={12} strokeWidth={3.4} />}</span></div>
      ))}</div>
      <div className="mt-5 flex justify-end"><span className={cn("asm rounded-full bg-[#1f3d7d] px-6 py-2.5 text-[13px] font-semibold text-white", live && "pulse-ring")} style={k(14)}>Publish now</span></div>
    </div>
  );
}

function ScreenStudent() {
  return (
    <div className="h-[430px] bg-[#f5f5f7] p-6">
      <div className="asm rounded-3xl p-6 text-white" style={{ ...k(3), background: "linear-gradient(118deg,#12275a,#1f3d7d 55%,#1e7fc0)" }}>
        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">Up next</span>
        <p className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.03em]">Percentage · Practice Set 8</p>
        <p className="mt-1 text-[13px] text-white/75">Quiz · 20 marks · about 5 minutes</p>
        <span className="mt-5 inline-flex rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#173272]">Start now</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {[["Essay · Digital India", "In progress", "#d5702a", "#fdede0"], ["Data Interpretation", "Waiting for review", "#0b83bd", "#e6f5fd"], ["Current Affairs Quiz", "16 / 20", "#23996b", "#e3f5ee"]].map(([t, c, fg, bg], i) => (
          <div key={t} className="asm flex items-center gap-3 rounded-2xl bg-white px-4 py-3" style={k(7 + i * 2)}><span className="size-9 rounded-xl" style={{ background: bg }} /><p className="flex-1 text-[13px] font-semibold text-[#1d1d1f]">{t}</p><span className="text-[11px] font-semibold" style={{ color: fg }}>{c}</span></div>
        ))}
      </div>
    </div>
  );
}

function ScreenReview() {
  return (
    <div className="grid h-[430px] grid-cols-[1.35fr_1fr] gap-3 bg-[#f5f5f7] p-5">
      <div className="asm rounded-2xl bg-white p-4" style={k(3)}>
        <div className="flex items-center gap-2.5"><span className="inline-flex size-8 items-center justify-center rounded-full bg-[#dff3ea] text-[11px] font-bold text-[#157a53]">LC</span><div><p className="text-[12px] font-bold text-[#1d1d1f]">Lakshmi Chauhan</p><p className="text-[10px] text-[#6e6e73]">Handed in 4 days ago</p></div></div>
        <div className="mt-4 rounded-xl bg-[#fdfcf6] p-4">{[78, 92, 64, 88, 70, 95, 58, 82, 74, 90, 66, 86, 54, 80, 72, 60].map((w, i) => <div key={i} className="asm my-2.5 h-1.5 origin-left rounded-full bg-[#25346b]/60" style={{ ...k(5 + i * 0.35), width: `${w}%` }} />)}</div>
      </div>
      <div className="asm rounded-2xl bg-white p-4" style={k(5)}>
        <p className="text-[11px] font-semibold text-[#6e6e73]">Marks</p>
        <p className="asm mt-1 text-[40px] font-bold leading-none tracking-[-0.04em] text-[#1d1d1f] tnum" style={k(9)}>20<span className="text-[18px] font-semibold text-[#86868b]"> / 25</span></p>
        <div className="asm mt-4 flex flex-wrap gap-1.5" style={k(11)}>{["Great work", "Show your steps", "Well structured"].map((t) => <span key={t} className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-semibold text-[#6e6e73]">+ {t}</span>)}</div>
        <div className="asm mt-4 rounded-xl bg-[#f5f5f7] p-3 text-[11px] leading-relaxed text-[#424245]" style={k(12)}>Clear and well organised. Watch the tense in sentence 4.</div>
        <span className="asm mt-5 flex justify-center rounded-full bg-[#1f3d7d] py-2.5 text-[12px] font-semibold text-white" style={k(13)}>Save and next</span>
        <span className="asm mt-2.5 flex justify-center rounded-full border border-[#d2d2d7] py-2.5 text-[12px] font-semibold text-[#424245]" style={k(14)}>Ask for a redo</span>
      </div>
    </div>
  );
}

function ScreenOverview({ live }: { live: boolean }) {
  return (
    <div className="h-[430px] bg-[#f5f5f7] p-5">
      <div className="grid grid-cols-3 gap-3">{[["Handed in", "88%"], ["On time", "86%"], ["To review", "73"]].map(([l, v], i) => <div key={l} className="asm rounded-2xl bg-white p-4" style={k(3 + i * 1.5)}><p className="text-[11px] font-medium text-[#6e6e73]">{l}</p><p className="mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] text-[#1d1d1f] tnum">{v}</p></div>)}</div>
      <div className="mt-3 grid grid-cols-[1fr_1.25fr] gap-3">
        <div className="asm flex flex-col items-center rounded-2xl bg-white p-5" style={k(8)}><Donut size={132} stroke={16} parts={[{ value: 273, color: "var(--color-ok)" }, { value: 74, color: "var(--color-warn-dot)" }, { value: 102, color: "var(--color-sky)" }, { value: 246, color: "var(--color-line-strong)" }, { value: 9, color: "var(--color-bad)" }]}><span className="text-[26px] font-bold leading-none tracking-[-0.03em] text-[#1d1d1f]">49%</span><span className="mt-1 text-[10px] font-semibold text-[#6e6e73]">handed in</span></Donut></div>
        <div className="asm rounded-2xl bg-white p-5" style={k(10)}><HBars key={live ? "on" : "off"} items={[{ label: "CGL Morning", value: live ? 65 : 0 }, { label: "CGL Evening", value: live ? 66 : 0 }, { label: "Bank PO", value: live ? 68 : 0 }, { label: "NTPC Weekend", value: live ? 67 : 0 }]} /></div>
      </div>
      <div className="asm mt-3 rounded-2xl bg-white px-5 py-3.5" style={k(12)}>
        {[["Imran Qureshi", "marked 11 submissions", "9 min ago"], ["System", "sent the 24-hour reminder", "1 hr ago"]].map(([w, t, ago], i) => (
          <div key={w} className={cn("flex items-center gap-3 py-2", i === 0 && "border-b border-black/5")}><span className="inline-flex size-6 items-center justify-center rounded-full bg-[#e6f5fd] text-[9px] font-bold text-[#0b83bd]">{w[0]}</span><p className="flex-1 text-[12px] text-[#424245]"><b className="text-[#1d1d1f]">{w}</b> {t}</p><span className="text-[11px] text-[#86868b]">{ago}</span></div>
        ))}
      </div>
    </div>
  );
}

/** Pointer-driven 3D tilt with a light that follows the cursor. */
function Tilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = motionReduced();
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 9}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.style.setProperty("--go", "1");
  };
  const leave = () => { const el = ref.current; if (!el) return; ["--rx", "--ry"].forEach((v) => el.style.setProperty(v, "0deg")); el.style.setProperty("--go", "0"); };
  if (still) return <>{children}</>;
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className="tilt relative rounded-[22px] will-change-transform">
      {children}
      <span aria-hidden className="glare" />
    </div>
  );
}

function Story() {
  const N = STORY.length;
  const [live, setLive] = useState<boolean[]>(() => (motionReduced() ? STORY.map(() => true) : STORY.map(() => false)));
  const plain = motionReduced();

  const ref = useScrollLink<HTMLDivElement>(
    () => 0,
    (el) => {
      if (motionReduced()) return;
      const vh = window.innerHeight;
      const stick = window.innerWidth >= 1024;
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
      const rects = cards.map((c) => c.getBoundingClientRect());
      cards.forEach((card, i) => {
        const e = clamp01((vh - rects[i].top) / ((vh - 84) * 0.8));
        const next = rects[i + 1];
        const cov = stick && next ? clamp01((vh - next.top) / (vh - 84)) : 0;
        card.style.setProperty("--e", e.toFixed(3));
        const panel = card.firstElementChild as HTMLElement;
        const enter = 1 - easeOut(e);
        panel.style.transform = `perspective(1900px) translateY(${enter * 80}px) rotateX(${enter * 10}deg) scale(${(0.92 + 0.08 * easeOut(e)) * (1 - 0.07 * cov)})`;
        panel.style.opacity = String(0.25 + 0.75 * clamp01(e * 2.2));
        const veil = card.querySelector<HTMLElement>("[data-veil]");
        if (veil) veil.style.opacity = String(cov * 0.62);
        const on = e > 0.72;
        if (card.dataset.live !== String(on)) { card.dataset.live = String(on); setLive((prev) => prev.map((v, j) => (j === i ? on : v))); }
      });
    },
  );

  return (
    <section id="story" data-dark className="scroll-mt-12 bg-black text-white">
      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-24 sm:pt-40">
        <Reveal>
          <h2 className="title-xl text-[40px] !text-white sm:text-[80px]">Four steps.<br />One calm flow.</h2>
          <p className="mx-auto mt-6 max-w-xl text-[19px] font-medium leading-snug text-[#a1a1a6] sm:text-[24px]">Scroll to watch an assignment build itself, from the first click to the final result.</p>
        </Reveal>
      </div>

      <div ref={ref} className="relative mx-auto max-w-[1240px] px-4 pb-32 sm:px-8 sm:pb-48">
        {STORY.map((s, i) => (
          <div key={s.title} data-card className={cn("relative mb-6 lg:mb-[24vh]", !plain && "lg:sticky lg:top-[84px]", i === N - 1 && "!mb-0")}>
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-[#171719] to-[#0a0a0b] shadow-[0_-40px_90px_-30px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.07)] will-change-transform sm:rounded-[40px] lg:h-[max(560px,min(640px,calc(100dvh-120px)))]">
              <span aria-hidden className="pointer-events-none absolute -right-24 top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full blur-3xl" style={{ background: `radial-gradient(closest-side, ${s.glow}, transparent)`, transform: "translateY(calc(-50% + (1 - var(--e, 1)) * 110px))" }} />
              <div className="relative grid h-full gap-9 p-7 sm:p-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12">
                <div className="relative">
                  <p className="asm text-[17px] font-semibold" style={{ ...k(0), color: s.tint }}>{s.eyebrow}</p>
                  <h3 className="title-xl asm mt-3 text-[38px] !text-white sm:text-[52px]" style={k(1)}>{s.title}</h3>
                  <p className="asm mt-5 max-w-md text-[18px] font-medium leading-snug tracking-[-0.01em] text-[#a1a1a6] sm:text-[20px]" style={k(2)}>{s.body}</p>
                  <span aria-hidden className="asm pointer-events-none mt-8 hidden select-none text-[120px] font-bold leading-none tracking-[-0.06em] lg:block" style={{ ...k(3), WebkitTextStroke: "1.5px rgb(255 255 255 / 0.14)", color: "transparent" }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <Tilt>
                  <AppWindow className="!shadow-[0_40px_90px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.08)]">
                    {[<ScreenCreate key="c" live={live[0]} />, <ScreenStudent key="s" />, <ScreenReview key="r" />, <ScreenOverview key="o" live={live[3]} />][i]}
                  </AppWindow>
                </Tilt>
              </div>
              <div data-veil aria-hidden className="pointer-events-none absolute inset-0 bg-black opacity-0" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------- highlights carousel ---------------------------------- */

function Highlights() {
  const rail = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const cards: { bg: string; fg: string; sub: string; eyebrow: string; title: string; visual: ReactNode }[] = [
    { bg: "#1d1d1f", fg: "#fff", sub: "#a1a1a6", eyebrow: "Smart reminders", title: "Nobody has to chase anyone.", visual: (
      <div className="space-y-3">{[["24 hours before", "Sent to 41 students"], ["3 hours before", "Goes out tonight at 4 PM"], ["At the deadline", "Teacher is told"]].map(([a, b], i) => <div key={a} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4"><span className={cn("inline-flex size-9 items-center justify-center rounded-full", i === 0 ? "bg-[#23996b]" : "bg-white/15")}>{i === 0 ? <Check size={17} strokeWidth={3} /> : <Clock size={17} />}</span><div><p className="text-[14px] font-semibold">{a}</p><p className="text-[12px] text-[#a1a1a6]">{b}</p></div></div>)}</div>
    ) },
    { bg: "#f5f5f7", fg: "#1d1d1f", sub: "#6e6e73", eyebrow: "Quizzes", title: "Marked the moment they finish.", visual: (
      <div className="flex flex-col items-center rounded-3xl bg-white p-7"><div className="relative size-[132px]"><svg viewBox="0 0 100 100" className="-rotate-90"><circle cx="50" cy="50" r="42" fill="none" stroke="#e6e6eb" strokeWidth="9" /><circle cx="50" cy="50" r="42" fill="none" stroke="#168a5b" strokeWidth="9" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="0" /></svg><span className="absolute inset-0 flex items-center justify-center text-[30px] font-bold tracking-[-0.04em] tnum">20/20</span></div><p className="mt-4 text-[13px] font-semibold text-[#168a5b]">Marked automatically</p></div>
    ) },
    { bg: "linear-gradient(160deg,#3a2391,#6a55c9 60%,#8f7bff)", fg: "#fff", sub: "rgb(255 255 255 / 0.78)", eyebrow: "Extra time", title: "A yes is one tap away.", visual: (
      <div className="rounded-3xl bg-white p-5 text-[#1d1d1f]"><p className="text-[13px] font-bold">Pankaj asked for more time</p><p className="mt-2 rounded-xl bg-[#f5f5f7] p-3 text-[12px] italic text-[#424245]">“Had a fever and missed two classes.”</p><div className="mt-4 flex gap-2"><span className="rounded-full bg-[#1f3d7d] px-4 py-2 text-[12px] font-semibold text-white">Give 24 more hours</span><span className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-semibold">Not now</span></div></div>
    ) },
    { bg: "linear-gradient(160deg,#0f5d86,#1ea6e4)", fg: "#fff", sub: "rgb(255 255 255 / 0.82)", eyebrow: "On every screen", title: "Made for phones first.", visual: (
      <div className="mx-auto w-[190px] rounded-[34px] border-[7px] border-[#1d1d1f] bg-white p-3 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)]"><div className="mx-auto mb-3 h-4 w-16 rounded-full bg-[#1d1d1f]" /><div className="rounded-2xl p-3 text-white" style={{ background: "linear-gradient(118deg,#12275a,#1f3d7d)" }}><p className="text-[11px] font-bold">Up next</p><p className="mt-1 text-[10px] opacity-80">Percentage Set 8</p></div>{[0, 1, 2].map((k) => <div key={k} className="mt-2 flex items-center gap-2 rounded-xl bg-[#f5f5f7] p-2.5"><span className="size-5 rounded-md bg-[#cdebfa]" /><span className="h-1.5 flex-1 rounded bg-[#d2d2d7]" /></div>)}</div>
    ) },
    { bg: "#fff", fg: "#1d1d1f", sub: "#6e6e73", eyebrow: "Reports", title: "Four ways to see the same results.", visual: (
      <div className="rounded-3xl bg-[#f5f5f7] p-5"><div className="mb-4 flex flex-wrap gap-1.5">{["Overview", "Time", "Subject", "Question"].map((t, i) => <span key={t} className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", i === 2 ? "bg-[#1f3d7d] text-white" : "bg-white text-[#6e6e73]")}>{t}</span>)}</div><HBars items={[{ label: "Quant", value: 82, color: "var(--color-sky-600)" }, { label: "Reasoning", value: 74, color: "var(--color-violet)" }, { label: "English", value: 68, color: "var(--color-amber)" }]} /></div>
    ) },
    { bg: "linear-gradient(160deg,#8a3a0c,#d5702a 60%,#f0a500)", fg: "#fff", sub: "rgb(255 255 255 / 0.85)", eyebrow: "Your brand", title: "Your colours. Your address.", visual: (
      <div className="rounded-3xl bg-white p-5"><div className="flex items-center gap-1.5 rounded-lg bg-[#f5f5f7] px-3 py-2"><span className="size-2 rounded-full bg-[#ff5f57]" /><span className="size-2 rounded-full bg-[#febc2e]" /><span className="size-2 rounded-full bg-[#28c840]" /><span className="ml-2 truncate text-[10px] text-[#6e6e73]">youracademy.onlinetestpanel.com</span></div><div className="mt-4 flex justify-center gap-3">{["#1f3d7d", "#0f5f48", "#4e2a7a", "#8f3f0c"].map((c) => <span key={c} className="size-9 rounded-full ring-2 ring-white" style={{ background: c, boxShadow: "0 0 0 1px rgb(0 0 0 / 0.1)" }} />)}</div></div>
    ) },
  ];

  const step = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 440, behavior: "smooth" });
  const onScroll = () => { const el = rail.current; if (el) setIdx(Math.round(el.scrollLeft / 440)); };

  return (
    <section id="highlights" className="scroll-mt-12 bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
        <Reveal><h2 className="title-xl text-[40px] sm:text-[64px]">Get the highlights.</h2></Reveal>
      </div>
      <div ref={rail} onScroll={onScroll} className="no-scrollbar mt-12 flex scroll-pl-6 snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 sm:scroll-pl-[max(32px,calc((100vw-1240px)/2+32px))] sm:px-[max(32px,calc((100vw-1240px)/2+32px))]">
        {cards.map((c) => (
          <article key={c.title} className="relative flex h-[540px] w-[min(84vw,420px)] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[32px] p-8" style={{ background: c.bg, color: c.fg }}>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wider opacity-70">{c.eyebrow}</p>
              <h3 className="mt-3 text-[32px] font-bold leading-[1.1] tracking-[-0.035em]" style={{ color: c.fg }}>{c.title}</h3>
            </div>
            <div>{c.visual}</div>
          </article>
        ))}
        <span className="w-4 shrink-0 sm:w-24" aria-hidden />
      </div>
      <div className="mx-auto mt-6 flex max-w-[1240px] items-center justify-between px-6 sm:px-8">
        <div className="flex gap-2" aria-hidden>{cards.map((c, i) => <span key={c.title} className={cn("h-2 rounded-full bg-[#1d1d1f] transition-all duration-500", idx === i ? "w-6 opacity-90" : "w-2 opacity-20")} />)}</div>
        <div className="flex gap-2.5">
          <button aria-label="Previous" onClick={() => step(-1)} className="inline-flex size-11 items-center justify-center rounded-full bg-[#e8e8ed] text-[#1d1d1f] transition-colors hover:bg-[#d2d2d7]"><ChevronLeft size={20} /></button>
          <button aria-label="Next" onClick={() => step(1)} className="inline-flex size-11 items-center justify-center rounded-full bg-[#e8e8ed] text-[#1d1d1f] transition-colors hover:bg-[#d2d2d7]"><ChevronRight size={20} /></button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- features ---------------------------------- */

const SWATCHES = [{ navy: "#1f3d7d", sky: "#1ea6e4" }, { navy: "#0f5f48", sky: "#22b07a" }, { navy: "#4e2a7a", sky: "#a35fd1" }, { navy: "#8f3f0c", sky: "#ef8a22" }];

function ThemeMock() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (motionReduced()) return;
    const t = setInterval(() => setI((x) => (x + 1) % SWATCHES.length), 1900);
    return () => clearInterval(t);
  }, []);
  const c = SWATCHES[i];
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10">
      <div className="flex items-center gap-1.5 bg-[#f5f5f7] px-3 py-2">{["#ff5f57", "#febc2e", "#28c840"].map((d) => <span key={d} className="size-2 rounded-full" style={{ background: d }} />)}<span className="ml-2 truncate rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-[#6e6e73]">youracademy.onlinetestpanel.com</span></div>
      <div className="p-4 transition-colors duration-700" style={{ background: c.navy }}><div className="h-2.5 w-24 rounded bg-white/80" /><div className="mt-3 flex gap-2"><span className="h-7 w-20 rounded-full transition-colors duration-700" style={{ background: c.sky }} /><span className="h-7 w-14 rounded-full bg-white/20" /></div><div className="mt-3 grid grid-cols-3 gap-2">{[0, 1, 2].map((k) => <span key={k} className="h-9 rounded-xl bg-white/15" />)}</div></div>
    </div>
  );
}

function Tile({ eyebrow, title, body, children, className, delay = 0 }: { eyebrow: string; title: string; body: string; children?: ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-white p-8 transition-transform duration-500 hover:scale-[1.012] sm:p-10">
        <p className={cn("text-[13px] font-semibold uppercase tracking-wider", GREY)}>{eyebrow}</p>
        <h3 className="mt-3 text-[28px] font-bold leading-[1.1] tracking-[-0.035em] text-[#1d1d1f] sm:text-[34px]">{title}</h3>
        <p className={cn("mt-3 text-[17px] leading-relaxed", GREY)}>{body}</p>
        {children && <div className="mt-8 flex-1">{children}</div>}
      </div>
    </Reveal>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-12 bg-[#f5f5f7] py-28 sm:py-40">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
        <Reveal className="mx-auto max-w-[820px] text-center">
          <h2 className="title-xl text-[40px] sm:text-[72px]">Everything. Included.</h2>
          <p className={cn("mt-6 text-[21px] font-medium leading-snug tracking-[-0.01em] sm:text-[26px]", GREY)}>Built around one idea: create content once, reuse it, and stay in control of it.</p>
        </Reveal>
        <div className="mt-20 grid gap-5 lg:grid-cols-3">
          <Tile className="lg:col-span-2" eyebrow="Reports" title="Every test, explained four ways." body="Students see an overview plus time-wise, subject-wise and question-wise analysis of each test they take.">
            <div className="rounded-3xl bg-[#f5f5f7] p-6"><div className="mb-5 flex flex-wrap gap-2">{["Overview", "Time-wise", "Subject-wise", "Question-wise"].map((t, i) => <span key={t} className={cn("rounded-full px-4 py-1.5 text-[13px] font-semibold", i === 2 ? "bg-[#1f3d7d] text-white" : "bg-white text-[#6e6e73]")}>{t}</span>)}</div><HBars items={[{ label: "Quantitative Aptitude", value: 82, color: "var(--color-sky-600)" }, { label: "Reasoning", value: 74, color: "var(--color-violet)" }, { label: "English", value: 68, color: "var(--color-amber)" }, { label: "General Awareness", value: 77, color: "var(--color-leaf)" }]} /></div>
          </Tile>
          <Tile delay={80} eyebrow="Test Store" title="Start with free packs." body="Activate tests from any seller. There are free packs you can start with at no cost.">
            <div className="relative h-40">{[["₹799", "#eaf0fb", "#1f3d7d"], ["₹499", "#eeebfb", "#6a55c9"], ["FREE", "#e4f5ec", "#168a5b"]].map(([p, bg, fg], k) => (
              <div key={p} className="absolute inset-x-0 flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3.5 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.25)]" style={{ top: k * 34, transform: `scale(${1 - (2 - k) * 0.045})`, zIndex: k }}><span className="inline-flex size-10 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}><Library size={19} /></span><span className="flex-1"><span className="block h-2.5 w-24 rounded bg-[#e6e6eb]" /><span className="mt-2 block h-2 w-14 rounded bg-[#e6e6eb]/70" /></span><span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: bg, color: fg }}>{p}</span></div>
            ))}</div>
          </Tile>
          <Tile eyebrow="Your brand" title="Your colours. Your sub-domain." body="Every institute gets its own address and theme."><ThemeMock /></Tile>
          <Tile delay={80} eyebrow="Sell" title="Buy and sell test series." body="Any valid user can create content, keep control of it and sell it.">
            <div className="flex items-end gap-2.5">{[38, 54, 46, 72, 64, 92].map((h, i) => <span key={i} className="flex-1 rounded-t-xl bg-gradient-to-t from-[#1ea6e4] to-[#1f3d7d]" style={{ height: h + 20 }} />)}</div>
          </Tile>
          <Tile delay={160} eyebrow="Revise" title="Bookmark questions." body="Students save the tricky questions and come back to them later.">
            <div className="space-y-3">{[0, 1].map((k) => <div key={k} className="flex items-center gap-3 rounded-2xl bg-[#f5f5f7] px-4 py-3.5"><Bookmark size={18} className={k === 0 ? "fill-[#f0a500] text-[#f0a500]" : "text-[#86868b]"} /><span className="h-2.5 flex-1 rounded bg-[#e6e6eb]" /></div>)}</div>
          </Tile>
          <Tile eyebrow="Documents" title="Papers, timetables, solutions." body="Upload timetables, question papers and solution papers for your students.">
            <div className="flex flex-wrap gap-2.5">{["Timetable.pdf", "Question paper.pdf", "Solutions.pdf"].map((t) => <span key={t} className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-4 py-2.5 text-[13px] font-semibold text-[#424245]"><FileText size={15} className="text-[#c73b53]" />{t}</span>)}</div>
          </Tile>
          <Tile className="lg:col-span-2" delay={80} eyebrow="Admin panel" title="One simple place to manage it all." body="Student records, test views, test management and the seller dashboard.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{([[Users, "Students"], [ClipboardList, "Tests"], [Settings2, "Test management"], [Wallet, "Seller dashboard"]] as [LucideIcon, string][]).map(([I, t]) => <div key={t} className="rounded-3xl bg-[#f5f5f7] p-5 text-center transition-colors hover:bg-[#eaf0fb]"><I size={26} className="mx-auto text-[#1f3d7d]" /><p className="mt-3 text-[13px] font-semibold text-[#1d1d1f]">{t}</p></div>)}</div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- the rest ---------------------------------- */

const CUSTOMERS: { icon: LucideIcon; name: string; points: string[] }[] = [
  { icon: School, name: "Coaching institutes", points: ["Test conduction for your regular exams", "Content buying and purchase", "Live tests for every student at once", "Sell your content to others"] },
  { icon: GraduationCap, name: "Colleges", points: ["Train students for placement", "See who needs help with reports", "Reuse questions batch after batch"] },
  { icon: Presentation, name: "Teachers", points: ["Sell questions of your own creation", "Create once, reuse again and again", "Stay in control of who can access it"] },
  { icon: Briefcase, name: "Companies", points: ["Regular tests for your employees", "A report for every test", "Online or on a local network"] },
];

function SitePricing({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-3">
      {PLANS.map((p, i) => {
        const dark = p.id === "pro";
        return (
          <Reveal key={p.id} delay={i * 90}>
            <div className={cn("flex h-full flex-col rounded-[32px] p-9 sm:p-10", dark ? "bg-[#1d1d1f] text-white" : "bg-white text-[#1d1d1f]")}>
              <div className="flex items-center justify-between"><h3 className="text-[26px] font-bold tracking-[-0.03em]" style={{ color: dark ? "#fff" : undefined }}>{p.name}</h3>{dark && <span className="rounded-full bg-[#5cc8f5] px-3 py-1 text-[11px] font-bold text-[#0b2a3d]">Most popular</span>}</div>
              <p className={cn("mt-1 text-[15px]", dark ? "text-[#a1a1a6]" : GREY)}>{p.tagline}</p>
              <p className="mt-9 text-[64px] font-bold leading-none tracking-[-0.05em] tnum">{rupees(p.price)}</p>
              <p className={cn("mt-2 text-[15px] font-medium", dark ? "text-[#a1a1a6]" : GREY)}>+ GST, per year</p>
              <p className={cn("mt-8 border-t pt-6 text-[17px] font-semibold", dark ? "border-white/15" : "border-black/10")}>{p.users} premium users</p>
              <ul className="mt-5 flex-1 space-y-3.5">{INCLUDED.map((t) => <li key={t} className={cn("flex items-start gap-3 text-[15px]", dark ? "text-[#d2d2d7]" : "text-[#424245]")}><Check size={17} className={cn("mt-0.5 shrink-0", dark ? "text-[#5cc8f5]" : "text-[#1f3d7d]")} strokeWidth={3} />{t}</li>)}</ul>
              <button onClick={onChoose} className={cn("mt-9 h-[52px] rounded-full text-[16px] font-semibold transition-transform active:scale-[0.97]", dark ? "bg-white text-[#1d1d1f] hover:bg-white/90" : "bg-[#1f3d7d] text-white hover:bg-[#19326a]")}>Get {p.name}</button>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export function Landing() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const start = () => nav("/login");

  // Like apple.com: the bar turns dark while it sits over a black section.
  useEffect(() => {
    let raf = 0;
    const check = () => { raf = 0; setDark(!!document.elementFromPoint(window.innerWidth / 2, 64)?.closest("[data-dark]")); };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="force-light min-h-dvh bg-white text-[#1d1d1f]">
      <header className={cn("fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500", dark ? "glass-dark border-white/10" : "glass-light border-black/[0.06]")}>
        <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between gap-6 px-5">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Trigrexam"><img src={logo} alt="Trigrexam" className={cn("h-[21px] w-auto transition-[filter] duration-500", dark && "brightness-0 invert")} /></button>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Sections">{NAV.map(([id, l]) => <button key={id} onClick={() => go(id)} className={cn("text-[12px] transition-colors", dark ? "text-white/75 hover:text-white" : "text-[#1d1d1f]/75 hover:text-[#1d1d1f]")}>{l}</button>)}</nav>
          <div className="flex items-center gap-2">
            <button onClick={start} className={cn("rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors", dark ? "bg-white text-[#1d1d1f] hover:bg-white/90" : "bg-[#1f3d7d] text-white hover:bg-[#19326a]")}>Open dashboard</button>
            <button aria-label="Menu" onClick={() => setOpen(!open)} className={cn("inline-flex size-8 items-center justify-center rounded-full lg:hidden", dark ? "text-white" : "text-[#1d1d1f]")}>{open ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
        </div>
        {open && <div className="rise border-t border-black/5 bg-white/95 px-6 py-4 lg:hidden">{NAV.map(([id, l]) => <button key={id} onClick={() => { setOpen(false); go(id); }} className="block w-full border-b border-black/5 py-3.5 text-left text-[22px] font-semibold tracking-tight">{l}</button>)}</div>}
      </header>

      {/* hero */}
      <section id="top" className="overflow-x-clip pt-[132px] text-center sm:pt-[168px]">
        <div className="mx-auto max-w-[1120px] px-6">
          <p className="rise gradient-text inline-block text-[19px] font-semibold sm:text-[24px]">Introducing the new admin dashboard</p>
          <h1 className="display rise mt-4 text-[46px] sm:text-[84px] lg:text-[100px]" style={{ animationDelay: "70ms" }}>Assignments that take care of <span className="gradient-text">themselves.</span></h1>
          <p className={cn("rise mx-auto mt-7 max-w-[760px] text-[21px] font-medium leading-snug tracking-[-0.015em] sm:text-[30px]", GREY)} style={{ animationDelay: "140ms" }}>One calm place for admins, teachers and students. Set it once, and nobody has to chase anyone.</p>
          <div className="rise mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4" style={{ animationDelay: "210ms" }}>
            <Button variant="primary" size="lg" onClick={start}>Open the dashboard</Button>
            <button onClick={() => go("story")} className="inline-flex items-center gap-1 text-[19px] font-medium text-[#0b83bd] hover:underline">See how it works <ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="mt-20 px-4 pb-24 sm:mt-28 sm:px-8"><HeroShowcase /></div>
      </section>

      {/* statement */}
      <section className="bg-white pb-32 pt-8 sm:pb-48">
        <div className="mx-auto max-w-[980px] px-6">
          <ScrollWords text="Creating work takes a minute. Reminders send themselves. Reviews wait in one calm queue. And every student always knows what comes next." className="title-xl text-[34px] text-[#1d1d1f] sm:text-[60px]" />
        </div>
      </section>

      <Story />
      <Highlights />
      <Features />

      {/* numbers */}
      <section data-dark className="bg-black py-28 text-white sm:py-40">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
          <Reveal className="mx-auto max-w-[820px] text-center"><h2 className="title-xl text-[38px] !text-white sm:text-[64px]">Simple by design.</h2></Reveal>
          <div className="mt-20 grid gap-12 text-center sm:grid-cols-2 lg:grid-cols-4">
            {([[4, "", "steps to your own platform"], [null, "∞", "tests, on every plan"], [250, "", "premium users on Business"], [2017, "", "building exam software since"]] as [number | null, string, string][]).map(([n, sym, l], i) => (
              <Reveal key={l} delay={i * 100}>
                <p className="gradient-text text-[72px] font-bold leading-none tracking-[-0.05em] tnum sm:text-[96px]">{n === null ? sym : <CountOnView to={n} />}</p>
                <p className="mt-4 text-[17px] font-medium text-[#a1a1a6]">{l}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* customers */}
      <section id="customers" className="scroll-mt-12 bg-white py-28 sm:py-40">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
          <Reveal className="mx-auto max-w-[820px] text-center"><h2 className="title-xl text-[40px] sm:text-[64px]">Made for everyone who runs tests.</h2></Reveal>
          <div className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {CUSTOMERS.map((c, i) => (
              <Reveal key={c.name} delay={i * 90}>
                <c.icon size={44} strokeWidth={1.3} className="text-[#1f3d7d]" />
                <h3 className="mt-5 text-[24px] font-bold tracking-[-0.03em]">{c.name}</h3>
                <ul className="mt-4 space-y-3">{c.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-[16px] leading-snug text-[#424245]"><Check size={16} className="mt-1 shrink-0 text-[#168a5b]" strokeWidth={3} />{p}</li>)}</ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="scroll-mt-12 bg-[#f5f5f7] py-28 sm:py-40">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
          <Reveal className="mx-auto max-w-[820px] text-center">
            <h2 className="title-xl text-[40px] sm:text-[72px]">Choose your plan.</h2>
            <p className={cn("mt-6 text-[21px] font-medium leading-snug tracking-[-0.01em] sm:text-[26px]", GREY)}>Billed annually. Every plan includes unlimited tests, a personalized theme, the mobile apps and no ads.</p>
          </Reveal>
          <div className="mt-20"><SitePricing onChoose={start} /></div>
        </div>
      </section>

      {/* quote */}
      <section className="bg-white py-28 sm:py-44">
        <Reveal className="mx-auto max-w-[980px] px-6 text-center">
          <blockquote className="title-xl text-[28px] !leading-[1.25] sm:text-[44px]">“Pesofts is revolutionizing the platform of online exam software and mobile app. Their focused marketing oriented software makes them first choice.”</blockquote>
          <p className="mt-10 text-[17px] font-semibold">Baljit Dhaka</p>
          <p className={cn("text-[15px]", GREY)}>Pinnacle SSC CGL Online Coaching</p>
        </Reveal>
      </section>

      {/* final call */}
      <section id="contact" data-dark className="scroll-mt-12 relative overflow-hidden bg-black py-32 text-center text-white sm:py-48">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(30_166_228/0.35),transparent)] blur-2xl" />
        <Reveal className="relative mx-auto max-w-[900px] px-6">
          <h2 className="display text-[44px] !text-white sm:text-[88px]">Ready when <span className="gradient-text">you are.</span></h2>
          <p className="mx-auto mt-6 max-w-xl text-[20px] font-medium leading-snug text-[#a1a1a6] sm:text-[24px]">Tell us about your institute and how many students you have. We will help you pick the right plan.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <a href={`mailto:${CONTACT.email}`} className="inline-flex h-[52px] items-center gap-2 rounded-full bg-white px-7 text-[16px] font-semibold text-[#1d1d1f]"><Mail size={18} /> {CONTACT.email}</a>
            <a href={`tel:${CONTACT.phones[0].replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1 text-[19px] font-medium text-[#5cc8f5] hover:underline"><Phone size={18} /> {CONTACT.phones[0]} <ArrowRight size={18} /></a>
          </div>
        </Reveal>
      </section>

      <footer className="bg-[#f5f5f7] px-6 py-14 text-[12px] leading-relaxed text-[#6e6e73]">
        <div className="mx-auto max-w-[1024px]">
          <div className="grid gap-10 border-b border-black/10 pb-10 sm:grid-cols-2 lg:grid-cols-4">
            <div><img src={logo} alt="Trigrexam" className="h-6 w-auto" /><p className="mt-4 max-w-[240px]">Online exam software for coaching institutes, colleges, teachers and companies.</p></div>
            <div><p className="mb-3 font-semibold text-[#1d1d1f]">Explore</p><ul className="space-y-2">{NAV.map(([id, l]) => <li key={id}><button onClick={() => go(id)} className="hover:text-[#1d1d1f] hover:underline">{l}</button></li>)}</ul></div>
            <div><p className="mb-3 font-semibold text-[#1d1d1f]">Dashboard</p><ul className="space-y-2"><li><button onClick={start} className="hover:text-[#1d1d1f] hover:underline">Open the dashboard</button></li><li><button onClick={() => nav("/about")} className="hover:text-[#1d1d1f] hover:underline">About this design</button></li></ul></div>
            <div><p className="mb-3 font-semibold text-[#1d1d1f]">Contact</p><ul className="space-y-2"><li className="flex gap-2"><MapPin size={14} className="mt-0.5 shrink-0" />{CONTACT.address}</li><li>{CONTACT.email}</li><li>{CONTACT.phones.join(", ")}</li></ul></div>
          </div>
          <p className="pt-6">Copyright © 2026 Trigrexam Inc. All rights reserved. · Privacy Policy · Returns · Terms and Conditions</p>
          <p className="mt-1">This is a design prototype. All names, numbers and invoices on the dashboard are sample data.</p>
        </div>
      </footer>
    </div>
  );
}

