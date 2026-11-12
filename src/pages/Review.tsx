import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, CircleCheck, CornerUpLeft, FileText, RotateCcw, Zap } from "lucide-react";
import { useStore } from "../store/store";
import { questionById } from "../data/questions";
import { FEEDBACK_CHIPS, sampleAnswer } from "../data/samples";
import type { Assignment, Submission } from "../lib/types";
import { cn, fmtAgo, fmtWhen, mulberry32 } from "../lib/utils";
import { dueFor } from "../lib/selectors";
import { Avatar, Button, Chip, Empty, Kbd, PageHeader, StackBar, Textarea } from "../components/ui";
import { useToast } from "../components/toast";

export function Review() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const st = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const a = st.assignments.find((x) => x.id === id);
  const subs = st.subsOf(id ?? "");

  const queue = useMemo(() => subs.filter((s) => s.status === "submitted").sort((x, y) => (x.submittedAt ?? 0) - (y.submittedAt ?? 0)), [subs]);
  const wanted = params.get("s");
  const current: Submission | undefined = subs.find((s) => s.studentId === wanted && (s.status === "submitted" || s.status === "reviewed" || s.status === "redo")) ?? queue[0];

  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [total] = useState(queue.length);

  useEffect(() => {
    if (!current || !a) return;
    setScore(current.score ?? Math.round(a.maxMarks * 0.8));
    setFeedback(current.feedback ?? "");
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (redo: boolean) => {
    if (!current || !a) return;
    const next = queue.find((s) => s.id !== current.id);
    st.review(current.id, score, feedback.trim(), redo);
    toast(redo ? `${st.nameOf(current.studentId).split(" ")[0]} will redo this and resubmit` : `Saved ${score} out of ${a.maxMarks}. The student has been told.`);
    if (next) setParams({ s: next.studentId }, { replace: true });
    else setParams({}, { replace: true });
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && current?.status !== undefined && a?.type !== "quiz") { e.preventDefault(); save(false); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!a) return <Empty icon={FileText} title="We could not find that assignment" action={<Button onClick={() => nav("/assignments")}>Back</Button>} />;

  if (!current) {
    return (
      <div>
        <PageHeader back={{ to: `/assignments/${a.id}`, label: a.title }} title="Reviewing" />
        <div className="card">
          <Empty art="caught" icon={CircleCheck} title="Everything is reviewed" body="Every submission for this assignment has a mark and feedback. Students have been told." action={<Button variant="primary" onClick={() => nav(`/assignments/${a.id}`)}>See the results</Button>} />
        </div>
      </div>
    );
  }

  const stu = st.students.find((x) => x.id === current.studentId)!;
  const done = Math.max(0, total - queue.length);
  const late = !!current.submittedAt && current.submittedAt > dueFor(a, current);
  const isQuiz = a.type === "quiz";
  const idx = queue.findIndex((s) => s.id === current.id);

  return (
    <div>
      <PageHeader
        back={{ to: `/assignments/${a.id}`, label: a.title }}
        title={queue.length ? `Reviewing ${queue.length} waiting` : "Reviewing"}
        subtitle={<span className="flex items-center gap-3"><span className="w-40"><StackBar total={Math.max(total, 1)} parts={[{ value: done, color: "var(--color-ok)" }]} height={6} /></span>{done} done this session</span>}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)_340px]">
        <aside className="card hidden overflow-hidden lg:block">
          <p className="eyebrow border-b border-line px-4 py-3">Oldest first</p>
          <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
            {(queue.some((q) => q.id === current.id) ? queue : [current, ...queue]).map((s) => {
              const n = st.nameOf(s.studentId);
              const on = s.id === current.id;
              return (
                <li key={s.id}>
                  <button onClick={() => setParams({ s: s.studentId }, { replace: true })} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", on ? "bg-navy-50" : "hover:bg-surface-2")}>
                    <Avatar name={n} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm font-semibold", on ? "text-navy" : "text-ink")}>{n}</span>
                      <span className="block truncate text-xs text-muted">{s.submittedAt ? fmtAgo(s.submittedAt) : ""}</span>
                    </span>
                    {s.status === "reviewed" && <Check size={15} className="text-ok" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="card min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
            <Avatar name={stu.name} size={42} />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-ink">{stu.name}</p>
              <p className="text-[13px] text-muted">{st.batches.find((b) => b.id === stu.batchId)?.short} · {stu.roll} · handed in {current.submittedAt ? fmtWhen(current.submittedAt) : "—"}</p>
            </div>
            {late && <Chip tone="warn" dot>Handed in late</Chip>}
            {current.status === "reviewed" && <Chip tone="ok" dot>Already reviewed</Chip>}
          </div>
          <div className="p-5 sm:p-7">
            <Work a={a} s={current} />
          </div>
        </section>

        <aside className="card min-w-0 space-y-6 p-5 lg:sticky lg:top-[92px]">
          {isQuiz ? (
            <div className="text-center">
              <span className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><Zap size={22} /></span>
              <p className="text-[34px] font-bold leading-none text-ink tnum">{current.score}<span className="text-lg font-semibold text-muted">/{a.maxMarks}</span></p>
              <p className="mt-2 text-sm text-muted">Marked automatically. Nothing to review.</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="score" className="mb-2 block text-sm font-bold text-ink">Marks</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1.5 rounded-2xl border border-line-strong bg-surface-2 px-4 py-2">
                    <input id="score" type="number" min={0} max={a.maxMarks} value={score} onChange={(e) => setScore(Math.min(a.maxMarks, Math.max(0, Number(e.target.value) || 0)))} className="w-16 bg-transparent text-3xl font-bold text-ink outline-none tnum" />
                    <span className="text-base font-semibold text-muted">/ {a.maxMarks}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[["Full", 1], ["80%", 0.8], ["60%", 0.6], ["40%", 0.4]].map(([l, f]) => (
                    <button key={l} onClick={() => setScore(Math.round(a.maxMarks * (f as number)))} className="rounded-full border border-line-strong px-3 py-1 text-[13px] font-semibold text-body transition-colors hover:bg-navy-50 hover:text-navy">{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="fb" className="mb-2 block text-sm font-bold text-ink">Feedback for {stu.name.split(" ")[0]}</label>
                <Textarea id="fb" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={5} placeholder="One or two kind, specific sentences help the most." />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {FEEDBACK_CHIPS.map((c) => (
                    <button key={c.label} onClick={() => setFeedback((f) => (f ? `${f.trim()} ${c.text}` : c.text))} className="rounded-full bg-bg px-3 py-1 text-xs font-semibold text-muted transition-colors hover:bg-sky-50 hover:text-sky-600">+ {c.label}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Button variant="primary" size="lg" className="w-full" icon={Check} onClick={() => save(false)}>
                  {current.status === "reviewed" ? "Update" : queue.length > 1 ? "Save and next" : "Save"}
                </Button>
                <Button className="w-full" icon={RotateCcw} onClick={() => save(true)} disabled={!feedback.trim()} title={feedback.trim() ? "" : "Add feedback so the student knows what to fix"}>Ask for a redo</Button>
                <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted"><Kbd>⌘</Kbd><Kbd>Enter</Kbd> to save and move on</p>
              </div>
            </>
          )}
          {queue.length > 1 && idx >= 0 && (
            <button onClick={() => { const n = queue[(idx + 1) % queue.length]; setParams({ s: n.studentId }, { replace: true }); }} className="flex w-full items-center justify-center gap-1.5 text-[13px] font-semibold text-muted hover:text-navy"><CornerUpLeft size={14} className="rotate-180" /> Skip for now</button>
          )}
        </aside>
      </div>
    </div>
  );
}

export function Work({ a, s }: { a: Assignment; s: Submission }) {
  if (a.type === "quiz") {
    return (
      <ol className="space-y-5">
        {a.questionIds.map((qid, i) => {
          const q = questionById(qid)!;
          const pick = s.picks?.[i];
          return (
            <li key={qid}>
              <p className="text-[15px] font-semibold leading-snug text-ink">{i + 1}. {q.text.split("\n")[0]}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {q.options.map((o, k) => (
                  <li key={k} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", k === q.answer ? "border-ok/40 bg-ok-soft text-ok" : k === pick ? "border-bad/40 bg-bad-soft text-bad" : "border-line text-muted")}>
                    <span className="font-bold">{String.fromCharCode(65 + k)}</span> {o}
                    {k === q.answer && <Check size={15} className="ml-auto" />}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    );
  }
  const text = s.answer && s.answer.length > 70 ? s.answer : sampleAnswer(a, s.studentId);
  return (
    <div className="space-y-6">
      {(a.type === "written" || a.type === "mixed") && (
        <div>
          <p className="eyebrow mb-3">Written answer</p>
          <div className="whitespace-pre-line rounded-2xl bg-surface-2 p-5 text-[15px] leading-[1.75] text-ink">{text}</div>
        </div>
      )}
      {(a.type === "file" || a.type === "mixed") && (
        <div>
          <p className="eyebrow mb-3">Uploaded work</p>
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-bad-soft text-bad"><FileText size={20} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{s.fileName ?? "work.pdf"}</p><p className="text-xs text-muted">PDF · 1.4 MB · 2 pages</p></div>
          </div>
          <Notebook seed={s.studentId + a.id} />
        </div>
      )}
    </div>
  );
}

/** A believable photo of handwritten work, drawn from the student's id so it is stable. */
function Notebook({ seed }: { seed: string }) {
  const rng = mulberry32([...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 11));
  const lines = Array.from({ length: 13 }, (_, i) => {
    const y = 46 + i * 30;
    let x = 52 + rng() * 6;
    const end = 520 - rng() * (i % 4 === 3 ? 260 : 60);
    let d = `M${x.toFixed(1)},${y}`;
    while (x < end) {
      const w = 4 + rng() * 9;
      d += ` q${(w / 2).toFixed(1)},${(-6 - rng() * 7).toFixed(1)} ${w.toFixed(1)},${(rng() * 4 - 2).toFixed(1)}`;
      x += w;
      if (rng() < 0.12) { x += 9; d += ` m9,0`; }
    }
    return d;
  });
  return (
    <svg viewBox="0 0 580 440" className="w-full rounded-2xl border border-line bg-[#fdfcf6] shadow-inner" role="img" aria-label="Photo of handwritten work">
      <line x1="40" y1="0" x2="40" y2="440" stroke="#e8a1a1" strokeWidth="1.2" />
      {Array.from({ length: 14 }, (_, i) => <line key={i} x1="0" x2="580" y1={50 + i * 30} y2={50 + i * 30} stroke="#cfdcec" strokeWidth="1" />)}
      {lines.map((d, i) => <path key={i} d={d} fill="none" stroke="#25346b" strokeWidth="1.7" strokeLinecap="round" opacity={0.78} />)}
    </svg>
  );
}
