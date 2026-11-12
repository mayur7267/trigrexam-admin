import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ellipsis, Inbox, Plus, Search } from "lucide-react";
import { MODULES, type Row } from "../data/modules";
import { rupees } from "../data/plans";
import { Button, Chip, Empty, Field, Input, Menu, Modal, ModalFoot, ModalHead, PageHeader, Select, Tabs, Textarea } from "../components/ui";
import { useToast } from "../components/toast";
import { cn } from "../lib/utils";

const fmt = (v: unknown, kind?: string) => {
  if (kind === "money") return rupees(Number(v));
  if (kind === "num") return new Intl.NumberFormat("en-IN").format(Number(v));
  if (kind === "pct") return Number(v) ? `${v}%` : "—";
  return String(v ?? "");
};

export function Module({ id }: { id: string }) {
  const m = MODULES[id];
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Row[]>(m.rows);
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Row>({});
  const [fresh, setFresh] = useState<Row | null>(null);

  const startCreate = () => {
    setDraft(Object.fromEntries(m.create.fields.map((f) => [f.key, f.options?.[0] ?? ""])));
    setOpen(true);
  };
  // The Create menu in the top bar links here with ?new=1.
  useEffect(() => {
    if (params.get("new") === "1" && m.create.fields.length) { startCreate(); setParams({}, { replace: true }); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = useMemo(() => {
    if (!m.tabKey) return [];
    const vals = [...new Set(rows.map((r) => String(r[m.tabKey!])))];
    return [{ id: "All", label: "All", count: rows.length }, ...vals.map((v) => ({ id: v, label: v, count: rows.filter((r) => String(r[m.tabKey!]) === v).length }))];
  }, [rows, m.tabKey]);

  const shown = rows.filter((r) => (tab === "All" || String(r[m.tabKey!]) === tab) && (!q || Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase())));
  const title = m.cols[0];
  const ready = m.create.fields.every((f) => f.type === "number" || f.type === "date" || String(draft[f.key] ?? "").trim());

  const save = () => {
    const r: Row = { ...m.create.defaults, ...Object.fromEntries(Object.entries(draft).filter(([, v]) => v !== "")) };
    for (const f of m.create.fields) if (f.type === "number") r[f.key] = Number(draft[f.key]) || 0;
    if (r.code) r.code = String(r.code).toUpperCase();
    setRows((x) => [r, ...x]);
    setFresh(r);
    setTab("All");
    setOpen(false);
    toast(m.create.done(r));
  };

  const act = (a: string, r: Row) => {
    if (a === "Delete") { setRows((x) => x.filter((y) => y !== r)); toast(`Deleted “${r[title.key]}”`); return; }
    toast(`${a} · ${r[title.key]}`);
  };

  return (
    <div>
      <PageHeader
        title={m.title}
        subtitle={m.subtitle}
        actions={m.create.label ? <Button variant="primary" icon={Plus} onClick={startCreate}>{m.create.label}</Button> : undefined}
      />

      <div className="stagger mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {m.stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-[13px] font-semibold text-muted">{s.label}</p>
            <p className="mt-2 truncate text-[28px] font-bold leading-tight tracking-tight tnum">{s.value}</p>
            {s.hint && <p className={cn("mt-1 text-[13px] font-medium", s.tone === "good" ? "text-ok" : s.tone === "warn" ? "text-warn" : s.tone === "bad" ? "text-bad" : "text-muted")}>{s.hint}</p>}
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-4">
          {tabs.length > 1 ? <Tabs items={tabs} value={tab} onChange={setTab} className="border-b-0" /> : <span />}
          <label className="relative mb-3 w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${m.title.toLowerCase()}`} className="h-10 pl-9" aria-label={`Search ${m.title}`} />
          </label>
        </div>

        {shown.length === 0 ? (
          <div className="border-t border-line p-8"><Empty icon={Inbox} title="Nothing here" body={q ? `Nothing matches “${q}”.` : "Nothing in this list yet."} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-y border-line bg-surface-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  {m.cols.map((c) => <th key={c.key} className={cn("px-5 py-2.5 font-semibold", c.hideSm && "hidden md:table-cell", ["num", "money", "pct"].includes(c.kind ?? "") && "text-right")}>{c.label}</th>)}
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((r, i) => {
                  const Lead = m.lead?.(r);
                  return (
                    <tr key={String(r[title.key]) + i} className={cn("transition-colors hover:bg-surface-2", r === fresh && "bg-sky-50/60")}>
                      {m.cols.map((c) => (
                        <td key={c.key} className={cn("px-5 py-3.5 text-[14px]", c.hideSm && "hidden md:table-cell", ["num", "money", "pct"].includes(c.kind ?? "") && "text-right tnum")}>
                          {c.kind === "title" ? (
                            <div className="flex items-center gap-3">
                              {Lead && <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Lead size={17} /></span>}
                              <div className="min-w-0">
                                <p className="max-w-[440px] truncate font-semibold text-ink">{fmt(r[c.key])}</p>
                                {c.sub && r[c.sub] !== undefined && <p className="mt-0.5 truncate text-[13px] text-muted">{fmt(r[c.sub])}</p>}
                              </div>
                            </div>
                          ) : c.kind === "chip" ? (
                            <Chip tone={c.tones?.[String(r[c.key])] ?? "neutral"} dot>{fmt(r[c.key])}</Chip>
                          ) : (
                            <span className="text-body">{fmt(r[c.key], c.kind)}</span>
                          )}
                        </td>
                      ))}
                      <td className="pr-3 text-right">
                        <Menu
                          trigger={(p) => <button {...p} aria-label="More actions" className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-black/[.06] hover:text-ink dark:hover:bg-white/10"><Ellipsis size={17} /></button>}
                          items={m.rowActions.map((a) => ({ label: a, danger: a === "Delete" || a === "Refund", onClick: () => act(a, r) }))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-5 py-3 text-[12px] text-faint">
          Showing {shown.length} of {rows.length}{m.joins && <> · One page for what used to be {m.joins}</>}
        </p>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} label={m.create.title}>
        <ModalHead title={m.create.title} onClose={() => setOpen(false)} />
        <div className="grid gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          {m.create.fields.map((f, i) => (
            <Field key={f.key} label={f.label} className={f.type === "textarea" || i === 0 ? "sm:col-span-2" : ""}>
              {(fid) => {
                const v = String(draft[f.key] ?? "");
                const set = (val: string) => setDraft((d) => ({ ...d, [f.key]: val }));
                if (f.type === "select") return <Select id={fid} value={v} onChange={(e) => set(e.target.value)}>{f.options!.map((o) => <option key={o}>{o}</option>)}</Select>;
                if (f.type === "textarea") return <Textarea id={fid} rows={3} value={v} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />;
                return <Input id={fid} type={f.type ?? "text"} value={v} placeholder={f.placeholder} autoFocus={i === 0} onChange={(e) => set(e.target.value)} />;
              }}
            </Field>
          ))}
        </div>
        <ModalFoot>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={!ready} onClick={save}>{m.create.label === "Upload" ? "Upload" : "Create"}</Button>
        </ModalFoot>
      </Modal>
    </div>
  );
}
