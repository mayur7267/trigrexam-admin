import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CircleCheck, FileUp, FileText, Hourglass, Lock, Paperclip, RotateCcw, Send, TriangleAlert, X } from "lucide-react";
import { useStore } from "../store/store";
import { ME_STUDENT } from "../data/seed";
import { questionById } from "../data/questions";
import { shownStatus, typeLabel } from "../lib/selectors";
import { cn, fmtAgo, fmtLeft, fmtWhen } from "../lib/utils";
import type { Assignment, Submission } from "../lib/types";
import { Avatar, Button, Chip, Empty, Modal, ModalFoot, ModalHead, PageHeader, Ring, StatusChip, SubjectTag, Textarea } from "../components/ui";
import { Confetti, DueLabel } from "../components/bits";
import { useToast } from "../components/toast";
import { Work } from "./Review";

const REASONS = ["I was unwell", "My internet was down", "A family event", "I need help with this topic"];

export function StudentAssignment() {
  const { id } = useParams();
  const st = useStore();
  const nav = useNavigate();
  const a = st.assignments.find((x) => x.id === id);
  const sub = st.submissions.find((s) => s.assignmentId === id && s.studentId === ME_STUDENT);
  const [askMore, setAskMore] = useState(false);
  if (!a || !sub || a.status === "draft" || a.status === "scheduled") {
    return <Empty icon={FileText} title="This assignment is not available" body="It may not be open yet, or it was not given to you." action={<Button onClick={() => nav("/")}>Back to my work</Button>} />;
  }
  const shown = shownStatus(a, sub);
  const teacher = st.teachers.find((t) => t.id === a.teacherId)!;
  const pendingReq = st.extensions.find((e) => e.assignmentId === a.id && e.studentId === ME_STUDENT && e.status === "pending");
  const canEdit = shown === "todo" || shown === "progress" || shown === "redo" || (shown === "missing" && a.late !== "block");
  const closed = shown === "missing" && a.late === "block";

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        back={{ to: "/", label: "My work" }}
        title={a.title}
        subtitle={<span className="flex flex-wrap items-center gap-x-4 gap-y-1.5"><StatusChip status={shown} /><SubjectTag subject={a.subject} /><span>{typeLabel[a.type]} · {a.maxMarks} marks</span></span>}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {shown === "redo" && (
            <div className="flex gap-3 rounded-2xl border border-amber/30 bg-amber-soft p-5">
              <RotateCcw size={22} className="mt-0.5 shrink-0 text-amber" />
              <div>
                <p className="text-[15px] font-bold text-ink">{teacher.name.split(" ")[0]} asked you to redo this</p>
                <p className="mt-1 text-[14px] leading-relaxed text-body">“{sub.feedback}”</p>
              </div>
            </div>
          )}
          {shown === "missing" && !closed && (
            <div className="flex gap-3 rounded-2xl border border-bad/25 bg-bad-soft p-5">
              <TriangleAlert size={22} className="mt-0.5 shrink-0 text-bad" />
              <div><p className="text-[15px] font-bold text-ink">The deadline passed {fmtLeft(a.dueAt).replace(" overdue", "")} ago</p><p className="mt-1 text-[14px] text-body">You can still hand it in. It will be marked as late{a.late === "penalty" ? " and 10% of the marks are taken off" : ""}.</p></div>
            </div>
          )}
          {closed && (
            <div className="flex gap-3 rounded-2xl border border-line bg-surface p-5"><Lock size={22} className="mt-0.5 shrink-0 text-muted" /><div><p className="text-[15px] font-bold text-ink">This assignment is closed</p><p className="mt-1 text-[14px] text-body">Late work is not accepted. Ask {teacher.name.split(" ")[0]} if you think there is a mistake.</p></div></div>
          )}

          {shown === "reviewed" && <Results a={a} s={sub} teacherName={teacher.name} />}
          {shown === "submitted" && <Waiting a={a} s={sub} teacherName={teacher.name} />}
          {canEdit && (a.type === "quiz" ? <QuizRunner a={a} s={sub} /> : <Editor a={a} s={sub} />)}
        </div>

        <aside className="card min-w-0 space-y-5 p-5 lg:sticky lg:top-[92px]">
          <div>
            <p className="eyebrow mb-1.5">Deadline</p>
            <DueLabel at={Math.max(a.dueAt, sub.extensionUntil ?? 0)} className="text-[15px]" />
            {sub.extensionUntil && sub.extensionUntil > a.dueAt && <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet"><Hourglass size={14} /> You have extra time</p>}
          </div>
          <div>
            <p className="eyebrow mb-1.5">Teacher</p>
            <p className="flex items-center gap-2.5 text-[15px] font-semibold text-ink"><Avatar name={teacher.name} size={30} />{teacher.name}</p>
          </div>
          <div>
            <p className="eyebrow mb-1.5">What to do</p>
            <p className="text-[14px] leading-relaxed text-body">{a.instructions}</p>
          </div>
          {a.late !== "allow" && <p className="rounded-xl bg-bg px-3 py-2.5 text-[13px] text-muted">{a.late === "penalty" ? "Late work loses 10% of the marks." : "Late work is not accepted."}</p>}
          {(shown === "todo" || shown === "progress") && (
            <div className="border-t border-line pt-4">
              {pendingReq ? <p className="flex items-center gap-2 text-[13px] font-semibold text-violet"><Hourglass size={15} /> Request sent to {teacher.name.split(" ")[0]}</p> : (
                <button onClick={() => setAskMore(true)} className="text-sm font-semibold text-sky-600 hover:text-navy">Need more time?</button>
              )}
            </div>
          )}
        </aside>
      </div>

      <AskTime open={askMore} onClose={() => setAskMore(false)} a={a} teacherName={teacher.name} />
    </div>
  );
}

/* ---------------- quiz ---------------- */
function QuizRunner({ a, s }: { a: Assignment; s: Submission }) {
  const st = useStore();
  const [picks, setPicks] = useState<number[]>(s.picks ?? []);
  const [i, setI] = useState(() => Math.min(s.picks?.length ?? 0, a.questionIds.length - 1));
  const q = questionById(a.questionIds[i])!;
  const chosen = picks[i];
  const last = i === a.questionIds.length - 1;

  const choose = (k: number) => {
    const next = [...picks];
    next[i] = k;
    setPicks(next);
    st.saveWork(s.id, { picks: next });
  };
  const go = () => {
    if (last) st.submitWork(s.id, { picks });
    else setI(i + 1);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) choose(n - 1);
      if (e.key === "Enter" && chosen !== undefined) go();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-4 border-b border-line px-6 py-4">
        <p className="text-sm font-bold text-ink">Question {i + 1} of {a.questionIds.length}</p>
        <div className="flex flex-1 gap-1.5">
          {a.questionIds.map((_, k) => <span key={k} className={cn("h-1.5 flex-1 rounded-full transition-colors", k < i || picks[k] !== undefined ? "bg-sky" : "bg-line", k === i && "bg-navy")} />)}
        </div>
      </div>
      <div className="px-6 py-7 sm:px-8">
        <p className="whitespace-pre-line text-xl font-semibold leading-snug text-ink sm:text-[22px]">{q.text}</p>
        <ul className="mt-7 grid gap-3" role="radiogroup" aria-label="Choose your answer">
          {q.options.map((o, k) => {
            const on = chosen === k;
            return (
              <li key={k}>
                <button role="radio" aria-checked={on} onClick={() => choose(k)} className={cn("flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-base font-medium transition-all", on ? "border-navy bg-navy-50 text-ink shadow-[var(--shadow-lift)]" : "border-line text-body hover:border-line-strong hover:bg-surface-2")}>
                  <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors", on ? "bg-navy text-white" : "bg-bg text-muted")}>{String.fromCharCode(65 + k)}</span>
                  {o}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-6 py-4">
        <Button icon={ArrowLeft} disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button>
        <span className="hidden text-[13px] text-muted sm:block">Your answers are saved as you go</span>
        <Button variant="primary" size="lg" iconRight={last ? Check : ArrowRight} disabled={chosen === undefined} onClick={go}>{last ? "Finish and see my score" : "Next"}</Button>
      </div>
    </section>
  );
}

/* ---------------- written / file ---------------- */
function Editor({ a, s }: { a: Assignment; s: Submission }) {
  const st = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [text, setText] = useState(s.status === "redo" ? "" : s.answer ?? "");
  const [file, setFile] = useState<string | undefined>(s.status === "redo" ? undefined : s.fileName);
  const [progress, setProgress] = useState(file ? 100 : 0);
  const [saved, setSaved] = useState<string>(s.startedAt && s.status === "in_progress" ? "Draft saved" : "");
  const timer = useRef<number | undefined>(undefined);

  const needsText = a.type === "written" || a.type === "mixed";
  const needsFile = a.type === "file";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const ready = (!needsText || words >= 5) && (!needsFile || (file && progress === 100));

  const onText = (v: string) => {
    setText(v);
    setSaved("Saving…");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { st.saveWork(s.id, { answer: v }); setSaved("Draft saved"); }, 700);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const pickFile = () => {
    const name = `${st.nameOf(ME_STUDENT).split(" ")[0]}_${a.id}.pdf`;
    setFile(name);
    setProgress(0);
    let p = 0;
    const iv = window.setInterval(() => { p += 14 + Math.random() * 16; if (p >= 100) { p = 100; window.clearInterval(iv); } setProgress(Math.round(p)); }, 120);
  };

  const submit = () => {
    st.submitWork(s.id, { answer: text, fileName: file });
    toast("Handed in. Your teacher has been told.");
    nav("/");
  };

  return (
    <section className="card overflow-hidden">
      <div className="space-y-6 p-6 sm:p-8">
        {needsText && (
          <div>
            <div className="mb-2 flex items-end justify-between">
              <label htmlFor="ans" className="text-sm font-bold text-ink">Your answer</label>
              <span className="text-[13px] text-muted tnum">{words} words{saved && <span className="ml-3 text-ok">{saved}</span>}</span>
            </div>
            <Textarea id="ans" value={text} onChange={(e) => onText(e.target.value)} rows={14} placeholder="Start typing here. It saves on its own, so you can leave and come back." className="text-base leading-[1.75]" />
          </div>
        )}
        {(a.type === "file" || a.type === "mixed") && (
          <div>
            <p className="mb-2 text-sm font-bold text-ink">{a.type === "mixed" ? "Add your working (optional)" : "Your work"}</p>
            {!file ? (
              <button onClick={pickFile} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line-strong px-6 py-10 text-center transition-colors hover:border-sky hover:bg-sky-50/50">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><FileUp size={22} /></span>
                <span className="text-[15px] font-bold text-ink">Choose a photo or PDF</span>
                <span className="text-[13px] text-muted">Clear, well-lit photos of your notebook work well</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-line-strong p-4">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-bad-soft text-bad"><Paperclip size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{file}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-sky transition-[width]" style={{ width: `${progress}%` }} /></div>
                  <p className="mt-1 text-xs text-muted">{progress < 100 ? `Uploading… ${progress}%` : "Uploaded · 1.4 MB"}</p>
                </div>
                <button aria-label="Remove file" onClick={() => { setFile(undefined); setProgress(0); }} className="rounded-lg p-2 text-muted hover:bg-bg hover:text-ink"><X size={18} /></button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-6 py-4 sm:px-8">
        <span className="text-[13px] text-muted">{ready ? "Ready to hand in" : needsText ? "Write at least a few words to continue" : "Add your file to continue"}</span>
        <Button variant="primary" size="lg" icon={Send} disabled={!ready} onClick={submit}>{s.status === "redo" ? "Resubmit" : "Hand it in"}</Button>
      </div>

    </section>
  );
}

/* ---------------- after hand-in ---------------- */
function Waiting({ a, s, teacherName }: { a: Assignment; s: Submission; teacherName: string }) {
  const steps = [
    { label: "Handed in", note: s.submittedAt ? fmtWhen(s.submittedAt) : "", done: true },
    { label: `${teacherName.split(" ")[0]} is reviewing`, note: "Usually within 2 days", done: false, now: true },
    { label: "Marks and feedback", note: "You will get a notification", done: false },
  ];
  return (
    <>
      <section className="card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3"><span className="inline-flex size-11 items-center justify-center rounded-2xl bg-ok-soft text-ok"><CircleCheck size={24} /></span><div><h2 className="text-lg font-bold">You have handed this in</h2><p className="text-sm text-muted">There is nothing more to do.</p></div></div>
        <ol className="grid gap-5 sm:grid-cols-3">
          {steps.map((x, i) => (
            <li key={x.label} className="relative">
              <span className={cn("mb-2 inline-flex size-7 items-center justify-center rounded-full text-xs font-bold", x.done ? "bg-ok text-white" : x.now ? "bg-sky text-white" : "bg-line text-muted")}>{x.done ? <Check size={14} strokeWidth={3.2} /> : i + 1}</span>
              <p className="text-sm font-bold text-ink">{x.label}</p>
              <p className="text-[13px] text-muted">{x.note}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="card p-6 sm:p-8"><p className="eyebrow mb-4">What you handed in</p><Work a={a} s={s} /></section>
    </>
  );
}

function Results({ a, s, teacherName }: { a: Assignment; s: Submission; teacherName: string }) {
  const pct = a.maxMarks ? ((s.score ?? 0) / a.maxMarks) * 100 : 0;
  const color = pct >= 75 ? "var(--color-ok)" : pct >= 50 ? "var(--color-sky)" : "var(--color-warn-dot)";
  return (
    <>
      <section className="card rise relative flex flex-wrap items-center gap-6 p-6 sm:p-8">
        {pct >= 75 && <Confetti />}
        <Ring value={pct} size={104} stroke={11} color={color}><span className="text-xl">{Math.round(pct)}%</span></Ring>
        <div>
          <p className="text-[34px] font-bold leading-none text-ink tnum">{s.score}<span className="text-xl font-semibold text-muted"> / {a.maxMarks}</span></p>
          <p className="mt-2 text-sm text-muted">{s.autoGraded ? "Marked automatically, straight away." : `Reviewed by ${teacherName}${s.reviewedAt ? ` · ${fmtAgo(s.reviewedAt)}` : ""}`}</p>
          {pct >= 75 && <Chip tone="ok" className="mt-3">Strong result</Chip>}
        </div>
      </section>
      {s.feedback && (
        <section className="card p-6 sm:p-8">
          <p className="eyebrow mb-3">Feedback from {teacherName.split(" ")[0]}</p>
          <p className="text-[16px] leading-relaxed text-ink">“{s.feedback}”</p>
        </section>
      )}
      <section className="card p-6 sm:p-8"><p className="eyebrow mb-4">{a.type === "quiz" ? "Your answers" : "What you handed in"}</p><Work a={a} s={s} /></section>
    </>
  );
}

function AskTime({ open, onClose, a, teacherName }: { open: boolean; onClose: () => void; a: Assignment; teacherName: string }) {
  const st = useStore();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const send = () => {
    st.requestExtension(a.id, ME_STUDENT, reason.trim());
    toast(`Request sent to ${teacherName.split(" ")[0]}. You will get a notification.`);
    setReason("");
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} label="Ask for more time">
      <ModalHead title="Ask for more time" subtitle={`${teacherName.split(" ")[0]} will get your request and can say yes in one tap.`} onClose={onClose} />
      <div className="space-y-4 px-6 py-5">
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => <button key={r} onClick={() => setReason(r)} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors", reason === r ? "border-navy bg-navy-50 text-navy" : "border-line-strong text-body hover:bg-bg")}>{r}</button>)}
        </div>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell your teacher what happened, in a sentence or two." rows={4} aria-label="Reason" />
      </div>
      <ModalFoot><Button onClick={onClose}>Cancel</Button><Button variant="primary" icon={Send} disabled={reason.trim().length < 4} onClick={send}>Send request</Button></ModalFoot>
    </Modal>
  );
}
