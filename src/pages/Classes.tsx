import { useMemo, useState } from "react";
import { CalendarPlus, Clock, TriangleAlert, Users, Video } from "lucide-react";
import { useStore } from "../store/store";
import { ME_STUDENT, ME_TEACHER } from "../data/seed";
import { DAY, HOUR, SUBJECTS, cn, fmtLeft, fmtTime, startOfDay } from "../lib/utils";
import type { LiveClass, SubjectId } from "../lib/types";
import { Button, Chip, Field, Input, Modal, ModalFoot, ModalHead, PageHeader, Select, SubjectDot } from "../components/ui";
import { useToast } from "../components/toast";

const START = 7;
const END = 21;
const ROW = 46;

export function Classes() {
  const st = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const now = Date.now();
  const me = st.students.find((s) => s.id === ME_STUDENT)!;
  const scope = (c: LiveClass) => st.role === "admin" || (st.role === "teacher" ? c.teacherId === ME_TEACHER : c.batchId === me.batchId);
  const classes = st.classes.filter(scope);
  const monday = startOfDay(now) - ((new Date(now).getDay() + 6) % 7) * DAY;
  const days = Array.from({ length: 6 }, (_, i) => monday + i * DAY);
  const today = startOfDay(now);

  const live = classes.find((c) => now >= c.startAt && now < c.startAt + c.durationMin * 60_000);
  const next = classes.filter((c) => c.startAt > now).sort((a, b) => a.startAt - b.startAt)[0];

  const clashes = useMemo(() => {
    const set = new Set<string>();
    const list = st.classes.filter((c) => c.id !== "live-now");
    for (const x of list) for (const y of list) {
      if (x.id < y.id && x.teacherId === y.teacherId && x.startAt < y.startAt + y.durationMin * 60_000 && y.startAt < x.startAt + x.durationMin * 60_000) { set.add(x.id); set.add(y.id); }
    }
    return set;
  }, [st.classes]);
  const clashList = classes.filter((c) => clashes.has(c.id));
  const hours = Array.from({ length: END - START }, (_, i) => START + i);

  return (
    <div>
      <PageHeader
        icon={Video}
        title="Live classes"
        subtitle={st.role === "student" ? "Your timetable for this week." : "The week at a glance. We warn you before two classes collide."}
        actions={st.role === "admin" ? <Button variant="primary" icon={CalendarPlus} onClick={() => setOpen(true)}>Schedule a class</Button> : undefined}
      />

      {(live || next) && (
        <section className={cn("card mb-6 flex flex-wrap items-center gap-x-6 gap-y-4 p-5", live && "border-bad/30")}>
          <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-2xl", live ? "bg-bad-soft text-bad" : "bg-sky-50 text-sky-600")}><Video size={24} /></span>
          <div className="min-w-0 flex-1 basis-64">
            {live ? <Chip tone="bad"><span className="live-dot" /> Live now</Chip> : <Chip tone="sky" dot>Up next · in {fmtLeft(next.startAt).replace(" left", "")}</Chip>}
            <p className="mt-1.5 truncate text-lg font-bold text-ink">{(live ?? next).title}</p>
            <p className="text-[13px] text-muted">{st.batches.find((b) => b.id === (live ?? next).batchId)?.short} · {st.teachers.find((t) => t.id === (live ?? next).teacherId)?.name} · {fmtTime((live ?? next).startAt)}</p>
          </div>
          {live && st.role === "admin" && <span className="flex items-center gap-2 text-sm text-body"><Users size={17} className="text-muted" /> <b className="text-ink tnum">{Math.round((st.batches.find((b) => b.id === live.batchId)?.studentIds.length ?? 0) * 0.81)}</b> students joined</span>}
          <Button variant={live ? "primary" : "secondary"} icon={Video} onClick={() => toast(live ? "Opening the class room…" : "You will get a reminder 10 minutes before")}>{live ? (st.role === "student" ? "Join class" : "Open class") : "Remind me"}</Button>
        </section>
      )}

      {clashList.length > 0 && st.role !== "student" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warn-dot/40 bg-warn-soft p-4">
          <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">One teacher is booked for two classes at the same time</p>
            <p className="mt-0.5 text-[13px] text-body">{st.teachers.find((t) => t.id === clashList[0].teacherId)?.name} on {new Date(clashList[0].startAt).toLocaleDateString("en-IN", { weekday: "long" })} at {fmtTime(clashList[0].startAt)}: {clashList.map((c) => c.title).join(" and ")}.</p>
          </div>
          {st.role === "admin" && <Button size="sm" onClick={() => toast("Moved “Mock Test · Doubt Session” to 11:00 AM. Both batches have been told.")}>Move one</Button>}
        </div>
      )}

      <section className="card hidden overflow-hidden md:block" aria-label="Week timetable">
        <div className="grid border-b border-line bg-surface-2" style={{ gridTemplateColumns: "56px repeat(6, minmax(0, 1fr))" }}>
          <span />
          {days.map((d) => (
            <div key={d} className={cn("px-3 py-3 text-center", d === today && "bg-sky-50")}>
              <p className={cn("text-xs font-bold uppercase tracking-wide", d === today ? "text-sky-600" : "text-muted")}>{new Date(d).toLocaleDateString("en-IN", { weekday: "short" })}</p>
              <p className={cn("text-lg font-bold tnum", d === today ? "text-navy" : "text-ink")}>{new Date(d).getDate()}</p>
            </div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(6, minmax(0, 1fr))", height: hours.length * ROW }}>
          <div className="relative">{hours.map((h, i) => <span key={h} className="absolute right-2 -translate-y-2 text-[11px] font-medium text-faint tnum" style={{ top: i * ROW }}>{h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}</span>)}</div>
          {days.map((d) => (
            <div key={d} className={cn("relative border-l border-line", d === today && "bg-sky-50/40")}>
              {hours.map((h, i) => <span key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * ROW }} />)}
              {classes.filter((c) => startOfDay(c.startAt) === d).map((c, _i, dayList) => {
                const crowd = dayList.filter((o) => o.startAt < c.startAt + c.durationMin * 60_000 && c.startAt < o.startAt + o.durationMin * 60_000).sort((x, y) => x.id.localeCompare(y.id));
                const slot = crowd.findIndex((o) => o.id === c.id);
                const mins = (c.startAt - d) / 60_000 - START * 60;
                const top = (mins / 60) * ROW;
                const h = (c.durationMin / 60) * ROW;
                const s = SUBJECTS[c.subject];
                const isLive = now >= c.startAt && now < c.startAt + c.durationMin * 60_000;
                const clash = clashes.has(c.id);
                if (top < 0 || top > hours.length * ROW) return null;
                return (
                  <div key={c.id} className={cn("absolute overflow-hidden rounded-lg border-l-[3px] px-2 py-1.5", clash && "ring-2 ring-warn-dot")} style={{ top: top + 1, height: h - 2, left: `calc(${(slot / crowd.length) * 100}% + 4px)`, width: `calc(${100 / crowd.length}% - 8px)`, background: s.soft, borderColor: s.color }}>
                    <p className="flex items-center gap-1 truncate text-xs font-bold leading-tight text-ink">{isLive && <span className="live-dot !size-1.5" />}{c.title}</p>
                    <p className="truncate text-[11px] leading-tight text-muted">{st.batches.find((b) => b.id === c.batchId)?.short} · {st.teachers.find((t) => t.id === c.teacherId)?.name.split(" ")[0]}</p>
                  </div>
                );
              })}
              {d === today && now >= startOfDay(now) + START * HOUR && now < startOfDay(now) + END * HOUR && (
                <span className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: ((now - startOfDay(now)) / HOUR - START) * ROW }}><span className="size-2 -ml-1 rounded-full bg-bad" /><span className="h-px flex-1 bg-bad" /></span>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-5 md:hidden">
        {days.map((d) => {
          const list = classes.filter((c) => startOfDay(c.startAt) === d).sort((a, b) => a.startAt - b.startAt);
          if (!list.length) return null;
          return (
            <section key={d}>
              <h2 className={cn("mb-2 text-sm font-bold", d === today ? "text-navy" : "text-muted")}>{d === today ? "Today" : new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</h2>
              <ul className="card divide-y divide-line overflow-hidden">
                {list.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-16 shrink-0 text-[13px] font-bold text-ink tnum">{fmtTime(c.startAt)}</span>
                    <SubjectDot subject={c.subject} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{c.title}</span><span className="block truncate text-xs text-muted">{st.batches.find((b) => b.id === c.batchId)?.short}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        {(Object.keys(SUBJECTS) as SubjectId[]).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><SubjectDot subject={k} />{SUBJECTS[k].name}</span>)}
        <span className="inline-flex items-center gap-1.5"><Clock size={13} /> Each class runs 90 minutes</span>
      </div>

      <ScheduleDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function ScheduleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const st = useStore();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<SubjectId>("quant");
  const [batchId, setBatchId] = useState("b1");
  const [teacherId, setTeacherId] = useState("t1");
  const [when, setWhen] = useState(() => { const d = new Date(Date.now() + DAY); d.setHours(17, 0, 0, 0); return d; });
  const pad = (n: number) => String(n).padStart(2, "0");
  const val = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(when.getHours())}:${pad(when.getMinutes())}`;
  const busy = st.classes.find((c) => c.teacherId === teacherId && c.startAt < when.getTime() + 90 * 60_000 && when.getTime() < c.startAt + c.durationMin * 60_000);

  return (
    <Modal open={open} onClose={onClose} label="Schedule a class">
      <ModalHead title="Schedule a class" subtitle="Students in the batch are told straight away." onClose={onClose} />
      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <Field label="Topic">{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Ratio and Proportion" />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject">{(id) => <Select id={id} value={subject} onChange={(e) => setSubject(e.target.value as SubjectId)}>{(Object.keys(SUBJECTS) as SubjectId[]).map((k) => <option key={k} value={k}>{SUBJECTS[k].short}</option>)}</Select>}</Field>
          <Field label="Batch">{(id) => <Select id={id} value={batchId} onChange={(e) => setBatchId(e.target.value)}>{st.batches.map((b) => <option key={b.id} value={b.id}>{b.short}</option>)}</Select>}</Field>
          <Field label="Teacher">{(id) => <Select id={id} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>{st.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>}</Field>
          <Field label="Date and time">{(id) => <Input id={id} type="datetime-local" value={val} onChange={(e) => e.target.value && setWhen(new Date(e.target.value))} />}</Field>
        </div>
        {busy && <p className="flex items-start gap-2 rounded-xl bg-warn-soft px-4 py-3 text-[13px] font-medium text-warn"><TriangleAlert size={16} className="mt-0.5 shrink-0" /> {st.teachers.find((t) => t.id === teacherId)?.name.split(" ")[0]} already has “{busy.title}” at that time. Pick another slot or another teacher.</p>}
      </div>
      <ModalFoot>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={title.trim().length < 3 || !!busy} onClick={() => { st.scheduleClass({ title: title.trim(), subject, batchId, teacherId, startAt: when.getTime(), durationMin: 90 }); toast("Class scheduled. The batch has been told."); setTitle(""); onClose(); }}>Schedule</Button>
      </ModalFoot>
    </Modal>
  );
}
