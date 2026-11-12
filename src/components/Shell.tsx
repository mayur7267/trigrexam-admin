import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronsUpDown, ClipboardList, Globe, Info, ListChecks, LogOut, Megaphone, Menu as MenuIcon, MessageSquare, Moon, Package, Plus, Search, Sun, Ticket, Upload, Users as UsersIcon, Video, X } from "lucide-react";
import { useStore } from "../store/store";
import { INSTITUTE, ME_ADMIN, ME_STUDENT, ME_TEACHER } from "../data/seed";
import { NAV, navItems } from "./nav";
import { shownStatus } from "../lib/selectors";
import { cn } from "../lib/utils";
import type { Role } from "../lib/types";
import { Avatar, IconButton, Kbd, Menu, Modal, Segmented } from "./ui";
import { NoticeRow } from "./NoticeRow";
import logo from "../assets/trigrexam-logo.png";

const CREATE: Record<Role, { label: string; to: string; icon: typeof Search }[]> = {
  admin: [
    { label: "New assignment", to: "/assignments/new", icon: ClipboardList },
    { label: "New test", to: "/tests?new=1", icon: ListChecks },
    { label: "Upload a video or PDF", to: "/library?new=1", icon: Upload },
    { label: "Schedule a live class", to: "/classes", icon: Video },
    { label: "New package", to: "/packages?new=1", icon: Package },
    { label: "New coupon", to: "/coupons?new=1", icon: Ticket },
    { label: "Send a message", to: "/messages?new=1", icon: MessageSquare },
    { label: "Post news", to: "/news?new=1", icon: Megaphone },
  ],
  teacher: [
    { label: "New assignment", to: "/assignments/new", icon: ClipboardList },
    { label: "Schedule a live class", to: "/classes", icon: Video },
  ],
  student: [],
};

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
    for (const it of navItems(role)) if (!term || it.label.toLowerCase().includes(term)) out.push({ group: "Go to", label: it.label, to: it.to, icon: it.icon });
    for (const c of CREATE[role]) if (!term || c.label.toLowerCase().includes(term) || "create new".includes(term)) out.push({ group: "Do", label: c.label, to: c.to, icon: c.icon });
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
  const roles = <Segmented<Role> size="sm" label="Preview as" value={role} onChange={(r) => { setNavOpen(false); switchRole(r); }} options={[{ id: "admin", label: "Admin" }, { id: "teacher", label: "Teacher" }, { id: "student", label: "Student" }]} />;

  const links = (big?: boolean) => NAV[role].map((g, gi) => (
    <div key={gi} className={gi ? (big ? "mt-6" : "mt-5") : ""}>
      {g.title && <p className={cn("eyebrow mb-1.5 px-3", big ? "text-[12px]" : "text-[11px]")}>{g.title}</p>}
      {g.items.map((it) => {
        const c = count(it.badge);
        return (
          <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setNavOpen(false)}
            className={({ isActive }) => cn("group flex items-center gap-3 rounded-xl px-3 font-medium transition-colors", big ? "py-2.5 text-[17px]" : "py-[7px] text-[14px]", isActive ? "bg-black/[0.06] text-ink dark:bg-white/10" : "text-ink/70 hover:bg-black/[0.035] hover:text-ink dark:hover:bg-white/[.06]")}>
            {({ isActive }) => (<>
              <it.icon size={big ? 19 : 17} strokeWidth={isActive ? 2.3 : 1.9} className={isActive ? "text-sky-600" : "text-ink/45 group-hover:text-ink/70"} />
              <span className="flex-1 truncate">{it.label}</span>
              {c > 0 && <span className="rounded-full bg-sky px-1.5 text-[11px] font-bold leading-[18px] text-white tnum">{c}</span>}
            </>)}
          </NavLink>
        );
      })}
    </div>
  ));

  const account = (
    <Menu
      align="left"
      trigger={(p) => (
        <button {...p} aria-label="Account menu" className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]">
          <Avatar name={persona.name} size={34} />
          <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{persona.name}</span><span className="block truncate text-[12px] text-muted">{persona.sub}</span></span>
          <ChevronsUpDown size={15} className="text-faint" />
        </button>
      )}
      items={[
        { label: "About this design", icon: Info, onClick: () => nav("/about") },
        { label: "Product website", icon: Globe, onClick: () => nav("/welcome") },
        { label: dark ? "Light mode" : "Dark mode", icon: dark ? Sun : Moon, onClick: () => setDark(!dark) },
        { label: "Sign out", icon: LogOut, onClick: () => nav("/login") },
      ]}
    />
  );

  return (
    <div className="min-h-dvh bg-bg">
      {run > 1 && <span key={run} className="navbar-run" aria-hidden />}

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] flex-col border-r border-line bg-surface/80 backdrop-blur-xl lg:flex">
        <Link to="/" aria-label="Trigrexam home" className="flex items-center gap-3 px-5 pb-4 pt-5">
          <img src={logo} alt="Trigrexam" className="h-[22px] w-auto dark:brightness-0 dark:invert" />
        </Link>
        <p className="-mt-2 px-5 pb-3 text-[12px] font-medium text-muted">{INSTITUTE}</p>
        <nav aria-label="Main" className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">{links()}</nav>
        <div className="border-t border-line px-3 pb-3 pt-3">
          <p className="eyebrow mb-2 px-1 text-[11px]">Preview as</p>
          <div className="mb-2 [&>div]:flex [&>div]:w-full [&_button]:flex-1">{roles}</div>
          {account}
        </div>
      </aside>

      <div className="lg:pl-[256px]">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 border-b border-black/[0.06] dark:border-white/10">
          <div className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-2 px-4 sm:px-8">
            <Link to="/" aria-label="Trigrexam home" className="mr-1 shrink-0 lg:hidden"><img src={logo} alt="Trigrexam" className="h-[20px] w-auto dark:brightness-0 dark:invert" /></Link>
            <button onClick={() => setPalette(true)} className="ml-auto flex h-10 items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 text-[14px] text-faint transition-colors hover:border-line-strong sm:w-[300px] lg:ml-0 lg:w-[380px]" aria-label="Search (Ctrl K)">
              <Search size={16} />
              <span className="hidden flex-1 text-left sm:block">Search or jump to anything</span>
              <span className="hidden sm:block"><Kbd>⌘K</Kbd></span>
            </button>
            <div className="ml-auto flex items-center gap-1">
              {CREATE[role].length > 0 && (
                <Menu
                  trigger={(p) => (
                    <button {...p} className="mr-1 inline-flex h-10 items-center gap-1.5 rounded-full bg-navy px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-navy-700">
                      <Plus size={17} strokeWidth={2.4} /> <span className="hidden sm:inline">Create</span>
                    </button>
                  )}
                  items={CREATE[role].map((c) => ({ label: c.label, icon: c.icon, onClick: () => nav(c.to) }))}
                />
              )}
              <IconButton icon={dark ? Sun : Moon} label={dark ? "Switch to light mode" : "Switch to dark mode"} size={38} onClick={() => setDark(!dark)} className="hidden rounded-full text-ink/70 hover:bg-black/[.06] hover:text-ink sm:inline-flex dark:hover:bg-white/10" />
              <Bell2 />
              <IconButton icon={navOpen ? X : MenuIcon} label={navOpen ? "Close menu" : "Open menu"} size={38} onClick={() => setNavOpen(!navOpen)} className="rounded-full text-ink/70 lg:hidden" />
            </div>
          </div>
        </header>

        {navOpen && (
          <div className="fixed inset-x-0 bottom-0 top-[60px] z-40 overflow-y-auto bg-surface px-4 pb-10 pt-5 lg:hidden">
            <div className="mb-6 px-3">{roles}</div>
            <nav aria-label="Menu">{links(true)}</nav>
            <div className="mt-8 border-t border-line pt-4">{account}</div>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-8 sm:px-8 sm:pt-12">
          <div key={loc.pathname} className="rise">
            <Outlet />
          </div>
        </main>

        <footer className="mx-auto max-w-[1240px] border-t border-line px-4 py-8 text-[12px] leading-relaxed text-faint sm:px-8">
          <p>Demo with sample data from a fictional institute. Nothing is saved or sent.</p>
          <p className="mt-1">Copyright © 2026 Trigrexam Inc. · <Link to="/welcome" className="hover:text-ink">Product website</Link> · <Link to="/about" className="hover:text-ink">About this design</Link></p>
        </footer>
      </div>
      <Palette2 open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
