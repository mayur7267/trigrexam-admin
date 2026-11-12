import { useState } from "react";
import { ArrowRight, CreditCard, Download, Mail, Phone, Rocket, TriangleAlert } from "lucide-react";
import { useStore } from "../store/store";
import { CONTACT, INVOICES, PLANS, planById, recommend, rupees, type Plan } from "../data/plans";
import { Button, CardHead, Chip, Modal, ModalFoot, ModalHead, PageHeader, Ring } from "../components/ui";
import { Confetti, HeroArt } from "../components/bits";
import { PlanTable, PricingCards } from "../components/pricing";
import { Reveal } from "../components/fx";
import { useToast } from "../components/toast";
import { cn } from "../lib/utils";

const USED = 78;
const RENEWS = "14 Mar 2027";

export function Billing() {
  const st = useStore();
  const toast = useToast();
  const plan = planById(st.plan);
  const next = PLANS.find((p) => p.price > plan.price);
  const pctUsed = Math.round((USED / plan.users) * 100);
  const [need, setNeed] = useState(120);
  const rec = recommend(need);
  const [target, setTarget] = useState<Plan | null>(null);
  const [party, setParty] = useState(0);

  const download = (inv: (typeof INVOICES)[number]) => {
    const text = [
      "SAMPLE INVOICE", "", `Invoice no: ${inv.no}`, `Date: ${inv.date}`, "Billed to: Shikhar Academy", `Plan: ${inv.plan} (annual)`, `Amount: ${rupees(inv.amount)} + GST`, `Status: ${inv.status}`, "", "Trigrexam · info@trigrexam.com",
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `${inv.no}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Downloaded ${inv.no}`);
  };

  const confirm = () => {
    if (!target) return;
    const up = target.price > plan.price;
    st.setPlan(target.id);
    toast(up ? `You are now on ${target.name}. Enjoy the extra room.` : `Switched to ${target.name}`);
    if (up) { setParty((n) => n + 1); setTimeout(() => setParty(0), 3600); }
    setTarget(null);
  };

  return (
    <div className="relative space-y-8">
      {party > 0 && <Confetti key={party} />}
      <PageHeader icon={CreditCard} title="Plan and billing" subtitle="Your plan, what you are using, and what comes next." />

      <section className="hero px-6 py-8 sm:px-10">
        <HeroArt />
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/70">Your plan</p>
            <h2 key={plan.id} className="rise mt-1 text-[38px] font-bold leading-tight tracking-tight sm:text-[44px]">{plan.name}</h2>
            <p className="mt-1.5 text-[16px] text-white/80">{rupees(plan.price)} + GST per year · renews on {RENEWS}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {next && <Button variant="light" size="lg" icon={Rocket} onClick={() => setTarget(next)}>Upgrade to {next.name}</Button>}
              <Button variant="glass" size="lg" icon={Download} onClick={() => download(INVOICES[0])}>Download invoice</Button>
            </div>
          </div>
          <div className="flex items-center gap-5 rounded-2xl border border-white/20 bg-[#0d2250]/40 p-5 backdrop-blur-md">
            <Ring value={pctUsed} size={104} stroke={11} color="#fff" track="rgba(255,255,255,0.22)" textClass="text-white">{pctUsed}%</Ring>
            <div>
              <p className="text-sm font-semibold text-white/70">Premium users</p>
              <p className="text-[28px] font-bold leading-tight tnum">{USED} <span className="text-lg font-semibold text-white/70">of {plan.users}</span></p>
              <p className="text-[13px] text-white/70">{plan.users - USED} places left</p>
            </div>
          </div>
        </div>
      </section>

      {pctUsed >= 70 && next && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-warn-dot/40 bg-warn-soft px-5 py-4">
          <TriangleAlert size={22} className="shrink-0 text-warn" />
          <p className="min-w-0 flex-1 basis-64 text-[15px] text-body"><b className="text-ink">You have used {USED} of {plan.users} premium users.</b> {next.name} lets you add up to {next.users}.</p>
          <Button size="sm" iconRight={ArrowRight} onClick={() => setTarget(next)}>See {next.name}</Button>
        </div>
      )}

      <Reveal>
        <section className="card overflow-hidden">
          <CardHead title="Find the right plan" hint="Drag to the number of premium users you expect." />
          <div className="grid items-center gap-8 px-5 pb-7 pt-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:px-7">
            <div>
              <p className="text-[44px] font-bold leading-none tracking-tight text-ink tnum">{need}<span className="ml-2 text-lg font-semibold text-muted">premium users</span></p>
              <input type="range" min={10} max={300} step={5} value={need} onChange={(e) => setNeed(Number(e.target.value))} className="brand mt-6 w-full" aria-label="Number of premium users" />
              <div className="mt-2 flex justify-between text-xs font-semibold text-faint"><span>10</span><span>50</span><span>100</span><span>250</span><span>300</span></div>
            </div>
            <div key={rec?.id ?? "more"} className="rise rounded-2xl bg-sky-50 p-6">
              {rec ? (
                <>
                  <p className="text-sm font-semibold text-sky-600">We suggest</p>
                  <p className="mt-1 text-[28px] font-bold tracking-tight text-ink">{rec.name}</p>
                  <p className="mt-1 text-[15px] text-body">{rupees(rec.price)} + GST per year · up to {rec.users} users</p>
                  {rec.id === st.plan ? <Chip tone="ok" className="mt-4" dot>You are on this plan</Chip> : <Button variant="primary" className="mt-4" onClick={() => setTarget(rec)}>{rec.price > plan.price ? "Upgrade" : "Switch"} to {rec.name}</Button>}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-sky-600">More than 250?</p>
                  <p className="mt-1 text-[22px] font-bold tracking-tight text-ink">Let us build a plan for you</p>
                  <a href={`mailto:${CONTACT.email}`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white"><Mail size={16} /> {CONTACT.email}</a>
                </>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <div>
          <h2 className="mb-1 text-2xl font-bold tracking-tight">Choose a plan</h2>
          <p className="mb-2 text-muted">Billed annually. Every plan includes unlimited tests and the mobile app.</p>
          <PricingCards current={st.plan} onChoose={setTarget} label={(p, cur) => (cur ? "Your current plan" : p.price > plan.price ? `Upgrade to ${p.name}` : `Switch to ${p.name}`)} />
        </div>
      </Reveal>

      <Reveal>
        <section className="card overflow-hidden"><CardHead title="Compare plans" /><div className="mt-3"><PlanTable current={st.plan} /></div></section>
      </Reveal>

      <Reveal>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section className="card overflow-hidden">
            <CardHead title="Invoices" hint="Sample invoices for this demo" />
            <ul className="mt-3 divide-y divide-line">
              {INVOICES.map((inv) => (
                <li key={inv.no} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1 basis-48"><p className="text-sm font-bold text-ink">{inv.no}</p><p className="text-[13px] text-muted">{inv.date} · {inv.plan}</p></div>
                  <p className="text-sm font-semibold text-ink tnum">{rupees(inv.amount)} <span className="text-muted">+ GST</span></p>
                  <Chip tone="ok" dot>{inv.status}</Chip>
                  <Button size="sm" icon={Download} onClick={() => download(inv)}>Download</Button>
                </li>
              ))}
            </ul>
          </section>
          <section className="card flex flex-col justify-between p-6">
            <div>
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-navy-50 text-navy"><Phone size={21} /></span>
              <h3 className="text-lg font-bold">Questions about billing?</h3>
              <p className="mt-1.5 text-[15px] text-muted">We are happy to help with plans, invoices or a custom quote.</p>
            </div>
            <div className="mt-6 space-y-2.5 text-[15px]">
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 font-semibold text-sky-600 hover:text-navy"><Mail size={17} /> {CONTACT.email}</a>
              {CONTACT.phones.map((ph) => <a key={ph} href={`tel:${ph.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2.5 font-semibold text-sky-600 hover:text-navy"><Phone size={17} /> {ph}</a>)}
            </div>
          </section>
        </div>
      </Reveal>

      <Modal open={!!target} onClose={() => setTarget(null)} label="Change plan">
        {target && (
          <>
            <ModalHead title={target.price > plan.price ? `Upgrade to ${target.name}` : `Switch to ${target.name}`} subtitle="Review the change before you confirm." onClose={() => setTarget(null)} />
            <div className="space-y-4 px-6 py-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-2xl border border-line-strong p-4 text-center"><p className="text-xs font-bold uppercase tracking-wide text-muted">Now</p><p className="mt-1 text-lg font-bold">{plan.name}</p><p className="text-[13px] text-muted">{plan.users} users</p></div>
                <ArrowRight className="text-sky-600" />
                <div className={cn("rounded-2xl border-2 border-navy bg-navy-50 p-4 text-center")}><p className="text-xs font-bold uppercase tracking-wide text-navy">New</p><p className="mt-1 text-lg font-bold">{target.name}</p><p className="text-[13px] text-muted">{target.users} users</p></div>
              </div>
              <p className="rounded-xl bg-bg px-4 py-3 text-[15px] text-body"><b className="text-ink">{rupees(target.price)} + GST</b> per year, billed annually.</p>
            </div>
            <ModalFoot><Button onClick={() => setTarget(null)}>Not now</Button><Button variant="primary" icon={Rocket} onClick={confirm}>Confirm</Button></ModalFoot>
          </>
        )}
      </Modal>
    </div>
  );
}
