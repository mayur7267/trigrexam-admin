import { useNavigate, Link } from "react-router-dom";
import { Eye, Plus, Send, Video, Zap } from "lucide-react";
import { useStore } from "../store/store";
import { ME_TEACHER } from "../data/seed";
import { fmtAgo, fmtLeft, fmtLongDay, fmtTime, plural, startOfDay } from "../lib/utils";
import { Button, CardHead, Chip, Empty, LinkMore, PageHeader, SubjectTile } from "../components/ui";
import { DueLabel, ProgressOf, greeting } from "../components/bits";
import { ExtensionList } from "../components/ExtensionList";
import { useToast } from "../components/toast";

export function HomeTeacher() {
  const st = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const me = st.teachers.find((t) => t.id === ME_TEACHER)!;
  const now = Date.now();
  const mine = st.assignments.filter((a) => a.teacherId === me.id);
  const queue = mine
    .map((a) => ({ a, waiting: st.subsOf(a.id).filter((s) => s.status === "submitted") }))
    .filter((x) => x.waiting.length > 0)
    .sort((x, y) => y.waiting.length - x.waiting.length);
  const total = queue.reduce((n, x) => n + x.waiting.length, 0);
  const oldest = total ? Math.min(...queue.flatMap((x) => x.waiting.map((s) => s.submittedAt ?? now))) : now;
  const active = mine.filter((a) => a.status === "active" && a.dueAt > now).sort((x, y) => x.dueAt - y.dueAt).slice(0, 3);
  const todays = st.classes.filter((c) => c.teacherId === me.id && startOfDay(c.startAt) === startOfDay(now)).sort((x, y) => x.startAt - y.startAt);
  const pendingExt = st.extensions.filter((e) => e.status === "pending" && st.assignments.find((a) => a.id === e.assignmentId)?.teacherId === me.id);
  const slow = me.turnaroundDays > 2;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${me.name.split(" ")[0]}`}
        subtitle={`${fmtLongDay(now)}. ${total ? `${plural(total, "submission")} waiting for you` : "Nothing is waiting for you"}${todays.length ? `, ${plural(todays.length, "class", "classes")} today.` : "."}`}
        actions={<Button variant="primary" icon={Plus} onClick={() => nav("/assignments/new")}>New assignment</Button>}
      />

      <section className="card overflow-hidden" aria-label="Review queue">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="hero !rounded-none flex flex-col justify-between gap-6 p-7">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-white/70">Waiting for your review</p>
              <p className="mt-2 text-[56px] font-bold leading-none tnum">{total}</p>
              <p className="mt-3 text-[15px] text-white/80">{total ? `The oldest was handed in ${fmtAgo(oldest)}.` : "You are all caught up."}</p>
            </div>
            <div>
              <Button size="lg" variant="light" icon={Eye} disabled={!total} onClick={() => queue[0] && nav(`/review/${queue[0].a.id}`)}>Start reviewing</Button>
              <p className="mt-3 text-[13px] text-white/70">You review in {me.turnaroundDays} days on average{slow ? ". The target is 2." : ". Right on target."}</p>
            </div>
          </div>
          <div>
            <CardHead title="By assignment" hint="Most waiting first" />
            {queue.length === 0 ? <Empty art="caught" icon={Zap} title="Nothing to review" body="New submissions will show up here." /> : (
              <ul className="mt-3 divide-y divide-line">
                {queue.slice(0, 4).map(({ a, waiting }) => (
                  <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                    <SubjectTile subject={a.subject} size={40} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/assignments/${a.id}`} className="block truncate text-sm font-bold text-ink hover:text-navy">{a.title}</Link>
                      <p className="mt-0.5 text-xs text-muted">Oldest {fmtAgo(Math.min(...waiting.map((s) => s.submittedAt ?? now)))}</p>
                    </div>
                    <Chip tone="warn">{waiting.length} waiting</Chip>
                    <Button size="sm" variant="soft" onClick={() => nav(`/review/${a.id}`)}>Review</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="card overflow-hidden">
          <CardHead title="Asking for more time" hint={pendingExt.length ? "Say yes in one tap" : undefined} />
          {pendingExt.length ? <div className="mt-2"><ExtensionList onlyPending teacherId={me.id} /></div> : <Empty art="inbox" icon={Zap} title="No requests" body="When a student asks for more time, it appears here." />}
        </section>

        <section className="card">
          <CardHead title="Today’s classes" action={<LinkMore to="/classes">Timetable</LinkMore>} />
          {todays.length === 0 ? <Empty icon={Video} title="No classes today" /> : (
            <ul className="mt-3 divide-y divide-line">
              {todays.map((c) => {
                const live = now >= c.startAt && now < c.startAt + c.durationMin * 60_000;
                const done = now >= c.startAt + c.durationMin * 60_000;
                return (
                  <li key={c.id} className={`flex items-center gap-4 px-5 py-3.5 ${done ? "opacity-55" : ""}`}>
                    <span className="w-[62px] shrink-0 text-[13px] font-bold text-ink tnum">{fmtTime(c.startAt)}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{c.title}</p><p className="truncate text-xs text-muted">{st.batches.find((b) => b.id === c.batchId)?.short}</p></div>
                    {live ? <Chip tone="bad"><span className="live-dot" /> Live now</Chip> : done ? <span className="text-xs text-faint">Done</span> : <span className="text-xs font-semibold text-muted">in {fmtLeft(c.startAt).replace(" left", "")}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {active.length > 0 && (
        <section className="card">
          <CardHead title="Due soon from your batches" hint="Send a reminder if a lot of students are still working" action={<LinkMore to="/assignments">All assignments</LinkMore>} />
          <ul className="mt-3 divide-y divide-line">
            {active.map((a) => (
              <li key={a.id} className="grid items-center gap-x-6 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                <div className="min-w-0"><Link to={`/assignments/${a.id}`} className="block truncate text-[15px] font-bold text-ink hover:text-navy">{a.title}</Link><DueLabel at={a.dueAt} /></div>
                <ProgressOf a={a} subs={st.subsOf(a.id)} compact />
                <Button size="sm" icon={Send} onClick={() => { const n = st.remind(a.id); toast(`Reminder sent to ${plural(n, "student")}`); }}>Remind</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
