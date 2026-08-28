import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { Avatar, Badge, Card, Empty, Stat } from "../components/ui/ui";
import { Icon, type IconName } from "../components/Icon";
import { OrderDetail, dueBadge } from "./OrderSheet";
import { STAGE_META } from "../lib/stages";
import { inr, balance, paid, daysUntil, fmtDate, fmtDay, measurementStale } from "../lib/format";
import type { ActivityType, Order } from "../data/types";
import "./modules.css";

const ACT_ICON: Record<ActivityType, IconName> = {
  signup: "spark", login: "back", order_placed: "orders", stage: "clock", payment: "payments",
  measurement: "measure", customer_added: "customers", family_added: "customers",
};

export function Portal({ active, go }: { active: string; go: (id: string) => void }) {
  const { db, user } = useStore();
  const [open, setOpen] = useState<Order | null>(null);

  const famId = user?.familyId;
  const family = db.families.find(f => f.id === famId);
  const members = useMemo(() => db.customers.filter(c => c.familyId === famId), [db.customers, famId]);
  const memberIds = new Set(members.map(m => m.id));
  const orders = useMemo(() => db.orders.filter(o => memberIds.has(o.customerId)), [db.orders, famId]);
  const activity = useMemo(() => db.activity.filter(a => a.familyId === famId), [db.activity, famId]);

  const active_ = orders.filter(o => o.stage !== "delivered");
  const dueDue = orders.reduce((s, o) => s + balance(o), 0);
  const nextDelivery = [...active_].sort((a, b) => daysUntil(a.deliveryDate) - daysUntil(b.deliveryDate))[0];
  const custName = (id: string) => db.customers.find(c => c.id === id)?.name ?? "—";

  const detail = open ? <OrderDetail order={db.orders.find(o => o.id === open.id)!} onClose={() => setOpen(null)} readOnly /> : null;

  if (active === "myorders") {
    return (<>
      <Head eyebrow={family?.name} title="My Orders" sub="Every piece we're making for your family." />
      <Card>
        {orders.length === 0 ? <Empty icon={<Icon name="orders" size={30} />} title="No orders yet" hint="Your orders will appear here once placed at the studio." /> : (
          <div className="list">
            {orders.map(o => (
              <div className="list-row" key={o.id} onClick={() => setOpen(o)}>
                <Avatar name={custName(o.customerId)} />
                <div className="grow">
                  <div className="title">{o.garment} {o.deadline && <span className="flag">★</span>}</div>
                  <div className="sub"><span>{custName(o.customerId)}</span>·<span>{o.code}</span><Badge tone={STAGE_META[o.stage].tone}>{STAGE_META[o.stage].label}</Badge></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {dueBadge(o)}
                  <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>{balance(o) > 0 ? `${inr(balance(o))} due` : "Settled"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {detail}
    </>);
  }

  if (active === "measurements") {
    return (<>
      <Head eyebrow={family?.name} title="Measurements" sub="On file for each family member, kept fresh for a perfect fit." />
      <div className="grid-cards">
        {members.map(c => (
          <Card key={c.id}>
            <div className="fam-hd">
              <Avatar name={c.name} />
              <div className="who"><b>{c.name}</b><span> · {c.id}</span></div>
            </div>
            {c.measurements.length === 0 ? <div style={{ padding: 16, fontSize: 13, color: "var(--text-faint)" }}>No measurements yet. Visit the studio for a fitting.</div> :
              c.measurements.map(m => (
                <div key={m.id} style={{ padding: 14 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b style={{ fontSize: 14 }}>{m.garment}</b>
                    {measurementStale(m.takenAt) ? <Badge tone="warn">refresh · {fmtDate(m.takenAt)}</Badge> : <Badge tone="ok">{fmtDate(m.takenAt)}</Badge>}
                  </div>
                  <div className="meas-grid">
                    {m.values.map((v, i) => <div className="meas-cell" key={i}><div className="m-lbl">{v.label}</div><div className="m-val">{v.value}</div></div>)}
                  </div>
                </div>
              ))}
          </Card>
        ))}
      </div>
    </>);
  }

  if (active === "history") {
    return (<>
      <Head eyebrow={family?.name} title="Activity History" sub="Everything on your account: orders, fittings and payments, in order." />
      <Card>
        {activity.length === 0 ? <Empty icon={<Icon name="history" size={30} />} title="Nothing yet" /> : (
          <div className="list">
            {activity.map(a => (
              <div className="list-row" key={a.id} style={{ cursor: a.orderId ? "pointer" : "default" }}
                onClick={() => { const o = db.orders.find(x => x.id === a.orderId); if (o) setOpen(o); }}>
                <div className="sample" style={{ width: 38, height: 38 }}><Icon name={ACT_ICON[a.type]} size={17} /></div>
                <div className="grow">
                  <div className="title" style={{ fontSize: 13.5 }}>{a.summary}</div>
                  <div className="sub">{fmtDate(a.at)}{a.customerId ? ` · ${custName(a.customerId)}` : ""}</div>
                </div>
                {a.amount != null && <div className="tnum" style={{ fontWeight: 650 }}>{inr(a.amount)}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
      {detail}
    </>);
  }

  // Overview
  return (<>
    <Head eyebrow={`Hello, ${user?.name?.split(" ")[0] ?? "there"}`} title="Your Portal" sub={`${family?.name} · signed in with ${user?.phone}`} />
    <div className="grid-stats">
      <Card><Stat icon={<Icon name="orders" size={15} />} label="Active orders" value={active_.length} sub={`${orders.length} in total`} /></Card>
      <Card><Stat icon={<Icon name="clock" size={15} />} label="Next delivery" value={nextDelivery ? fmtDay(nextDelivery.deliveryDate) : "—"} sub={nextDelivery?.garment ?? "nothing scheduled"} /></Card>
      <Card><Stat icon={<Icon name="payments" size={15} />} label="Balance due" value={inr(dueDue)} sub="across your orders" /></Card>
    </div>

    <div className="two-col">
      <Card>
        <div className="card-hd"><h3>Your orders</h3><Badge tone="info">{active_.length} active</Badge></div>
        {orders.length === 0 ? <Empty icon={<Icon name="orders" size={30} />} title="No orders yet" /> : (
          <div className="list">
            {orders.slice(0, 5).map(o => (
              <div className="list-row" key={o.id} onClick={() => setOpen(o)}>
                <div className="grow">
                  <div className="title" style={{ fontSize: 14 }}>{o.garment}</div>
                  <div className="sub"><span>{custName(o.customerId)}</span><Badge tone={STAGE_META[o.stage].tone}>{STAGE_META[o.stage].label}</Badge></div>
                </div>
                {dueBadge(o)}
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <div className="card-hd"><h3>Recent activity</h3><button className="btn btn-ghost btn-sm" onClick={() => go("history")}>See all</button></div>
        <div className="list">
          {activity.slice(0, 6).map(a => (
            <div className="list-row" key={a.id} style={{ cursor: "default" }}>
              <div className="sample" style={{ width: 34, height: 34 }}><Icon name={ACT_ICON[a.type]} size={16} /></div>
              <div className="grow"><div className="title" style={{ fontSize: 13 }}>{a.summary}</div><div className="sub">{fmtDate(a.at)}</div></div>
              {a.amount != null && <div className="tnum faint" style={{ fontSize: 12.5 }}>{inr(a.amount)}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
    {detail}
  </>);
}

function Head({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub: string }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </div>
  );
}
