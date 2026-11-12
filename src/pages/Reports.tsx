import { useMemo, useState } from "react";
import { ChartColumn, Download } from "lucide-react";
import { useStore } from "../store/store";
import { QUESTIONS } from "../data/questions";
import { SUBJECTS, cn, mulberry32 } from "../lib/utils";
import { dueFor } from "../lib/selectors";
import type { SubjectId } from "../lib/types";
import { Button, CardHead, Chip, PageHeader, Select, SubjectTag, Tabs, Toggle } from "../components/ui";
import { Columns, HBars, Heatmap, LineChart } from "../components/charts";
import { StatTile } from "../components/bits";
import { useToast } from "../components/toast";

type T = "overview" | "subject" | "time" | "question";
const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

export function Reports() {
  const st = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<T>("overview");
  const [batch, setBatch] = useState("all");
  const [weekly, setWeekly] = useState(true);

  const students = st.students.filter((s) => batch === "all" || s.batchId === batch);
  const avg = (f: (s: (typeof students)[number]) => number) => Math.round(students.reduce((n, s) => n + f(s), 0) / Math.max(1, students.length));
  const score = avg((s) => s.avgScore);
  const rng = useMemo(() => mulberry32(batch.length * 7 + 3), [batch]);
  const trend = useMemo(() => Array.from({ length: 8 }, (_, i) => Math.round(score - 9 + i * 1.3 + (rng() - 0.5) * 3)), [score, rng]);
  const handed = st.submissions.filter((s) => s.submittedAt && (batch === "all" || st.students.find((x) => x.id === s.studentId)?.batchId === batch));
  const aMap = new Map(st.assignments.map((a) => [a.id, a]));
  const onTime = handed.length ? Math.round((handed.filter((s) => s.submittedAt! <= dueFor(aMap.get(s.assignmentId)!, s)).length / handed.length) * 100) : 0;
  const dist = [0, 0, 0, 0, 0];
  students.forEach((s) => { dist[Math.min(4, Math.floor(s.avgScore / 20))]++; });
  const stack = useMemo(() => Array.from({ length: 8 }, (_, i) => { const ot = Math.round(62 + i * 2.4 + (rng() - 0.5) * 6); const late = Math.round(22 - i * 0.9 + (rng() - 0.5) * 3); return { label: WEEKS[i], value: 100, stack: [{ value: ot, color: "var(--color-ok)" }, { value: late, color: "var(--color-warn-dot)" }, { value: Math.max(2, 100 - ot - late), color: "var(--color-bad)" }] }; }), [rng]);

  const heat = useMemo(() => {
    const r = mulberry32(17 + batch.length);
    const slotBase = [0.28, 0.46, 0.38, 0.5, 0.86, 0.62];
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((_, d) => slotBase.map((b, k) => Math.min(1, Math.max(0.04, b * (d >= 5 ? (k < 3 ? 1.25 : 0.7) : 1) + (r() - 0.5) * 0.18))));
  }, [batch]);

  const topics = useMemo(() => {
    const names: [string, SubjectId][] = [["Percentage", "quant"], ["Profit and loss", "quant"], ["Number series", "quant"], ["Time and work", "quant"], ["Syllogism", "reasoning"], ["Blood relations", "reasoning"], ["Direction sense", "reasoning"], ["Grammar", "english"], ["Vocabulary", "english"], ["Reading comprehension", "english"], ["Polity", "ga"], ["Geography", "ga"]];
    const r = mulberry32(99 + batch.length);
    return names.map(([n, s]) => ({ n, s, v: Math.round(48 + r() * 34) })).sort((a, b) => a.v - b.v);
  }, [batch]);

  const buckets = [
    { label: "Under 30s", value: 14, acc: 41 }, { label: "30–60s", value: 31, acc: 63 }, { label: "60–90s", value: 34, acc: 74 }, { label: "90–120s", value: 15, acc: 71 }, { label: "Over 2 min", value: 6, acc: 58 },
  ];

  const hardest = useMemo(() => {
    const r = mulberry32(5);
    return QUESTIONS.map((q) => ({ q, correct: Math.round(28 + r() * 62), time: Math.round(35 + r() * 80), used: st.assignments.filter((a) => a.questionIds.includes(q.id)).length })).sort((a, b) => a.correct - b.correct).slice(0, 6);
  }, [st.assignments]);

  const exportCsv = () => {
    const head = ["Name", "Roll no", "Batch", "Attendance %", "Average score %", "On-time %", "Status"];
    const rows = students.map((s) => [s.name, s.roll, st.batches.find((b) => b.id === s.batchId)?.short ?? "", s.attendance, s.avgScore, s.onTime, s.flag === "ok" ? "On track" : s.flag === "watch" ? "Keep an eye" : "Needs attention"]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "student-performance.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Downloaded student-performance.csv");
  };

  return (
    <div>
      <PageHeader
        icon={ChartColumn}
        title="Reports"
        subtitle="Four ways to look at the same results, from the big picture down to a single question."
        actions={<>
          <Select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-auto min-w-44" aria-label="Batch">
            <option value="all">All batches</option>
            {st.batches.map((b) => <option key={b.id} value={b.id}>{b.short}</option>)}
          </Select>
          <Button icon={Download} onClick={exportCsv}>Download CSV</Button>
        </>}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-2 sm:px-5">
          <Tabs<T> value={tab} onChange={setTab} items={[{ id: "overview", label: "Overview" }, { id: "subject", label: "By subject" }, { id: "time", label: "By time" }, { id: "question", label: "By question" }]} />
          <label className="mb-2 flex items-center gap-2.5 text-[13px] font-semibold text-muted">Email me this every Monday <Toggle checked={weekly} onChange={(v) => { setWeekly(v); toast(v ? "You will get this every Monday at 8 AM" : "Weekly email turned off"); }} label="Weekly email" /></label>
        </div>

        <div className="space-y-6 border-t border-line bg-bg/60 p-4 sm:p-6">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Average score" value={`${score}%`} tone="good" hint="Up 3 points in 8 weeks" spark={trend} sparkColor="var(--color-sky)" />
                <StatTile label="Handed in on time" value={`${onTime}%`} hint="Of everything handed in" />
                <StatTile label="Class attendance" value={`${avg((s) => s.attendance)}%`} hint="Average per student" />
                <StatTile label="Need attention" value={students.filter((s) => s.flag === "risk").length} tone="warn" hint={`of ${students.length} students`} to="/students?filter=risk" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="card"><CardHead title="Average score, week by week" /><div className="px-5 pb-5 pt-5"><LineChart data={trend} labels={WEEKS} unit="%" /></div></section>
                <section className="card"><CardHead title="How work came in" hint={<span className="flex flex-wrap gap-x-4 gap-y-1"><Key c="var(--color-ok)" l="On time" /><Key c="var(--color-warn-dot)" l="Late" /><Key c="var(--color-bad)" l="Missing" /></span>} /><div className="px-5 pb-5 pt-5"><Columns items={stack.map((s) => ({ ...s, tag: "" }))} height={170} max={100} /></div></section>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="card"><CardHead title="Where students score" hint="Number of students in each range" /><div className="px-5 pb-5 pt-5"><Columns height={150} items={dist.map((v, i) => ({ label: `${i * 20}–${i * 20 + 20}%`, value: v, color: i < 2 ? "var(--color-warn-dot)" : "var(--color-sky)" }))} /></div></section>
                <section className="card"><CardHead title="When students are most active" hint="Evenings are the busiest time to send work" /><div className="px-5 pb-5 pt-5"><Heatmap rows={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} cols={["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"]} values={heat} /></div></section>
              </div>
            </>
          )}

          {tab === "subject" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card"><CardHead title="Accuracy by subject" /><div className="px-5 pb-5 pt-5"><HBars items={(Object.keys(SUBJECTS) as SubjectId[]).map((k) => ({ label: SUBJECTS[k].name, value: avg((s) => s.subjectScores[k]), color: SUBJECTS[k].color }))} /></div></section>
              <section className="card"><CardHead title="Topics to practise next" hint="Lowest accuracy first" />
                <ul className="mt-3 divide-y divide-line">
                  {topics.slice(0, 6).map((t) => (
                    <li key={t.n} className="flex items-center gap-3 px-5 py-3">
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{t.n}</span><SubjectTag subject={t.s} /></span>
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line"><span className={cn("block h-full rounded-full", t.v < 55 ? "bg-bad" : "bg-warn-dot")} style={{ width: `${t.v}%` }} /></span>
                      <span className="w-10 text-right text-sm font-bold text-ink tnum">{t.v}%</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {tab === "time" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card"><CardHead title="Time spent on each question" hint="Share of answers in each time range" /><div className="px-5 pb-5 pt-5"><Columns items={buckets.map((b) => ({ label: b.label, value: b.value, tag: `${b.value}%` }))} height={170} /></div></section>
              <section className="card"><CardHead title="Accuracy for each range" hint="Rushing and overthinking both cost marks" /><div className="px-5 pb-5 pt-5"><HBars items={buckets.map((b) => ({ label: b.label, value: b.acc, color: b.acc >= 70 ? "var(--color-ok)" : "var(--color-sky)" }))} /><p className="mt-5 rounded-xl bg-sky-50 px-4 py-3 text-[13px] font-medium text-sky-600">The sweet spot is 60 to 90 seconds per question, with 74% correct.</p></div></section>
            </div>
          )}

          {tab === "question" && (
            <section className="card overflow-hidden">
              <CardHead title="Hardest questions" hint="If almost no one gets a question right, it may be unclear. Worth a look." />
              <ul className="mt-3 divide-y divide-line">
                {hardest.map(({ q, correct, time, used }) => (
                  <li key={q.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                    <div className="min-w-0 flex-1 basis-72"><p className="text-sm font-semibold leading-snug text-ink">{q.text.split("\n")[0]}</p><p className="mt-1 flex items-center gap-3 text-xs text-muted"><SubjectTag subject={q.subject} />{q.topic} · used in {used} {used === 1 ? "assignment" : "assignments"}</p></div>
                    <span className="text-sm text-muted tnum">{time}s average</span>
                    <span className={cn("w-16 text-right text-lg font-bold tnum", correct < 40 ? "text-bad" : "text-ink")}>{correct}%</span>
                    {correct < 40 ? <Chip tone="bad">May be unclear</Chip> : <Chip>Hard</Chip>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Key({ c, l }: { c: string; l: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c }} />{l}</span>;
}
