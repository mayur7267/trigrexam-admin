import type {
  ActivityItem, Assignment, AssignmentStatus, AssignmentType, Batch, Course, ExtensionRequest, LiveClass,
  Notice, Student, SubjectId, Submission, SubStatus, Teacher,
} from "../lib/types";
import { DAY, HOUR, clamp, mulberry32, startOfDay } from "../lib/utils";
import { questionById } from "./questions";

export const ME_STUDENT = "s1";
export const ME_TEACHER = "t1";
export const ME_ADMIN = { name: "Anil Mehra", title: "Institute admin" };
export const INSTITUTE = "Shikhar Academy";

const FIRST = ["Aarav","Vivaan","Aditya","Arjun","Kabir","Ishaan","Reyansh","Rohan","Karan","Siddharth","Ananya","Diya","Aisha","Meera","Kavya","Ishita","Riya","Saanvi","Tanvi","Nisha","Pooja","Simran","Neeraj","Deepak","Manish","Sandeep","Amit","Vikas","Rakesh","Harpreet","Gurpreet","Mohammad","Zoya","Farhan","Sneha","Divya","Shreya","Pallavi","Akash","Naveen","Yash","Mayank","Lakshmi","Anjali","Kiran","Sunil","Rahul","Pankaj","Jyoti","Bhavna"];
const LAST = ["Sharma","Verma","Gupta","Singh","Yadav","Kumar","Mishra","Chauhan","Rawat","Joshi","Tiwari","Pandey","Saxena","Bansal","Agarwal","Khan","Ansari","Malik","Kaur","Bhatia","Chopra","Mehta","Nair","Reddy","Iyer","Patel","Dubey","Thakur","Rana","Sethi"];

const BATCH_DEFS = [
  { id: "b1", name: "SSC CGL 2026 · Morning", short: "CGL Morning", courseId: "c1", size: 48, prefix: "CGL-M", teachers: ["t1", "t2", "t3", "t4"] },
  { id: "b2", name: "SSC CGL 2026 · Evening", short: "CGL Evening", courseId: "c1", size: 41, prefix: "CGL-E", teachers: ["t1", "t2", "t3", "t4"] },
  { id: "b3", name: "Bank PO Foundation", short: "Bank PO", courseId: "c2", size: 36, prefix: "BPO", teachers: ["t2", "t3", "t5", "t4"] },
  { id: "b4", name: "Railway NTPC Weekend", short: "NTPC Weekend", courseId: "c3", size: 29, prefix: "NTPC", teachers: ["t4", "t5", "t3", "t2"] },
];

const REVIEW_DELAY_H: Record<string, number> = { t1: 62, t2: 22, t3: 38, t4: 11, t5: 44 };

const FEEDBACK = [
  "Good structure and clear working. Keep the same pace in the exam.",
  "Right method, but a calculation slip in the last step. Double-check before submitting.",
  "Well attempted. Add one more example next time to make the point stronger.",
  "Please write out the steps. Marks are given for the method, not just the answer.",
  "Neat and complete. Try the shortcut from class for question 4.",
  "Good effort. Revise the formula for compound change and attempt again.",
];

export function buildSeed(now: number) {
  const rng = mulberry32(2026);
  const rint = (a: number, b: number) => Math.floor(a + rng() * (b - a + 1));

  /* ---------- people ---------- */
  const used = new Set<string>(["Aarav Sharma"]);
  const makeName = () => {
    for (;;) {
      const n = `${FIRST[rint(0, FIRST.length - 1)]} ${LAST[rint(0, LAST.length - 1)]}`;
      if (!used.has(n)) {
        used.add(n);
        return n;
      }
    }
  };

  const students: Student[] = [];
  const batches: Batch[] = BATCH_DEFS.map((b) => ({
    id: b.id, name: b.name, short: b.short, courseId: b.courseId, studentIds: [], teacherIds: b.teachers,
  }));

  BATCH_DEFS.forEach((bd, bi) => {
    for (let i = 0; i < bd.size; i++) {
      const isMe = bi === 0 && i === 0;
      const base = isMe ? 0.78 : rng();
      const avgScore = isMe ? 78 : Math.round(clamp(42 + base * 48 + (rng() - 0.5) * 8, 34, 94));
      const attendance = isMe ? 91 : Math.round(clamp(62 + base * 35 + (rng() - 0.5) * 14, 54, 99));
      const onTime = isMe ? 88 : Math.round(clamp(45 + base * 52 + (rng() - 0.5) * 16, 30, 100));
      const lastActiveHrs = isMe ? 2 : Math.round(clamp(2 + (1 - base) * rng() * 220, 1, 400));
      const sub = (o: number) => Math.round(clamp(avgScore + (rng() - 0.5) * 24 + o, 22, 98));
      const reasons: string[] = [];
      if (attendance < 66) reasons.push(`Attendance is ${attendance}%`);
      if (onTime < 52) reasons.push(`Only ${onTime}% of work submitted on time`);
      if (lastActiveHrs > 150) reasons.push(`Not seen for ${Math.round(lastActiveHrs / 24)} days`);
      if (avgScore < 46) reasons.push(`Average score is ${avgScore}%`);
      const flag: Student["flag"] = reasons.length >= 2 || attendance < 58 ? "risk" : reasons.length === 1 ? "watch" : "ok";
      const trend = Array.from({ length: 6 }, (_, k) => Math.round(clamp(avgScore - 8 + k * 1.6 + (rng() - 0.5) * 9, 20, 99)));
      const id = isMe ? ME_STUDENT : `s${students.length + 1}`;
      students.push({
        id,
        name: isMe ? "Aarav Sharma" : makeName(),
        roll: `${bd.prefix}-${String(2600 + i * 7 + bi * 3).padStart(4, "0")}`,
        batchId: bd.id,
        phone: `+91 9${rint(100, 999)}${rint(10, 99)} ${rint(10000, 99999)}`.replace(/(\d{5})(\d{5})/, "$1 $2"),
        attendance, avgScore, onTime, lastActiveHrs, trend,
        subjectScores: { quant: sub(isMe ? 4 : 0), reasoning: sub(0), english: sub(-2), ga: sub(2) },
        flag, reasons,
      });
      batches[bi].studentIds.push(id);
    }
  });

  const teachers: Teacher[] = [
    { id: "t1", name: "Neha Kapoor", subject: "quant", batchIds: ["b1", "b2"], classesThisWeek: 9, turnaroundDays: 0, rating: 4.7 },
    { id: "t2", name: "Rahul Bansal", subject: "reasoning", batchIds: ["b1", "b2", "b3", "b4"], classesThisWeek: 11, turnaroundDays: 0, rating: 4.6 },
    { id: "t3", name: "Priya Menon", subject: "english", batchIds: ["b1", "b2", "b3", "b4"], classesThisWeek: 8, turnaroundDays: 0, rating: 4.8 },
    { id: "t4", name: "Suresh Yadav", subject: "ga", batchIds: ["b1", "b2", "b3", "b4"], classesThisWeek: 7, turnaroundDays: 0, rating: 4.5 },
    { id: "t5", name: "Imran Qureshi", subject: "quant", batchIds: ["b3", "b4"], classesThisWeek: 8, turnaroundDays: 0, rating: 4.4 },
  ];

  const courses: Course[] = [
    {
      id: "c1", name: "SSC CGL Complete Course", batchIds: ["b1", "b2"], subjects: ["quant", "reasoning", "english", "ga"], progress: 62,
      nextMilestone: "Full-length mock test on Saturday",
      modules: [
        { title: "Quantitative Aptitude", done: 18, total: 30 }, { title: "Reasoning", done: 22, total: 28 },
        { title: "English", done: 14, total: 24 }, { title: "General Awareness", done: 20, total: 26 },
      ],
    },
    {
      id: "c2", name: "Bank PO Foundation", batchIds: ["b3"], subjects: ["quant", "reasoning", "english", "ga"], progress: 48,
      nextMilestone: "Sectional test on Wednesday",
      modules: [
        { title: "Quantitative Aptitude", done: 10, total: 24 }, { title: "Reasoning", done: 14, total: 26 },
        { title: "English", done: 12, total: 22 }, { title: "Banking Awareness", done: 8, total: 18 },
      ],
    },
    {
      id: "c3", name: "Railway NTPC Weekend", batchIds: ["b4"], subjects: ["ga", "quant", "reasoning"], progress: 35,
      nextMilestone: "CBT-1 mock on Sunday",
      modules: [
        { title: "General Awareness", done: 12, total: 30 }, { title: "Mathematics", done: 8, total: 22 },
        { title: "General Intelligence", done: 9, total: 24 },
      ],
    },
  ];

  /* ---------- assignments ---------- */
  interface Def {
    id: string; title: string; subject: SubjectId; type: AssignmentType; batchIds: string[]; teacherId: string;
    releaseH: number; dueH: number; maxMarks: number; qs?: string[]; submitted: number; progress: number; reviewed: number;
    forceStatus?: AssignmentStatus; instructions: string; late?: Assignment["late"];
  }
  const qa = (...n: number[]) => n.map((i) => `q-qa-${i}`);
  const ids = (p: string, n: number) => Array.from({ length: n }, (_, i) => `${p}-${i + 1}`);

  const defs: Def[] = [
    { id: "a1", title: "Percentage and Profit–Loss · Practice Set 7", subject: "quant", type: "quiz", batchIds: ["b1", "b2"], teacherId: "t1", releaseH: -50, dueH: 6, maxMarks: 20, qs: qa(1, 2, 3, 4, 5), submitted: 0.46, progress: 0.16, reviewed: 1, instructions: "Five questions, 4 marks each. No negative marking. You can leave and come back before the deadline." },
    { id: "a2", title: "Syllogism · Venn Diagram Worksheet", subject: "reasoning", type: "file", batchIds: ["b3"], teacherId: "t2", releaseH: -70, dueH: 30, maxMarks: 25, submitted: 0.45, progress: 0.2, reviewed: 0.6, instructions: "Solve all 12 problems from the worksheet. Upload a clear photo or PDF of your handwritten work." },
    { id: "a3", title: "Essay · Digital India and Rural Education", subject: "english", type: "written", batchIds: ["b1", "b2", "b4"], teacherId: "t3", releaseH: -96, dueH: 72, maxMarks: 25, submitted: 0.2, progress: 0.3, reviewed: 0.55, instructions: "Write 250 to 300 words. You will be marked on ideas, structure and language, 5 marks each for the first two and 15 for language." },
    { id: "a4", title: "Reading Comprehension · Passage 12", subject: "english", type: "mixed", batchIds: ["b3", "b4"], teacherId: "t3", releaseH: -40, dueH: 50, maxMarks: 20, submitted: 0.26, progress: 0.25, reviewed: 0.55, instructions: "Read the passage, answer the five questions, then write a three-line summary in your own words." },
    { id: "a5", title: "Current Affairs Weekly Quiz · Week 44", subject: "ga", type: "quiz", batchIds: ["b1", "b2", "b3", "b4"], teacherId: "t4", releaseH: -30, dueH: 22, maxMarks: 20, qs: ids("q-ga", 5), submitted: 0.6, progress: 0.12, reviewed: 1, instructions: "Five quick questions from this week's class. Takes about 5 minutes." },
    { id: "a6", title: "Time and Work · Homework Set 3", subject: "quant", type: "file", batchIds: ["b4"], teacherId: "t5", releaseH: -120, dueH: -18, maxMarks: 20, submitted: 0.82, progress: 0.04, reviewed: 0.75, instructions: "Solve questions 1 to 15 from Set 3. Upload your notebook pages." },
    { id: "a7", title: "Number Series · Mixed Practice", subject: "quant", type: "quiz", batchIds: ["b2", "b3"], teacherId: "t5", releaseH: -20, dueH: 120, maxMarks: 20, qs: ["q-qa-6", "q-qa-10", "q-qa-7", "q-qa-8", "q-qa-9"], submitted: 0.2, progress: 0.14, reviewed: 1, instructions: "A mixed set to warm up for Saturday's test." },
    { id: "a8", title: "Data Interpretation · Bar and Line Graphs", subject: "quant", type: "file", batchIds: ["b1"], teacherId: "t1", releaseH: -120, dueH: -52, maxMarks: 25, submitted: 0.9, progress: 0, reviewed: 0.68, instructions: "Solve the five graph sets and upload your working." },
    { id: "a9", title: "Blood Relations · Chapter Test", subject: "reasoning", type: "quiz", batchIds: ["b1"], teacherId: "t2", releaseH: -240, dueH: -170, maxMarks: 20, qs: ["q-rs-1", "q-rs-2", "q-rs-3", "q-rs-4", "q-rs-5"], submitted: 0.96, progress: 0, reviewed: 1, instructions: "Chapter test for the Blood Relations module." },
    { id: "a10", title: "Vocabulary · One-word Substitution", subject: "english", type: "quiz", batchIds: ["b2"], teacherId: "t3", releaseH: -300, dueH: -220, maxMarks: 20, qs: ids("q-en", 5), submitted: 0.95, progress: 0, reviewed: 1, instructions: "Practice set for the vocabulary module." },
    { id: "a11", title: "Data Sufficiency · Practice Set", subject: "reasoning", type: "quiz", batchIds: ["b1", "b2"], teacherId: "t2", releaseH: 14, dueH: 86, maxMarks: 20, qs: ids("q-rs", 5), submitted: 0, progress: 0, reviewed: 1, forceStatus: "scheduled", instructions: "Opens tomorrow morning." },
    { id: "a12", title: "Seating Arrangement · Circular", subject: "reasoning", type: "written", batchIds: [], teacherId: "t2", releaseH: 24, dueH: 96, maxMarks: 20, submitted: 0, progress: 0, reviewed: 1, forceStatus: "draft", instructions: "" },
    { id: "a13", title: "Quadratic Equations · Quick Quiz", subject: "quant", type: "quiz", batchIds: ["b1"], teacherId: "t1", releaseH: 24, dueH: 96, maxMarks: 20, qs: ["q-qa-9", "q-qa-8"], submitted: 0, progress: 0, reviewed: 1, forceStatus: "draft", instructions: "" },
    { id: "a14", title: "Algebra · Quadratic Equations Worksheet", subject: "quant", type: "file", batchIds: ["b1", "b2"], teacherId: "t1", releaseH: -60, dueH: 40, maxMarks: 20, submitted: 0.3, progress: 0.25, reviewed: 0.5, instructions: "Solve all 10 questions and show every step. Upload photos of your work." },
    { id: "a16", title: "Reported Speech · Exercise 4", subject: "english", type: "written", batchIds: ["b1"], teacherId: "t3", releaseH: -340, dueH: -250, maxMarks: 25, submitted: 0.94, progress: 0, reviewed: 1, instructions: "Rewrite the 15 sentences in reported speech." },
  ];

  const assignments: Assignment[] = [];
  const submissions: Submission[] = [];
  let sid = 1;

  const studentById = new Map(students.map((s) => [s.id, s]));

  for (const d of defs) {
    const round = (t: number) => Math.round(t / (30 * 60_000)) * 30 * 60_000;
    const releaseAt = round(now + d.releaseH * HOUR);
    const dueAt = round(now + d.dueH * HOUR);
    const released = releaseAt <= now;
    const marksPerQ = d.qs ? d.maxMarks / d.qs.length : 0;
    const roster = d.batchIds.flatMap((b) => batches.find((x) => x.id === b)!.studentIds);

    if (released) {
      for (const stId of roster) {
        const st = studentById.get(stId)!;
        const ability = st.avgScore;
        const adj = rng() + (0.5 - st.onTime / 100) * 0.25;
        const rolled: SubStatus = adj < d.submitted ? "submitted" : adj < d.submitted + d.progress ? "in_progress" : "not_started";
        const sub: Submission = { id: `u${sid++}`, assignmentId: d.id, studentId: stId, status: rolled === "submitted" ? "submitted" : rolled };
        const winEnd = Math.min(now - 20 * 60_000, dueAt);
        const t0 = releaseAt + 2 * HOUR;
        const isLate = dueAt < now && rng() < (1 - st.onTime / 100) * 0.75;
        if (rolled !== "not_started") sub.startedAt = Math.round(t0 + rng() * Math.max(HOUR, (winEnd - t0) * 0.8));
        if (rolled === "in_progress") sub.answer = "";
        if (rolled === "submitted") {
          const t1 = Math.max(sub.startedAt ?? t0, t0);
          sub.submittedAt = isLate
            ? Math.round(dueAt + HOUR + rng() * 30 * HOUR)
            : Math.round(t1 + rng() * Math.max(HOUR, winEnd - t1));
          sub.submittedAt = Math.min(sub.submittedAt, now - 10 * 60_000);
          if (d.type === "quiz" && d.qs) {
            const picks = d.qs.map((qid) => {
              const q = questionById(qid)!;
              const right = rng() < 0.3 + (ability / 100) * 0.62;
              return right ? q.answer : (q.answer + 1 + Math.floor(rng() * 3)) % 4;
            });
            const correct = picks.filter((p, i) => p === questionById(d.qs![i])!.answer).length;
            sub.picks = picks;
            sub.score = correct * marksPerQ;
            sub.status = "reviewed";
            sub.autoGraded = true;
            sub.reviewedAt = sub.submittedAt;
          } else {
            if (d.type === "file" || d.type === "mixed") sub.fileName = `${st.name.split(" ")[0]}_${d.id}.pdf`;
            if (d.type === "written" || d.type === "mixed") sub.answer = "Submitted answer (full text available to the reviewer).";
            if (rng() < d.reviewed) {
              const delay = (REVIEW_DELAY_H[d.teacherId] ?? 30) * HOUR * (0.7 + rng() * 0.6);
              const at = Math.min(sub.submittedAt + delay, now - (5 + rng() * 120) * 60_000);
              if (at > sub.submittedAt) {
                sub.status = "reviewed";
                sub.reviewedAt = Math.round(at);
                sub.score = Math.round(clamp(d.maxMarks * ((ability + (rng() - 0.5) * 18) / 100), 3, d.maxMarks));
                sub.feedback = FEEDBACK[Math.floor(rng() * FEEDBACK.length)];
              }
            }
          }
        }
        submissions.push(sub);
      }
    }

    let status: AssignmentStatus;
    if (d.forceStatus) status = d.forceStatus;
    else if (dueAt < now && !submissions.some((s) => s.assignmentId === d.id && s.status === "submitted")) status = "completed";
    else status = "active";

    assignments.push({
      id: d.id, title: d.title, subject: d.subject, type: d.type, status, batchIds: d.batchIds, teacherId: d.teacherId,
      createdAt: Math.min(releaseAt, now) - 6 * HOUR, releaseAt, dueAt, instructions: d.instructions, maxMarks: d.maxMarks,
      late: "allow", reminders: true, questionIds: d.qs ?? [],
    });
  }

  /* ---------- Aarav's story: one of each state ---------- */
  const mine = (aid: string) => submissions.find((s) => s.assignmentId === aid && s.studentId === ME_STUDENT)!;
  const quizOf = (aid: string, correct: number) => {
    const a = assignments.find((x) => x.id === aid)!;
    const per = a.maxMarks / a.questionIds.length;
    const picks = a.questionIds.map((qid, i) => {
      const q = questionById(qid)!;
      return i < correct ? q.answer : (q.answer + 1) % 4;
    });
    return { picks, score: correct * per };
  };
  {
    const a1 = mine("a1");
    Object.assign(a1, { status: "not_started" as SubStatus, startedAt: undefined, submittedAt: undefined, picks: undefined, score: undefined, reviewedAt: undefined, autoGraded: false });

    const a3 = mine("a3");
    Object.assign(a3, {
      status: "in_progress" as SubStatus, startedAt: now - 5 * HOUR, submittedAt: undefined, score: undefined, reviewedAt: undefined,
      answer: "Digital India has changed how a student in a small village can learn. A phone with a data connection now gives access to lessons that once needed a trip to the city.\n\nHowever, the benefits are uneven. Many schools still lack",
    });

    const a5 = mine("a5");
    const q5 = quizOf("a5", 4);
    Object.assign(a5, { status: "reviewed" as SubStatus, startedAt: now - 8 * HOUR, submittedAt: now - 7 * HOUR, reviewedAt: now - 7 * HOUR, picks: q5.picks, score: q5.score, autoGraded: true });

    const a8 = mine("a8");
    Object.assign(a8, { status: "submitted" as SubStatus, startedAt: now - 4.1 * DAY, submittedAt: now - 3.6 * DAY, fileName: "DI_Sheet_Aarav.pdf", score: undefined, reviewedAt: undefined, feedback: undefined });

    const a9 = mine("a9");
    const q9 = quizOf("a9", 4);
    Object.assign(a9, { status: "reviewed" as SubStatus, startedAt: now - 7.2 * DAY, submittedAt: now - 7.1 * DAY, reviewedAt: now - 7.1 * DAY, picks: q9.picks, score: q9.score, autoGraded: true });

    const a14 = mine("a14");
    Object.assign(a14, {
      status: "redo" as SubStatus, startedAt: now - 30 * HOUR, submittedAt: now - 20 * HOUR, fileName: "Quadratic_Aarav.pdf", reviewedAt: now - 3 * HOUR,
      score: undefined, feedback: "Q3 and Q5 are missing the working. Please show each step and upload again before the deadline.",
    });

    const a16 = mine("a16");
    Object.assign(a16, {
      status: "reviewed" as SubStatus, startedAt: now - 10.4 * DAY, submittedAt: now - 10.2 * DAY, reviewedAt: now - 8.9 * DAY, score: 21,
      answer: "Submitted answer.", feedback: "Clear writing and the reporting verbs are well chosen. Watch the tense shift in sentence 4 and you will lose no marks here.",
    });
  }

  /* ---------- extension requests ---------- */
  const pick = (aid: string, n: number) =>
    submissions.filter((s) => s.assignmentId === aid && (s.status === "not_started" || s.status === "in_progress") && s.studentId !== ME_STUDENT)[n]?.studentId;
  const extensions: ExtensionRequest[] = [
    { id: "x1", assignmentId: "a1", studentId: pick("a1", 0) ?? "s2", reason: "Had a fever and missed two classes. I can finish by tomorrow morning.", requestedAt: now - 70 * 60_000, status: "pending" },
    { id: "x2", assignmentId: "a14", studentId: pick("a14", 0) ?? "s3", reason: "Internet was down at my hostel for two days.", requestedAt: now - 4 * HOUR, status: "pending" },
    { id: "x3", assignmentId: "a3", studentId: pick("a3", 1) ?? "s4", reason: "Family function this weekend. Need one more day for the essay.", requestedAt: now - 9 * HOUR, status: "pending" },
  ];

  /* ---------- classes ---------- */
  const SLOTS = [[7, 0], [9, 0], [17, 0], [19, 0]] as const;
  const GRID: [string, SubjectId, string, string][][] = [
    [["b1", "quant", "t1", "Percentage · Shortcuts"], ["b3", "reasoning", "t2", "Syllogism Basics"], ["b2", "quant", "t1", "Percentage · Shortcuts"], ["b4", "ga", "t4", "Polity · Fundamental Rights"]],
    [["b1", "reasoning", "t2", "Blood Relations"], ["b3", "english", "t3", "Reading Comprehension"], ["b2", "reasoning", "t2", "Blood Relations"], ["b3", "quant", "t5", "Number Series"]],
    [["b1", "english", "t3", "Grammar · Tenses"], ["b4", "quant", "t5", "Time and Work"], ["b2", "english", "t3", "Grammar · Tenses"], ["b1", "ga", "t4", "Current Affairs Digest"]],
    [["b1", "quant", "t1", "Profit and Loss"], ["b3", "reasoning", "t2", "Seating Arrangement"], ["b2", "quant", "t1", "Profit and Loss"], ["b4", "reasoning", "t2", "Coding–Decoding"]],
    [["b1", "reasoning", "t2", "Direction Sense"], ["b3", "ga", "t4", "Economy Basics"], ["b2", "reasoning", "t2", "Direction Sense"], ["b3", "english", "t3", "Vocabulary Builder"]],
    [["b1", "quant", "t1", "Weekly Test Discussion"], ["b2", "quant", "t1", "Weekly Test Discussion"], ["b4", "ga", "t4", "Geography · Rivers"], ["b4", "english", "t3", "Essay Writing"]],
  ];
  const day0 = startOfDay(now);
  const monday = day0 - ((new Date(now).getDay() + 6) % 7) * DAY;
  const classes: LiveClass[] = [];
  GRID.forEach((day, di) => {
    day.forEach(([b, subject, t, title], si) => {
      classes.push({
        id: `c-${di}-${si}`, title, subject: subject as SubjectId, batchId: b, teacherId: t,
        startAt: monday + di * DAY + SLOTS[si][0] * HOUR + SLOTS[si][1] * 60_000, durationMin: 90,
      });
    });
  });
  classes.push({ id: "c-clash", title: "Mock Test · Doubt Session", subject: "reasoning", batchId: "b4", teacherId: "t2", startAt: monday + 3 * DAY + 9 * HOUR, durationMin: 90 });
  const hr = new Date(now).getHours();
  if (hr >= 8 && hr < 20) {
    classes.push({ id: "live-now", title: "Syllogism Basics", subject: "reasoning", batchId: "b3", teacherId: "t2", startAt: now - 25 * 60_000, durationMin: 75 });
  }

  /* ---------- notices + activity ---------- */
  const nm = (id: string) => students.find((s) => s.id === id)?.name ?? "A student";
  const asg = (id: string) => assignments.find((a) => a.id === id)!;
  const notices: Notice[] = [
    { id: "n1", audience: "admin", kind: "extension", title: "3 extension requests are waiting", body: "Neha Kapoor and Priya Menon need to approve them before the deadlines.", at: now - 40 * 60_000, read: false, link: "/notifications" },
    { id: "n2", audience: "admin", kind: "reminder", title: "Reminder sent automatically", body: `${asg("a5").title} · 24 hr reminder reached 71 students on app and WhatsApp.`, at: now - 3 * HOUR, read: false, link: "/assignments/a5" },
    { id: "n3", audience: "admin", kind: "assigned", title: "Priya Menon published an assignment", body: asg("a4").title, at: now - 38 * HOUR, read: true, link: "/assignments/a4" },
    { id: "n4", audience: "admin", kind: "system", title: "Weekly report is ready", body: "Last week's completion and attendance summary is ready to download.", at: now - 2 * DAY, read: true, link: "/reports" },

    { id: "n5", audience: "teacher", kind: "extension", title: `${nm(extensions[0].studentId)} asked for more time`, body: `${asg("a1").title}: “${extensions[0].reason}”`, at: extensions[0].requestedAt, read: false, extensionId: "x1" },
    { id: "n6", audience: "teacher", kind: "extension", title: `${nm(extensions[1].studentId)} asked for more time`, body: `${asg("a14").title}: “${extensions[1].reason}”`, at: extensions[1].requestedAt, read: false, extensionId: "x2" },
    { id: "n7", audience: "teacher", kind: "submitted", title: "6 new submissions", body: `${asg("a14").title} · waiting for your review`, at: now - 2 * HOUR, read: false, link: "/assignments/a14" },
    { id: "n8", audience: "teacher", kind: "reminder", title: "Reviews are getting old", body: `${asg("a8").title} has submissions waiting for 3 days.`, at: now - 5 * HOUR, read: true, link: "/assignments/a8" },

    { id: "n9", audience: "student", kind: "reminder", title: "Due in 6 hours", body: `${asg("a1").title}`, at: now - 30 * 60_000, read: false, link: "/assignments/a1" },
    { id: "n10", audience: "student", kind: "reviewed", title: "Neha asked you to redo a worksheet", body: `${asg("a14").title}: show every step and upload again.`, at: now - 3 * HOUR, read: false, link: "/assignments/a14" },
    { id: "n11", audience: "student", kind: "reviewed", title: "Quiz marked: 16 out of 20", body: asg("a5").title, at: now - 7 * HOUR, read: true, link: "/assignments/a5" },
    { id: "n12", audience: "student", kind: "assigned", title: "New assignment", body: asg("a3").title, at: now - 4 * DAY, read: true, link: "/assignments/a3" },
  ];

  const activity: ActivityItem[] = [
    { id: "ac1", at: now - 9 * 60_000, who: "Imran Qureshi", text: "marked 11 submissions on Time and Work" },
    { id: "ac2", at: now - 24 * 60_000, who: "Meera Chauhan", text: "submitted Syllogism worksheet" },
    { id: "ac3", at: now - 70 * 60_000, who: "System", text: "sent the 24-hour reminder for Current Affairs Quiz" },
    { id: "ac4", at: now - 2 * HOUR, who: "Neha Kapoor", text: "returned an assignment for redo" },
    { id: "ac5", at: now - 4 * HOUR, who: "Priya Menon", text: "published Reading Comprehension · Passage 12" },
    { id: "ac6", at: now - 6 * HOUR, who: "Rahul Bansal", text: "rescheduled Thursday's doubt session" },
  ];

  // Review turnaround from the data, so the numbers on screen always agree.
  for (const t of teachers) {
    const done = submissions.filter((s) => s.reviewedAt && !s.autoGraded && s.submittedAt && assignments.find((a) => a.id === s.assignmentId)?.teacherId === t.id);
    const avg = done.length ? done.reduce((n, s) => n + (s.reviewedAt! - s.submittedAt!), 0) / done.length : 0;
    t.turnaroundDays = Math.round((avg / DAY) * 10) / 10;
  }

  return { students, teachers, batches, courses, assignments, submissions, extensions, notices, activity, classes };
}

export type Seed = ReturnType<typeof buildSeed>;
