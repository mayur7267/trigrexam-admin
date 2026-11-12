import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, CircleCheck, Clock, Flame, Hourglass, MessageSquareQuote, Play, RotateCcw, Sparkles } from "lucide-react";
import { useStore } from "../store/store";
import { ME_STUDENT } from "../data/seed";
import { useMine, type Mine } from "../lib/hooks";
import { typeLabel } from "../lib/selectors";
import { SUBJECTS, fmtAgo, fmtIn, fmtLongDay, fmtTime, fmtWhen, lowerDay, startOfDay, plural } from "../lib/utils";
import { Button, Chip, Ring, StatusChip, SubjectTag, SubjectTile } from "../components/ui";
import { DueLabel, HeroArt, greeting } from "../components/bits";

export function HomeStudent() {
  const st = useStore();
  const nav = useNavigate();
  const mine = useMine();
  const me = st.students.find((s) => s.id === ME_STUDENT)!;
  const now = Date.now();

  const todo = mine
    .filter((m) => m.shown === "todo" || m.shown === "progress" || m.shown === "redo" || m.shown === "missing")
    .sort((x, y) => rank(x) - rank(y) || x.a.dueAt - y.a.dueAt);
  const waiting = mine.filter((m) => m.shown === "submitted");
  const done = mine.filter((m) => m.shown === "reviewed").sort((x, y) => (y.s.reviewedAt ?? 0) - (x.s.reviewedAt ?? 0));
  const next = todo.find((m) => m.shown !== "missing") ?? todo[0];
  const lastNote = done.find((m) => m.s.feedback && !m.s.autoGraded) ?? mine.find((m) => m.shown === "redo");

  const week = mine.filter((m) => m.a.dueAt > now - 7 * 86_400_000);
  const weekDone = week.filter((m) => m.shown === "reviewed" || m.shown === "submitted").length;
  const DAYMS = 86_400_000;
  const sod = startOfDay(now);
  const streakDays = Array.from({ length: 7 }, (_, i) => sod - (6 - i) * DAYMS);
  const activeDays = new Set(st.submissions.filter((x) => x.studentId === ME_STUDENT && x.submittedAt).map((x) => startOfDay(x.submittedAt!)));
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    if (activeDays.has(streakDays[i])) streak++;
    else if (i !== 6) break;
  }
  const todays = st.classes.filter((c) => c.batchId === me.batchId && startOfDay(c.startAt) === startOfDay(now)).sort((a, b) => a.startAt - b.startAt);

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-10">
        <h1 className="display text-[40px] sm:text-[64px]">{greeting()}, <span className="gradient-text">{me.name.split(" ")[0]}</span>.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted sm:text-[20px]">
          {todo.length ? <>You have <b className="text-ink">{plural(todo.length, "thing")}</b> to do. {next && <>The next one is due in {fmtIn(next.a.dueAt)}.</>}</> : "You are all caught up. Nice work."}
          <span className="hidden sm:inline"> · {fmtLongDay(now)}</span>
        </p>
      </div>

      {next && (
        <section className="hero rise mb-7" aria-label="Up next">
          <HeroArt dots={false} />
          <div className="grid md:grid-cols-[1fr_auto]">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">{next.shown === "redo" ? "Redo requested" : next.shown === "progress" ? "In progress" : "Up next"}</span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/80"><span className="size-2.5 rounded-full bg-white" />{SUBJECTS[next.a.subject].short}</span>
              </div>
              <h2 className="max-w-xl text-2xl font-bold leading-snug tracking-tight sm:text-[30px]">{next.a.title}</h2>
              <p className="mt-2 max-w-xl text-[15px] text-white/80">{next.shown === "redo" && next.s.feedback ? `“${next.s.feedback}”` : `${typeLabel[next.a.type]} · ${next.a.maxMarks} marks${next.a.type === "quiz" ? ` · ${next.a.questionIds.length} questions, about 5 minutes` : ""}`}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Button variant="light" size="lg" icon={next.shown === "redo" ? RotateCcw : Play} onClick={() => nav(`/assignments/${next.a.id}`)}>
                  {next.shown === "redo" ? "Fix and resubmit" : next.shown === "progress" ? "Continue" : "Start now"}
                </Button>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-white"><Clock size={16} className="text-white/70" />{fmtWhen(next.a.dueAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-white/15 bg-white/[0.07] px-8 py-6 md:w-64 md:flex-col md:justify-center md:border-l md:border-t-0">
              <Ring value={week.length ? (weekDone / week.length) * 100 : 0} size={88} stroke={9} color="#fff" track="rgba(255,255,255,0.22)" textClass="text-white">{weekDone}/{week.length}</Ring>
              <p className="text-sm font-bold text-white md:text-center">done this week<span className="mt-0.5 block text-[13px] font-medium text-white/70">{me.onTime}% on time overall</span></p>
            </div>
          </div>
        </section>
      )}

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <Group title="To do" count={todo.length} empty="Nothing to do right now.">
            {todo.map((m) => <Row key={m.a.id} m={m} />)}
          </Group>
          {waiting.length > 0 && (
            <Group title="Handed in, waiting for review" count={waiting.length}>
              {waiting.map((m) => <Row key={m.a.id} m={m} />)}
            </Group>
          )}
          <Group title="Reviewed" count={done.length}>
            {done.slice(0, 4).map((m) => <Row key={m.a.id} m={m} />)}
            {done.length > 4 && <Link to="/progress" className="flex items-center justify-center gap-1 py-3.5 text-sm font-semibold text-sky-600 hover:text-navy">See all {done.length} <ArrowRight size={15} /></Link>}
          </Group>
        </div>

        <aside className="space-y-5">
          {lastNote?.s.feedback && (
            <section className="card p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><MessageSquareQuote size={17} className="text-sky-600" /> Latest feedback</p>
              <p className="text-[14px] leading-relaxed text-body">“{lastNote.s.feedback}”</p>
              <p className="mt-3 text-xs text-muted">{lastNote.a.title}{lastNote.s.reviewedAt ? ` · ${fmtAgo(lastNote.s.reviewedAt)}` : ""}</p>
            </section>
          )}
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-soft text-amber"><Flame size={21} /></span>
              <div><p className="text-[15px] font-bold text-ink">{streak > 0 ? `${streak}-day streak` : "Start a streak"}</p><p className="text-[13px] text-muted">{activeDays.has(sod) ? "Nice. You handed something in today." : "Hand something in today to keep it going."}</p></div>
            </div>
            <div className="flex justify-between">
              {streakDays.map((d) => {
                const on = activeDays.has(d);
                const today = d === sod;
                return (
                  <div key={d} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase text-faint">{new Date(d).toLocaleDateString("en-IN", { weekday: "narrow" })}</span>
                    <span className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-bold ${on ? "bg-sky text-white" : today ? "border-2 border-dashed border-sky text-sky-600" : "bg-bg text-faint"}`}>{on ? <Check size={15} strokeWidth={3.2} /> : new Date(d).getDate()}</span>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="card p-5">
            <p className="mb-3 flex items-center justify-between text-sm font-bold text-ink">Today’s classes <Link to="/classes" className="text-[13px] font-semibold text-sky-600 hover:text-navy">All</Link></p>
            {todays.length === 0 ? <p className="text-sm text-muted">No classes today.</p> : (
              <ul className="space-y-3">
                {todays.map((c) => {
                  const live = now >= c.startAt && now < c.startAt + c.durationMin * 60_000;
                  return (
                    <li key={c.id} className="flex items-center gap-3">
                      <span className="w-[60px] shrink-0 text-[13px] font-bold text-ink tnum">{fmtTime(c.startAt)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-body">{c.title}</span>
                      {live && <Chip tone="bad"><span className="live-dot" /> Live</Chip>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section className="card flex items-center gap-4 p-5">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ok-soft text-ok"><Sparkles size={21} /></span>
            <div><p className="text-sm font-bold text-ink">{me.onTime}% handed in on time</p><p className="text-[13px] text-muted">Keep it above 80% and you will stay ahead of the batch.</p></div>
          </section>
        </aside>
      </div>
    </div>
  );
}

const rank = (m: Mine) => (m.shown === "redo" ? 0 : m.shown === "missing" ? 3 : 1);

function Group({ title, count, children, empty }: { title: string; count: number; children: React.ReactNode; empty?: string }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold">{title}<span className="rounded-full bg-bg px-2.5 py-0.5 text-[13px] font-bold text-muted tnum">{count}</span></h2>
      {count === 0 && empty ? <p className="card flex items-center gap-2 px-5 py-5 text-sm text-muted"><CircleCheck size={18} className="text-ok" /> {empty}</p> : <div className="card divide-y divide-line overflow-hidden">{children}</div>}
    </section>
  );
}

function Row({ m }: { m: Mine }) {
  const { a, s, shown } = m;
  const action = shown === "todo" ? "Start" : shown === "progress" ? "Continue" : shown === "redo" ? "Redo" : shown === "missing" ? "Hand in late" : shown === "submitted" ? "View" : "Results";
  return (
    <Link to={`/assignments/${a.id}`} className="row-hover group flex items-center gap-4 px-5 py-4">
      <SubjectTile subject={a.subject} size={46} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ink group-hover:text-navy">{a.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <SubjectTag subject={a.subject} />
          {shown === "reviewed" && s.score !== undefined ? <span className="font-semibold text-ink tnum">{s.score}/{a.maxMarks}{s.autoGraded ? " · auto-marked" : ""}</span>
            : shown === "submitted" ? <span>Handed in {s.submittedAt ? lowerDay(fmtWhen(s.submittedAt)) : ""}</span>
            : <DueLabel at={a.dueAt} />}
          {s.extensionUntil && shown !== "reviewed" && <span className="inline-flex items-center gap-1 text-violet"><Hourglass size={13} /> Extra time</span>}
        </p>
      </div>
      <span className="hidden sm:block"><StatusChip status={shown} /></span>
      <span className="inline-flex h-9 shrink-0 items-center rounded-xl bg-navy-50 px-3.5 text-[13px] font-bold text-navy transition-colors group-hover:bg-navy group-hover:text-white">{action}</span>
    </Link>
  );
}
