import { BookOpen, ChartColumn, ClipboardCheck, GraduationCap, House, Store, TrendingUp, Users, Video, type LucideIcon } from "lucide-react";
import type { Role } from "../lib/types";

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: "review" | "todo" }

export const NAV: Record<Role, NavItem[]> = {
  admin: [
    { to: "/", label: "Home", icon: House, end: true },
    { to: "/assignments", label: "Assignments", icon: ClipboardCheck, badge: "review" },
    { to: "/students", label: "Students", icon: Users },
    { to: "/teachers", label: "Teachers", icon: GraduationCap },
    { to: "/classes", label: "Live classes", icon: Video },
    { to: "/courses", label: "Courses", icon: BookOpen },
    { to: "/store", label: "Test store", icon: Store },
    { to: "/reports", label: "Reports", icon: ChartColumn },
  ],
  teacher: [
    { to: "/", label: "Today", icon: House, end: true },
    { to: "/assignments", label: "Assignments", icon: ClipboardCheck, badge: "review" },
    { to: "/classes", label: "Live classes", icon: Video },
    { to: "/students", label: "My students", icon: Users },
  ],
  student: [
    { to: "/", label: "My work", icon: ClipboardCheck, end: true, badge: "todo" },
    { to: "/classes", label: "Classes", icon: Video },
    { to: "/progress", label: "My progress", icon: TrendingUp },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { admin: "Admin", teacher: "Teacher", student: "Student" };
