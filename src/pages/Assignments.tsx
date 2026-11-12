import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, ClipboardCheck, Copy, Ellipsis, Eye, FilePlus2, Plus, Search, Send, TimerReset } from "lucide-react";
import { useStore } from "../store/store";
import { ME_TEACHER } from "../data/seed";
import { typeLabel } from "../lib/selectors";
import { DAY, fmtWhen, lowerDay, plural } from "../lib/utils";
import type { Assignment, SubjectId } from "../lib/types";
import { AssignmentChip, Button, Chip, Empty, IconButton, Input, Menu, PageHeader, Select, SubjectTag, SubjectTile, Tabs } from "../components/ui";
import { DueLabel, ProgressOf } from "../components/bits";
import { useToast } from "../components/toast";
import { SUBJECTS } from "../lib/utils";

type Tab = "active" | "review" | "scheduled" | "drafts" | "completed";

export function Assignments() {
  const st = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "active";
  const q = params.get("q") ?? "";
  const batch = params.get("batch") ?? "all";
  const subject = params.get("subject") ?? "all";
  const teacher = params.get("teacher") ?? "all";
  const isTeacher = st.role === "teacher";

  const set = (k: string, v: string, def = "all") => {
    const next = new URLSearchParams(params);
    if (!v || v === def) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const waiting = (a: Assignment) => st.subsOf(a.id).filter((s) => s.status === "submitted").length;

  const scoped = useMemo(() => {
    return st.assignments.filter((a) => {
      if (isTeacher && a.teacherId !== ME_TEACHER) return false;
      if (batch !== "all" && !a.batchIds.includes(batch)) return false;
      if (subject !== "all" && a.subject !== subject) return false;
      if (teacher !== "all" && a.teacherId !== teacher) return false;
      if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [st.assignments, isTeacher, batch, subject, teacher, q]);

  const counts = {
    active: scoped.filter((a) => a.status === "active").length,
    review: scoped.filter((a) => waiting(a) > 0).length,
    scheduled: scoped.filter((a) => a.status === "scheduled").length,
    drafts: scoped.filter((a) => a.status === "draft").length,
    completed: scoped.filter((a) => a.status === "completed").length,
  };

  const rows = useMemo(() => {
    const f = scoped.filter((a) => (tab === "review" ? waiting(a) > 0 : tab === "drafts" ? a.status === "draft" : a.status === tab));
    const by = {
      active: (x: Assignment, y: Assignment) => x.dueAt - y.dueAt,
      review: (x: Assignment, y: Assignment) => waiting(y) - waiting(x),
      scheduled: (x: Assignment, y: Assignment) => x.releaseAt - y.releaseAt,
      drafts: (x: Assignment, y: Assignment) => y.createdAt - x.createdAt,
      completed: (x: Assignment, y: Assignment) => y.dueAt - x.dueAt,
    }[tab];
    return [...f].sort(by);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, tab, st.submissions]);

  const batchName = (a: Assignment) => (a.batchIds.length ? a.batchIds.map((b) => st.batches.find((x) => x.id === b)?.short).join(", ") : "No batch chosen yet");

  return (
    <div>
      <PageHeader
        icon={ClipboardCheck}
        title="Assignments"
        subtitle={isTeacher ? "Your assignments, and everything waiting for your review." : "Create work, give it to a batch, and watch it come back."}
        actions={<Button variant="primary" icon={Plus} onClick={() => nav("/assignments/new")}>New assignment</Button>}
      />

      <div className="card overflow-hidden">
        <div className="px-3 pt-2 sm:px-5">
          <Tabs<Tab>
            value={tab}
            onChange={(t) => set("tab", t, "active")}
            items={[
              { id: "active", label: "Active", count: counts.active },
              { id: "review", label: "Needs review", count: counts.review },
              { id: "scheduled", label: "Scheduled", count: counts.scheduled },
              { id: "drafts", label: "Drafts", count: counts.drafts },
              { id: "completed", label: "Completed", count: counts.completed },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-surface-2 px-4 py-3 sm:px-5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => set("q", e.target.value, "")} placeholder="Search by title" className="pl-9" aria-label="Search assignments" />
          </div>
          <Select value={batch} onChange={(e) => set("batch", e.target.value)} className="w-auto min-w-40" aria-label="Filter by batch">
            <option value="all">All batches</option>
            {st.batches.map((b) => <option key={b.id} value={b.id}>{b.short}</option>)}
          </Select>
          <Select value={subject} onChange={(e) => set("subject", e.target.value)} className="w-auto min-w-36" aria-label="Filter by subject">
            <option value="all">All subjects</option>
            {(Object.keys(SUBJECTS) as SubjectId[]).map((s) => <option key={s} value={s}>{SUBJECTS[s].short}</option>)}
          </Select>
          {!isTeacher && (
            <Select value={teacher} onChange={(e) => set("teacher", e.target.value)} className="w-auto min-w-40" aria-label="Filter by teacher">
              <option value="all">All teachers</option>
              {st.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          )}
        </div>

        {rows.length === 0 ? (
          <Empty
            art={tab === "review" ? "caught" : "search"}
            icon={tab === "drafts" ? FilePlus2 : ClipboardCheck}
            title={tab === "review" ? "Nothing is waiting for review" : tab === "drafts" ? "No drafts" : "No assignments here"}
            body={tab === "review" ? "Every submitted assignment has been reviewed. Nice work." : "Try another tab or clear the filters."}
            action={<Button variant="primary" icon={Plus} onClick={() => nav("/assignments/new")}>Create an assignment</Button>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((a) => {
              const w = waiting(a);
              const teacherName = st.teachers.find((t) => t.id === a.teacherId)?.name;
              return (
                <li key={a.id} className="row-hover relative grid items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
                  <div className="flex min-w-0 items-center gap-4">
                    <SubjectTile subject={a.subject} size={46} />
                    <div className="min-w-0">
                    <Link
                      to={a.status === "draft" ? `/assignments/new?from=${a.id}` : tab === "review" ? `/review/${a.id}` : `/assignments/${a.id}`}
                      className="block truncate text-[15px] font-bold text-ink after:absolute after:inset-0 after:content-[''] hover:text-navy"
                    >
                      {a.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                      <SubjectTag subject={a.subject} />
                      <span>{typeLabel[a.type]}{a.type === "quiz" ? " · auto-marked" : ""}</span>
                      <span>{batchName(a)}</span>
                      {!isTeacher && <span>by {teacherName}</span>}
                    </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    {a.status === "draft" ? (
                      <p className="text-[13px] text-muted">Not published yet</p>
                    ) : a.status === "scheduled" ? (
                      <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet"><CalendarClock size={14} /> Opens {lowerDay(fmtWhen(a.releaseAt))}</p>
                    ) : tab === "review" ? (
                      <div>
                        <p className="text-[15px] font-bold text-ink tnum">{plural(w, "submission")} waiting</p>
                        <p className="mt-0.5 text-[13px] text-muted">Oldest {Math.max(1, Math.round((Date.now() - Math.min(...st.subsOf(a.id).filter((s) => s.status === "submitted").map((s) => s.submittedAt ?? Date.now()))) / DAY))} days ago</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <DueLabel at={a.dueAt} />
                        <ProgressOf a={a} subs={st.subsOf(a.id)} compact />
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-2 md:justify-end">
                    {tab === "review" ? (
                      <Button size="sm" variant="primary" onClick={() => nav(`/review/${a.id}`)}>Start reviewing</Button>
                    ) : (
                      <>
                        <AssignmentChip status={a.status} />
                        {w > 0 && a.status !== "draft" && <Chip tone="warn" title="Waiting for review">{w} to review</Chip>}
                      </>
                    )}
                    <Menu
                      trigger={(p) => <IconButton {...p} icon={Ellipsis} label="More actions" />}
                      items={[
                        { label: "Open", icon: Eye, onClick: () => nav(a.status === "draft" ? `/assignments/new?from=${a.id}` : `/assignments/${a.id}`) },
                        ...(a.status === "active" ? [
                          { label: "Send a reminder", icon: Send, onClick: () => { const n = st.remind(a.id); toast(`Reminder sent to ${n} students`); } },
                          { label: "Give everyone 1 more day", icon: TimerReset, onClick: () => { st.extendDue(a.id, a.dueAt + DAY); toast("Deadline moved by one day"); } },
                        ] : []),
                        { label: "Duplicate", icon: Copy, onClick: () => nav(`/assignments/new?from=${a.id}&copy=1`) },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
