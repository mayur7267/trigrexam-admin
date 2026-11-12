import { useNavigate } from "react-router-dom";
import { BellRing, CircleCheck, ClipboardList, Hourglass, Inbox, Info, Video, type LucideIcon } from "lucide-react";
import type { Notice, NoticeKind } from "../lib/types";
import { fmtAgo } from "../lib/utils";
import { useStore } from "../store/store";
import { useToast } from "./toast";
import { Button, Chip } from "./ui";

const ICON: Record<NoticeKind, { icon: LucideIcon; bg: string; fg: string }> = {
  assigned: { icon: ClipboardList, bg: "bg-sky-50", fg: "text-sky-600" },
  submitted: { icon: Inbox, bg: "bg-warn-soft", fg: "text-warn" },
  reviewed: { icon: CircleCheck, bg: "bg-ok-soft", fg: "text-ok" },
  extension: { icon: Hourglass, bg: "bg-violet-soft", fg: "text-violet" },
  reminder: { icon: BellRing, bg: "bg-amber-soft", fg: "text-amber" },
  class: { icon: Video, bg: "bg-navy-50", fg: "text-navy" },
  system: { icon: Info, bg: "bg-bg", fg: "text-muted" },
};

export function NoticeRow({ n, onNavigate }: { n: Notice; onNavigate?: () => void }) {
  const { extensions, decideExtension, markRead } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const I = ICON[n.kind];
  const ext = n.extensionId ? extensions.find((x) => x.id === n.extensionId) : undefined;

  const open = () => {
    markRead(n.id);
    if (n.link) {
      onNavigate?.();
      nav(n.link);
    }
  };

  return (
    <div className={`flex gap-3 px-4 py-3.5 ${n.read ? "" : "bg-sky-50/60"}`}>
      <span className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${I.bg} ${I.fg}`}>
        <I.icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <button onClick={open} disabled={!n.link} className="block w-full text-left enabled:hover:text-navy">
          <span className="flex items-start justify-between gap-3">
            <span className="text-sm font-bold text-ink">{n.title}</span>
            <span className="mt-0.5 shrink-0 text-xs text-faint">{fmtAgo(n.at)}</span>
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-muted">{n.body}</span>
        </button>
        {ext && ext.status === "pending" && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={() => { decideExtension(ext.id, true); toast("24 more hours given. The student has been told."); }}>Give 24 more hours</Button>
            <Button size="sm" onClick={() => { decideExtension(ext.id, false); toast("Request declined. The student has been told."); }}>Not this time</Button>
          </div>
        )}
        {ext && ext.status !== "pending" && (
          <div className="mt-2"><Chip tone={ext.status === "approved" ? "ok" : "neutral"} dot>{ext.status === "approved" ? "More time given" : "Declined"}</Chip></div>
        )}
      </div>
      {!n.read && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-sky" />}
    </div>
  );
}
