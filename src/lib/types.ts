export type Role = "admin" | "teacher" | "student";
export type SubjectId = "quant" | "reasoning" | "english" | "ga";
export type AssignmentType = "quiz" | "written" | "file" | "mixed";
export type AssignmentStatus = "draft" | "scheduled" | "active" | "completed";
export type SubStatus = "not_started" | "in_progress" | "submitted" | "reviewed" | "redo";
export type LatePolicy = "allow" | "penalty" | "block";

export interface Batch {
  id: string;
  name: string;
  short: string;
  courseId: string;
  studentIds: string[];
  teacherIds: string[];
}

export interface Student {
  id: string;
  name: string;
  roll: string;
  batchId: string;
  phone: string;
  attendance: number;
  avgScore: number;
  onTime: number;
  lastActiveHrs: number;
  trend: number[];
  subjectScores: Record<SubjectId, number>;
  flag: "ok" | "watch" | "risk";
  reasons: string[];
}

export interface Teacher {
  id: string;
  name: string;
  subject: SubjectId;
  batchIds: string[];
  classesThisWeek: number;
  turnaroundDays: number;
  rating: number;
}

export interface Course {
  id: string;
  name: string;
  batchIds: string[];
  subjects: SubjectId[];
  progress: number;
  nextMilestone: string;
  modules: { title: string; done: number; total: number }[];
}

export interface Question {
  id: string;
  subject: SubjectId;
  topic: string;
  text: string;
  options: string[];
  answer: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject: SubjectId;
  type: AssignmentType;
  status: AssignmentStatus;
  batchIds: string[];
  teacherId: string;
  createdAt: number;
  releaseAt: number;
  dueAt: number;
  instructions: string;
  maxMarks: number;
  late: LatePolicy;
  reminders: boolean;
  questionIds: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubStatus;
  startedAt?: number;
  submittedAt?: number;
  answer?: string;
  fileName?: string;
  picks?: number[];
  score?: number;
  feedback?: string;
  reviewedAt?: number;
  extensionUntil?: number;
  autoGraded?: boolean;
}

export interface ExtensionRequest {
  id: string;
  assignmentId: string;
  studentId: string;
  reason: string;
  requestedAt: number;
  status: "pending" | "approved" | "declined";
  until?: number;
}

export type NoticeKind = "assigned" | "submitted" | "reviewed" | "extension" | "reminder" | "class" | "system";

export interface Notice {
  id: string;
  audience: Role;
  kind: NoticeKind;
  title: string;
  body: string;
  at: number;
  read: boolean;
  link?: string;
  extensionId?: string;
}

export interface ActivityItem {
  id: string;
  at: number;
  who: string;
  text: string;
}

export interface LiveClass {
  id: string;
  title: string;
  subject: SubjectId;
  batchId: string;
  teacherId: string;
  startAt: number;
  durationMin: number;
}
