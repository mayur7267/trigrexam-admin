import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, Eye, EyeOff, GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import { useStore } from "../store/store";
import type { Role } from "../lib/types";
import { Button, Input } from "../components/ui";
import logo from "../assets/trigrexam-logo.png";

const DEMOS: { role: Role; icon: typeof UserRound; title: string; body: string }[] = [
  { role: "admin", icon: ShieldCheck, title: "Admin", body: "See everything and act on what needs you" },
  { role: "teacher", icon: GraduationCap, title: "Teacher", body: "Create work and review it calmly" },
  { role: "student", icon: UserRound, title: "Student", body: "A simple to-do list that works on your phone" },
];

export function Login() {
  const { setRole } = useStore();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const enter = (r: Role) => { setRole(r); nav("/"); };

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-surface px-6 pb-16 pt-24 sm:pt-32">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(30_166_228/0.22),rgb(163_95_209/0.12)_55%,transparent)] blur-2xl" />
      <button onClick={() => nav("/welcome")} className="absolute left-5 top-5 inline-flex items-center gap-1 text-[14px] font-medium text-sky-600 hover:text-navy sm:left-8 sm:top-7"><ChevronLeft size={17} /> Product website</button>

      <img src={logo} alt="Trigrexam" className="rise relative h-9 w-auto dark:brightness-0 dark:invert" />
      <h1 className="display rise relative mt-10 max-w-[620px] text-center text-[38px] sm:text-[56px]" style={{ animationDelay: "60ms" }}>Sign in to <span className="gradient-text">Trigrexam Admin.</span></h1>
      <p className="rise relative mt-4 text-center text-[18px] text-muted sm:text-[21px]" style={{ animationDelay: "120ms" }}>Use your email, or explore as a role.</p>

      <form className="rise relative mt-10 w-full max-w-[400px] space-y-3" style={{ animationDelay: "180ms" }} onSubmit={(e) => { e.preventDefault(); enter("admin"); }}>
        <Input type="email" defaultValue="anil@shikharacademy.in" autoComplete="off" aria-label="Email" className="!h-14 !rounded-2xl !px-5 !text-[17px]" />
        <div className="relative">
          <Input type={show ? "text" : "password"} defaultValue="demo-password" autoComplete="off" aria-label="Password" className="!h-14 !rounded-2xl !pl-5 !pr-12 !text-[17px]" />
          <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:text-ink">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" iconRight={ArrowRight}>Sign in</Button>
      </form>

      <div className="relative my-10 flex w-full max-w-[400px] items-center gap-4 text-xs font-semibold uppercase tracking-wider text-faint"><span className="h-px flex-1 bg-line" />or explore as<span className="h-px flex-1 bg-line" /></div>

      <div className="rise relative w-full max-w-[400px] space-y-3" style={{ animationDelay: "240ms" }}>
        {DEMOS.map((d) => (
          <button key={d.role} onClick={() => enter(d.role)} className="group flex w-full items-center gap-4 rounded-3xl bg-bg p-4 text-left transition-all duration-300 hover:scale-[1.015] hover:bg-navy-50">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-navy"><d.icon size={22} /></span>
            <span className="min-w-0 flex-1"><span className="block text-[17px] font-semibold text-ink">{d.title}</span><span className="block text-[14px] text-muted">{d.body}</span></span>
            <ArrowRight size={18} className="text-faint transition-transform group-hover:translate-x-1 group-hover:text-navy" />
          </button>
        ))}
      </div>
      <p className="relative mt-10 text-center text-xs text-faint">Demo with sample data. Nothing is saved or sent.</p>
    </div>
  );
}
