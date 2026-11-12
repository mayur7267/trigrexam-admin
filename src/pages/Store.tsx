import { useState } from "react";
import { Briefcase, Check, CircleCheck, CreditCard, Landmark, Layers, Star, Store as StoreIcon, Ticket, TrainFront, GraduationCap, Users, type LucideIcon } from "lucide-react";
import { useStore } from "../store/store";
import { PACKS, type Pack, type PackCategory } from "../data/packs";
import { rupees } from "../data/plans";
import { Button, CardHead, Chip, Modal, ModalFoot, ModalHead, PageHeader, Segmented } from "../components/ui";
import { AreaChart } from "../components/charts";
import { Confetti } from "../components/bits";
import { Reveal } from "../components/fx";
import { useToast } from "../components/toast";
import { cn } from "../lib/utils";

const CAT: Record<PackCategory, { icon: LucideIcon; grad: string }> = {
  SSC: { icon: GraduationCap, grad: "var(--hero)" },
  Banking: { icon: Landmark, grad: "linear-gradient(118deg, #3a2391 0%, #6a55c9 55%, #1ea6e4 150%)" },
  Railway: { icon: TrainFront, grad: "linear-gradient(118deg, #0c5a4a 0%, #23996b 55%, #1ea6e4 160%)" },
  Placement: { icon: Briefcase, grad: "linear-gradient(118deg, #8a3a0c 0%, #d5702a 55%, #f0a500 150%)" },
};
const CATS: ("All" | PackCategory)[] = ["All", "SSC", "Banking", "Railway", "Placement"];
const TOKENS = 120;

export function Store() {
  const st = useStore();
  const toast = useToast();
  const [cat, setCat] = useState<"All" | PackCategory>("All");
  const [free, setFree] = useState<"all" | "free">("all");
  const [target, setTarget] = useState<Pack | null>(null);
  const [how, setHow] = useState<"token" | "pay">("token");
  const [party, setParty] = useState(0);

  const list = PACKS.filter((p) => (cat === "All" || p.category === cat) && (free === "all" || p.price === 0));

  const activate = () => {
    if (!target) return;
    st.activatePack(target.id);
    toast(`${target.title} is now active for your students`);
    setParty((n) => n + 1);
    setTimeout(() => setParty(0), 3600);
    setTarget(null);
  };

  return (
    <div className="relative space-y-8">
      {party > 0 && <Confetti key={party} />}
      <PageHeader icon={StoreIcon} title="Test store" subtitle="Ready-made test packs. Activate one for your students in a few taps." />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all", cat === c ? "border-navy bg-navy text-white shadow-[0_6px_16px_-8px_var(--color-navy)]" : "border-line-strong bg-surface text-body hover:bg-bg")}>{c}</button>
          ))}
        </div>
        <Segmented<"all" | "free"> label="Price" value={free} onChange={setFree} options={[{ id: "all", label: "All packs" }, { id: "free", label: "Free only" }]} />
      </div>

      <div key={cat + free} className="stagger grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const c = CAT[p.category];
          const active = st.packs.includes(p.id);
          return (
            <article key={p.id} className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
              <div className="relative isolate flex h-32 items-end justify-between overflow-hidden px-5 pb-4 text-white" style={{ background: c.grad }}>
                <span aria-hidden className="absolute inset-0 -z-[1] opacity-60" style={{ backgroundImage: "radial-gradient(rgb(255 255 255 / 0.3) 1.2px, transparent 1.4px)", backgroundSize: "18px 18px", WebkitMaskImage: "linear-gradient(120deg, transparent 20%, #000 90%)", maskImage: "linear-gradient(120deg, transparent 20%, #000 90%)" }} />
                <c.icon size={74} strokeWidth={1.2} className="absolute -right-3 -top-2 -z-[1] rotate-[-8deg] text-white/20 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110" />
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{p.category}</span>
                {p.price === 0 && <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold tracking-wide text-ok">FREE</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[17px] font-bold leading-snug tracking-tight">{p.title}</h3>
                <p className="mt-1 text-[13px] text-muted">by {p.seller}</p>
                <p className="mt-4 flex items-center gap-4 text-[13px] font-semibold text-body">
                  <span className="inline-flex items-center gap-1.5"><Layers size={15} className="text-muted" /> {p.tests} tests</span>
                  <span>{p.questions.toLocaleString("en-IN")} questions</span>
                </p>
                <p className="mt-2 flex items-center gap-2 text-[13px] text-muted"><Star size={14} className="fill-warn-dot text-warn-dot" /> <b className="text-ink">{p.rating}</b> · {p.sold.toLocaleString("en-IN")} students</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-xl font-bold text-ink tnum">{p.price === 0 ? "Free" : rupees(p.price)}</p>
                  {active ? (
                    <Chip tone="ok" dot><Check size={13} strokeWidth={3} /> Active</Chip>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => { setTarget(p); setHow(TOKENS > 0 ? "token" : "pay"); }}>Activate</Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Reveal>
        <section className="card overflow-hidden">
          <CardHead title="Sell your own tests" hint="Teachers can publish packs and keep control of their content. Sample numbers below." />
          <div className="grid gap-6 px-5 pb-6 pt-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <AreaChart height={190} labels={["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]} series={[{ name: "Earned (₹)", color: "var(--color-ok)", data: [4200, 5100, 4800, 7300, 8900, 11200] }]} min={0} />
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {[["Packs live", "6", Layers], ["Students bought", "1,284", Users], ["Earned this month", "₹11,200", CreditCard]].map(([l, v, I]) => {
                const Icon = I as LucideIcon;
                return (
                  <div key={l as string} className="flex items-center gap-3 rounded-2xl bg-bg p-4">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-sky-600"><Icon size={19} /></span>
                    <div className="min-w-0"><p className="text-xl font-bold leading-tight text-ink tnum">{v as string}</p><p className="truncate text-xs font-semibold text-muted">{l as string}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </Reveal>

      <Modal open={!!target} onClose={() => setTarget(null)} label="Activate test pack">
        {target && (
          <>
            <ModalHead title="Activate for your students" subtitle={target.title} onClose={() => setTarget(null)} />
            <div className="space-y-3 px-6 py-6">
              {target.price === 0 ? (
                <p className="flex items-center gap-3 rounded-2xl bg-ok-soft px-4 py-4 text-[15px] font-semibold text-ok"><CircleCheck size={20} /> This pack is free. It is ready to activate.</p>
              ) : (
                <>
                  <p className="mb-1 text-sm font-semibold text-ink">How should students get it?</p>
                  {([["token", Ticket, "Use a token", `${TOKENS} tokens left. This uses 1.`], ["pay", CreditCard, `Pay ${rupees(target.price)} + GST`, "Through the payment gateway."]] as const).map(([id, I, t, d]) => (
                    <button key={id} onClick={() => setHow(id)} aria-pressed={how === id} className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all", how === id ? "border-navy bg-navy-50 shadow-[0_0_0_1px_var(--color-navy)]" : "border-line-strong hover:bg-surface-2")}>
                      <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-xl", how === id ? "bg-navy text-white" : "bg-bg text-muted")}><I size={21} /></span>
                      <span><span className="block text-[15px] font-bold text-ink">{t}</span><span className="block text-[13px] text-muted">{d}</span></span>
                    </button>
                  ))}
                </>
              )}
            </div>
            <ModalFoot><Button onClick={() => setTarget(null)}>Cancel</Button><Button variant="primary" onClick={activate}>Activate</Button></ModalFoot>
          </>
        )}
      </Modal>
    </div>
  );
}
