import {
  Award, BookOpen, Building2, ChartColumn, ClipboardCheck, CreditCard, FileQuestion, FolderOpen, GraduationCap, History, House, Layers, ListChecks,
  Megaphone, MessageSquare, Package, Receipt, Settings, Sparkles, Store, Ticket, TrendingUp, Users, Video, type LucideIcon,
} from "lucide-react";
import type { Role } from "../lib/types";

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: "review" | "todo" }
export interface NavGroup { title?: string; items: NavItem[] }

export const NAV: Record<Role, NavGroup[]> = {
  admin: [
    { items: [{ to: "/", label: "Home", icon: House, end: true }] },
    { title: "People", items: [{ to: "/students", label: "Students", icon: Users }, { to: "/teachers", label: "Teachers", icon: GraduationCap }] },
    { title: "Teach", items: [
      { to: "/courses", label: "Courses", icon: BookOpen },
      { to: "/library", label: "Content library", icon: FolderOpen },
      { to: "/series", label: "Series", icon: Layers },
      { to: "/classes", label: "Live classes", icon: Video },
      { to: "/assignments", label: "Assignments", icon: ClipboardCheck, badge: "review" },
    ] },
    { title: "Assess", items: [
      { to: "/tests", label: "Tests", icon: ListChecks },
      { to: "/questions", label: "Question bank", icon: FileQuestion },
      { to: "/reports", label: "Results and reports", icon: ChartColumn },
    ] },
    { title: "Sell", items: [
      { to: "/packages", label: "Packages", icon: Package },
      { to: "/sales", label: "Sales", icon: Receipt },
      { to: "/coupons", label: "Coupons and codes", icon: Ticket },
      { to: "/store", label: "Ready-made tests", icon: Store },
    ] },
    { title: "Engage", items: [{ to: "/messages", label: "Messages", icon: MessageSquare }, { to: "/news", label: "News and updates", icon: Megaphone }] },
    { title: "Setup", items: [
      { to: "/centers", label: "Centers", icon: Building2 },
      { to: "/certificates", label: "Certificates", icon: Award },
      { to: "/services", label: "Services", icon: Sparkles },
      { to: "/history", label: "Recent changes", icon: History },
      { to: "/billing", label: "Plan and billing", icon: CreditCard },
      { to: "/settings", label: "Settings", icon: Settings },
    ] },
  ],
  teacher: [
    { items: [{ to: "/", label: "Today", icon: House, end: true }] },
    { title: "Teach", items: [
      { to: "/assignments", label: "Assignments", icon: ClipboardCheck, badge: "review" },
      { to: "/classes", label: "Live classes", icon: Video },
      { to: "/students", label: "My students", icon: Users },
    ] },
  ],
  student: [
    { items: [
      { to: "/", label: "My work", icon: ClipboardCheck, end: true, badge: "todo" },
      { to: "/classes", label: "Classes", icon: Video },
      { to: "/progress", label: "My progress", icon: TrendingUp },
    ] },
  ],
};

export const navItems = (r: Role) => NAV[r].flatMap((g) => g.items);

export const ROLE_LABEL: Record<Role, string> = { admin: "Admin", teacher: "Teacher", student: "Student" };
