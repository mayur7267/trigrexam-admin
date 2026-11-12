import { useNavigate } from "react-router-dom";
import { ArrowRight, BellRing, ClipboardPen, Eye, Hourglass, MonitorSmartphone, Palette, Rocket, Send, ShieldCheck, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { useStore } from "../store/store";
import type { Role } from "../lib/types";
import { Button } from "../components/ui";

const IDEAS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Sparkles, title: "A home that tells you what to do", body: "No wall of charts. The first thing an admin sees is a short list of what needs a person, each with one button." },
  { icon: Rocket, title: "Create in three steps", body: "What is it, who gets it, when is it due. Sensible defaults, and a live preview of exactly what students will see." },
  { icon: BellRing, title: "Reminders that run themselves", body: "Set it once. Students are reminded 24 and 3 hours before, on the app and WhatsApp. Nobody chases anyone." },
  { icon: Zap, title: "Quizzes mark themselves", body: "Questions come from the question bank and results appear instantly. Teachers only review work that needs a human." },
  { icon: Eye, title: "A calm place to review", body: "One student at a time, marks and feedback side by side, one-tap feedback phrases, and a shortcut to save and move on." },
  { icon: Hourglass, title: "More time in one tap", body: "Students ask with a reason. The teacher says yes from the notification. No more lost messages in chats." },
  { icon: ShieldCheck, title: "The same words everywhere", body: "To do, In progress, Waiting for review, Reviewed, Redo, Missing. Same colours for admin, teacher and student." },
  { icon: MonitorSmartphone, title: "Made for phones too", body: "Most students use a phone. Every screen reflows properly, and the student flow was designed phone-first." },
  { icon: Palette, title: "Your brand, instantly", body: "Pick a colour and the portal changes everywhere. Light and dark modes are built in." },
];

const STEPS: { role: Role; to: string; title: string; body: string; cta: string }[] = [
  { role: "admin", to: "/assignments/new", title: "An admin creates an assignment", body: "Three short steps. Choose Quiz, pick a batch, publish.", cta: "Open as Admin" },
  { role: "student", to: "/", title: "A student receives it and hands it in", body: "It is right there on their home screen. Start it, answer, done.", cta: "Open as Student" },
  { role: "teacher", to: "/", title: "The teacher reviews what needs a human", body: "Written and file work lands in a calm review screen with marks and feedback.", cta: "Open as Teacher" },
  { role: "admin", to: "/assignments", title: "The admin watches it come together", body: "Progress, late work and reminders update on their own. Nothing to chase.", cta: "Back to Admin" },
];

export function About() {
  const { setRole } = useStore();
  const nav = useNavigate();
  const go = (r: Role, to: string) => { setRole(r); nav(to); };
  const phone = `${window.location.href.split("#")[0]}#/?embed=student`;

  return (
    <div className="mx-auto max-w-[1080px] space-y-10">
      <section className="card overflow-hidden">
        <div className="grid items-center lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-7 sm:p-10">
            <p className="eyebrow text-sky-600">Trigrexam Admin · design notes</p>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.15] sm:text-[42px]">Assignments that take care of themselves.</h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
              This is a redesign of the admin dashboard with one idea at its centre: <b className="text-ink">the person doing the work should never have to chase anyone</b>. Teachers create in minutes, students always know what is next, and admins only see what needs them.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => go("admin", "/")}>Explore the dashboard</Button>
              <Button size="lg" onClick={() => document.getElementById("tour")?.scrollIntoView({ behavior: "smooth" })}>Take the 60-second tour</Button>
              <Button size="lg" variant="ghost" onClick={() => nav("/welcome")}>See the product website</Button>
            </div>
          </div>
          <div className="hidden justify-center self-stretch bg-sky-50/70 px-6 py-8 lg:flex">
            <div className="rounded-[38px] border-[9px] border-ink bg-ink shadow-[var(--shadow-pop)]" style={{ width: 312 + 18, height: 624 + 18 }}>
              <div className="overflow-hidden rounded-[28px] bg-bg" style={{ width: 312, height: 624 }}>
                <iframe title="Student app on a phone" src={phone} style={{ width: 390, height: 780, border: 0, transform: "scale(0.8)", transformOrigin: "top left" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tour" className="scroll-mt-24">
        <h2 className="text-2xl font-bold">See the whole flow in a minute</h2>
        <p className="mt-1 text-muted">One assignment, followed through three roles. Each button switches the role for you.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card flex flex-col p-5">
              <span className="mb-4 inline-flex size-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
              <h3 className="text-[15px] font-bold leading-snug">{s.title}</h3>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{s.body}</p>
              <Button size="sm" variant="soft" className="mt-5 self-start" iconRight={ArrowRight} onClick={() => go(s.role, s.to)}>{s.cta}</Button>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold">What changed, and why</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="card p-6">
            <p className="eyebrow mb-4">What we set out to fix</p>
            <ul className="space-y-3 text-[15px] text-body">
              {["Setting up the same assignment again for every batch", "Calling and messaging students to remind them", "Marking that waits for days, unseen", "Students unsure what is due and when", "Extension requests lost in chat groups", "Admins finding problems only when it is too late"].map((t) => <li key={t} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-bad" />{t}</li>)}
            </ul>
          </div>
          <div className="card border-ok/30 p-6">
            <p className="eyebrow mb-4 text-ok">What you get now</p>
            <ul className="space-y-3 text-[15px] text-body">
              {["Three steps to publish, with defaults filled in", "Automatic reminders on the app and WhatsApp", "A review queue with oldest first, and nudges when it slips", "A clear to-do list for every student, phone-first", "Ask for more time and get a yes in one tap", "A home screen that lists only what needs a person"].map((t) => <li key={t} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-ok" />{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Nine small ideas</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {IDEAS.map((x) => (
            <div key={x.title} className="card p-5">
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><x.icon size={22} /></span>
              <h3 className="text-[15px] font-bold">{x.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{x.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-navy-50 text-navy"><ClipboardPen size={24} /></span>
          <p className="max-w-xl text-sm leading-relaxed text-muted">Everything you see uses sample data from a fictional institute. Press <kbd className="rounded border border-line-strong bg-surface-2 px-1.5 text-xs font-semibold">⌘K</kbd> anywhere to search, and use <b className="text-ink">Preview as</b> in the top bar to switch between admin, teacher and student.</p>
        </div>
        <Button variant="primary" icon={Send} onClick={() => go("admin", "/assignments/new")}>Create an assignment</Button>
      </section>
    </div>
  );
}
