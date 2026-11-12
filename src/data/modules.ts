// The rest of the platform: every module an institute uses beyond assignments,
// each described as data so one page (pages/Module.tsx) can show it.
import {
  Award, Building2, FileQuestion, FileText, FolderOpen, History, Layers, ListChecks, Megaphone, MessageSquare,
  Package, PlayCircle, Receipt, Sparkles, Ticket, Video, type LucideIcon,
} from "lucide-react";
import type { Tone } from "../components/ui";

export type Cell = string | number;
export type Row = Record<string, Cell>;
export interface Col { key: string; label: string; kind?: "title" | "chip" | "money" | "num" | "pct"; sub?: string; tones?: Record<string, Tone>; hideSm?: boolean }
export interface FieldDef { key: string; label: string; type?: "text" | "number" | "select" | "textarea" | "date"; options?: string[]; placeholder?: string }
export interface Stat { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" }
export interface ModuleDef {
  path: string; title: string; subtitle: string; icon: LucideIcon;
  joins?: string; // which old screens this one page replaces
  stats: Stat[];
  tabKey?: string; // column the tabs filter on
  cols: Col[];
  rows: Row[];
  lead?: (r: Row) => LucideIcon;
  create: { label: string; title: string; fields: FieldDef[]; defaults: Row; done: (r: Row) => string };
  rowActions: string[];
}

const BATCHES = ["SSC CGL 2026 · Morning", "SSC CGL 2026 · Evening", "Bank PO Foundation", "Railway NTPC Weekend", "All students"];
const SUBJ = ["Quant", "Reasoning", "English", "General awareness"];
const STATUS: Record<string, Tone> = {
  Live: "ok", Published: "ok", Active: "ok", Paid: "ok", Sent: "ok", Issued: "ok", On: "ok", Done: "ok",
  Scheduled: "sky", Pending: "warn", Draft: "neutral", Expired: "neutral", Off: "neutral", Refunded: "bad", Failed: "bad", Paused: "amber",
};
const KIND: Record<string, LucideIcon> = { Video: PlayCircle, PDF: FileText, Notes: FileText, "Test series": ListChecks, "Video series": Video };

export const MODULES: Record<string, ModuleDef> = {
  library: {
    path: "/library", title: "Content library", icon: FolderOpen, joins: "Manage Videos, Manage PDFs and Documents",
    subtitle: "Every video, PDF and note in one place. Upload once, use it in any course.",
    stats: [{ label: "Items", value: "1,284" }, { label: "Videos", value: "612", hint: "418 hours" }, { label: "PDFs and notes", value: "672" }, { label: "Storage used", value: "38%", hint: "190 of 500 GB" }],
    tabKey: "type",
    cols: [
      { key: "name", label: "Name", kind: "title", sub: "course" },
      { key: "type", label: "Type", kind: "chip", tones: { Video: "sky", PDF: "violet", Notes: "amber" } },
      { key: "subject", label: "Subject", hideSm: true },
      { key: "views", label: "Views", kind: "num" },
      { key: "added", label: "Added", hideSm: true },
    ],
    lead: (r) => KIND[String(r.type)] ?? FileText,
    rows: [
      { name: "Percentage · Shortcuts in 20 minutes", course: "SSC CGL Complete Course", type: "Video", subject: "Quant", views: 1840, added: "Today" },
      { name: "Syllogism · All 8 cases", course: "Bank PO Foundation", type: "Video", subject: "Reasoning", views: 1212, added: "Yesterday" },
      { name: "Profit and Loss formula sheet", course: "SSC CGL Complete Course", type: "PDF", subject: "Quant", views: 2730, added: "2 days ago" },
      { name: "One-word substitution · 300 words", course: "All courses", type: "PDF", subject: "English", views: 3104, added: "4 days ago" },
      { name: "Monthly current affairs · October", course: "All courses", type: "Notes", subject: "General awareness", views: 2286, added: "1 week ago" },
      { name: "Coding-Decoding · New pattern", course: "Railway NTPC Weekend", type: "Video", subject: "Reasoning", views: 640, added: "1 week ago" },
      { name: "Error spotting · 50 practice sentences", course: "SSC CGL Complete Course", type: "PDF", subject: "English", views: 980, added: "2 weeks ago" },
    ],
    create: {
      label: "Upload", title: "Upload to the library",
      fields: [
        { key: "name", label: "Title", placeholder: "For example: Time and Work · Basics" },
        { key: "type", label: "Type", type: "select", options: ["Video", "PDF", "Notes"] },
        { key: "subject", label: "Subject", type: "select", options: SUBJ },
        { key: "course", label: "Course", type: "select", options: ["SSC CGL Complete Course", "Bank PO Foundation", "Railway NTPC Weekend", "All courses"] },
      ],
      defaults: { views: 0, added: "Just now" },
      done: (r) => `“${r.name}” is in the library`,
    },
    rowActions: ["Preview", "Add to a course", "Replace file", "Delete"],
  },

  series: {
    path: "/series", title: "Series", icon: Layers, joins: "Test Series, Video Series and Assign to Series",
    subtitle: "Tests and videos in a set order. Students unlock the next one when they finish.",
    stats: [{ label: "Series", value: "18" }, { label: "Students enrolled", value: "2,416" }, { label: "Finish rate", value: "64%", hint: "+5 pts this month", tone: "good" }, { label: "Unlocking today", value: "212" }],
    tabKey: "type",
    cols: [
      { key: "name", label: "Series", kind: "title", sub: "batch" },
      { key: "type", label: "Type", kind: "chip", tones: { "Test series": "sky", "Video series": "violet" } },
      { key: "items", label: "Items", kind: "num" },
      { key: "enrolled", label: "Enrolled", kind: "num", hideSm: true },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    lead: (r) => KIND[String(r.type)] ?? Layers,
    rows: [
      { name: "CGL Tier 1 · 30 full mocks", batch: "SSC CGL 2026 · Morning", type: "Test series", items: 30, enrolled: 89, status: "Live" },
      { name: "Bank PO Prelims · Sectional", batch: "Bank PO Foundation", type: "Test series", items: 24, enrolled: 36, status: "Live" },
      { name: "Reasoning from zero", batch: "All students", type: "Video series", items: 42, enrolled: 154, status: "Live" },
      { name: "NTPC CBT 1 · Previous papers", batch: "Railway NTPC Weekend", type: "Test series", items: 15, enrolled: 29, status: "Scheduled" },
      { name: "English grammar in 21 days", batch: "All students", type: "Video series", items: 21, enrolled: 0, status: "Draft" },
    ],
    create: {
      label: "New series", title: "New series",
      fields: [
        { key: "name", label: "Name", placeholder: "For example: CGL Tier 2 · 20 mocks" },
        { key: "type", label: "Type", type: "select", options: ["Test series", "Video series"] },
        { key: "batch", label: "Who gets it", type: "select", options: BATCHES },
        { key: "items", label: "How many items", type: "number", placeholder: "20" },
      ],
      defaults: { enrolled: 0, status: "Draft", items: 0 },
      done: (r) => `Series “${r.name}” created as a draft`,
    },
    rowActions: ["Edit order", "Assign to a batch", "Duplicate", "Delete"],
  },

  tests: {
    path: "/tests", title: "Tests", icon: ListChecks, joins: "Test, Tests Pool and the 26-item action menu",
    subtitle: "Build a test from the question bank, schedule it, and results come in on their own.",
    stats: [{ label: "Live now", value: "3", hint: "214 students writing", tone: "good" }, { label: "Scheduled", value: "2", hint: "Next one Sunday, 10 AM" }, { label: "Attempts this month", value: "12,840", hint: "+18% vs last month", tone: "good" }, { label: "Average score", value: "68%" }],
    tabKey: "status",
    cols: [
      { key: "name", label: "Test", kind: "title", sub: "batch" },
      { key: "questions", label: "Questions", kind: "num", hideSm: true },
      { key: "time", label: "Time", hideSm: true },
      { key: "attempts", label: "Attempts", kind: "num" },
      { key: "avg", label: "Average", kind: "pct" },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { name: "CGL Tier 1 · Full mock 14", batch: "SSC CGL 2026 · Morning", questions: 100, time: "60 min", attempts: 82, avg: 71, status: "Live" },
      { name: "Quant sectional · Algebra", batch: "SSC CGL 2026 · Evening", questions: 25, time: "20 min", attempts: 37, avg: 64, status: "Live" },
      { name: "Bank PO Prelims · Mock 6", batch: "Bank PO Foundation", questions: 100, time: "60 min", attempts: 34, avg: 58, status: "Live" },
      { name: "NTPC CBT 1 · Mock 3", batch: "Railway NTPC Weekend", questions: 100, time: "90 min", attempts: 0, avg: 0, status: "Scheduled" },
      { name: "English · Error spotting drill", batch: "All students", questions: 30, time: "15 min", attempts: 0, avg: 0, status: "Scheduled" },
      { name: "GA weekly · Week 45", batch: "All students", questions: 50, time: "25 min", attempts: 0, avg: 0, status: "Draft" },
      { name: "CGL Tier 1 · Full mock 13", batch: "SSC CGL 2026 · Morning", questions: 100, time: "60 min", attempts: 88, avg: 69, status: "Done" },
    ],
    create: {
      label: "New test", title: "New test",
      fields: [
        { key: "name", label: "Name", placeholder: "For example: CGL Tier 1 · Full mock 15" },
        { key: "batch", label: "Who takes it", type: "select", options: BATCHES },
        { key: "questions", label: "Questions", type: "number", placeholder: "100" },
        { key: "time", label: "Time", type: "select", options: ["15 min", "20 min", "30 min", "60 min", "90 min"] },
        { key: "status", label: "Publish", type: "select", options: ["Scheduled", "Live", "Draft"] },
      ],
      defaults: { attempts: 0, avg: 0, questions: 0 },
      done: (r) => (r.status === "Live" ? `“${r.name}” is live. Students got a notification` : `“${r.name}” saved`),
    },
    rowActions: ["Edit questions", "See results", "Duplicate", "Delete"],
  },

  questions: {
    path: "/questions", title: "Question bank", icon: FileQuestion, joins: "Questions, Passages and Instruction parts",
    subtitle: "All your questions, tagged by subject, topic and difficulty. Tests pick from here.",
    stats: [{ label: "Questions", value: "18,420" }, { label: "Added this week", value: "312" }, { label: "Reported by students", value: "4", hint: "Answer key looks wrong", tone: "warn" }, { label: "Used in tests", value: "71%" }],
    tabKey: "subject",
    cols: [
      { key: "q", label: "Question", kind: "title", sub: "topic" },
      { key: "subject", label: "Subject", kind: "chip", tones: { Quant: "sky", Reasoning: "violet", English: "amber", "General awareness": "ok" } },
      { key: "level", label: "Level", kind: "chip", tones: { Easy: "ok", Medium: "warn", Hard: "bad" } },
      { key: "used", label: "Used", kind: "num", hideSm: true },
      { key: "right", label: "Answered right", kind: "pct", hideSm: true },
    ],
    rows: [
      { q: "A shopkeeper marks 40% above cost and gives 25% off. Profit?", topic: "Profit and Loss", subject: "Quant", level: "Medium", used: 14, right: 58 },
      { q: "Some cats are dogs. All dogs are birds. Conclusion?", topic: "Syllogism", subject: "Reasoning", level: "Easy", used: 22, right: 81 },
      { q: "Choose the word closest in meaning to CANDID.", topic: "Vocabulary", subject: "English", level: "Easy", used: 9, right: 77 },
      { q: "Who presides over a joint sitting of Parliament?", topic: "Polity", subject: "General awareness", level: "Medium", used: 6, right: 49 },
      { q: "A and B finish a job in 12 days, B and C in 15, C and A in 20. A alone?", topic: "Time and Work", subject: "Quant", level: "Hard", used: 11, right: 31 },
      { q: "If MONKEY is XDJEFO, how is TIGER written?", topic: "Coding-Decoding", subject: "Reasoning", level: "Medium", used: 17, right: 62 },
    ],
    create: {
      label: "Add question", title: "Add a question",
      fields: [
        { key: "q", label: "Question", type: "textarea", placeholder: "Type the question" },
        { key: "subject", label: "Subject", type: "select", options: SUBJ },
        { key: "topic", label: "Topic", placeholder: "For example: Percentage" },
        { key: "level", label: "Level", type: "select", options: ["Easy", "Medium", "Hard"] },
      ],
      defaults: { used: 0, right: 0 },
      done: () => "Question added to the bank",
    },
    rowActions: ["Edit", "See who got it wrong", "Duplicate", "Delete"],
  },

  packages: {
    path: "/packages", title: "Packages", icon: Package, joins: "Manage Packages/Batches and Make Product",
    subtitle: "What students buy or get enrolled in: courses, test series and live classes, bundled with a price.",
    stats: [{ label: "On sale", value: "9" }, { label: "Sold this month", value: "214", hint: "+12% vs last month", tone: "good" }, { label: "Revenue this month", value: "₹4.83L", tone: "good" }, { label: "Best seller", value: "CGL Combo" }],
    tabKey: "status",
    cols: [
      { key: "name", label: "Package", kind: "title", sub: "includes" },
      { key: "price", label: "Price", kind: "money" },
      { key: "validity", label: "Validity", hideSm: true },
      { key: "sold", label: "Sold", kind: "num" },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { name: "SSC CGL Combo 2026", includes: "Course + 30 mocks + live classes", price: 4999, validity: "12 months", sold: 96, status: "Published" },
      { name: "Bank PO Prelims + Mains", includes: "Course + 48 tests", price: 3499, validity: "9 months", sold: 41, status: "Published" },
      { name: "NTPC Weekend Batch", includes: "Weekend live classes + 15 papers", price: 2499, validity: "6 months", sold: 29, status: "Published" },
      { name: "CGL Mock Test Series", includes: "30 full mocks", price: 499, validity: "6 months", sold: 48, status: "Published" },
      { name: "English Grammar Crash Course", includes: "21 videos + 10 tests", price: 299, validity: "3 months", sold: 0, status: "Draft" },
    ],
    create: {
      label: "New package", title: "New package",
      fields: [
        { key: "name", label: "Name", placeholder: "For example: CGL Tier 2 Pack" },
        { key: "includes", label: "What is inside", placeholder: "Course + 20 mocks" },
        { key: "price", label: "Price (₹)", type: "number", placeholder: "999" },
        { key: "validity", label: "Validity", type: "select", options: ["3 months", "6 months", "9 months", "12 months"] },
        { key: "status", label: "Show in the store", type: "select", options: ["Published", "Draft"] },
      ],
      defaults: { sold: 0, price: 0 },
      done: (r) => (r.status === "Published" ? `“${r.name}” is on sale in your store` : `“${r.name}” saved as a draft`),
    },
    rowActions: ["Edit", "Give to a batch", "Copy store link", "Delete"],
  },

  sales: {
    path: "/sales", title: "Sales", icon: Receipt, joins: "All Buyers and Receipts",
    subtitle: "Every payment, with the receipt. Refunds and bank transfers in the same list.",
    stats: [{ label: "This month", value: "₹4,83,120", hint: "+8.1% vs last month", tone: "good" }, { label: "Orders", value: "214" }, { label: "To confirm", value: "2", hint: "Bank transfers", tone: "warn" }, { label: "Refunds", value: "₹1,998" }],
    tabKey: "status",
    cols: [
      { key: "buyer", label: "Buyer", kind: "title", sub: "item" },
      { key: "amount", label: "Amount", kind: "money" },
      { key: "method", label: "Paid by", hideSm: true },
      { key: "when", label: "When", hideSm: true },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { buyer: "Aarav Sharma", item: "SSC CGL Combo 2026", amount: 4999, method: "UPI", when: "Today, 5:12 PM", status: "Paid" },
      { buyer: "Pooja Nair", item: "CGL Mock Test Series", amount: 499, method: "Card", when: "Today, 3:40 PM", status: "Paid" },
      { buyer: "Vikram Singh", item: "Bank PO Prelims + Mains", amount: 3499, method: "Bank transfer", when: "Today, 11:05 AM", status: "Pending" },
      { buyer: "Sneha Reddy", item: "NTPC Weekend Batch", amount: 2499, method: "Bank transfer", when: "Yesterday", status: "Pending" },
      { buyer: "Karan Malhotra", item: "CGL Mock Test Series", amount: 499, method: "UPI", when: "Yesterday", status: "Paid" },
      { buyer: "Ritika Gupta", item: "English Grammar Crash Course", amount: 299, method: "UPI", when: "3 days ago", status: "Refunded" },
    ],
    create: {
      label: "Record a payment", title: "Record a payment",
      fields: [
        { key: "buyer", label: "Student", placeholder: "Name" },
        { key: "item", label: "Package", type: "select", options: ["SSC CGL Combo 2026", "Bank PO Prelims + Mains", "NTPC Weekend Batch", "CGL Mock Test Series"] },
        { key: "amount", label: "Amount (₹)", type: "number", placeholder: "4999" },
        { key: "method", label: "Paid by", type: "select", options: ["Cash", "Bank transfer", "UPI", "Card"] },
      ],
      defaults: { when: "Just now", status: "Paid", amount: 0 },
      done: (r) => `Payment recorded. ${r.buyer} has the package now and a receipt by email`,
    },
    rowActions: ["Confirm payment", "Download receipt", "Refund"],
  },

  coupons: {
    path: "/coupons", title: "Coupons and codes", icon: Ticket, joins: "Coupons and Tokens",
    subtitle: "Discount codes for the store, and access codes that unlock a package for free.",
    stats: [{ label: "Active codes", value: "6" }, { label: "Used this month", value: "128" }, { label: "Discount given", value: "₹38,400" }, { label: "Sales with a code", value: "31%" }],
    tabKey: "status",
    cols: [
      { key: "code", label: "Code", kind: "title", sub: "kind" },
      { key: "value", label: "Gives" },
      { key: "used", label: "Used", kind: "num" },
      { key: "ends", label: "Ends", hideSm: true },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { code: "DIWALI30", kind: "Discount · all packages", value: "30% off", used: 64, ends: "15 Nov", status: "Active" },
      { code: "TOPPER100", kind: "Access code · CGL Mock Test Series", value: "Free", used: 12, ends: "31 Dec", status: "Active" },
      { code: "FRIEND200", kind: "Discount · referral", value: "₹200 off", used: 41, ends: "No end", status: "Active" },
      { code: "NTPCWEEKEND", kind: "Discount · NTPC Weekend Batch", value: "15% off", used: 11, ends: "30 Nov", status: "Paused" },
      { code: "INDEPENDENCE", kind: "Discount · all packages", value: "25% off", used: 96, ends: "16 Aug", status: "Expired" },
    ],
    create: {
      label: "New code", title: "New code",
      fields: [
        { key: "code", label: "Code", placeholder: "For example: NEWYEAR25" },
        { key: "kind", label: "Kind", type: "select", options: ["Discount · all packages", "Access code · one package", "Discount · referral"] },
        { key: "value", label: "Gives", placeholder: "25% off" },
        { key: "ends", label: "Ends on", type: "date" },
      ],
      defaults: { used: 0, status: "Active" },
      done: (r) => `Code ${String(r.code).toUpperCase()} is ready to share`,
    },
    rowActions: ["Copy code", "Pause", "Edit", "Delete"],
  },

  messages: {
    path: "/messages", title: "Messages", icon: MessageSquare, joins: "Notifications, Update by Email and Update by Notification",
    subtitle: "Write once and send it on the app, WhatsApp, SMS or email. See who opened it.",
    stats: [{ label: "Sent this month", value: "46" }, { label: "Opened", value: "82%", tone: "good" }, { label: "SMS credits left", value: "3,420" }, { label: "Scheduled", value: "2" }],
    tabKey: "status",
    cols: [
      { key: "title", label: "Message", kind: "title", sub: "to" },
      { key: "channel", label: "Sent on", hideSm: true },
      { key: "opened", label: "Opened", kind: "pct" },
      { key: "when", label: "When", hideSm: true },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { title: "Full mock 14 is live. 60 minutes, starts now", to: "SSC CGL 2026 · Morning", channel: "App + WhatsApp", opened: 91, when: "Today, 4:00 PM", status: "Sent" },
      { title: "Diwali offer: 30% off every package", to: "All students", channel: "App + SMS + Email", opened: 74, when: "Yesterday", status: "Sent" },
      { title: "Class moved to 7 PM tonight", to: "Bank PO Foundation", channel: "App + WhatsApp", opened: 96, when: "2 days ago", status: "Sent" },
      { title: "Fee reminder for December", to: "Railway NTPC Weekend", channel: "SMS + Email", opened: 0, when: "1 Dec, 10:00 AM", status: "Scheduled" },
    ],
    create: {
      label: "New message", title: "New message",
      fields: [
        { key: "to", label: "To", type: "select", options: BATCHES },
        { key: "channel", label: "Send on", type: "select", options: ["App + WhatsApp", "App + SMS + Email", "App only", "SMS only", "Email only"] },
        { key: "title", label: "Message", type: "textarea", placeholder: "What do you want to tell them?" },
      ],
      defaults: { opened: 0, when: "Just now", status: "Sent" },
      done: (r) => `Sent to ${r.to} on ${String(r.channel).toLowerCase()}`,
    },
    rowActions: ["See who opened it", "Send again", "Delete"],
  },

  news: {
    path: "/news", title: "News and updates", icon: Megaphone, joins: "News",
    subtitle: "Exam dates, results and articles that students see on their home screen.",
    stats: [{ label: "Published", value: "38" }, { label: "Reads this week", value: "4,960" }, { label: "Most read", value: "CGL notice" }, { label: "Drafts", value: "2" }],
    tabKey: "status",
    cols: [
      { key: "title", label: "Post", kind: "title", sub: "tag" },
      { key: "reads", label: "Reads", kind: "num" },
      { key: "when", label: "Published", hideSm: true },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { title: "SSC CGL 2026 notification is out: key dates", tag: "Exam update", reads: 2140, when: "Today", status: "Published" },
      { title: "How Riya went from 98 to 162 in 8 weeks", tag: "Topper story", reads: 1320, when: "3 days ago", status: "Published" },
      { title: "RRB NTPC admit cards: how to download", tag: "Exam update", reads: 1105, when: "1 week ago", status: "Published" },
      { title: "10 percentage tricks for Tier 1", tag: "Article", reads: 0, when: "", status: "Draft" },
    ],
    create: {
      label: "New post", title: "New post",
      fields: [
        { key: "title", label: "Headline", placeholder: "For example: Bank PO result date announced" },
        { key: "tag", label: "Kind", type: "select", options: ["Exam update", "Article", "Topper story", "Institute news"] },
        { key: "status", label: "Publish", type: "select", options: ["Published", "Draft"] },
      ],
      defaults: { reads: 0, when: "Just now" },
      done: (r) => (r.status === "Published" ? "Posted. Students see it on their home screen" : "Saved as a draft"),
    },
    rowActions: ["Edit", "Pin to the top", "Delete"],
  },

  centers: {
    path: "/centers", title: "Centers", icon: Building2, joins: "Institute > Center",
    subtitle: "Your branches and exam centers, with the activation keys for offline tests.",
    stats: [{ label: "Centers", value: "4" }, { label: "Students", value: "3,764" }, { label: "Keys in use", value: "212 of 300" }, { label: "Offline tests this week", value: "6" }],
    cols: [
      { key: "name", label: "Center", kind: "title", sub: "city" },
      { key: "head", label: "Head", hideSm: true },
      { key: "students", label: "Students", kind: "num" },
      { key: "keys", label: "Keys", hideSm: true },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { name: "Main branch", city: "Laxmi Nagar, Delhi", head: "Anil Mehra", students: 1820, keys: "120 of 150", status: "Active" },
      { name: "Mukherjee Nagar", city: "Delhi", head: "Neha Kapoor", students: 1104, keys: "60 of 80", status: "Active" },
      { name: "Noida Sector 18", city: "Noida", head: "Rahul Bansal", students: 640, keys: "32 of 50", status: "Active" },
      { name: "Gurugram (opening)", city: "Gurugram", head: "Priya Menon", students: 200, keys: "0 of 20", status: "Paused" },
    ],
    create: {
      label: "Add center", title: "Add a center",
      fields: [
        { key: "name", label: "Name", placeholder: "For example: Dwarka" },
        { key: "city", label: "City", placeholder: "Delhi" },
        { key: "head", label: "Head", type: "select", options: ["Anil Mehra", "Neha Kapoor", "Rahul Bansal", "Priya Menon", "Suresh Yadav"] },
      ],
      defaults: { students: 0, keys: "0 of 50", status: "Active" },
      done: (r) => `${r.name} center added with 50 activation keys`,
    },
    rowActions: ["Make more keys", "Edit", "Pause"],
  },

  certificates: {
    path: "/certificates", title: "Certificates", icon: Award, joins: "Manage Certificate",
    subtitle: "Certificates that go out on their own when a student finishes a course or passes a test.",
    stats: [{ label: "Designs", value: "5" }, { label: "Issued this month", value: "318" }, { label: "Shared on LinkedIn", value: "74" }, { label: "Waiting to issue", value: "0", tone: "good" }],
    tabKey: "status",
    cols: [
      { key: "name", label: "Certificate", kind: "title", sub: "rule" },
      { key: "issued", label: "Issued", kind: "num" },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { name: "SSC CGL Course completion", rule: "When a student finishes every lesson", issued: 142, status: "On" },
      { name: "Mock test topper", rule: "Top 3 in any full mock", issued: 96, status: "On" },
      { name: "100-day streak", rule: "Practised 100 days in a row", issued: 38, status: "On" },
      { name: "Bank PO Course completion", rule: "When a student finishes every lesson", issued: 42, status: "On" },
      { name: "Grammar crash course", rule: "Score 70% or more in the final test", issued: 0, status: "Off" },
    ],
    create: {
      label: "New certificate", title: "New certificate",
      fields: [
        { key: "name", label: "Name", placeholder: "For example: Reasoning master" },
        { key: "rule", label: "Give it when", type: "select", options: ["When a student finishes every lesson", "Top 3 in any full mock", "Score 70% or more in the final test"] },
      ],
      defaults: { issued: 0, status: "On" },
      done: (r) => `“${r.name}” will go out automatically`,
    },
    rowActions: ["Edit design", "Preview", "Turn off"],
  },

  services: {
    path: "/services", title: "Services", icon: Sparkles, joins: "Exclusive Services",
    subtitle: "Add-ons from Trigrexam: your own app, your own website, SMS and more. Turn on what you need.",
    stats: [{ label: "Turned on", value: "4" }, { label: "Monthly cost", value: "₹2,400" }, { label: "Your app installs", value: "2,980" }, { label: "Renews on", value: "1 Dec" }],
    tabKey: "status",
    cols: [
      { key: "name", label: "Service", kind: "title", sub: "what" },
      { key: "price", label: "Price" },
      { key: "status", label: "Status", kind: "chip", tones: STATUS },
    ],
    rows: [
      { name: "Your own Android and iOS app", what: "Your logo and colours on the stores", price: "Included", status: "On" },
      { name: "Your own website", what: "shikharacademy.in with the store built in", price: "Included", status: "On" },
      { name: "WhatsApp messages", what: "Reminders and results on WhatsApp", price: "₹1,200 / month", status: "On" },
      { name: "SMS pack", what: "5,000 SMS", price: "₹1,200 / month", status: "On" },
      { name: "Offline test centre kit", what: "OMR sheets and the desktop test app", price: "₹4,999 once", status: "Off" },
      { name: "Proctoring", what: "Camera checks during tests", price: "₹3 per attempt", status: "Off" },
    ],
    create: {
      label: "Ask for a service", title: "Ask for a service",
      fields: [
        { key: "name", label: "What do you need?", placeholder: "For example: YouTube live in the app" },
        { key: "what", label: "Tell us more", type: "textarea", placeholder: "A line or two" },
      ],
      defaults: { price: "We'll quote", status: "Pending" },
      done: () => "Sent to Trigrexam. Someone calls you within a day",
    },
    rowActions: ["Turn on", "Turn off", "See bill"],
  },

  history: {
    path: "/history", title: "Recent changes", icon: History,
    subtitle: "Who changed what, newest first. Undo anything from the last 24 hours.",
    stats: [{ label: "Changes today", value: "37" }, { label: "By teachers", value: "24" }, { label: "By you", value: "13" }, { label: "Undone", value: "1" }],
    cols: [
      { key: "what", label: "Change", kind: "title", sub: "where" },
      { key: "who", label: "By" },
      { key: "when", label: "When", hideSm: true },
    ],
    rows: [
      { what: "Published “CGL Tier 1 · Full mock 14”", where: "Tests", who: "Neha Kapoor", when: "4:00 PM" },
      { what: "Gave 2 extra days to 3 students", where: "Assignments · Percentage Practice Set 7", who: "Neha Kapoor", when: "3:41 PM" },
      { what: "Confirmed a bank transfer of ₹2,499", where: "Sales", who: "Anil Mehra", when: "2:15 PM" },
      { what: "Changed DIWALI30 to end on 15 Nov", where: "Coupons and codes", who: "Anil Mehra", when: "1:02 PM" },
      { what: "Uploaded 4 videos", where: "Content library", who: "Rahul Bansal", when: "11:30 AM" },
      { what: "Added 12 students from a spreadsheet", where: "Students", who: "Anil Mehra", when: "10:05 AM" },
    ],
    create: { label: "", title: "", fields: [], defaults: {}, done: () => "" },
    rowActions: ["Undo", "Open"],
  },
};

export const MODULE_KEYS = Object.keys(MODULES);
