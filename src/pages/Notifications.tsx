import { useState } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useStore } from "../store/store";
import { Button, CardHead, Empty, PageHeader, Tabs } from "../components/ui";
import { NoticeRow } from "../components/NoticeRow";
import { ExtensionList } from "../components/ExtensionList";

type T = "all" | "action" | "updates";

export function Notifications() {
  const { role, notices, extensions, markAllRead } = useStore();
  const [tab, setTab] = useState<T>("all");
  const mine = notices.filter((n) => n.audience === role).sort((a, b) => b.at - a.at);
  const needsAction = (n: (typeof mine)[number]) => !!n.extensionId && extensions.find((e) => e.id === n.extensionId)?.status === "pending";
  const list = mine.filter((n) => (tab === "all" ? true : tab === "action" ? needsAction(n) : !needsAction(n)));
  const pendingAdmin = role === "admin" && extensions.some((e) => e.status === "pending");

  return (
    <div className="mx-auto max-w-[860px]">
      <PageHeader icon={Bell} title="Notifications" subtitle="Everything that happened, and anything that needs a quick answer." actions={<Button icon={CheckCheck} onClick={() => markAllRead(role)}>Mark all as read</Button>} />
      {pendingAdmin && (
        <section className="card mb-6 overflow-hidden">
          <CardHead title="Requests for more time" hint="You can decide these for any teacher" />
          <div className="mt-2"><ExtensionList onlyPending /></div>
        </section>
      )}
      <div className="card overflow-hidden">
        <div className="px-3 pt-2 sm:px-5">
          <Tabs<T> value={tab} onChange={setTab} items={[{ id: "all", label: "All", count: mine.length }, { id: "action", label: "Needs you", count: mine.filter(needsAction).length }, { id: "updates", label: "Updates" }]} />
        </div>
        {list.length === 0 ? <Empty art="caught" icon={BellOff} title="Nothing here" body="You are all caught up." /> : <div className="divide-y divide-line">{list.map((n) => <NoticeRow key={n.id} n={n} />)}</div>}
      </div>
    </div>
  );
}
