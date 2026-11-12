import { Building2, Check, Minus, Rocket, Sprout, Users, type LucideIcon } from "lucide-react";
import { INCLUDED, PLANS, rupees, type Plan, type PlanId } from "../data/plans";
import { cn } from "../lib/utils";
import { Button } from "./ui";
import { GlowCard } from "./fx";

const ICON: Record<PlanId, LucideIcon> = { basic: Sprout, pro: Rocket, business: Building2 };

export function PricingCards({ current, onChoose, label }: { current?: PlanId; onChoose: (p: Plan) => void; label?: (p: Plan, isCurrent: boolean) => string }) {
  return (
    <div className="grid items-stretch gap-6 pt-3 lg:grid-cols-3">
      {PLANS.map((p, i) => {
        const featured = p.id === "pro";
        const isCurrent = current === p.id;
        const Icon = ICON[p.id];
        return (
          <GlowCard key={p.id} className={cn("card relative flex flex-col p-7 transition-transform duration-300 hover:-translate-y-1.5", featured && "gborder", isCurrent && !featured && "border-navy")}>
            {featured && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky to-navy px-4 py-1 text-xs font-bold tracking-wide text-white shadow-[0_6px_16px_-6px_var(--color-navy)]">Most popular</span>}
            <div className="flex items-center gap-3.5">
              <span className={cn("inline-flex size-12 items-center justify-center rounded-2xl", featured ? "bg-gradient-to-br from-sky to-navy text-white" : "bg-navy-50 text-navy")}><Icon size={24} strokeWidth={2} /></span>
              <div><h3 className="text-xl font-bold tracking-tight">{p.name}</h3><p className="text-[13px] text-muted">{p.tagline}</p></div>
            </div>

            <p className="mt-7 flex items-baseline gap-2"><span className="text-[46px] font-bold leading-none tracking-tight text-ink tnum">{rupees(p.price)}</span><span className="text-sm font-semibold text-muted">+ GST / year</span></p>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3.5">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-surface text-sky-600"><Users size={18} /></span>
              <p className="text-[15px] text-body"><b className="text-[17px] text-ink tnum">{p.users}</b> premium users</p>
            </div>

            <ul className="mt-6 flex-1 space-y-3.5">
              {INCLUDED.map((t, k) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-body" style={{ animation: "rise 0.5s ease-out both", animationDelay: `${i * 120 + k * 70}ms` }}>
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok"><Check size={13} strokeWidth={3.2} /></span>{t}
                </li>
              ))}
            </ul>

            <Button variant={featured ? "primary" : "secondary"} size="lg" className="mt-8 w-full" disabled={isCurrent} onClick={() => onChoose(p)}>
              {label ? label(p, isCurrent) : isCurrent ? "Your current plan" : `Choose ${p.name}`}
            </Button>
          </GlowCard>
        );
      })}
    </div>
  );
}

export function PlanTable({ current }: { current?: PlanId }) {
  const rows: { label: string; cells: (string | boolean)[] }[] = [
    { label: "Premium users", cells: PLANS.map((p) => String(p.users)) },
    { label: "Tests", cells: ["Unlimited", "Unlimited", "Unlimited"] },
    { label: "Free demo tests (unlimited users)", cells: ["5", "5", "5"] },
    { label: "Personalized theme", cells: [true, true, true] },
    { label: "Android and iOS app", cells: [true, true, true] },
    { label: "No ads", cells: [true, true, true] },
    { label: "Billed", cells: ["Annually", "Annually", "Annually"] },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-muted">What you get</th>
            {PLANS.map((p) => (
              <th key={p.id} className={cn("px-5 py-4 text-center", (current ?? "pro") === p.id && "bg-sky-50/70")}>
                <span className="block text-[15px] font-bold text-ink">{p.name}</span>
                <span className="block text-[13px] font-medium text-muted">{rupees(p.price)} + GST</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="px-5 py-3.5 font-medium text-ink">{r.label}</td>
              {r.cells.map((c, i) => (
                <td key={i} className={cn("px-5 py-3.5 text-center font-semibold text-ink", (current ?? "pro") === PLANS[i].id && "bg-sky-50/70")}>
                  {c === true ? <Check size={18} className="mx-auto text-ok" strokeWidth={2.8} /> : c === false ? <Minus size={18} className="mx-auto text-faint" /> : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
