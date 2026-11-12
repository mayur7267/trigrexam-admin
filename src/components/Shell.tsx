import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, ClipboardList, CreditCard, Globe, Info, LogOut, Menu as MenuIcon, Moon, Palette, Plus, Search, Sun, Users as UsersIcon, X } from "lucide-react";
import { useStore } from "../store/store";
import { ME_ADMIN, ME_STUDENT, ME_TEACHER } from "../data/seed";
import { NAV, ROLE_LABEL } from "./nav";
import { shownStatus } from "../lib/selectors";
import { cn } from "../lib/utils";
import type { Role } from "../lib/types";
import { Avatar, IconButton, Kbd, Menu, Modal, Segmented } from "./ui";
import { NoticeRow } from "./NoticeRow";
import logo from "../assets/trigrexam-logo.png";

function usePersona() {
  const { role, teachers, students } = useStore();
  if (role === "admin") return { name: ME_ADMIN.name, sub: ME_ADMIN.title };
  if (role === "teacher") return { name: teachers.find((t) => t.id === ME_TEACHER)!.name, sub: "Teacher · Quant" };
  return { name: students.find((s) => s.id === ME_STUDENT)!.name, sub: "Student · CGL Morning" };
}

function useBadges() {
  const { role, assignments, submissions } = useStore();
  return useMemo(() => {
    const now = Date.now();
    const mineT = new Set(assignments.filter((a) => a.teacherId === ME_TEACHER).map((a) => a.id));
    const review = submissions.filter((s) => s.status === "submitted" && (role === "admin" || mineT.has(s.assignmentId))).length;
    const todo = submissions.filter((s) => {
      if (s.studentId !== ME_STUDENT) return false;
      const a = assignments.find((x) => x.id === s.assignmentId);
      if (!a || a.status === "draft" || a.status === "scheduled") return false;
      const st = shownStatus(a, s, now);
      return st === "todo" || st === "progress" || st === "redo";
    }).length;
    return { review, todo };
  }, [role, assignments, submissions]);
}

function Bell2() {
  const { role, notices, markAllRead } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  const mine = notices.filter((n) => n.audience === role).sort((a, b) => b.at - a.at);
  const unread = mine.filter((n) => !n.read).length;
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="relative inline-flex size-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-black/[.06] hover:text-ink dark:hover:bg-white/10">
        <Bell size={18} className={unread > 0 ? "wiggle" : ""} />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-bad px-1 text-[10px] font-bold leading-4 text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-[-60px] top-full z-50 mt-2.5 w-[400px] max-w-[calc(100vw-24px)] overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-pop)] sm:right-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">Notifications</h2>
            <button onClick={() => markAllRead(role)} className="text-[13px] font-medium text-sky-600 hover:text-navy">Mark all as read</button>
          </div>
          <div className="max-h-[420px] divide-y divide-line overflow-y-auto">
            {mine.slice(0, 6).map((n) => <NoticeRow key={n.id} n={n} onNavigate={() => setOpen(false)} />)}
          </div>
          <Link to="/notifications" className="block border-t border-line bg-surface-2 py-3.5 text-center text-sm font-medium text-sky-600 hover:text-navy">See all notifications</Link>
        </div>
      )}
    </div>
  );
}

function Palette2({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, assignments, students, submissions } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out: { group: string; label: string; hint?: string; to: string; icon: typeof Search }[] = [];
    for (const it of NAV[role]) if (!term || it.label.toLowerCase().includes(term)) out.push({ group: "Go to", label: it.label, to: it.to, icon: it.icon });
    if (role !== "student" && (!term || "new assignment create".includes(term))) out.push({ group: "Do", label: "Create a new assignment", to: "/assignments/new", icon: Plus });
    const myIds = new Set(submissions.filter((s) => s.studentId === ME_STUDENT).map((s) => s.assignmentId));
    for (const a of assignments) {
      if (role === "student" && !myIds.has(a.id)) continue;
      if (a.status === "draft" && role === "student") continue;
      if (term && a.title.toLowerCase().includes(term)) out.push({ group: "Assignments", label: a.title, hint: a.status, to: `/assignments/${a.id}`, icon: ClipboardList });
    }
    if (role !== "student" && term.length > 1) {
      for (const s of students) if (s.name.toLowerCase().includes(term) || s.roll.toLowerCase().includes(term)) out.push({ group: "Students", label: s.name, hint: s.roll, to: `/students?open=${s.id}`, icon: UsersIcon });
    }
    return out.slice(0, 9);
  }, [q, role, assignments, students, submissions]);

  const go = (to: string) => { onClose(); nav(to); };

  return (
    <Modal open={open} onClose={onClose} label="Search">
      <div className="flex items-center gap-3 border-b border-line px-6 py-5">
        <Search size={20} className="text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
            if (e.key === "Enter" && results[idx]) go(results[idx].to);
          }}
          placeholder={role === "student" ? "Search your assignments or pages" : "Search students, assignments or pages"}
          className="flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-faint"
          aria-label="Search"
        />
        <Kbd>Esc</Kbd>
      </div>
      <ul className="max-h-[380px] overflow-y-auto p-2.5">
        {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Nothing found for “{q}”.</li>}
        {results.map((r, i) => (
          <li key={r.group + r.label + i}>
            {(i === 0 || results[i - 1].group !== r.group) && <p className="eyebrow px-3 pb-1 pt-3">{r.group}</p>}
            <button onClick={() => go(r.to)} onMouseEnter={() => setIdx(i)} className={cn("flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left", idx === i ? "bg-black/[.05] dark:bg-white/10" : "")}>
              <r.icon size={17} className="text-muted" />
              <span className="flex-1 truncate text-[15px] font-medium text-ink">{r.label}</span>
              {r.hint && <span className="text-xs capitalize text-muted">{r.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function Shell() {
  const store = useStore();
  const { role, setRole, dark, setDark } = store;
  const loc = useLocation();
  const nav = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [run, setRun] = useState(0);
  const persona = usePersona();
  const badges = useBadges();

  useEffect(() => { setNavOpen(false); window.scrollTo(0, 0); setRun((n) => n + 1); }, [loc.pathname]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen]);

  const switchRole = (r: Role) => { setRole(r); nav("/"); };
  const count = (b?: "review" | "todo") => (b === "review" ? badges.review : b === "todo" ? badges.todo : 0);
  const extra = role === "admin" ? [{ to: "/billing", label: "Plan and billing" }, { to: "/settings", label: "Settings" }] : [];

  return (
    <div className="min-h-dvh bg-bg">
      {run > 1 && <span key={run} className="navbar-run" aria-hidden />}

      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] dark:border-white/10">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center gap-1 px-4 sm:px-6">
          <Link to="/" aria-label="Trigrexam home" className="mr-2 shrink-0 lg:mr-5"><img src={logo} alt="Trigrexam" className="h-[22px] w-auto dark:brightness-0 dark:invert" /></Link>

          <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {NAV[role].map((it) => {
              const c = count(it.badge);
              return (
                <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => cn("relative inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors", isActive ? "bg-black/[0.06] text-ink dark:bg-white/10" : "text-ink/65 hover:text-ink")}>
                  {it.label}
                  {c > 0 && <span className="ml-1.5 rounded-full bg-sky px-1.5 text-[10px] font-bold leading-4 text-white tnum">{c}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
            <IconButton icon={Search} label="Search (Ctrl K)" size={36} onClick={() => setPalette(true)} className="rounded-full text-ink/70 hover:bg-black/[.06] hover:text-ink dark:hover:bg-white/10" />
            <div className="mx-1.5 hidden xl:block">
              <Segmented<Role> size="sm" label="Preview as" value={role} onChange={switchRole} options={[{ id: "admin", label: "Admin" }, { id: "teacher", label: "Teacher" }, { id: "student", label: "Student" }]} />
            </div>
            <IconButton icon={dark ? Sun : Moon} label={dark ? "Switch to light mode" : "Switch to dark mode"} size={36} onClick={() => setDark(!dark)} className="hidden rounded-full text-ink/70 hover:bg-black/[.06] hover:text-ink sm:inline-flex dark:hover:bg-white/10" />
            <Bell2 />
            <Menu
              trigger={(p) => (
                <button {...p} aria-label="Account menu" className="ml-0.5 hidden rounded-full p-0.5 transition-opacity hover:opacity-80 sm:block"><Avatar name={persona.name} size={30} /></button>
              )}
              items={[
                { label: `${persona.name} · ${ROLE_LABEL[role]}`, onClick: () => {} },
                { label: "Preview as Admin", onClick: () => switchRole("admin") },
                { label: "Preview as Teacher", onClick: () => switchRole("teacher") },
                { label: "Preview as Student", onClick: () => switchRole("student") },
                ...(role === "admin" ? [{ label: "Plan and billing", icon: CreditCard, onClick: () => nav("/billing") }, { label: "Settings", icon: Palette, onClick: () => nav("/settings") }] : []),
                { label: "About this design", icon: Info, onClick: () => nav("/about") },
                { label: "Product website", icon: Globe, onClick: () => nav("/welcome") },
                { label: "Sign out", icon: LogOut, onClick: () => nav("/login") },
              ]}
            />
            <IconButton icon={navOpen ? X : MenuIcon} label={navOpen ? "Close menu" : "Open menu"} size={36} onClick={() => setNavOpen(!navOpen)} className="rounded-full text-ink/70 lg:hidden" />
          </div>
        </div>
      </header>

      {navOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[52px] z-40 overflow-y-auto bg-surface px-6 pb-10 pt-6 lg:hidden">
          <nav aria-label="Menu">
            {NAV[role].map((it, i) => (
              <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setNavOpen(false)} className="rise flex items-center justify-between border-b border-line py-3.5 text-[26px] font-semibold tracking-tight text-ink" style={{ animationDelay: `${i * 40}ms` }}>
                {it.label}
                {count(it.badge) > 0 && <span className="rounded-full bg-sky px-2.5 py-0.5 text-sm font-bold text-white tnum">{count(it.badge)}</span>}
              </NavLink>
            ))}
            {extra.map((it, i) => (
              <NavLink key={it.to} to={it.to} onClick={() => setNavOpen(false)} className="rise block border-b border-line py-3.5 text-[20px] font-medium tracking-tight text-muted" style={{ animationDelay: `${(NAV[role].length + i) * 40}ms` }}>{it.label}</NavLink>
            ))}
          </nav>
          <div className="mt-8">
            <p className="eyebrow mb-3">Preview as</p>
            <Segmented<Role> label="Preview as" value={role} onChange={(r) => { setNavOpen(false); switchRole(r); }} options={[{ id: "admin", label: "Admin" }, { id: "teacher", label: "Teacher" }, { id: "student", label: "Student" }]} />
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-[15px] font-medium text-sky-600">
            <button onClick={() => { setNavOpen(false); nav("/about"); }}>About this design</button>
            <button onClick={() => { setNavOpen(false); nav("/welcome"); }}>Product website</button>
            <button onClick={() => setDark(!dark)}>{dark ? "Light mode" : "Dark mode"}</button>
            <button onClick={() => nav("/login")}>Sign out</button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-[84px] sm:px-8 sm:pt-[104px]">
        <div key={loc.pathname} className="rise">
          <Outlet />
        </div>
      </main>

      <footer className="mx-auto max-w-[1280px] border-t border-line px-4 py-8 text-[12px] leading-relaxed text-faint sm:px-8">
        <p>Demo with sample data from a fictional institute. Nothing is saved or sent.</p>
        <p className="mt-1">Copyright © 2026 Trigrexam Inc. · <Link to="/welcome" className="hover:text-ink">Product website</Link> · <Link to="/about" className="hover:text-ink">About this design</Link></p>
      </footer>
      <Palette2 open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
