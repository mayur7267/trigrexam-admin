import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ActivityItem, Assignment, AssignmentType, ExtensionRequest, LatePolicy, LiveClass, Notice, Role, SubjectId, Submission,
} from "../lib/types";
import { HOUR } from "../lib/utils";
import { ME_STUDENT, ME_TEACHER, buildSeed } from "../data/seed";
import { questionById } from "../data/questions";
import type { PlanId } from "../data/plans";

export interface NewAssignment {
  title: string;
  subject: SubjectId;
  type: AssignmentType;
  batchIds: string[];
  teacherId: string;
  instructions: string;
  maxMarks: number;
  releaseAt: number;
  dueAt: number;
  late: LatePolicy;
  reminders: boolean;
  questionIds: string[];
}

export type AccentId = "trigrexam" | "emerald" | "plum" | "saffron" | "slate";
export const ACCENTS: Record<AccentId, { label: string; navy: string; navy700: string; navy50: string; sky: string; sky600: string; sky100: string; sky50: string }> = {
  trigrexam: { label: "Trigrexam blue", navy: "#1f3d7d", navy700: "#19326a", navy50: "#eaf0fb", sky: "#1ea6e4", sky600: "#0b83bd", sky100: "#cdebfa", sky50: "#e6f5fd" },
  emerald: { label: "Emerald", navy: "#0f5f48", navy700: "#0b4a39", navy50: "#e3f3ee", sky: "#22b07a", sky600: "#0f8a5c", sky100: "#c7ecdc", sky50: "#e5f6ee" },
  plum: { label: "Plum", navy: "#4e2a7a", navy700: "#3f2063", navy50: "#efe9f8", sky: "#a35fd1", sky600: "#8138b4", sky100: "#e6d3f4", sky50: "#f3e9fa" },
  saffron: { label: "Saffron", navy: "#8f3f0c", navy700: "#743207", navy50: "#fbeee3", sky: "#ef8a22", sky600: "#b85f08", sky100: "#fbdcb8", sky50: "#fdf0e0" },
  slate: { label: "Slate", navy: "#2b3850", navy700: "#212c40", navy50: "#e8ecf3", sky: "#5f86bd", sky600: "#3f6399", sky100: "#d3deee", sky50: "#e9eff7" },
};

interface Ui {
  role: Role;
  dark: boolean;
  accent: AccentId;
}

type World = Pick<ReturnType<typeof buildSeed>, "students" | "teachers" | "batches" | "courses">;

interface Live {
  assignments: Assignment[];
  submissions: Submission[];
  extensions: ExtensionRequest[];
  notices: Notice[];
  activity: ActivityItem[];
  classes: LiveClass[];
  reminded: Record<string, number>;
  plan: PlanId;
  packs: string[];
}

export interface Store extends Ui, World, Live {
  setRole: (r: Role) => void;
  setDark: (d: boolean) => void;
  setAccent: (a: AccentId) => void;
  setPlan: (p: PlanId) => void;
  activatePack: (id: string) => void;
  createAssignment: (input: NewAssignment, publish: boolean) => string;
  deleteAssignment: (id: string) => void;
  remind: (assignmentId: string, studentIds?: string[]) => number;
  extendDue: (assignmentId: string, until: number) => void;
  grantExtension: (assignmentId: string, studentIds: string[], until: number) => void;
  saveWork: (subId: string, patch: Partial<Submission>) => void;
  submitWork: (subId: string, patch: Partial<Submission>) => void;
  requestExtension: (assignmentId: string, studentId: string, reason: string) => void;
  decideExtension: (id: string, approve: boolean) => void;
  review: (subId: string, score: number | undefined, feedback: string, redo: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: (role: Role) => void;
  scheduleClass: (c: Omit<LiveClass, "id">) => void;
  nameOf: (studentId: string) => string;
  subsOf: (assignmentId: string) => Submission[];
}

const Ctx = createContext<Store | null>(null);

const KEY = "trigrexam-admin-prefs";

/** The phone preview on the "About" page loads this app inside an iframe as a fixed role. */
const EMBED: Role | null = (() => {
  try {
    const v = new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("embed");
    return v === "admin" || v === "teacher" || v === "student" ? v : null;
  } catch {
    return null;
  }
})();

function loadUi(): Ui {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { role: EMBED ?? raw.role ?? "admin", dark: !!raw.dark, accent: raw.accent ?? "trigrexam" };
  } catch {
    return { role: EMBED ?? "admin", dark: false, accent: "trigrexam" };
  }
}

let uid = 1000;
const nid = (p: string) => `${p}${uid++}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [seed] = useState(() => buildSeed(Date.now()));
  const [ui, setUi] = useState<Ui>(loadUi);
  const [live, setLive] = useState<Live>(() => ({
    assignments: seed.assignments, submissions: seed.submissions, extensions: seed.extensions,
    notices: seed.notices, activity: seed.activity, classes: seed.classes, reminded: {},
    plan: "pro", packs: ["pk-free-ssc"],
  }));
  const world: World = seed;

  useEffect(() => {
    if (!EMBED) {
      try { localStorage.setItem(KEY, JSON.stringify(ui)); } catch { /* storage can be blocked */ }
    }
    const root = document.documentElement;
    root.dataset.theme = ui.dark ? "dark" : "light";
    const a = ACCENTS[ui.accent];
    const vars: Record<string, string> = {
      "--color-navy": a.navy, "--color-navy-700": a.navy700, "--color-navy-50": a.navy50,
      "--color-sky": a.sky, "--color-sky-600": a.sky600, "--color-sky-100": a.sky100, "--color-sky-50": a.sky50,
    };
    for (const [k, v] of Object.entries(vars)) {
      if (ui.dark || ui.accent === "trigrexam") root.style.removeProperty(k);
      else root.style.setProperty(k, v);
    }
  }, [ui]);

  const nameOf = useCallback((id: string) => world.students.find((s) => s.id === id)?.name ?? "A student", [world]);
  const subsIndex = useMemo(() => {
    const m = new Map<string, Submission[]>();
    for (const s of live.submissions) {
      const l = m.get(s.assignmentId);
      if (l) l.push(s);
      else m.set(s.assignmentId, [s]);
    }
    return m;
  }, [live.submissions]);
  const subsOf = useCallback((id: string) => subsIndex.get(id) ?? [], [subsIndex]);

  const push = useCallback((fn: (l: Live) => Live) => setLive((l) => fn(l)), []);

  const addActivity = (l: Live, who: string, text: string): Live => ({
    ...l, activity: [{ id: nid("ac"), at: Date.now(), who, text }, ...l.activity].slice(0, 20),
  });

  const store: Store = useMemo(() => ({
    ...ui, ...world, ...live,
    nameOf, subsOf,
    setRole: (role) => setUi((u) => ({ ...u, role })),
    setDark: (dark) => setUi((u) => ({ ...u, dark })),
    setAccent: (accent) => setUi((u) => ({ ...u, accent })),
    setPlan: (plan) => push((l) => addActivity({ ...l, plan }, "You", `changed the plan to ${plan === "pro" ? "Professional" : plan === "business" ? "Business" : "Basic"}`)),
    activatePack: (id) => push((l) => (l.packs.includes(id) ? l : { ...l, packs: [...l.packs, id] })),

    createAssignment: (input, publish) => {
      const id = nid("a");
      const now = Date.now();
      const status = !publish ? "draft" : input.releaseAt <= now ? "active" : "scheduled";
      const a: Assignment = { id, ...input, status, createdAt: now };
      push((l) => {
        let next: Live = { ...l, assignments: [a, ...l.assignments] };
        if (status === "active") {
          const roster = world.batches.filter((b) => a.batchIds.includes(b.id)).flatMap((b) => b.studentIds);
          const subs: Submission[] = roster.map((sid) => ({ id: nid("u"), assignmentId: id, studentId: sid, status: "not_started" }));
          next = { ...next, submissions: [...next.submissions, ...subs] };
          const forMe = roster.includes(ME_STUDENT);
          if (forMe) {
            next = {
              ...next,
              notices: [{ id: nid("n"), audience: "student", kind: "assigned", title: "New assignment", body: a.title, at: now, read: false, link: `/assignments/${id}` }, ...next.notices],
            };
          }
        }
        if (publish) next = addActivity(next, world.teachers.find((t) => t.id === a.teacherId)?.name ?? "Teacher", `published ${a.title}`);
        return next;
      });
      return id;
    },

    deleteAssignment: (id) => push((l) => ({
      ...l,
      assignments: l.assignments.filter((a) => a.id !== id),
      submissions: l.submissions.filter((s) => s.assignmentId !== id),
    })),

    remind: (assignmentId, studentIds) => {
      const isPending = (s: Submission) =>
        s.assignmentId === assignmentId && (s.status === "not_started" || s.status === "in_progress") && (!studentIds || studentIds.includes(s.studentId));
      const count = live.submissions.filter(isPending).length;
      push((l) => {
        const a = l.assignments.find((x) => x.id === assignmentId);
        if (!a) return l;
        const pending = l.submissions.filter(isPending);
        let next: Live = { ...l, reminded: { ...l.reminded, [assignmentId]: Date.now() } };
        next = addActivity(next, "You", `sent a reminder to ${count} students for ${a.title}`);
        if (pending.some((s) => s.studentId === ME_STUDENT)) {
          next = { ...next, notices: [{ id: nid("n"), audience: "student", kind: "reminder", title: "Friendly reminder", body: `${a.title} is waiting for you.`, at: Date.now(), read: false, link: `/assignments/${assignmentId}` }, ...next.notices] };
        }
        return next;
      });
      return count;
    },

    extendDue: (assignmentId, until) => push((l) => {
      const a = l.assignments.find((x) => x.id === assignmentId);
      if (!a) return l;
      let next: Live = { ...l, assignments: l.assignments.map((x) => (x.id === assignmentId ? { ...x, dueAt: until, status: x.status === "completed" ? "active" : x.status } : x)) };
      next = addActivity(next, "You", `extended the deadline for ${a.title}`);
      return next;
    }),

    grantExtension: (assignmentId, studentIds, until) => push((l) => {
      const a = l.assignments.find((x) => x.id === assignmentId);
      if (!a) return l;
      let next: Live = { ...l, submissions: l.submissions.map((s) => (s.assignmentId === assignmentId && studentIds.includes(s.studentId) ? { ...s, extensionUntil: until } : s)) };
      next = addActivity(next, "You", `gave ${studentIds.length} student${studentIds.length === 1 ? "" : "s"} more time on ${a.title}`);
      return next;
    }),

    saveWork: (subId, patch) => push((l) => ({
      ...l,
      submissions: l.submissions.map((s) => (s.id === subId ? { ...s, ...patch, status: s.status === "not_started" ? "in_progress" : s.status, startedAt: s.startedAt ?? Date.now() } : s)),
    })),

    submitWork: (subId, patch) => push((l) => {
      const sub = l.submissions.find((s) => s.id === subId);
      if (!sub) return l;
      const a = l.assignments.find((x) => x.id === sub.assignmentId)!;
      const now = Date.now();
      let merged: Submission = { ...sub, ...patch, submittedAt: now, startedAt: sub.startedAt ?? now };
      if (a.type === "quiz") {
        const per = a.maxMarks / Math.max(1, a.questionIds.length);
        const picks = merged.picks ?? [];
        const correct = a.questionIds.filter((qid, i) => picks[i] === questionById(qid)?.answer).length;
        merged = { ...merged, status: "reviewed", score: correct * per, autoGraded: true, reviewedAt: now };
      } else {
        merged = { ...merged, status: "submitted", feedback: undefined };
      }
      let next: Live = { ...l, submissions: l.submissions.map((s) => (s.id === subId ? merged : s)) };
      const who = world.students.find((s) => s.id === sub.studentId)?.name ?? "A student";
      next = addActivity(next, who, `submitted ${a.title}`);
      if (a.type !== "quiz" && a.teacherId === ME_TEACHER) {
        next = { ...next, notices: [{ id: nid("n"), audience: "teacher", kind: "submitted", title: `${who} submitted work`, body: `${a.title} · waiting for your review`, at: now, read: false, link: `/review/${a.id}?s=${sub.studentId}` }, ...next.notices] };
      }
      return next;
    }),

    requestExtension: (assignmentId, studentId, reason) => push((l) => {
      const a = l.assignments.find((x) => x.id === assignmentId);
      if (!a) return l;
      const req: ExtensionRequest = { id: nid("x"), assignmentId, studentId, reason, requestedAt: Date.now(), status: "pending" };
      const who = world.students.find((s) => s.id === studentId)?.name ?? "A student";
      let next: Live = { ...l, extensions: [req, ...l.extensions] };
      if (a.teacherId === ME_TEACHER) {
        next = { ...next, notices: [{ id: nid("n"), audience: "teacher", kind: "extension", title: `${who} asked for more time`, body: `${a.title}: “${reason}”`, at: Date.now(), read: false, extensionId: req.id }, ...next.notices] };
      }
      return addActivity(next, who, `asked for more time on ${a.title}`);
    }),

    decideExtension: (id, approve) => push((l) => {
      const req = l.extensions.find((x) => x.id === id);
      if (!req) return l;
      const a = l.assignments.find((x) => x.id === req.assignmentId)!;
      const until = Math.max(a.dueAt, Date.now()) + 24 * HOUR;
      let next: Live = {
        ...l,
        extensions: l.extensions.map((x) => (x.id === id ? { ...x, status: approve ? "approved" : "declined", until: approve ? until : undefined } : x)),
        notices: l.notices.map((n) => (n.extensionId === id ? { ...n, read: true } : n)),
        submissions: approve
          ? l.submissions.map((s) => (s.assignmentId === a.id && s.studentId === req.studentId ? { ...s, extensionUntil: until } : s))
          : l.submissions,
      };
      if (req.studentId === ME_STUDENT) {
        next = { ...next, notices: [{ id: nid("n"), audience: "student", kind: "extension", title: approve ? "You got more time" : "Extension not approved", body: approve ? `${a.title} is now due in 24 hours more.` : `${a.title} keeps its original deadline.`, at: Date.now(), read: false, link: `/assignments/${a.id}` }, ...next.notices] };
      }
      const who = world.students.find((s) => s.id === req.studentId)?.name ?? "A student";
      return addActivity(next, "You", `${approve ? "approved" : "declined"} ${who}'s request for more time`);
    }),

    review: (subId, score, feedback, redo) => push((l) => {
      const sub = l.submissions.find((s) => s.id === subId);
      if (!sub) return l;
      const a = l.assignments.find((x) => x.id === sub.assignmentId)!;
      const now = Date.now();
      const submissions = l.submissions.map((s) => (s.id === subId ? { ...s, status: redo ? ("redo" as const) : ("reviewed" as const), score: redo ? undefined : score, feedback, reviewedAt: now } : s));
      const stillWaiting = submissions.some((s) => s.assignmentId === a.id && s.status === "submitted");
      const assignments = l.assignments.map((x) => (x.id === a.id && x.dueAt < now && !stillWaiting && x.status === "active" ? { ...x, status: "completed" as const } : x));
      let next: Live = { ...l, submissions, assignments };
      if (sub.studentId === ME_STUDENT) {
        next = { ...next, notices: [{ id: nid("n"), audience: "student", kind: "reviewed", title: redo ? "Please redo and resubmit" : `Reviewed: ${score} out of ${a.maxMarks}`, body: a.title, at: now, read: false, link: `/assignments/${a.id}` }, ...next.notices] };
      }
      return addActivity(next, world.teachers.find((t) => t.id === a.teacherId)?.name ?? "Teacher", `${redo ? "asked for a redo on" : "reviewed"} ${world.students.find((s) => s.id === sub.studentId)?.name}'s ${a.title}`);
    }),

    markRead: (id) => push((l) => ({ ...l, notices: l.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    markAllRead: (role) => push((l) => ({ ...l, notices: l.notices.map((n) => (n.audience === role ? { ...n, read: true } : n)) })),

    scheduleClass: (c) => push((l) => addActivity({ ...l, classes: [...l.classes, { ...c, id: nid("c") }] }, "You", `scheduled ${c.title}`)),
  }), [ui, world, live, nameOf, subsOf, push]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
