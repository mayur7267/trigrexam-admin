import type { Assignment } from "../lib/types";

const ESSAYS = [
  "Digital India has changed how a student in a small village can learn. A phone with a data connection now gives access to lessons that once needed a trip to the city. My cousin in Barabanki prepares for exams using free video classes and mock tests.\n\nBut the benefits are uneven. Many schools still lack reliable electricity and many families cannot afford a smartphone. If the government wants real change, it must first fix power and connectivity, and then train teachers to use technology well.\n\nIn conclusion, Digital India is a strong idea. It will only succeed in rural education when every child, not just the ones with a phone, can take part.",
  "Education is the base of progress and Digital India mission is making it reachable. In villages, children now watch lectures on YouTube and give online exams from the nearest centre. This saves time and money of the family.\n\nHowever there are problems also. Internet speed is slow, many teachers are not trained and girls often get less access to phones. The government should open more digital learning centres in every panchayat.\n\nTo sum up, if these problems are solved, rural students can compete equally with city students.",
  "Technology is no longer a luxury for rural students. Through Digital India, schools receive smart boards and students can use the DIKSHA platform to study in their own language. This helps weaker students catch up at their own speed.\n\nStill, a tool is only as good as the people using it. Teachers need regular training, and parents need to be convinced that online learning is real learning.\n\nIf these gaps are closed, Digital India can make a village classroom as good as a city one.",
];

const COMPREHENSION = [
  "Q1 (b)  Q2 (d)  Q3 (a)  Q4 (c)  Q5 (b)\n\nSummary: The writer argues that cities must plan for public transport first, because roads alone cannot keep up with growth. Cheap and frequent buses make people leave their cars at home.",
  "Q1 (b)  Q2 (c)  Q3 (a)  Q4 (c)  Q5 (d)\n\nSummary: According to the passage, urban growth needs better public transport. Only building more roads will not solve the traffic problem for long.",
];

const GENERIC = [
  "1. She said that she was going to the market that day.\n2. He told me that he had finished the work.\n3. The teacher asked the students whether they had understood the lesson.\n4. Ravi said that he would call me the next morning.\n5. She exclaimed that it was a beautiful sight.",
  "1. She told that she is going to the market.\n2. He said me that he has finished the work.\n3. The teacher asked whether we have understood the lesson.\n4. Ravi said that he will call me the next morning.\n5. She exclaimed with joy that it was a beautiful sight.",
];

const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

export function sampleAnswer(a: Assignment, studentId: string): string {
  const h = hash(studentId + a.id);
  if (a.id === "a3") return ESSAYS[h % ESSAYS.length];
  if (a.id === "a4") return COMPREHENSION[h % COMPREHENSION.length];
  if (a.subject === "english") return GENERIC[h % GENERIC.length];
  return ESSAYS[h % ESSAYS.length];
}

export const FEEDBACK_CHIPS = [
  { label: "Great work", text: "Great work. Clear and well organised." },
  { label: "Show your steps", text: "Please show every step. Marks are given for the method, not only the answer." },
  { label: "Check the formula", text: "Revise the formula from class and try this type again." },
  { label: "Well structured", text: "Well structured, with a clear start and finish." },
  { label: "Improve grammar", text: "Watch your tenses and sentence length. Read it aloud once before submitting." },
  { label: "Add more detail", text: "Good start. Add one example to make your point stronger." },
];
