import { BookOpen, Flag } from "lucide-react";
import { useStore } from "../store/store";
import { PageHeader, Ring } from "../components/ui";
import { HBars } from "../components/charts";
import { plural } from "../lib/utils";

const BANNERS = [
  "var(--hero)",
  "linear-gradient(118deg, #3a2391 0%, #6a55c9 55%, #1ea6e4 150%)",
  "linear-gradient(118deg, #0c5a4a 0%, #23996b 55%, #1ea6e4 160%)",
];

export function Courses() {
  const st = useStore();
  return (
    <div>
      <PageHeader icon={BookOpen} title="Courses" subtitle="What each course covers and how far every batch has come." />
      <div className="stagger grid gap-6 lg:grid-cols-2">
        {st.courses.map((c, i) => {
          const batches = st.batches.filter((b) => c.batchIds.includes(b.id));
          const students = batches.reduce((n, b) => n + b.studentIds.length, 0);
          return (
            <section key={c.id} className="card overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
              <div className="relative isolate overflow-hidden px-6 pb-6 pt-6 text-white" style={{ background: BANNERS[i % BANNERS.length] }}>
                <span aria-hidden className="absolute inset-0 -z-[1] opacity-60" style={{ backgroundImage: "radial-gradient(rgb(255 255 255 / 0.28) 1.2px, transparent 1.4px)", backgroundSize: "20px 20px", WebkitMaskImage: "linear-gradient(100deg, transparent 30%, #000 90%)", maskImage: "linear-gradient(100deg, transparent 30%, #000 90%)" }} />
                <span aria-hidden className="absolute -right-16 -top-20 -z-[1] size-64 rounded-full bg-white/15 blur-2xl" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">{plural(c.subjects.length, "subject")}</p>
                    <h2 className="mt-1.5 text-[22px] font-bold leading-tight tracking-tight text-white">{c.name}</h2>
                    <p className="mt-1.5 text-sm text-white/80">{plural(students, "student")} · {batches.map((b) => b.short).join(", ")}</p>
                  </div>
                  <Ring value={c.progress} size={76} stroke={8} color="#fff" track="rgba(255,255,255,0.25)" textClass="text-white" />
                </div>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur"><Flag size={14} /> {c.nextMilestone}</p>
              </div>
              <div className="p-6">
                <p className="eyebrow mb-4">Lessons covered</p>
                <HBars items={c.modules.map((m) => ({ label: m.title, value: Math.round((m.done / m.total) * 100), display: `${m.done} of ${m.total}` }))} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
