import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator, Check, ChevronRight, Globe, Puzzle, BookText, X as XIcon, type LucideIcon } from "lucide-react";
import { cn, initials, SUBJECTS, tintFor } from "../lib/utils";
import type { AssignmentStatus, SubjectId } from "../lib/types";
import { statusLabel, type ShownStatus } from "../lib/selectors";
import { useMounted } from "../lib/hooks";
import { ILLUSTRATIONS, type IllusName } from "./illustrations";

/* ---------- buttons ---------- */
type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "light" | "glass";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "btn-shine bg-navy text-white hover:bg-navy-700 shadow-[0_1px_2px_rgb(16_32_63/0.18)]",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
  soft: "bg-navy-50 text-navy hover:brightness-95",
  ghost: "text-body hover:bg-navy-50 hover:text-navy",
  danger: "bg-bad-soft text-bad hover:brightness-95",
  light: "btn-shine bg-white text-[#173272] hover:bg-white/90 shadow-[0_1px_2px_rgb(0_0_0/0.2)]",
  glass: "border border-white/30 bg-white/10 text-white hover:bg-white/20",
};
const SIZE: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5 rounded-full",
  md: "h-10 px-5 text-sm gap-2 rounded-full",
  lg: "h-[52px] px-7 text-[16px] gap-2 rounded-full",
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

export function Button({ variant = "secondary", size = "md", icon: Icon, iconRight: IconR, className, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-[background,filter,box-shadow,transform] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT[variant], SIZE[size], className,
      )}
    >
      {Icon && <Icon size={size === "sm" ? 15 : 17} strokeWidth={2.2} aria-hidden />}
      {children}
      {IconR && <IconR size={size === "sm" ? 15 : 17} strokeWidth={2.2} aria-hidden />}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, size = 38, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; size?: number }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl text-body transition-colors hover:bg-navy-50 hover:text-navy", className)}
    >
      <Icon size={19} strokeWidth={2} aria-hidden />
    </button>
  );
}

/* ---------- chips ---------- */
export type Tone = "neutral" | "sky" | "ok" | "warn" | "bad" | "violet" | "navy" | "amber";
const TONE: Record<Tone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: "bg-bg text-muted", fg: "", dot: "bg-faint" },
  sky: { bg: "bg-sky-50 text-sky-600", fg: "", dot: "bg-sky" },
  ok: { bg: "bg-ok-soft text-ok", fg: "", dot: "bg-ok" },
  warn: { bg: "bg-warn-soft text-warn", fg: "", dot: "bg-warn-dot" },
  bad: { bg: "bg-bad-soft text-bad", fg: "", dot: "bg-bad" },
  violet: { bg: "bg-violet-soft text-violet", fg: "", dot: "bg-violet" },
  navy: { bg: "bg-navy-50 text-navy", fg: "", dot: "bg-navy" },
  amber: { bg: "bg-amber-soft text-amber", fg: "", dot: "bg-amber" },
};

export function Chip({ tone = "neutral", dot, children, className, title }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold", TONE[tone].bg, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", TONE[tone].dot)} />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<ShownStatus, Tone> = { todo: "neutral", progress: "sky", submitted: "warn", reviewed: "ok", redo: "amber", missing: "bad" };
export function StatusChip({ status, label }: { status: ShownStatus; label?: string }) {
  return <Chip tone={STATUS_TONE[status]} dot>{label ?? statusLabel[status]}</Chip>;
}

const ASG_TONE: Record<AssignmentStatus, { tone: Tone; label: string }> = {
  draft: { tone: "neutral", label: "Draft" },
  scheduled: { tone: "violet", label: "Scheduled" },
  active: { tone: "sky", label: "Active" },
  completed: { tone: "ok", label: "Completed" },
};
export function AssignmentChip({ status }: { status: AssignmentStatus }) {
  const t = ASG_TONE[status];
  return <Chip tone={t.tone} dot>{t.label}</Chip>;
}

export function SubjectDot({ subject, className }: { subject: SubjectId; className?: string }) {
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: SUBJECTS[subject].color }} />;
}

export function SubjectTag({ subject }: { subject: SubjectId }) {
  const s = SUBJECTS[subject];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-body">
      <SubjectDot subject={subject} />
      {s.short}
    </span>
  );
}

const SUBJECT_ICON: Record<SubjectId, LucideIcon> = { quant: Calculator, reasoning: Puzzle, english: BookText, ga: Globe };

/** A coloured icon tile for a subject. Makes lists scannable at a glance. */
export function SubjectTile({ subject, size = 40, className }: { subject: SubjectId; size?: number; className?: string }) {
  const Icon = SUBJECT_ICON[subject];
  const s = SUBJECTS[subject];
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-xl", className)} style={{ width: size, height: size, background: s.soft, color: s.color }}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.1} />
    </span>
  );
}

/* ---------- people ---------- */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const [bg, fg] = tintFor(name);
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold", className)}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size < 28 ? 9 : Math.max(11, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = 28 }: { names: string[]; max?: number; size?: number }) {
  const shown = names.slice(0, max);
  return (
    <span className="inline-flex items-center">
      {shown.map((n, i) => (
        <span key={n + i} style={{ marginLeft: i === 0 ? 0 : -size * 0.18 }}>
          <Avatar name={n} size={size} className="ring-2 ring-surface" />
        </span>
      ))}
      {names.length > max && (
        <span style={{ marginLeft: -size * 0.18, width: size, height: size, fontSize: 11 }} className="inline-flex items-center justify-center rounded-full bg-bg font-bold text-muted ring-2 ring-surface">
          +{names.length - max}
        </span>
      )}
    </span>
  );
}

/* ---------- layout bits ---------- */
export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { to: string; label: string }; icon?: LucideIcon }) {
  return (
    <div className="mb-10 sm:mb-12">
      {back && (
        <Link to={back.to} className="mb-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-sky-600 hover:text-navy">
          <ArrowLeft size={15} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0">
          <h1 className="title-xl text-[34px] sm:text-[48px]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted sm:text-[19px]">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}

export function CardHead({ title, hint, action, className }: { title: ReactNode; hint?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-6 pt-6", className)}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function LinkMore({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-0.5 whitespace-nowrap text-[13px] font-semibold text-sky-600 hover:text-navy">
      {children} <ChevronRight size={15} />
    </Link>
  );
}

export function Empty({ icon: Icon, title, body, action, art }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode; art?: IllusName }) {
  const Art = art ? ILLUSTRATIONS[art] : null;
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Art ? <div className="mb-3"><Art /></div> : (
        <span className="relative mb-5 inline-flex size-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-600">
          <span className="absolute -inset-3 rounded-[34px] border border-sky-100" />
          <span className="absolute -inset-6 rounded-[44px] border border-dashed border-line" />
          <Icon size={28} strokeWidth={1.7} />
        </span>
      )}
      <p className="text-base font-bold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-line-strong bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted">{children}</kbd>;
}

/* ---------- tabs & segmented ---------- */
export function Tabs<T extends string>({ items, value, onChange, className }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("no-scrollbar -mb-px flex gap-1 overflow-x-auto border-b border-line", className)}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-3.5 pb-3 pt-2 text-sm font-semibold transition-colors",
              on ? "text-navy" : "text-muted hover:text-ink",
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn("rounded-full px-2 py-px text-xs font-bold", on ? "bg-navy text-white" : "bg-bg text-muted")}>{it.count}</span>
            )}
            {on && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-full bg-sky" />}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, size = "md", label }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; size?: "sm" | "md"; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-bg p-1">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-lg font-semibold transition-all",
              size === "sm" ? "px-3 py-1 text-[13px]" : "px-4 py-1.5 text-sm",
              on ? "bg-surface text-navy shadow-[0_1px_3px_rgb(16_32_63/0.14)]" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- form controls ---------- */
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      {children(id)}
      {hint && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn("field", className)} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn("field min-h-24 resize-y leading-relaxed", className)} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cn("field appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)}
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b98b0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}>
    {children}
  </select>
);

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-sky" : "bg-line-strong")}
    >
      <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

export function Check2({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={cn("inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors", checked ? "border-navy bg-navy text-white" : "border-line-strong bg-surface hover:border-faint", className)}
    >
      {checked && <Check size={13} strokeWidth={3.2} />}
    </button>
  );
}

/* ---------- progress ---------- */
export function StackBar({ parts, total, height = 8, className }: { parts: { value: number; color: string; label?: string }[]; total: number; height?: number; className?: string }) {
  const on = useMounted();
  return (
    <div className={cn("flex w-full overflow-hidden rounded-full bg-line", className)} style={{ height }} role="img" aria-label={parts.map((p) => `${p.value} ${p.label ?? ""}`).join(", ")}>
      {parts.map((p, i) => (
        <span key={i} title={p.label ? `${p.value} ${p.label}` : undefined} style={{ width: `${on && total ? (p.value / total) * 100 : 0}%`, background: p.color, transitionDelay: `${i * 70}ms` }} className="h-full transition-[width] duration-[900ms] ease-out first:rounded-l-full last:rounded-r-full" />
      ))}
    </div>
  );
}

export function Ring({ value, size = 56, stroke = 6, color = "var(--color-sky)", track = "var(--color-line)", textClass = "text-ink", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; textClass?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const on = useMounted();
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={on ? c * (1 - Math.min(1, value / 100)) : c} className="transition-[stroke-dashoffset] duration-[1100ms] ease-out" />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-[13px] font-bold", textClass)}>{children ?? `${Math.round(value)}%`}</span>
    </span>
  );
}

/* ---------- overlays ---------- */
export function Modal({ open, onClose, children, variant = "center", label }: { open: boolean; onClose: () => void; children: ReactNode; variant?: "center" | "drawer"; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={cn("sheet", variant)}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && <div className="flex max-h-[100dvh] flex-col">{children}</div>}
    </dialog>
  );
}

export function ModalHead({ title, subtitle, onClose }: { title: ReactNode; subtitle?: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
      <div className="min-w-0">
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <IconButton icon={XIcon} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
    </div>
  );
}
export function ModalFoot({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2 px-6 py-4">{children}</div>;
}

export interface MenuItem { label: string; icon?: LucideIcon; onClick: () => void; danger?: boolean }

export function Menu({ trigger, items, align = "right" }: { trigger: (p: { onClick: () => void; "aria-expanded": boolean }) => ReactNode; items: MenuItem[]; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open })}
      {open && (
        <div role="menu" className={cn("absolute top-full z-40 mt-1.5 min-w-52 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-pop)]", align === "right" ? "right-0" : "left-0")}>
          {items.map((it) => (
            <button key={it.label} role="menuitem" onClick={() => { setOpen(false); it.onClick(); }}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors", it.danger ? "text-bad hover:bg-bad-soft" : "text-ink hover:bg-navy-50")}>
              {it.icon && <it.icon size={16} className="text-muted" />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
