import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, GraduationCap, Inbox, Star } from "lucide-react";
import { useStore } from "../store/store";
import { DAY, SUBJECTS, fmtAgo, cn } from "../lib/utils";
import { Avatar, Button, CardHead, PageHeader, SubjectTag } from "../components/ui";
import { useToast } from "../components/toast";

const TARGET = 2;

export function Teachers() {
  const st = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const now = Date.now();
  const rows = st.teachers.map((t) => {
    const mine = st.assignments.filter((a) => a.teacherId === t.id);
    const waiting = mine.flatMap((a) => st.subsOf(a.id).filter((s) => s.status === "submitted"));
    const oldest = waiting.length ? Math.min(...waiting.map((s) => s.submittedAt ?? now)) : 0;
    return { t, waiting: waiting.length, oldest, active: mine.filter((a) => a.status === "active").length };
  });
  const maxWait = Math.max(...rows.map((r) => r.waiting), 1);

  return (
    <div>
      <PageHeader icon={GraduationCap} title="Teachers" subtitle="Who is teaching what, and who needs a hand with marking." />

      <section className="card mb-6">
        <CardHead title="Marking workload" hint="Submissions waiting for each teacher. Amber means the oldest has waited more than 2 days." />
        <ul className="space-y-4 px-5 pb-5 pt-5">
          {rows.map(({ t, waiting, oldest }) => {
            return (
              <li key={t.id} className="grid items-center gap-3 sm:grid-cols-[180px_minmax(0,1fr)_150px]">
                <span className="flex items-center gap-2.5"><Avatar name={t.name} size={30} /><span className="truncate text-sm font-semibold text-ink">{t.name}</span></span>
                <span className="relative h-3 overflow-hidden rounded-full bg-line">
                  <span className={cn("block h-full rounded-full transition-[width] duration-700", oldest && now - oldest > TARGET * DAY ? "bg-warn-dot" : "bg-sky")} style={{ width: `${(waiting / maxWait) * 100}%` }} />
                </span>
                <span className="text-sm text-muted tnum"><b className="text-ink">{waiting}</b> waiting{oldest ? ` · ${Math.max(1, Math.round((now - oldest) / DAY))}d old` : ""}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ t, waiting, active }) => {
          const slow = t.turnaroundDays > TARGET;
          return (
            <section key={t.id} className="card flex flex-col p-5">
              <div className="flex items-start gap-3.5">
                <Avatar name={t.name} size={52} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold">{t.name}</h2>
                  <p className="mt-0.5 text-[13px] text-muted"><SubjectTag subject={t.subject} /></p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn"><Star size={12} fill="currentColor" /> {t.rating}</span>
              </div>
              <p className="mt-4 text-[13px] text-muted">Teaches {t.batchIds.map((b) => st.batches.find((x) => x.id === b)?.short).join(", ")}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
                <div><dt className="flex items-center gap-1 text-xs text-muted"><Inbox size={13} /> To review</dt><dd className="mt-1 text-xl font-bold text-ink tnum">{waiting}</dd></div>
                <div><dt className="flex items-center gap-1 text-xs text-muted"><Clock size={13} /> Review time</dt><dd className={cn("mt-1 text-xl font-bold tnum", slow ? "text-warn" : "text-ink")}>{t.turnaroundDays ? `${t.turnaroundDays}d` : "—"}</dd></div>
                <div><dt className="text-xs text-muted">Classes / week</dt><dd className="mt-1 text-xl font-bold text-ink tnum">{t.classesThisWeek}</dd></div>
              </dl>
              <div className="mt-5 flex gap-2.5 pt-1">
                {slow && waiting > 6 ? <Button size="sm" variant="soft" onClick={() => toast(`${t.name.split(" ")[0]} has been sent a nudge`)}>Send a nudge</Button> : null}
                <Button size="sm" iconRight={ArrowRight} className="ml-auto" onClick={() => nav(`/assignments?teacher=${t.id}`)}>{active} active</Button>
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-faint">Last updated {fmtAgo(now - 60_000)} · Subjects: {Object.values(SUBJECTS).map((s) => s.short).join(", ")}</p>
    </div>
  );
}
