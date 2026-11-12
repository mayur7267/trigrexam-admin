import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlarmClock, CalendarCheck, CircleCheck, ClipboardCheck, Hourglass, Inbox, Plus, Send, TriangleAlert, UserRoundSearch, Users, Video, Zap, type LucideIcon } from "lucide-react";
import { useStore } from "../store/store";
import { INSTITUTE, ME_ADMIN } from "../data/seed";
import { dueFor, shownStatus, statusLabel, type ShownStatus } from "../lib/selectors";
import { DAY, HOUR, mulberry32, fmtAgo, fmtLeft, fmtLongDay, fmtTime, fmtWhen, lowerDay, plural, startOfDay } from "../lib/utils";
import { Avatar, Button, CardHead, Chip, Empty, LinkMore, Modal, ModalHead, SubjectTile, type Tone } from "../components/ui";
import { DoneNote, DueLabel, ProgressOf, STATUS_COLOR, StatTile, greeting } from "../components/bits";
import { AreaChart, Donut, HBars } from "../components/charts";
import { ExtensionList } from "../components/ExtensionList";
import { useToast } from "../components/toast";

interface Item { key: string; icon: LucideIcon; tone: Tone; title: ReactNode; detail: ReactNode; action: ReactNode }

const TONE_ICON: Record<string, string> = {
  warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad", violet: "bg-violet-soft text-violet", sky: "bg-sky-50 text-sky-600", amber: "bg-amber-soft text-amber",
};

export function HomeAdmin() {
  const st = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [extOpen, setExtOpen] = useState(false);
  const [nudged, setNudged] = useState<string[]>([]);
  const now = Date.now();

  const aMap = new Map(st.assignments.map((a) => [a.id, a]));
  const active = st.assignments.filter((a) => a.status === "active");
  const awaiting = st.submissions.filter((s) => s.status === "submitted");
  const oldest = awaiting.length ? Math.min(...awaiting.map((s) => s.submittedAt ?? now)) : now;
  const handed = st.submissions.filter((s) => s.submittedAt);
  const onTime = handed.length ? Math.round((handed.filter((s) => s.submittedAt! <= dueFor(aMap.get(s.assignmentId)!, s)).length / handed.length) * 100) : 0;
  const activeWeek = st.students.filter((s) => s.lastActiveHrs < 168).length;
  const attendance = Math.round(st.students.reduce((n, s) => n + s.attendance, 0) / st.students.length);

  /* ---- things that need a person ---- */
  const items: Item[] = [];

  active
    .filter((a) => a.dueAt > now && a.dueAt - now < 36 * HOUR)
    .map((a) => ({ a, pending: st.subsOf(a.id).filter((s) => s.status === "not_started" || s.status === "in_progress").length }))
    .filter((x) => x.pending >= 5)
    .sort((x, y) => x.a.dueAt - y.a.dueAt)
    .slice(0, 2)
    .forEach(({ a, pending }) =>
      items.push({
        key: `due-${a.id}`, icon: AlarmClock, tone: "warn",
        title: <>{pending} students haven’t handed in <Link to={`/assignments/${a.id}`} className="underline decoration-line-strong underline-offset-2 hover:text-navy">{a.title}</Link></>,
        detail: <>Due {lowerDay(fmtWhen(a.dueAt))} · {fmtLeft(a.dueAt)}</>,
        action: st.reminded[a.id] ? <DoneNote>Reminder sent</DoneNote> : (
          <Button size="sm" variant="primary" icon={Send} onClick={() => { const n = st.remind(a.id); toast(`Reminder sent to ${n} students on the app and WhatsApp`); }}>Send reminder</Button>
        ),
      }),
    );

  for (const t of st.teachers) {
    const mine = awaiting.filter((s) => aMap.get(s.assignmentId)?.teacherId === t.id);
    if (mine.length >= 8) {
      const age = now - Math.min(...mine.map((s) => s.submittedAt ?? now));
      if (age > 48 * HOUR) {
        items.push({
          key: `slow-${t.id}`, icon: Inbox, tone: "bad",
          title: <>{t.name} has {mine.length} submissions waiting for review</>,
          detail: <>The oldest has waited {Math.round(age / DAY)} days. Your target is 2 days.</>,
          action: nudged.includes(t.id) ? <DoneNote>Nudge sent</DoneNote> : (
            <Button size="sm" onClick={() => { setNudged((n) => [...n, t.id]); toast(`${t.name.split(" ")[0]} has been sent a nudge`); }}>Send a nudge</Button>
          ),
        });
      }
    }
  }

  const pendingExt = st.extensions.filter((e) => e.status === "pending");
  if (pendingExt.length) {
    items.push({
      key: "ext", icon: Hourglass, tone: "violet",
      title: <>{pendingExt.length} students asked for more time</>,
      detail: <>Their teachers can approve in one tap. You can also decide here.</>,
      action: <Button size="sm" onClick={() => setExtOpen(true)}>Review requests</Button>,
    });
  }

  active
    .filter((a) => a.dueAt < now)
    .map((a) => ({ a, missing: st.subsOf(a.id).filter((s) => (s.status === "not_started" || s.status === "in_progress") && now > dueFor(a, s)).length }))
    .filter((x) => x.missing >= 3)
    .slice(0, 1)
    .forEach(({ a, missing }) =>
      items.push({
        key: `miss-${a.id}`, icon: TriangleAlert, tone: "amber",
        title: <>{missing} students missed <Link to={`/assignments/${a.id}`} className="underline decoration-line-strong underline-offset-2 hover:text-navy">{a.title}</Link></>,
        detail: <>The deadline passed {fmtLeft(a.dueAt).replace(" overdue", "")} ago.</>,
        action: st.reminded[a.id] ? <DoneNote>Reminder sent</DoneNote> : (
          <Button size="sm" onClick={() => { const n = st.remind(a.id); toast(`${n} students reminded. Late hand-ins are still accepted.`); }}>Remind them</Button>
        ),
      }),
    );

  const risk = st.students.filter((s) => s.flag === "risk").length;
  if (risk) {
    items.push({
      key: "risk", icon: UserRoundSearch, tone: "sky",
      title: <>{risk} students may be falling behind</>,
      detail: <>Low attendance or missed work. Reaching out early helps most.</>,
      action: <Button size="sm" onClick={() => nav("/students?filter=risk")}>See who</Button>,
    });
  }

  /* ---- today ---- */
  const allToday = st.classes
    .filter((c) => startOfDay(c.startAt) === startOfDay(now))
    .sort((a, b) => a.startAt - b.startAt);
  const isDone = (c: (typeof allToday)[number]) => now >= c.startAt + c.durationMin * 60_000;
  const upcoming = allToday.filter((c) => !isDone(c));
  const todays = upcoming.length ? upcoming : allToday.slice(-3);
  const finished = allToday.length - upcoming.length;

  const inProgress = [...active].sort((a, b) => a.dueAt - b.dueAt).slice(0, 5);

  const batchStats = st.batches.map((b) => {
    const list = st.students.filter((s) => s.batchId === b.id);
    const avg = (f: (s: (typeof list)[number]) => number) => Math.round(list.reduce((n, s) => n + f(s), 0) / list.length);
    return { b, score: avg((s) => s.avgScore), onTime: avg((s) => s.onTime), att: avg((s) => s.attendance) };
  });


  const activity = useMemo(() => {
    const r = mulberry32(41);
    const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * DAY));
    const wk = (d: Date) => ([0, 6].includes(d.getDay()) ? 0.62 : 1);
    return {
      labels: days.map((d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
      onTime: days.map((d, i) => Math.round((32 + i * 1.1 + r() * 14) * wk(d))),
      late: days.map((d, i) => Math.round((11 - i * 0.2 + r() * 6) * wk(d))),
    };
  }, []);
  const mixOrder: ShownStatus[] = ["reviewed", "submitted", "redo", "progress", "todo", "missing"];
  const mixColor: Record<ShownStatus, string> = { reviewed: STATUS_COLOR.reviewed, submitted: STATUS_COLOR.waiting, redo: STATUS_COLOR.redo, progress: STATUS_COLOR.progress, todo: "var(--color-line-strong)", missing: STATUS_COLOR.missing };
  const mix = useMemo(() => {
    const c: Record<ShownStatus, number> = { reviewed: 0, submitted: 0, redo: 0, progress: 0, todo: 0, missing: 0 };
    for (const sub of st.submissions) {
      const a = aMap.get(sub.assignmentId);
      if (!a || a.status !== "active") continue;
      c[shownStatus(a, sub, now)]++;
    }
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.submissions, st.assignments]);
  const mixTotal = mixOrder.reduce((n, k) => n + mix[k], 0) || 1;
  const mixHanded = Math.round(((mix.reviewed + mix.submitted + mix.redo) / mixTotal) * 100);

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-3">
        <p className="rise text-[15px] font-medium text-muted">{fmtLongDay(now)} · {INSTITUTE}</p>
        <h1 className="title-xl rise mt-2 text-[34px] sm:text-[44px]" style={{ animationDelay: "60ms" }}>{greeting()}, {ME_ADMIN.name.split(" ")[0]}</h1>
        <p className="rise mt-2 max-w-xl text-[17px] leading-relaxed text-muted" style={{ animationDelay: "120ms" }}>
          {items.length ? `${items.length} ${items.length === 1 ? "thing needs" : "things need"} you today. Everything else is running on its own.` : "Everything is running on its own today."}
        </p>
        <div className="rise mt-5 flex flex-wrap gap-3" style={{ animationDelay: "180ms" }}>
          <Button variant="primary" size="lg" icon={Plus} onClick={() => nav("/assignments/new")}>New assignment</Button>
          <Button variant="secondary" size="lg" icon={Video} onClick={() => nav("/classes")}>Schedule a class</Button>
        </div>
      </header>

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={ClipboardCheck} iconTone="warn" label="Waiting for review" value={awaiting.length} to="/assignments?tab=review" tone={now - oldest > 2 * DAY ? "warn" : "normal"} hint={awaiting.length ? `Oldest was handed in ${fmtAgo(oldest)}` : "All caught up"} />
        <StatTile icon={CircleCheck} iconTone="ok" label="Handed in on time" value={`${onTime}%`} delta={{ text: "4 pts", up: true, good: true }} hint="vs last week" spark={[66, 69, 68, 72, 74, onTime]} sparkColor="var(--color-ok)" to="/reports" />
        <StatTile icon={Users} iconTone="sky" label="Active this week" value={activeWeek} delta={{ text: "6", up: true, good: true }} hint={`of ${st.students.length} students`} spark={[121, 126, 124, 131, 138, activeWeek]} to="/students" />
        <StatTile icon={CalendarCheck} iconTone="violet" label="Class attendance" value={`${attendance}%`} delta={{ text: "2 pts", up: true, good: true }} hint="vs last week" spark={[77, 79, 78, 82, 80, attendance]} sparkColor="var(--color-violet)" to="/reports" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="card" aria-labelledby="attn">
          <CardHead title={<span id="attn">Needs your attention</span>} hint={items.length ? (items.length > 5 ? `The 5 most urgent of ${items.length}` : `${items.length} ${items.length === 1 ? "thing" : "things"}, most urgent first`) : undefined} />
          {items.length === 0 ? (
            <Empty art="caught" icon={Zap} title="You are all caught up" body="Nothing is overdue and no one is waiting on you." />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {items.slice(0, 5).map((it) => (
                <li key={it.key} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap">
                  <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE_ICON[it.tone] ?? ""}`}><it.icon size={20} /></span>
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="text-[15px] font-semibold leading-snug text-ink">{it.title}</p>
                    <p className="mt-0.5 text-[13px] text-muted">{it.detail}</p>
                  </div>
                  <div className="shrink-0">{it.action}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="today">
          <CardHead title={<span id="today">Today’s classes</span>} action={<LinkMore to="/classes">Timetable</LinkMore>} />
          {todays.length === 0 ? (
            <Empty icon={Video} title="No classes today" body="Enjoy the quiet. The week view shows what is next." />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {todays.slice(0, 5).map((c) => {
                const live = now >= c.startAt && now < c.startAt + c.durationMin * 60_000;
                const done = now >= c.startAt + c.durationMin * 60_000;
                const teacher = st.teachers.find((t) => t.id === c.teacherId)!;
                const batch = st.batches.find((b) => b.id === c.batchId)!;
                return (
                  <li key={c.id} className={`flex items-center gap-4 px-5 py-3.5 ${done ? "opacity-55" : ""}`}>
                    <span className="w-[62px] shrink-0 text-[13px] font-bold text-ink tnum">{fmtTime(c.startAt)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                      <p className="truncate text-xs text-muted">{batch.short} · {teacher.name}</p>
                    </div>
                    {live ? <Chip tone="bad"><span className="live-dot" /> Live now</Chip> : done ? <span className="text-xs text-faint">Done</span> : <span className="text-xs font-semibold text-muted">{fmtLeft(c.startAt).replace(" left", "")}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          {finished > 0 && upcoming.length > 0 && <p className="border-t border-line px-5 py-3 text-xs text-muted">{plural(finished, "class", "classes")} finished earlier today</p>}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="card" aria-labelledby="activity">
          <CardHead
            title={<span id="activity">Work handed in</span>}
            hint="Last 14 days. Hover the chart for each day."
            action={<span className="flex gap-4 text-[13px] font-semibold text-muted"><span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-sky" />On time</span><span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warn-dot" />Late</span></span>}
          />
          <div className="px-3 pb-4 pt-5 sm:px-5">
            <AreaChart height={236} labels={activity.labels} series={[{ name: "On time", color: "var(--color-sky)", data: activity.onTime }, { name: "Late", color: "var(--color-warn-dot)", data: activity.late }]} min={0} />
          </div>
        </section>

        <section className="card" aria-labelledby="mix">
          <CardHead title={<span id="mix">Where everything stands</span>} hint="Every student, across active assignments" />
          <div className="flex flex-col items-center gap-6 px-5 pb-6 pt-5 sm:flex-row lg:flex-col xl:flex-row">
            <Donut size={150} stroke={17} parts={mixOrder.map((k) => ({ value: mix[k], color: mixColor[k] }))}>
              <span className="text-[30px] font-bold leading-none text-ink tnum">{mixHanded}%</span>
              <span className="mt-1 text-xs font-semibold text-muted">handed in</span>
            </Donut>
            <ul className="w-full space-y-2.5">
              {mixOrder.map((k) => (
                <li key={k} className="flex items-center gap-2.5 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: mixColor[k] }} />
                  <span className="flex-1 text-body">{statusLabel[k]}</span>
                  <b className="text-ink tnum">{mix[k]}</b>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="card" aria-labelledby="inprog">
          <CardHead title={<span id="inprog">Assignments in progress</span>} hint="Soonest deadline first" action={<LinkMore to="/assignments">See all</LinkMore>} />
          <ul className="mt-3 divide-y divide-line">
            {inProgress.map((a) => (
              <li key={a.id}>
                <Link to={`/assignments/${a.id}`} className="row-hover grid items-center gap-x-6 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <SubjectTile subject={a.subject} size={42} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">{a.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
                        <span>{a.batchIds.map((b) => st.batches.find((x) => x.id === b)?.short).join(", ")}</span>
                        <DueLabel at={a.dueAt} />
                      </p>
                    </div>
                  </div>
                  <ProgressOf a={a} subs={st.subsOf(a.id)} compact />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="perf">
          <CardHead title={<span id="perf">How each batch is doing</span>} hint="Average test score" />
          <div className="px-5 pb-5 pt-4">
            <HBars
              items={batchStats.map(({ b, score, onTime: ot, att }) => ({
                label: b.short, value: score, display: `${score}%`,
                sub: `On time ${ot}% · Attendance ${att}%`,
                color: score >= 65 ? "var(--color-sky)" : "var(--color-warn-dot)",
              }))}
            />
          </div>
        </section>
      </div>

      <section className="card" aria-labelledby="recent">
        <CardHead title={<span id="recent">What happened recently</span>} />
        <ul className="mt-3 grid gap-x-8 px-5 pb-3 md:grid-cols-2">
          {st.activity.slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0 md:[&:nth-child(2)]:border-t-0">
              {a.who === "System" ? <span className="inline-flex size-8 items-center justify-center rounded-full bg-sky-50 text-sky-600"><Zap size={15} /></span> : <Avatar name={a.who === "You" ? ME_ADMIN.name : a.who} size={32} />}
              <p className="min-w-0 flex-1 text-sm text-body"><span className="font-semibold text-ink">{a.who}</span> {a.text}</p>
              <span className="shrink-0 text-xs text-faint">{fmtAgo(a.at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={extOpen} onClose={() => setExtOpen(false)} label="Extension requests">
        <ModalHead title="Requests for more time" subtitle="Giving more time adds 24 hours for that student only." onClose={() => setExtOpen(false)} />
        <div className="overflow-y-auto"><ExtensionList /></div>
      </Modal>
    </div>
  );
}
