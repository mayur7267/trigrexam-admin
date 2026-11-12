import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlarmClock, ArrowRight, BellRing, Check, ChevronDown, CircleCheck, ClipboardList, FilePlus2, FileUp, Layers, Rocket, SquarePen, Users, Zap, type LucideIcon } from "lucide-react";
import { useStore } from "../store/store";
import { ME_TEACHER } from "../data/seed";
import { QUESTIONS } from "../data/questions";
import type { AssignmentType, LatePolicy, SubjectId } from "../lib/types";
import { DAY, HOUR, SUBJECTS, cn, fmtWhen, lowerDay, plural } from "../lib/utils";
import { typeLabel } from "../lib/selectors";
import { Avatar, AvatarStack, Button, Check2, Chip, Field, Input, Modal, PageHeader, Segmented, Select, SubjectDot, SubjectTile, Textarea, Toggle } from "../components/ui";
import { useToast } from "../components/toast";

const TYPES: { id: AssignmentType; icon: LucideIcon; title: string; body: string }[] = [
  { id: "quiz", icon: Zap, title: "Quiz", body: "Marked for you, instantly" },
  { id: "written", icon: SquarePen, title: "Written answer", body: "Students type, you review" },
  { id: "file", icon: FileUp, title: "File upload", body: "Photos or a PDF of their work" },
  { id: "mixed", icon: Layers, title: "Questions + writing", body: "A short written part too" },
];
const TEACHER_FOR: Record<SubjectId, string> = { quant: "t1", reasoning: "t2", english: "t3", ga: "t4" };
const LATE: { id: LatePolicy; title: string; body: string }[] = [
  { id: "allow", title: "Accept late work", body: "Marked as late, no marks lost" },
  { id: "penalty", title: "Take 10% off", body: "Accepted with a small penalty" },
  { id: "block", title: "Close at the deadline", body: "No hand-ins after it" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toInput = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromInput = (s: string) => new Date(s).getTime();
const atHour = (daysAhead: number, hour: number) => { const d = new Date(); d.setDate(d.getDate() + daysAhead); d.setHours(hour, 0, 0, 0); return d.getTime(); };

export function NewAssignment() {
  const [round, setRound] = useState(0);
  return <Wizard key={round} onAgain={() => setRound((n) => n + 1)} />;
}

function Wizard({ onAgain }: { onAgain: () => void }) {
  const st = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const source = st.assignments.find((a) => a.id === params.get("from"));
  const isCopy = params.get("copy") === "1";
  const isTeacher = st.role === "teacher";

  const [title, setTitle] = useState(source ? (isCopy ? `${source.title} (copy)` : source.title) : "");
  const [subject, setSubject] = useState<SubjectId>(source?.subject ?? "quant");
  const [type, setType] = useState<AssignmentType>(source?.type ?? "quiz");
  const [qids, setQids] = useState<string[]>(source?.questionIds.length ? source.questionIds : QUESTIONS.filter((q) => q.subject === "quant").slice(0, 5).map((q) => q.id));
  const [pickQs, setPickQs] = useState(false);
  const [instructions, setInstructions] = useState(source?.instructions ?? "");
  const [marks, setMarks] = useState(source?.maxMarks ?? 20);
  const [batchIds, setBatchIds] = useState<string[]>(source?.batchIds ?? []);
  const [teacherId, setTeacherId] = useState(isTeacher ? ME_TEACHER : source?.teacherId ?? TEACHER_FOR.quant);
  const [releaseNow, setReleaseNow] = useState(true);
  const [releaseAt, setReleaseAt] = useState(atHour(1, 9));
  const [dueAt, setDueAt] = useState(source && source.dueAt > Date.now() ? source.dueAt : atHour(1, 18));
  const [late, setLate] = useState<LatePolicy>(source?.late ?? "allow");
  const [reminders, setReminders] = useState(true);
  const [more, setMore] = useState(false);
  const [done, setDone] = useState<null | { id: string; title: string; students: number; later: boolean; when: number }>(null);

  const pool = useMemo(() => QUESTIONS.filter((q) => q.subject === subject), [subject]);
  const marksPerQ = 4;
  const effMarks = type === "quiz" ? qids.length * marksPerQ : marks;
  const students = st.batches.filter((b) => batchIds.includes(b.id)).reduce((n, b) => n + b.studentIds.length, 0);
  const names = st.batches.filter((b) => batchIds.includes(b.id)).flatMap((b) => b.studentIds).slice(0, 6).map((id) => st.nameOf(id));
  const start = releaseNow ? Date.now() : releaseAt;
  const teacher = st.teachers.find((t) => t.id === teacherId);

  const pickSubject = (s: SubjectId) => {
    setSubject(s);
    setQids(QUESTIONS.filter((q) => q.subject === s).slice(0, 5).map((q) => q.id));
    if (!isTeacher) setTeacherId(TEACHER_FOR[s]);
  };

  const ok1 = title.trim().length >= 3 && (type !== "quiz" || qids.length > 0);
  const ok2 = batchIds.length > 0;
  const ok3 = dueAt > start;
  const missing = [!ok1 && (title.trim().length < 3 ? "Add a title" : "Pick a question"), !ok2 && "Choose who gets it", !ok3 && "Set a deadline after it opens"].filter(Boolean) as string[];

  const build = () => ({
    title: title.trim() || "Untitled assignment", subject, type, batchIds, teacherId,
    instructions: instructions.trim() || (type === "quiz" ? "Answer every question. You can leave and come back before the deadline." : ""),
    maxMarks: effMarks, releaseAt: start, dueAt, late, reminders, questionIds: type === "quiz" ? qids : [],
  });

  const finish = (publish: boolean) => {
    if (source && !isCopy && source.status === "draft") st.deleteAssignment(source.id);
    const id = st.createAssignment(build(), publish);
    if (publish) setDone({ id, title: build().title, students, later: !releaseNow, when: start });
    else { toast("Saved as a draft"); nav("/assignments?tab=drafts"); }
  };

  const moreSummary = [releaseNow ? "Opens right away" : `Opens ${lowerDay(fmtWhen(releaseAt))}`, LATE.find((l) => l.id === late)!.title, reminders ? "Smart reminders on" : "Reminders off"].join(" · ");

  return (
    <div>
      <PageHeader
        back={{ to: "/assignments", label: "Assignments" }}
        icon={FilePlus2}
        title="New assignment"
        subtitle="Add a title, choose who gets it, and publish. Everything else is already filled in."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {/* 1 */}
          <Block n={1} title="What is it?" done={ok1}>
            <div className="space-y-6">
              <Field label="Title">
                {(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Percentage · Practice Set 8" autoFocus />}
              </Field>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Subject</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SUBJECTS) as SubjectId[]).map((s) => (
                    <button key={s} onClick={() => pickSubject(s)} aria-pressed={subject === s} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors", subject === s ? "border-navy bg-navy-50 text-navy" : "border-line-strong text-body hover:bg-bg")}>
                      <SubjectDot subject={s} /> {SUBJECTS[s].short}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">How will students answer?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TYPES.map((t) => (
                    <button key={t.id} onClick={() => setType(t.id)} aria-pressed={type === t.id} className={cn("flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all", type === t.id ? "border-navy bg-navy-50 shadow-[0_0_0_1px_var(--color-navy)]" : "border-line-strong hover:border-faint hover:bg-surface-2")}>
                      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", type === t.id ? "bg-navy text-white" : "bg-bg text-muted")}><t.icon size={19} /></span>
                      <span><span className="block text-[15px] font-bold text-ink">{t.title}</span><span className="block text-[13px] leading-snug text-muted">{t.body}</span></span>
                    </button>
                  ))}
                </div>
              </div>

              {type === "quiz" ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3">
                    <p className="text-sm text-body"><b className="text-ink">{qids.length} questions</b> picked for you · {qids.length * marksPerQ} marks · marked automatically</p>
                    <button onClick={() => setPickQs(!pickQs)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-sky-600 hover:text-navy">{pickQs ? "Done" : "Change questions"}<ChevronDown size={15} className={cn("transition-transform", pickQs && "rotate-180")} /></button>
                  </div>
                  {pickQs && (
                    <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line-strong">
                      {pool.map((q) => {
                        const on = qids.includes(q.id);
                        return (
                          <li key={q.id}>
                            <button onClick={() => setQids((l) => (on ? l.filter((x) => x !== q.id) : [...l, q.id]))} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors", on ? "bg-sky-50/60" : "hover:bg-surface-2")}>
                              <Check2 checked={on} onChange={() => {}} label={`Use question: ${q.text.slice(0, 40)}`} className="pointer-events-none mt-0.5" />
                              <span className="min-w-0 flex-1 text-sm leading-snug text-ink">{q.text.split("\n")[0]}</span>
                              <Chip>{q.topic}</Chip>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-[1fr_130px]">
                  <Field label="Instructions (optional)">
                    {(id) => <Textarea id={id} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Solve all 10 questions and show every step." rows={3} />}
                  </Field>
                  <Field label="Total marks">
                    {(id) => <Input id={id} type="number" min={1} max={100} value={marks} onChange={(e) => setMarks(Math.max(1, Number(e.target.value) || 1))} />}
                  </Field>
                </div>
              )}
            </div>
          </Block>

          {/* 2 */}
          <Block n={2} title="Who gets it?" done={ok2} aside={<button className="text-[13px] font-semibold text-sky-600 hover:text-navy" onClick={() => setBatchIds(batchIds.length === st.batches.length ? [] : st.batches.map((b) => b.id))}>{batchIds.length === st.batches.length ? "Clear all" : "Select all"}</button>}>
            <div className="grid gap-3 sm:grid-cols-2">
              {st.batches.map((b) => {
                const on = batchIds.includes(b.id);
                return (
                  <button key={b.id} onClick={() => setBatchIds((l) => (on ? l.filter((x) => x !== b.id) : [...l, b.id]))} aria-pressed={on} className={cn("rounded-2xl border p-4 text-left transition-all", on ? "border-navy bg-navy-50 shadow-[0_0_0_1px_var(--color-navy)]" : "border-line-strong hover:border-faint hover:bg-surface-2")}>
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[15px] font-bold text-ink">{b.name}</span>
                      <Check2 checked={on} onChange={() => {}} label={b.name} className="pointer-events-none mt-0.5" />
                    </span>
                    <span className="mt-3 flex items-center justify-between">
                      <AvatarStack names={b.studentIds.slice(0, 5).map((id) => st.nameOf(id))} max={4} size={26} />
                      <span className="text-[13px] font-semibold text-muted tnum">{b.studentIds.length} students</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {type !== "quiz" && !isTeacher && (
              <Field className="mt-5" label="Who reviews the work?" hint="The usual teacher for this subject is already chosen.">
                {(id) => <Select id={id} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>{st.teachers.map((t) => <option key={t.id} value={t.id}>{t.name} · {SUBJECTS[t.subject].short}</option>)}</Select>}
              </Field>
            )}
          </Block>

          {/* 3 */}
          <Block n={3} title="When is it due?" done={ok3}>
            <div className="flex flex-wrap gap-2">
              {[{ l: "Tonight, 9 PM", t: atHour(0, 21) }, { l: "Tomorrow, 6 PM", t: atHour(1, 18) }, { l: "In 3 days", t: atHour(3, 18) }, { l: "Next week", t: atHour(7, 18) }].map((o) => (
                <button key={o.l} onClick={() => setDueAt(o.t)} aria-pressed={Math.abs(dueAt - o.t) < 60_000} className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-colors", Math.abs(dueAt - o.t) < 60_000 ? "border-navy bg-navy-50 text-navy" : "border-line-strong text-body hover:bg-bg")}>{o.l}</button>
              ))}
              <Input type="datetime-local" className="w-auto" value={toInput(dueAt)} onChange={(e) => e.target.value && setDueAt(fromInput(e.target.value))} aria-label="Custom deadline" />
            </div>
            {!ok3 && <p className="mt-2 text-[13px] font-medium text-bad">The deadline needs to be after the time it opens.</p>}

            <button onClick={() => setMore(!more)} aria-expanded={more} className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-line-strong px-4 py-3 text-left transition-colors hover:bg-surface-2">
              <span className="min-w-0"><span className="block text-sm font-bold text-ink">More options</span><span className="block truncate text-[13px] text-muted">{moreSummary}</span></span>
              <ChevronDown size={18} className={cn("shrink-0 text-muted transition-transform", more && "rotate-180")} />
            </button>

            {more && (
              <div className="rise mt-5 space-y-6">
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">When should students see it?</p>
                  <Segmented value={releaseNow ? "now" : "later"} onChange={(v) => setReleaseNow(v === "now")} label="Release" options={[{ id: "now", label: "Right away" }, { id: "later", label: "Choose a time" }]} />
                  {!releaseNow && <Input type="datetime-local" className="mt-3 max-w-xs" value={toInput(releaseAt)} onChange={(e) => e.target.value && setReleaseAt(fromInput(e.target.value))} aria-label="Release time" />}
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">If someone is late</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {LATE.map((l) => (
                      <button key={l.id} onClick={() => setLate(l.id)} aria-pressed={late === l.id} className={cn("rounded-2xl border p-3.5 text-left transition-all", late === l.id ? "border-navy bg-navy-50 shadow-[0_0_0_1px_var(--color-navy)]" : "border-line-strong hover:border-faint hover:bg-surface-2")}>
                        <span className="block text-sm font-bold text-ink">{l.title}</span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{l.body}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-line-strong p-4">
                  <div className="flex gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><BellRing size={20} /></span>
                    <div><p className="text-[15px] font-bold text-ink">Smart reminders</p><p className="mt-0.5 text-[13px] leading-snug text-muted">24 hours and 3 hours before the deadline, on the app and WhatsApp.</p></div>
                  </div>
                  <Toggle checked={reminders} onChange={setReminders} label="Smart reminders" />
                </div>
              </div>
            )}
          </Block>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[92px]">
          <section>
            <p className="eyebrow mb-2.5 px-1">What students will see</p>
            <div className="card overflow-hidden shadow-[var(--shadow-lift)]">
              <div className="h-1.5" style={{ background: SUBJECTS[subject].color }} />
              <div className="p-5">
                <div className="mb-3.5 flex items-center justify-between">
                  <SubjectTile subject={subject} size={36} />
                  <Chip tone="sky" dot>To do</Chip>
                </div>
                <p className={cn("text-[17px] font-bold leading-snug", title.trim() ? "text-ink" : "text-faint")}>{title.trim() || "Your title will appear here"}</p>
                <p className="mt-1.5 text-[13px] text-muted">{typeLabel[type]} · {effMarks} marks{type === "quiz" ? ` · ${qids.length} questions` : ""}</p>
                <div className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-body"><AlarmClock size={15} className="text-muted" /> Due {fmtWhen(dueAt)}</div>
                <div className="mt-5 flex h-11 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">Start</div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <dl className="space-y-3 text-sm">
              <Row icon={Users} label="Goes to">{students ? <span className="flex items-center gap-2"><AvatarStack names={names} max={3} size={22} /> <b className="text-ink">{plural(students, "student")}</b></span> : <span className="text-faint">Not chosen yet</span>}</Row>
              <Row icon={ClipboardList} label="Marked by">{type === "quiz" ? <b className="text-ink">Automatically</b> : teacher ? <span className="flex items-center gap-2"><Avatar name={teacher.name} size={22} /><b className="text-ink">{teacher.name}</b></span> : null}</Row>
              <Row icon={BellRing} label="Reminders"><b className={reminders ? "text-ok" : "text-muted"}>{reminders ? "On" : "Off"}</b></Row>
            </dl>
            {ok3 && dueAt - start > 0 && <p className="mt-4 rounded-xl bg-bg px-3 py-2 text-xs text-muted">Students get about {Math.max(1, Math.round((dueAt - start) / HOUR))} hours{(dueAt - start) > 2 * DAY ? ` (${Math.round((dueAt - start) / DAY)} days)` : ""} to finish.</p>}
            <Button variant="primary" size="lg" className="mt-5 w-full" icon={Rocket} disabled={missing.length > 0} onClick={() => finish(true)}>{releaseNow ? "Publish now" : "Schedule it"}</Button>
            {missing.length > 0 && <p className="mt-2.5 text-center text-[13px] text-muted">{missing.join(" · ")}</p>}
            <button onClick={() => finish(false)} disabled={title.trim().length < 1} className="mt-3 block w-full text-center text-[13px] font-semibold text-muted hover:text-navy disabled:opacity-40">Save as draft</button>
          </section>
        </aside>
      </div>

      <Modal open={!!done} onClose={() => done && nav(`/assignments/${done.id}`)} label="Assignment published">
        {done && (
          <div className="px-7 pb-7 pt-9 text-center">
            <svg viewBox="0 0 64 64" className="mx-auto size-24" aria-hidden>
              <circle cx="32" cy="32" r="28" fill="var(--color-ok-soft)" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-ok)" strokeWidth="3.5" strokeLinecap="round" pathLength={1} className="draw" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
              <path d="M20 33l8 8 16-17" fill="none" stroke="var(--color-ok)" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="draw" style={{ animationDelay: "0.55s" }} />
            </svg>
            <h2 className="mt-5 text-[26px] font-bold tracking-tight">{done.later ? "Scheduled" : "Published"}</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-muted">{done.title}</p>
            <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left">
              {[
                done.later ? `${plural(done.students, "student")} will see it ${lowerDay(fmtWhen(done.when))}` : `${plural(done.students, "student")} can see it right now`,
                reminders ? "Reminders go out 24 hours and 3 hours before the deadline" : "Reminders are off for this assignment",
                type === "quiz" ? "Marked automatically as students finish" : `${teacher?.name ?? "The reviewer"} will review the work`,
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-body"><CircleCheck size={19} className="mt-0.5 shrink-0 text-ok" />{t}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => nav(`/assignments/${done.id}`)}>See progress</Button>
              <Button size="lg" onClick={() => { setDone(null); onAgain(); }}>Create another</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Block({ n, title, done, aside, children }: { n: number; title: string; done: boolean; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-3.5 border-b border-line px-5 py-4 sm:px-7">
        <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors", done ? "bg-ok text-white" : "bg-navy text-white")}>{done ? <Check size={16} strokeWidth={3.2} /> : n}</span>
        <h2 className="flex-1 text-[19px] font-bold tracking-tight">{title}</h2>
        {aside}
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted"><Icon size={15} /> {label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
