import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { Card, Stat, Badge, Avatar } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { useWindows } from "../components/windows/WindowManager";
import { dueBadge } from "./OrderSheet";
import { STAGE_META, isClosed } from "../lib/stages";
import { inr, balance, daysUntil, measurementStale, fmtDay } from "../lib/format";
import type { Order } from "../data/types";
import "./modules.css";

export function Dashboard({ go }: { go: (id: string) => void }) {
  const { db } = useStore();
  const wm = useWindows();
  const openOrder = (o: Order) => wm.open({ kind: "order", key: o.id, title: o.garment, subtitle: o.code, payload: { orderId: o.id }, w: 460, h: 560 });

  const active = db.orders.filter(o => !isClosed(o.stage));
  const dueWeek = active.filter(o => { const d = daysUntil(o.deliveryDate); return d >= 0 && d <= 7; });
  const outstanding = db.orders.reduce((s, o) => s + balance(o), 0);
  const flagged = active.filter(o => o.deadline || daysUntil(o.deliveryDate) < 0);

  // "to be completed first", deadlines & overdue, soonest first
  const priority = useMemo(
    () => [...active]
      .filter(o => o.deadline || daysUntil(o.deliveryDate) <= 2)
      .sort((a, b) => daysUntil(a.deliveryDate) - daysUntil(b.deliveryDate)),
    [active]
  );

  const upcoming = useMemo(
    () => [...active].sort((a, b) => daysUntil(a.deliveryDate) - daysUntil(b.deliveryDate)).slice(0, 6),
    [active]
  );

  const staleMeas = db.customers.filter(c => c.measurements[0] && measurementStale(c.measurements[0].takenAt));
  const custName = (id: string) => db.customers.find(c => c.id === id)?.name ?? "—";

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Good day, {db.shop.owner}</span>
          <h1>Studio Overview</h1>
          <p>Deadlines first. Then everything else, in order of delivery.</p>
        </div>
      </div>

      <div className="grid-stats">
        <Card><Stat icon={<Icon name="orders" size={15} />} label="Active orders" value={active.length} sub={`${db.orders.length} total this book`} /></Card>
        <Card><Stat icon={<Icon name="clock" size={15} />} label="Due this week" value={dueWeek.length} sub="within 7 days" /></Card>
        <Card><Stat icon={<Icon name="payments" size={15} />} label="Outstanding" value={inr(outstanding)} sub="balance to collect" /></Card>
        <Card><Stat icon={<Icon name="flag" size={15} />} label="Deadlines" value={flagged.length} sub="flagged or overdue" /></Card>
      </div>

      <div className="two-col">
        <Card>
          <div className="card-hd">
            <h3>To be completed first</h3>
            <Badge tone="urgent" dot>{priority.length} priority</Badge>
          </div>
          <div className="list">
            {priority.length === 0 && <div style={{ padding: 24, color: "var(--text-faint)", fontSize: 13 }}>Nothing urgent. You're on top of it.</div>}
            {priority.map(o => (
              <div className="list-row" key={o.id} onClick={() => openOrder(o)}>
                <Avatar name={custName(o.customerId)} />
                <div className="grow">
                  <div className="title">{o.garment} {o.deadline && <span className="flag"><Icon name="flag" size={13} /></span>}</div>
                  <div className="sub">
                    <span>{custName(o.customerId)}</span>·<span>{o.code}</span>
                    <Badge tone={STAGE_META[o.stage].tone}>{STAGE_META[o.stage].label}</Badge>
                  </div>
                </div>
                {dueBadge(o)}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid-cards">
          <Card>
            <div className="card-hd"><h3>Upcoming deliveries</h3></div>
            <div className="list">
              {upcoming.map(o => (
                <div className="list-row" key={o.id} onClick={() => openOrder(o)}>
                  <div className="grow">
                    <div className="title" style={{ fontSize: 13.5 }}>{o.garment}</div>
                    <div className="sub"><span>{custName(o.customerId)}</span></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDay(o.deliveryDate)}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{STAGE_META[o.stage].label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {staleMeas.length > 0 && (
            <Card>
              <div className="card-hd">
                <h3>Measurements to refresh</h3>
                <Badge tone="warn">2+ months old</Badge>
              </div>
              <div className="list">
                {staleMeas.slice(0, 4).map(c => (
                  <div className="list-row" key={c.id} onClick={() => go("customers")}>
                    <Avatar name={c.name} />
                    <div className="grow">
                      <div className="title" style={{ fontSize: 13.5 }}>{c.name}</div>
                      <div className="sub">{c.measurements[0].garment}</div>
                    </div>
                    <Badge tone="warn">refresh</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

    </>
  );
}
