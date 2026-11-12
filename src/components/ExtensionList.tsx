import { useStore } from "../store/store";
import { fmtAgo } from "../lib/utils";
import { Avatar, Button, Chip } from "./ui";
import { useToast } from "./toast";

export function ExtensionList({ onlyPending = false, teacherId }: { onlyPending?: boolean; teacherId?: string }) {
  const { extensions, assignments, teachers, decideExtension, nameOf } = useStore();
  const toast = useToast();
  const list = extensions.filter((e) => (onlyPending ? e.status === "pending" : true) && (!teacherId || assignments.find((a) => a.id === e.assignmentId)?.teacherId === teacherId));
  if (list.length === 0) return <p className="px-6 py-10 text-center text-sm text-muted">No requests right now.</p>;
  return (
    <ul className="divide-y divide-line">
      {list.map((e) => {
        const a = assignments.find((x) => x.id === e.assignmentId)!;
        const t = teachers.find((x) => x.id === a.teacherId);
        return (
          <li key={e.id} className="flex gap-3 px-6 py-4">
            <Avatar name={nameOf(e.studentId)} size={38} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{nameOf(e.studentId)} <span className="font-medium text-muted">· {fmtAgo(e.requestedAt)}</span></p>
              <p className="mt-0.5 text-[13px] text-muted">{a.title} · reviewed by {t?.name}</p>
              <p className="mt-1.5 rounded-lg bg-bg px-3 py-2 text-[13px] italic text-body">“{e.reason}”</p>
              {e.status === "pending" ? (
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => { decideExtension(e.id, true); toast("24 more hours given."); }}>Give 24 more hours</Button>
                  <Button size="sm" onClick={() => { decideExtension(e.id, false); toast("Request declined."); }}>Not this time</Button>
                </div>
              ) : (
                <div className="mt-2"><Chip tone={e.status === "approved" ? "ok" : "neutral"} dot>{e.status === "approved" ? "More time given" : "Declined"}</Chip></div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
