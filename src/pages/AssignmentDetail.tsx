import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BellRing, CalendarClock, Check, Copy, Ellipsis, Eye, FileText, Hourglass, MessageSquareText, Send, TimerReset } from "lucide-react";
import { useStore } from "../store/store";
import { dueFor, shownStatus, tally, typeLabel, type ShownStatus } from "../lib/selectors";
import { DAY, HOUR, SUBJECTS, cn, fmtAgo, fmtLeft, fmtWhen, lowerDay, plural } from "../lib/utils";
import { AssignmentChip, Avatar, Button, CardHead, Check2, Chip, Empty, IconButton, Menu, Modal, ModalFoot, ModalHead, PageHeader, Ring, StatusChip, SubjectTag, Toggle } from "../components/ui";
import { STATUS_COLOR } from "../components/bits";
import { Columns } from "../components/charts";
import { useToast } from "../components/toast";

const ORDER: ShownStatus[] = ["missing", "submitted", "redo", "progress", "todo", "reviewed"];
const FILTERS: { id: ShownStatus | "all"; label: string; color?: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "missing", label: "Missing", color: STATUS_COLOR.missing },
  { id: "submitted", label: "Waiting for review", color: STATUS_COLOR.waiting },
  { id: "redo", label: "Redo requested", color: STATUS_COLOR.redo },
  { id: "progress", label: "In progress", color: STATUS_COLOR.progress },
  { id: "todo", label: "To do", color: "var(--color-faint)" },
  { id: "reviewed", label: "Reviewed", color: STATUS_COLOR.reviewed },
];

export function AssignmentDetail() {
  const { id } = useParams();
  const st = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState<ShownStatus | "all">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [extend, setExtend] = useState(false);
  const [remindOn, setRemindOn] = useState(true);
  const [limit, setLimit] = useState(15);

  const a = st.assignments.find((x) => x.id === id);
  const subs = st.subsOf(id ?? "");
  const now = Date.now();
  const t = a ? tally(a, subs, now) : undefined;

  const rows = useMemo(() => {
    if (!a) return [];
    return subs
      .map((s) => ({ s, shown: shownStatus(a, s, now), stu: st.students.find((x) => x.id === s.studentId)! }))
      .filter((r) => filter === "all" || r.shown === filter)
      .sort((x, y) => ORDER.indexOf(x.shown) - ORDER.indexOf(y.shown) || x.stu.name.localeCompare(y.stu.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, subs, filter, st.students]);

  if (!a || !t) return <Empty icon={FileText} title="We could not find that assignment" action={<Button onClick={() => nav("/assignments")}>Back to assignments</Button>} />;

  const teacher = st.teachers.find((x) => x.id === a.teacherId)!;
  const reviewable = a.type !== "quiz";
  const pending = subs.filter((s) => s.status === "not_started" || s.status === "in_progress");
  const scores = subs.filter((s) => s.score !== undefined).map((s) => s.score!);
  const bins = Array.from({ length: 5 }, (_, i) => ({ label: `${Math.round((i * a.maxMarks) / 5)}–${Math.round(((i + 1) * a.maxMarks) / 5)}`, value: 0 }));
  scores.forEach((sc) => { bins[Math.min(4, Math.floor((sc / a.maxMarks) * 5))].value++; });
  const avg = scores.length ? Math.round((scores.reduce((n, x) => n + x, 0) / scores.length) * 10) / 10 : 0;

  const shownRows = rows.slice(0, limit);
  const allPicked = shownRows.length > 0 && shownRows.every((r) => picked.has(r.s.studentId));
  const toggleAll = () => setPicked(allPicked ? new Set() : new Set(shownRows.map((r) => r.s.studentId)));
  const toggleOne = (sid: string) => setPicked((p) => { const n = new Set(p); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; });

  const remindSome = (ids?: string[]) => {
    const n = st.remind(a.id, ids);
    toast(n ? `Reminder sent to ${plural(n, "student")} on the app and WhatsApp` : "Everyone chosen has already handed in");
    setPicked(new Set());
  };

  const waitingReview = t.submitted;
  const steps = [
    { at: a.dueAt - 24 * HOUR, title: "24 hours before", note: "Gentle reminder to everyone who has not handed in" },
    { at: a.dueAt - 3 * HOUR, title: "3 hours before", note: "Second reminder, only to students who have not started" },
    { at: a.dueAt, title: "At the deadline", note: "Marks missing work and tells the teacher" },
    { at: a.dueAt + DAY, title: "A day late", note: "Lets the admin know who is still missing" },
  ];
  const nextIdx = steps.findIndex((s) => s.at > now);

  return (
    <div>
      <PageHeader
        back={{ to: "/assignments", label: "Assignments" }}
        title={a.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <AssignmentChip status={a.status} />
            <SubjectTag subject={a.subject} />
            <span>{typeLabel[a.type]}{a.type === "quiz" ? " · marked automatically" : ""}</span>
            <span>{a.batchIds.map((b) => st.batches.find((x) => x.id === b)?.short).join(", ")}</span>
          </span>
        }
        actions={
          <>
            {waitingReview > 0 && reviewable && <Button variant="primary" icon={Eye} onClick={() => nav(`/review/${a.id}`)}>Review {waitingReview} waiting</Button>}
            {pending.length > 0 && a.status === "active" && (
              <Button variant={waitingReview > 0 && reviewable ? "secondary" : "primary"} icon={Send} onClick={() => remindSome()}>
                Remind {pending.length} students
              </Button>
            )}
            <Menu
              trigger={(p) => <IconButton {...p} icon={Ellipsis} label="More actions" className="border border-line-strong bg-surface" />}
              items={[
                { label: "Change the deadline", icon: TimerReset, onClick: () => setExtend(true) },
                { label: "Duplicate this assignment", icon: Copy, onClick: () => nav(`/assignments/new?from=${a.id}&copy=1`) },
              ]}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <section className="card grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Deadline">
              <p className={cn("text-[15px] font-semibold", a.dueAt < now ? "text-bad" : "text-ink")}>{fmtWhen(a.dueAt)}</p>
              <p className="mt-0.5 text-[13px] text-muted">{fmtLeft(a.dueAt)} · <button onClick={() => setExtend(true)} className="font-semibold text-sky-600 hover:text-navy">Change</button></p>
            </Fact>
            <Fact label="Reviewer"><span className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Avatar name={teacher.name} size={26} />{teacher.name}</span></Fact>
            <Fact label="Total marks"><span className="text-[15px] font-semibold text-ink">{a.maxMarks}</span></Fact>
            <Fact label="Late hand-ins"><span className="text-[15px] font-semibold text-ink">{a.late === "allow" ? "Accepted" : a.late === "penalty" ? "10% marks off" : "Not accepted"}</span></Fact>
          </section>

          <section className="card overflow-hidden">
            <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line p-3 sm:px-5">
              {FILTERS.map((f) => {
                const count = f.id === "all" ? t.total : t[f.id];
                const on = filter === f.id;
                if (f.id !== "all" && count === 0) return null;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setFilter(f.id); setPicked(new Set()); setLimit(15); }}
                    className={cn("flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors", on ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-body hover:bg-bg")}
                  >
                    {f.color && <span className="size-2 rounded-full" style={{ background: on ? "#fff" : f.color }} />}
                    {f.label}
                    <span className={cn("tnum", on ? "text-white/80" : "text-muted")}>{count}</span>
                  </button>
                );
              })}
            </div>

            {picked.size > 0 && (
              <div className="rise flex flex-wrap items-center gap-3 border-b border-line bg-navy-50 px-5 py-2.5">
                <span className="text-sm font-bold text-navy">{picked.size} selected</span>
                <Button size="sm" variant="primary" icon={Send} onClick={() => remindSome([...picked])}>Remind</Button>
                <Button size="sm" icon={Hourglass} onClick={() => { st.grantExtension(a.id, [...picked], Math.max(a.dueAt, now) + DAY); toast(`${plural(picked.size, "student")} got 24 more hours`); setPicked(new Set()); }}>Give 24 more hours</Button>
                <button className="ml-auto text-[13px] font-semibold text-muted hover:text-ink" onClick={() => setPicked(new Set())}>Clear</button>
              </div>
            )}

            {rows.length === 0 ? (
              <Empty icon={Check} title="No one here" body="Try a different filter." />
            ) : (
              <>
                <div className="hidden grid-cols-[28px_minmax(0,1.5fr)_172px_minmax(0,1fr)_84px_96px] items-center gap-4 border-b border-line bg-surface-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-muted md:grid">
                  <Check2 checked={allPicked} onChange={toggleAll} label="Select everyone shown" />
                  <span>Student</span><span>Status</span><span>Handed in</span><span>Marks</span><span />
                </div>
                <ul className="divide-y divide-line">
                  {shownRows.map(({ s, shown, stu }) => {
                    const late = !!s.submittedAt && s.submittedAt > dueFor(a, s);
                    return (
                      <li key={s.id} className="row-hover grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-5 md:grid-cols-[28px_minmax(0,1.5fr)_172px_minmax(0,1fr)_84px_96px]">
                        <Check2 checked={picked.has(s.studentId)} onChange={() => toggleOne(s.studentId)} label={`Select ${stu.name}`} />
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={stu.name} size={34} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">{stu.name}</p>
                            <p className="truncate text-xs text-muted">{st.batches.find((b) => b.id === stu.batchId)?.short} · {stu.roll}</p>
                          </div>
                        </div>
                        <div className="col-start-3 row-start-1 flex items-center justify-end gap-2 md:col-start-auto md:row-start-auto md:justify-start">
                          <StatusChip status={shown} />
                          {s.extensionUntil && <span title="Has extra time"><Hourglass size={14} className="text-violet" /></span>}
                        </div>
                        <div className="col-start-2 row-start-2 text-[13px] text-muted md:col-start-auto md:row-start-auto">
                          {s.submittedAt ? <span><span className="block">{fmtWhen(s.submittedAt)}</span>{late && <span className="block text-xs font-semibold text-warn">Handed in late</span>}</span> : <span className="text-faint">{s.startedAt ? `Started ${fmtAgo(s.startedAt)}` : "Not started"}</span>}
                        </div>
                        <div className="hidden text-sm font-semibold text-ink tnum md:block">
                          {s.score !== undefined ? <>{s.score}<span className="font-medium text-muted">/{a.maxMarks}</span></> : <span className="text-faint">—</span>}
                          {s.autoGraded && <span className="ml-1 text-[11px] font-semibold text-sky-600">auto</span>}
                        </div>
                        <div className="col-start-3 row-start-2 flex justify-end md:col-start-auto md:row-start-auto">
                          {shown === "submitted" ? (
                            <Button size="sm" variant="primary" onClick={() => nav(`/review/${a.id}?s=${s.studentId}`)}>Review</Button>
                          ) : shown === "reviewed" ? (
                            <Button size="sm" variant="ghost" onClick={() => nav(`/review/${a.id}?s=${s.studentId}`)}>View</Button>
                          ) : (
                            <Button size="sm" icon={BellRing} onClick={() => remindSome([s.studentId])}>Remind</Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {rows.length > limit && (
                  <div className="border-t border-line p-4 text-center">
                    <Button onClick={() => setLimit(limit + 20)}>Show {Math.min(20, rows.length - limit)} more · {rows.length - limit} not shown</Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card">
            <CardHead
              title="Automatic reminders"
              hint="Set once. No one has to chase students."
              action={<Toggle checked={remindOn} onChange={(v) => { setRemindOn(v); toast(v ? "Automatic reminders are on" : "Automatic reminders are off"); }} label="Automatic reminders" />}
            />
            <ol className={cn("px-5 pb-5 pt-4", !remindOn && "opacity-45")}>
              {steps.map((s, i) => {
                const done = s.at <= now;
                const next = i === nextIdx;
                return (
                  <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < steps.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-18px)] w-px bg-line-strong" />}
                    <span className={cn("relative z-10 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2", done ? "border-ok bg-ok text-white" : next ? "border-sky bg-sky-50" : "border-line-strong bg-surface")}>
                      {done && <Check size={13} strokeWidth={3.4} />}
                      {next && <span className="size-2 rounded-full bg-sky" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{s.title} {next && <Chip tone="sky" className="ml-1">Next</Chip>}</p>
                      <p className="text-[13px] text-muted">{s.note}</p>
                      <p className="mt-0.5 text-xs text-faint">{done ? "Sent" : `Goes out ${lowerDay(fmtWhen(s.at))}`}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-2 px-5 py-3 text-xs font-semibold text-muted">
              Sent on <Chip tone="navy">App</Chip><Chip tone="ok">WhatsApp</Chip><Chip tone="neutral">Email</Chip>
            </div>
          </section>

          <section className="card">
            <CardHead title="Review progress" hint={reviewable ? `Reviewer: ${teacher.name}` : "Marked automatically"} />
            <div className="flex items-center gap-4 px-5 pb-5 pt-4">
              <Ring value={t.handedIn ? (t.reviewed / t.handedIn) * 100 : 0} size={72} stroke={8} color="var(--color-ok)" />
              <div>
                <p className="text-[15px] font-bold text-ink tnum">{t.reviewed} of {t.handedIn} reviewed</p>
                <p className="mt-0.5 text-[13px] text-muted">{waitingReview > 0 ? `${waitingReview} waiting for ${teacher.name.split(" ")[0]}` : "Nothing is waiting"}</p>
              </div>
            </div>
          </section>

          {scores.length > 2 && (
            <section className="card">
              <CardHead title="How the class scored" hint={`Average ${avg} out of ${a.maxMarks}`} />
              <div className="px-5 pb-5 pt-4"><Columns items={bins} height={110} /></div>
            </section>
          )}

          {a.instructions && (
            <section className="card p-5">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink"><MessageSquareText size={16} className="text-muted" /> What students see</p>
              <p className="text-[13px] leading-relaxed text-muted">{a.instructions}</p>
              <p className="mt-3 text-xs text-faint">Subject: {SUBJECTS[a.subject].name}</p>
            </section>
          )}
        </aside>
      </div>

      <ExtendDialog open={extend} onClose={() => setExtend(false)} aId={a.id} onlyPendingCount={pending.length} />
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function ExtendDialog({ open, onClose, aId, onlyPendingCount }: { open: boolean; onClose: () => void; aId: string; onlyPendingCount: number }) {
  const st = useStore();
  const toast = useToast();
  const a = st.assignments.find((x) => x.id === aId)!;
  const [by, setBy] = useState(DAY);
  const [scope, setScope] = useState<"all" | "pending">("all");
  const opts = [{ ms: 6 * HOUR, label: "6 hours" }, { ms: DAY, label: "1 day" }, { ms: 2 * DAY, label: "2 days" }, { ms: 3 * DAY, label: "3 days" }];
  const base = Math.max(a.dueAt, Date.now());
  const apply = () => {
    if (scope === "all") {
      st.extendDue(a.id, a.dueAt + by);
      toast(`New deadline: ${fmtWhen(a.dueAt + by)}`);
    } else {
      const ids = st.subsOf(a.id).filter((s) => s.status === "not_started" || s.status === "in_progress").map((s) => s.studentId);
      st.grantExtension(a.id, ids, base + by);
      toast(`${plural(ids.length, "student")} got ${opts.find((o) => o.ms === by)?.label} more`);
    }
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} label="Change the deadline">
      <ModalHead title="Change the deadline" subtitle={`Currently ${fmtWhen(a.dueAt)}`} onClose={onClose} />
      <div className="space-y-6 overflow-y-auto px-6 py-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Add more time</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {opts.map((o) => (
              <button key={o.ms} onClick={() => setBy(o.ms)} aria-pressed={by === o.ms} className={cn("rounded-xl border px-3 py-3 text-sm font-semibold transition-colors", by === o.ms ? "border-navy bg-navy-50 text-navy" : "border-line-strong hover:bg-bg")}>+ {o.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Who gets it</p>
          <div className="space-y-2">
            {([["all", "Everyone", "Moves the deadline for the whole assignment."], ["pending", `Only students who have not handed in (${onlyPendingCount})`, "Keeps the original deadline for everyone else."]] as const).map(([v, l, d]) => (
              <button key={v} onClick={() => setScope(v)} aria-pressed={scope === v} className={cn("flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors", scope === v ? "border-navy bg-navy-50" : "border-line-strong hover:bg-bg")}>
                <span className={cn("mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border-2", scope === v ? "border-navy" : "border-line-strong")}>{scope === v && <span className="size-2 rounded-full bg-navy" />}</span>
                <span><span className="block text-sm font-semibold text-ink">{l}</span><span className="block text-[13px] text-muted">{d}</span></span>
              </button>
            ))}
          </div>
        </div>
        <p className="flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-[13px] font-medium text-sky-600"><CalendarClock size={16} /> New deadline: {fmtWhen((scope === "all" ? a.dueAt : base) + by)}</p>
      </div>
      <ModalFoot>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={apply}>Apply</Button>
      </ModalFoot>
    </Modal>
  );
}
