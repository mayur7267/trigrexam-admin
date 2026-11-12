import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { useStore } from "../store/store";
import { ME_STUDENT } from "../data/seed";
import { useMine } from "../lib/hooks";
import { SUBJECTS, fmtAgo } from "../lib/utils";
import type { SubjectId } from "../lib/types";
import { Avatar, CardHead, PageHeader, Ring, SubjectTag } from "../components/ui";
import { HBars, LineChart } from "../components/charts";

export function Progress() {
  const st = useStore();
  const me = st.students.find((s) => s.id === ME_STUDENT)!;
  const done = useMine().filter((m) => m.shown === "reviewed" && m.s.score !== undefined).sort((x, y) => (y.s.reviewedAt ?? 0) - (x.s.reviewedAt ?? 0));
  const subjects = (Object.keys(SUBJECTS) as SubjectId[]).map((k) => ({ k, v: me.subjectScores[k] })).sort((a, b) => b.v - a.v);
  const best = subjects[0];
  const weakest = subjects[subjects.length - 1];

  const mates = st.students.filter((s) => s.batchId === me.batchId).sort((a, b) => b.avgScore - a.avgScore || a.name.localeCompare(b.name));
  const rank = mates.findIndex((s) => s.id === me.id) + 1;
  const batch = st.batches.find((b) => b.id === me.batchId)!;
  const podium = [mates[1], mates[0], mates[2]];
  const heights = [96, 128, 72];
  const medal = ["#c9d3e3", "#f3c34a", "#e3a272"];
  const below = mates.slice(3, 6);
  const showMe = rank > 6;

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader icon={TrendingUp} title="My progress" subtitle="A simple look at how you are doing, and what to practise next." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Average score", v: me.avgScore, color: "var(--color-sky)" },
          { label: "Class attendance", v: me.attendance, color: "var(--color-navy)" },
          { label: "Handed in on time", v: me.onTime, color: "var(--color-ok)" },
        ].map((t) => (
          <div key={t.label} className="card flex items-center gap-5 p-5">
            <Ring value={t.v} size={72} stroke={8} color={t.color} />
            <p className="text-[15px] font-bold text-ink">{t.label}</p>
          </div>
        ))}
      </div>

      <section className="card mb-6 overflow-hidden">
        <CardHead title="How you rank in your batch" hint={<>You are <b className="text-ink">#{rank}</b> of {mates.length} in {batch.short}</>} />
        <div className="grid items-end gap-x-10 gap-y-6 px-5 pt-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="flex items-end justify-center gap-3 sm:gap-5">
            {podium.map((p, i) => (
              <div key={p.id} className="flex w-24 flex-col items-center sm:w-28">
                <Avatar name={p.name} size={i === 1 ? 58 : 48} className={p.id === me.id ? "ring-4 ring-sky" : ""} />
                <p className="mt-2 w-full truncate text-center text-[13px] font-bold text-ink">{p.id === me.id ? "You" : `${p.name.split(" ")[0]} ${p.name.split(" ")[1]?.[0] ?? ""}.`}</p>
                <p className="mb-2 text-xs font-semibold text-muted tnum">{p.avgScore}%</p>
                <div className="flex w-full items-start justify-center rounded-t-2xl pt-3 text-2xl font-extrabold text-ink/80" style={{ height: heights[i], background: `linear-gradient(180deg, ${medal[i]}, color-mix(in srgb, ${medal[i]} 55%, var(--color-surface)))` }}>{[2, 1, 3][i]}</div>
              </div>
            ))}
          </div>
          <ul className="pb-6">
            {below.map((p, i) => <RankRow key={p.id} n={i + 4} id={p.id} name={p.name} score={p.avgScore} me={p.id === me.id} />)}
            {showMe && <><li className="py-1 text-center text-faint">· · ·</li><RankRow n={rank} id={me.id} name={me.name} score={me.avgScore} me /></>}
          </ul>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <CardHead title="Your score over six weeks" hint="Average of your tests" />
          <div className="px-5 pb-5 pt-5"><LineChart data={me.trend} labels={["W1", "W2", "W3", "W4", "W5", "W6"]} unit="%" min={Math.max(0, Math.min(...me.trend) - 15)} max={100} /></div>
        </section>
        <section className="card">
          <CardHead title="By subject" hint={`Strongest in ${SUBJECTS[best.k].short}. ${SUBJECTS[weakest.k].short} needs a little more practice.`} />
          <div className="px-5 pb-5 pt-5">
            <HBars items={subjects.map(({ k, v }) => ({ label: SUBJECTS[k].name, value: v, color: SUBJECTS[k].color }))} />
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <CardHead title="Everything reviewed so far" />
        <ul className="mt-3 divide-y divide-line">
          {done.map(({ a, s }) => (
            <li key={a.id}>
              <Link to={`/assignments/${a.id}`} className="row-hover flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{a.title}</p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-muted"><SubjectTag subject={a.subject} />{s.reviewedAt ? fmtAgo(s.reviewedAt) : ""}</p>
                </div>
                <div className="hidden w-32 sm:block"><div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-sky" style={{ width: `${((s.score ?? 0) / a.maxMarks) * 100}%` }} /></div></div>
                <p className="w-16 text-right text-sm font-bold text-ink tnum">{s.score}<span className="font-medium text-muted">/{a.maxMarks}</span></p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RankRow({ n, name, score, me }: { n: number; id: string; name: string; score: number; me?: boolean }) {
  return (
    <li className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${me ? "bg-sky-50" : ""}`}>
      <span className="w-6 text-center text-sm font-bold text-muted tnum">{n}</span>
      <Avatar name={name} size={32} />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{me ? "You" : name}</span>
      <span className="text-sm font-bold text-ink tnum">{score}%</span>
    </li>
  );
}
