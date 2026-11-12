import { useState } from "react";
import { Check, Mail, MessageCircle, Palette, Smartphone } from "lucide-react";
import { ACCENTS, useStore, type AccentId } from "../store/store";
import { cn } from "../lib/utils";
import { INSTITUTE } from "../data/seed";
import { CardHead, PageHeader, Segmented, Tabs, Toggle } from "../components/ui";
import { useToast } from "../components/toast";

type T = "look" | "reminders" | "roles";

export function Settings() {
  const [tab, setTab] = useState<T>("look");
  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader icon={Palette} title="Settings" subtitle="Make the portal yours, and set the rules once." />
      <div className="card overflow-hidden">
        <div className="px-3 pt-2 sm:px-5"><Tabs<T> value={tab} onChange={setTab} items={[{ id: "look", label: "Look and feel" }, { id: "reminders", label: "Reminders and rules" }, { id: "roles", label: "Who can do what" }]} /></div>
        {tab === "look" && <Look />}
        {tab === "reminders" && <Reminders />}
        {tab === "roles" && <Roles />}
      </div>
    </div>
  );
}

function Look() {
  const { accent, setAccent, dark, setDark } = useStore();
  const toast = useToast();
  return (
    <div className="space-y-8 p-5 sm:p-7">
      <div>
        <h2 className="text-base font-bold">Brand colour</h2>
        <p className="mt-0.5 text-sm text-muted">Every institute gets its own sub-domain and theme. Pick one and the whole portal changes at once.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {(Object.keys(ACCENTS) as AccentId[]).map((k) => {
            const a = ACCENTS[k];
            const on = accent === k && !dark;
            return (
              <button key={k} onClick={() => { setDark(false); setAccent(k); toast(`${a.label} applied`); }} aria-pressed={on} className={cn("rounded-2xl border p-3 text-left transition-all", on ? "border-navy shadow-[0_0_0_1px_var(--color-navy)]" : "border-line-strong hover:border-faint")}>
                <span className="mb-3 flex h-12 overflow-hidden rounded-xl"><span className="flex-1" style={{ background: a.navy }} /><span className="flex-1" style={{ background: a.sky }} /></span>
                <span className="flex items-center justify-between text-[13px] font-bold text-ink">{a.label}{on && <Check size={15} className="text-navy" />}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line-strong p-5">
        <div><h2 className="text-base font-bold">Dark mode</h2><p className="mt-0.5 text-sm text-muted">Easier on the eyes in the evening. Each person can switch it from the top bar.</p></div>
        <Toggle checked={dark} onChange={setDark} label="Dark mode" />
      </div>
      <div className="rounded-2xl bg-bg p-5">
        <p className="text-sm font-bold text-ink">Your portal address</p>
        <p className="mt-1 text-[15px] text-body"><span className="font-semibold text-navy">{INSTITUTE.toLowerCase().replace(" ", "")}</span>.onlinetestpanel.com</p>
      </div>
    </div>
  );
}

function Reminders() {
  const toast = useToast();
  const [rules, setRules] = useState({ h24: true, h3: true, missing: true, slow: true, parents: false });
  const [ch, setCh] = useState({ app: true, wa: true, sms: false, mail: true });
  const [late, setLate] = useState<"allow" | "penalty" | "block">("allow");
  const R = ({ k, title, body }: { k: keyof typeof rules; title: string; body: string }) => (
    <li className="flex items-center justify-between gap-5 py-4">
      <div><p className="text-[15px] font-semibold text-ink">{title}</p><p className="text-[13px] text-muted">{body}</p></div>
      <Toggle checked={rules[k]} onChange={(v) => { setRules({ ...rules, [k]: v }); toast("Saved"); }} label={title} />
    </li>
  );
  return (
    <div className="space-y-8 p-5 sm:p-7">
      <div>
        <h2 className="text-base font-bold">Automatic reminders</h2>
        <p className="mt-0.5 text-sm text-muted">These apply to every new assignment. Teachers can still change them for one assignment.</p>
        <ul className="mt-2 divide-y divide-line">
          <R k="h24" title="24 hours before the deadline" body="A gentle reminder to students who have not handed in." />
          <R k="h3" title="3 hours before the deadline" body="A second reminder, only for students who have not started." />
          <R k="missing" title="When work is missing" body="Marks it as missing and tells the teacher." />
          <R k="slow" title="When reviews are older than 2 days" body="Nudges the teacher, then tells you." />
          <R k="parents" title="Weekly summary for parents" body="Every Monday at 8 AM, on WhatsApp." />
        </ul>
      </div>
      <div>
        <h2 className="text-base font-bold">Where reminders go</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {([["app", "App", Smartphone], ["wa", "WhatsApp", MessageCircle], ["sms", "SMS", Smartphone], ["mail", "Email", Mail]] as const).map(([k, l, I]) => (
            <button key={k} aria-pressed={ch[k]} onClick={() => setCh({ ...ch, [k]: !ch[k] })} className={cn("flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors", ch[k] ? "border-navy bg-navy-50 text-navy" : "border-line-strong text-body hover:bg-bg")}><I size={17} />{l}{ch[k] && <Check size={15} className="ml-auto" />}</button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-base font-bold">Late work, by default</h2>
        <div className="mt-3"><Segmented value={late} onChange={setLate} label="Late work" options={[{ id: "allow", label: "Accept it" }, { id: "penalty", label: "Take 10% off" }, { id: "block", label: "Close at the deadline" }]} /></div>
      </div>
    </div>
  );
}

function Roles() {
  const rows: [string, boolean, boolean, boolean][] = [
    ["Create and publish assignments", true, true, false],
    ["Review and mark work", true, true, false],
    ["Give students more time", true, true, false],
    ["See every student and batch", true, false, false],
    ["See reports", true, true, false],
    ["Hand in work and see own marks", false, false, true],
    ["Change settings and the portal theme", true, false, false],
  ];
  return (
    <div className="p-5 sm:p-7">
      <CardHead title="Who can do what" hint="Three simple roles. Nothing to configure." className="!px-0 !pt-0" />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[520px] text-sm">
          <thead><tr className="border-b border-line bg-surface-2 text-left text-xs font-bold uppercase tracking-wide text-muted"><th className="px-4 py-3">Permission</th><th className="px-4 py-3 text-center">Admin</th><th className="px-4 py-3 text-center">Teacher</th><th className="px-4 py-3 text-center">Student</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map(([l, ...v]) => (
              <tr key={l}><td className="px-4 py-3 font-medium text-ink">{l}</td>{v.map((x, i) => <td key={i} className="px-4 py-3 text-center">{x ? <Check size={18} className="mx-auto text-ok" strokeWidth={2.6} /> : <span className="text-faint">—</span>}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
