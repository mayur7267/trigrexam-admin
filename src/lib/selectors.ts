import type { Assignment, Submission } from "./types";

export type ShownStatus = "todo" | "progress" | "submitted" | "reviewed" | "redo" | "missing";

/** The due time that applies to one student, after any extension they were given. */
export const dueFor = (a: Assignment, s?: Submission) => Math.max(a.dueAt, s?.extensionUntil ?? 0);

export function shownStatus(a: Assignment, s: Submission, now = Date.now()): ShownStatus {
  if (s.status === "reviewed") return "reviewed";
  if (s.status === "redo") return "redo";
  if (s.status === "submitted") return "submitted";
  if (now > dueFor(a, s)) return "missing";
  return s.status === "in_progress" ? "progress" : "todo";
}

export interface Tally {
  total: number;
  todo: number;
  progress: number;
  submitted: number;
  reviewed: number;
  redo: number;
  missing: number;
  handedIn: number;
  late: number;
}

export function tally(a: Assignment, subs: Submission[], now = Date.now()): Tally {
  const t: Tally = { total: subs.length, todo: 0, progress: 0, submitted: 0, reviewed: 0, redo: 0, missing: 0, handedIn: 0, late: 0 };
  for (const s of subs) {
    const st = shownStatus(a, s, now);
    if (st === "todo") t.todo++;
    else if (st === "progress") t.progress++;
    else if (st === "submitted") t.submitted++;
    else if (st === "reviewed") t.reviewed++;
    else if (st === "redo") t.redo++;
    else t.missing++;
    if (s.submittedAt) {
      t.handedIn++;
      if (s.submittedAt > dueFor(a, s)) t.late++;
    }
  }
  return t;
}

export const statusLabel: Record<ShownStatus, string> = {
  todo: "To do",
  progress: "In progress",
  submitted: "Waiting for review",
  reviewed: "Reviewed",
  redo: "Redo requested",
  missing: "Missing",
};

export const typeLabel = { quiz: "Quiz", written: "Written", file: "File upload", mixed: "Mixed" } as const;
