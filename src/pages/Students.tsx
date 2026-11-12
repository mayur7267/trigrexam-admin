import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Phone, Search, Users } from "lucide-react";
import { useStore } from "../store/store";
import { ME_TEACHER } from "../data/seed";
import { shownStatus } from "../lib/selectors";
import { SUBJECTS, cn, fmtAgo } from "../lib/utils";
import type { Student, SubjectId } from "../lib/types";
import { Avatar, Button, Chip, Empty, Input, Modal, PageHeader, Segmented, Select, StatusChip, type Tone } from "../components/ui";
import { HBars, LineChart } from "../components/charts";
import { useToast } from "../components/toast";
import { IconButton } from "../components/ui";
import { X } from "lucide-react";

type F = "all" | "ok" | "risk";
const FLAG: Record<Student["flag"], { tone: Tone; label: string }> = {
  ok: { tone: "ok", label: "On track" },
  watch: { tone: "warn", label: "Keep an eye" },
  risk: { tone: "bad", label: "Needs attention" },
};

export function Students() {
  const st = useStore();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(40);
  const filter = (params.get("filter") as F) || "all";
  const batch = params.get("batch") ?? "all";
  const q = params.get("q") ?? "";
  const open = params.get("open");
  const isTeacher = st.role === "teacher";

  const set = (k: string, v: string, def = "all") => {
    const n = new URLSearchParams(params);
    if (!v || v === def) n.delete(k); else n.set(k, v);
    setParams(n, { replace: true });
  };

  const myBatches = isTeacher ? new Set(st.teachers.find((t) => t.id === ME_TEACHER)!.batchIds) : null;
  const pool = st.students.filter((s) => !myBatches || myBatches.has(s.batchId));
  const list = useMemo(() => pool
    .filter((s) => (batch === "all" || s.batchId === batch) && (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.roll.toLowerCase().includes(q.toLowerCase())))
    .filter((s) => (filter === "all" ? true : filter === "risk" ? s.flag !== "ok" : s.flag === "ok"))
    .sort((a, b) => (filter === "risk" ? ["risk", "watch", "ok"].indexOf(a.flag) - ["risk", "watch", "ok"].indexOf(b.flag) : 0) || a.name.localeCompare(b.name)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [pool.length, batch, q, filter]);

  const needs = pool.filter((s) => s.flag !== "ok").length;
  const sel = st.students.find((s) => s.id === open);

  return (
    <div>
      <PageHeader icon={Users} title={isTeacher ? "My students" : "Students"} subtitle={`${pool.length} students${isTeacher ? " in your batches" : ` across ${st.batches.length} batches`}. ${needs} could use a quick check-in.`} />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <Segmented<F> label="Show" value={filter} onChange={(v) => set("filter", v)} options={[{ id: "all", label: "Everyone" }, { id: "risk", label: `Needs attention · ${needs}` }, { id: "ok", label: "On track" }]} />
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => set("q", e.target.value, "")} placeholder="Search name or roll number" className="pl-9" aria-label="Search students" />
          </div>
          <Select value={batch} onChange={(e) => set("batch", e.target.value)} className="w-auto min-w-40" aria-label="Filter by batch">
            <option value="all">All batches</option>
            {st.batches.filter((b) => !myBatches || myBatches.has(b.id)).map((b) => <option key={b.id} value={b.id}>{b.short}</option>)}
          </Select>
        </div>

        {list.length === 0 ? <Empty art="search" icon={Search} title="No students match" body="Try clearing a filter." /> : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_120px_90px_90px_140px] gap-4 border-b border-line bg-surface-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-muted lg:grid">
              <span>Student</span><span>Batch</span><span>Attendance</span><span>Score</span><span>On time</span><span>Status</span>
            </div>
            <ul className="divide-y divide-line">
              {list.slice(0, limit).map((s) => (
                <li key={s.id}>
                  <button onClick={() => set("open", s.id, "")} className="row-hover grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 text-left sm:px-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_120px_90px_90px_140px]">
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={s.name} size={38} />
                      <span className="min-w-0"><span className="block truncate text-sm font-bold text-ink">{s.name}</span><span className="block truncate text-xs text-muted">{s.roll}</span></span>
                    </span>
                    <span className="hidden truncate text-sm text-body lg:block">{st.batches.find((b) => b.id === s.batchId)?.short}</span>
                    <span className="hidden items-center gap-2 lg:flex">
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line"><span className={cn("block h-full rounded-full", s.attendance < 70 ? "bg-bad" : "bg-sky")} style={{ width: `${s.attendance}%` }} /></span>
                      <span className="text-sm font-semibold text-ink tnum">{s.attendance}%</span>
                    </span>
                    <span className="hidden text-sm font-semibold text-ink tnum lg:block">{s.avgScore}%</span>
                    <span className={cn("hidden text-sm font-semibold tnum lg:block", s.onTime < 55 ? "text-bad" : "text-ink")}>{s.onTime}%</span>
                    <span className="justify-self-end lg:justify-self-start"><Chip tone={FLAG[s.flag].tone} dot>{FLAG[s.flag].label}</Chip></span>
                  </button>
                </li>
              ))}
            </ul>
            {list.length > limit && <div className="border-t border-line p-4 text-center"><Button onClick={() => setLimit(limit + 40)}>Show {Math.min(40, list.length - limit)} more</Button></div>}
          </>
        )}
      </div>

      <Profile s={sel} onClose={() => set("open", "", "")} />
    </div>
  );
}

function Profile({ s, onClose }: { s?: Student; onClose: () => void }) {
  const st = useStore();
  const toast = useToast();
  const recent = useMemo(() => {
    if (!s) return [];
    const now = Date.now();
    return st.submissions
      .filter((x) => x.studentId === s.id)
      .map((x) => ({ x, a: st.assignments.find((a) => a.id === x.assignmentId)! }))
      .filter(({ a }) => a && (a.status === "active" || a.status === "completed"))
      .sort((p, q) => q.a.dueAt - p.a.dueAt)
      .slice(0, 5)
      .map((r) => ({ ...r, shown: shownStatus(r.a, r.x, now) }));
  }, [s, st.submissions, st.assignments]);

  return (
    <Modal open={!!s} onClose={onClose} variant="drawer" label="Student profile">
      {s && (
        <>
          <div className="relative shrink-0 border-b border-line">
            <div className="hero !rounded-none h-[104px]" aria-hidden />
            <IconButton icon={X} label="Close" onClick={onClose} className="absolute right-3 top-3 text-white hover:bg-white/15 hover:text-white" />
            <div className="flex items-end gap-4 px-6 pb-5">
              <Avatar name={s.name} size={76} className="-mt-10 ring-4 ring-surface" />
              <div className="min-w-0 flex-1 pb-0.5">
                <h2 className="truncate text-xl font-bold">{s.name}</h2>
                <p className="truncate text-sm text-muted">{st.batches.find((b) => b.id === s.batchId)?.name} · {s.roll}</p>
              </div>
              <Chip tone={FLAG[s.flag].tone} dot>{FLAG[s.flag].label}</Chip>
            </div>
          </div>
          <div className="space-y-7 overflow-y-auto px-6 py-6">
            <div className="flex flex-wrap gap-2.5">
              <Button variant="primary" icon={MessageCircle} onClick={() => toast(`Nudge sent to ${s.name.split(" ")[0]} on WhatsApp`)}>Send a nudge</Button>
              <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-2"><Phone size={17} /> {s.phone}</a>
            </div>

            {s.reasons.length > 0 && (
              <div className="rounded-2xl bg-warn-soft p-4">
                <p className="mb-2 text-sm font-bold text-warn">Why this student is flagged</p>
                <ul className="space-y-1 text-[14px] text-body">{s.reasons.map((r) => <li key={r}>• {r}</li>)}</ul>
                <p className="mt-3 text-[13px] text-muted">A short, friendly call this week usually helps most.</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[["Attendance", `${s.attendance}%`], ["Average score", `${s.avgScore}%`], ["On time", `${s.onTime}%`]].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-line p-4"><p className="text-[13px] text-muted">{l}</p><p className="mt-1 text-2xl font-bold text-ink tnum">{v}</p></div>
              ))}
            </div>
            <p className="-mt-3 text-xs text-muted">Last active {s.lastActiveHrs < 24 ? fmtAgo(Date.now() - s.lastActiveHrs * 3_600_000) : `${Math.round(s.lastActiveHrs / 24)} days ago`}</p>

            <div>
              <p className="mb-3 text-sm font-bold text-ink">Score over six weeks</p>
              <LineChart data={s.trend} labels={["W1", "W2", "W3", "W4", "W5", "W6"]} unit="%" height={130} min={Math.max(0, Math.min(...s.trend) - 12)} max={100} />
            </div>

            <div>
              <p className="mb-3 text-sm font-bold text-ink">By subject</p>
              <HBars items={(Object.keys(SUBJECTS) as SubjectId[]).map((k) => ({ label: SUBJECTS[k].short, value: s.subjectScores[k], color: SUBJECTS[k].color }))} />
            </div>

            <div>
              <p className="mb-3 text-sm font-bold text-ink">Recent assignments</p>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {recent.map(({ a, x, shown }) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{a.title}</span>
                    {x.score !== undefined && <span className="text-sm font-bold text-ink tnum">{x.score}/{a.maxMarks}</span>}
                    <StatusChip status={shown} />
                  </li>
                ))}
                {recent.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No assignments yet.</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
