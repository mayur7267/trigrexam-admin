import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { useMounted } from "../lib/hooks";

const uid = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, "");

/** Catmull-Rom spline turned into cubic Beziers, so lines feel smooth instead of jagged. */
function smooth(pts: [number, number][], lo: number, hi: number) {
  if (pts.length < 2) return "";
  const cl = (n: number) => Math.min(hi, Math.max(lo, n));
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.19;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = cl(p1[1] + (p2[1] - p0[1]) * t);
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = cl(p2[1] - (p3[1] - p1[1]) * t);
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth || 320);
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Sparkline({ data, color = "var(--color-sky)", width = 92, height = 36 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const id = uid(useId());
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts: [number, number][] = data.map((v, i) => [(i / (data.length - 1)) * (width - 8) + 4, height - 6 - ((v - min) / span) * (height - 12)]);
  const line = smooth(pts, 2, height - 2);
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${last[0]},${height} L${pts[0][0]},${height} Z`} fill={`url(#${id})`} className="fadein" />
      <path d={line} pathLength={1} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" className="draw" />
      <circle cx={last[0]} cy={last[1]} r={3.2} fill={color} stroke="var(--color-surface)" strokeWidth={1.8} />
    </svg>
  );
}

export interface Series { name: string; color: string; data: number[] }

/** Smooth gradient area chart with a hover crosshair and tooltip. */
export function AreaChart({ series, labels, height = 220, unit = "", min, max }: { series: Series[]; labels: string[]; height?: number; unit?: string; min?: number; max?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const base = uid(useId());
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.data);
  const lo = min ?? Math.max(0, Math.floor(Math.min(...all) / 10) * 10 - 10);
  let hi: number;
  let ticks: number[];
  if (max !== undefined) {
    hi = max;
    ticks = [0, 1, 2, 3].map((k) => Math.round(lo + ((hi - lo) * k) / 3));
  } else {
    const raw = Math.max(1, (Math.max(...all) * 1.04 - lo) / 3);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const stepSize = [1, 2, 2.5, 4, 5, 10].map((m) => m * mag).find((v) => v >= raw) ?? raw;
    hi = lo + stepSize * 3;
    ticks = [0, 1, 2, 3].map((k) => lo + stepSize * k);
  }
  const pL = 38, pR = 14, pT = 14, pB = 30;
  const iw = w - pL - pR;
  const ih = height - pT - pB;
  const n = labels.length;
  const x = (i: number) => pL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pT + (1 - (v - lo) / (hi - lo)) * ih;
  const labelStep = Math.ceil(n / Math.max(2, Math.floor(iw / 58)));

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const box = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const i = Math.round(((cx - box.left) / box.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div ref={ref} className="relative w-full min-w-0 select-none">
      <svg width={w} height={height} className="block max-w-full overflow-visible" role="img" aria-label="Chart">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.name} id={`${base}g${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.26" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pL} x2={w - pR} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray="3 5" />
            <text x={pL - 10} y={y(t) + 4} textAnchor="end" fontSize="11.5" fill="var(--color-faint)">{t}{unit}</text>
          </g>
        ))}
        {series.map((s, i) => {
          const pts = s.data.map((v, k) => [x(k), y(v)] as [number, number]);
          const line = smooth(pts, pT, pT + ih);
          return (
            <g key={s.name}>
              <path d={`${line} L${x(n - 1)},${pT + ih} L${x(0)},${pT + ih} Z`} fill={`url(#${base}g${i})`} className="fadein" />
              <path d={line} pathLength={1} fill="none" stroke={s.color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="draw" />
            </g>
          );
        })}
        {labels.map((l, i) => (i % labelStep === 0 || i === n - 1) && (i % labelStep === 0 || n - 1 - i >= labelStep / 2) ? (
          <text key={l + i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11.5" fill="var(--color-faint)">{l}</text>
        ) : null)}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pT} y2={pT + ih} stroke="var(--color-line-strong)" />
            {series.map((s) => <circle key={s.name} cx={x(hover)} cy={y(s.data[hover])} r={5} fill={s.color} stroke="var(--color-surface)" strokeWidth={2.4} />)}
          </g>
        )}
        <rect x={pL} y={pT} width={iw} height={ih} fill="transparent" onMouseMove={onMove} onTouchMove={onMove} onMouseLeave={() => setHover(null)} onTouchEnd={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-[var(--shadow-pop)]"
          style={{ left: Math.min(w - 80, Math.max(80, x(hover))), top: 0 }}
        >
          <p className="mb-1 text-xs font-semibold text-muted">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center gap-2 whitespace-nowrap text-[13px] text-body">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              {series.length > 1 && <span>{s.name}</span>}
              <b className="ml-auto pl-3 text-ink tnum">{s.data[hover]}{unit}</b>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Single-series version, same look. */
export function LineChart({ data, labels, height = 200, color = "var(--color-sky)", min, max, unit = "" }: { data: number[]; labels: string[]; height?: number; color?: string; min?: number; max?: number; unit?: string }) {
  return <AreaChart series={[{ name: "Value", color, data }]} labels={labels} height={height} min={min} max={max} unit={unit} />;
}

export interface ColItem { label: string; value: number; color?: string; stack?: { value: number; color: string }[]; tag?: string }

export function Columns({ items, height = 160, max, highlight }: { items: ColItem[]; height?: number; max?: number; highlight?: number }) {
  const top = max ?? Math.max(...items.map((i) => i.stack ? i.stack.reduce((a, b) => a + b.value, 0) : i.value)) * 1.1;
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {items.map((it, i) => {
          const total = it.stack ? it.stack.reduce((a, b) => a + b.value, 0) : it.value;
          return (
            <div key={it.label} className="group flex h-full flex-1 flex-col justify-end" title={`${it.label}: ${total}`}>
              <span className="mb-1 text-center text-xs font-semibold text-muted tnum">{it.tag ?? total}</span>
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-lg transition-[filter] group-hover:brightness-110" style={{ height: `${(total / top) * 100}%` }}>
                {it.stack ? it.stack.map((s, k) => <span key={k} style={{ height: `${(s.value / total) * 100}%`, background: s.color }} />) : (
                  <span className="h-full" style={{ background: it.color ?? "var(--color-sky)", opacity: highlight === undefined || highlight === i ? 1 : 0.45 }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {items.map((it) => <span key={it.label} className="flex-1 truncate text-center text-xs text-faint">{it.label}</span>)}
      </div>
    </div>
  );
}

export interface BarItem { label: ReactNode; value: number; display?: string; color?: string; sub?: ReactNode }

export function HBars({ items, max = 100, className }: { items: BarItem[]; max?: number; className?: string }) {
  const on = useMounted();
  return (
    <ul className={cn("space-y-3.5", className)}>
      {items.map((it, i) => (
        <li key={i}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-ink">{it.label}</span>
            <span className="shrink-0 font-bold text-ink tnum">{it.display ?? `${it.value}%`}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full transition-[width] duration-[1000ms] ease-out" style={{ width: `${on ? Math.min(100, (it.value / max) * 100) : 0}%`, background: it.color ?? "var(--color-sky)", transitionDelay: `${i * 90}ms` }} />
          </div>
          {it.sub && <div className="mt-1 text-xs text-muted">{it.sub}</div>}
        </li>
      ))}
    </ul>
  );
}

export function Donut({ parts, size = 120, stroke = 14, children }: { parts: { value: number; color: string }[]; size?: number; stroke?: number; children?: ReactNode }) {
  const total = parts.reduce((a, b) => a + b.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        {parts.map((p, i) => {
          const len = (p.value / total) * c;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="butt" strokeDasharray={`${Math.max(0, len - 3)} ${c}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</span>
    </span>
  );
}

/** Rows by columns grid where colour shows how busy each cell is (0 to 1). */
export function Heatmap({ rows, cols, values, unit = "students" }: { rows: string[]; cols: string[]; values: number[][]; unit?: string }) {
  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `34px repeat(${cols.length}, minmax(0, 1fr))` }}>
        <span />
        {cols.map((c) => <span key={c} className="text-center text-[11px] font-semibold text-faint">{c}</span>)}
        {rows.map((r, ri) => (
          <div key={r} className="contents">
            <span className="self-center text-[11px] font-semibold text-faint">{r}</span>
            {values[ri].map((v, ci) => (
              <span
                key={ci}
                title={`${r}, ${cols[ci]}: ${Math.round(v * 100)} ${unit}`}
                className="h-8 rounded-md transition-transform hover:scale-110"
                style={{ background: `color-mix(in srgb, var(--color-sky) ${Math.round(8 + v * 92)}%, var(--color-line))` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[11px] font-semibold text-faint">
        Quiet
        {[0.1, 0.35, 0.6, 0.85, 1].map((v) => <span key={v} className="size-3.5 rounded" style={{ background: `color-mix(in srgb, var(--color-sky) ${Math.round(8 + v * 92)}%, var(--color-line))` }} />)}
        Busy
      </div>
    </div>
  );
}
