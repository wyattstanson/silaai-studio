import { useMemo } from "react";
import { useStore } from "../data/store";
import { Avatar, Badge, Card, Stat, Empty } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { useWindows } from "../components/windows/WindowManager";
import { inr, balance, paid, fmtDate } from "../lib/format";
import type { Order } from "../data/types";
import "./modules.css";

export function Payments() {
  const { db } = useStore();
  const wm = useWindows();
  const openOrder = (o: Order) => wm.open({ kind: "order", key: o.id, title: o.garment, subtitle: o.code, payload: { orderId: o.id }, w: 460, h: 560 });
  const custName = (id: string) => db.customers.find(c => c.id === id)?.name ?? "—";

  const outstanding = db.orders.filter(o => balance(o) > 0).sort((a, b) => balance(b) - balance(a));
  const totalDue = outstanding.reduce((s, o) => s + balance(o), 0);
  const collected = db.orders.reduce((s, o) => s + paid(o), 0);

  const ledger = useMemo(() => {
    const rows: { orderId: string; order: Order; at: string; kind: string; amount: number; method: string; id: string }[] = [];
    for (const o of db.orders) for (const p of o.payments) rows.push({ orderId: o.id, order: o, ...p });
    return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [db.orders]);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Money</span>
          <h1>Payments</h1>
          <p>Advances, balances and the full transaction history, one ledger.</p>
        </div>
      </div>

      <div className="grid-stats">
        <Card><Stat icon={<Icon name="payments" size={15} />} label="Collected" value={inr(collected)} sub="advances + balances" /></Card>
        <Card><Stat icon={<Icon name="clock" size={15} />} label="Outstanding" value={inr(totalDue)} sub={`${outstanding.length} orders pending`} /></Card>
        <Card><Stat icon={<Icon name="check" size={15} />} label="Settled orders" value={db.orders.filter(o => balance(o) === 0).length} sub={`of ${db.orders.length}`} /></Card>
      </div>

      <div className="two-col">
        <Card>
          <div className="card-hd"><h3>Outstanding balances</h3><Badge tone="urgent">{inr(totalDue)}</Badge></div>
          {outstanding.length === 0 ? <Empty icon={<Icon name="check" size={30} />} title="All settled" hint="No pending balances right now." /> : (
            <div className="list">
              {outstanding.map(o => (
                <div className="list-row" key={o.id} onClick={() => openOrder(o)}>
                  <Avatar name={custName(o.customerId)} />
                  <div className="grow">
                    <div className="title" style={{ fontSize: 14 }}>{o.garment}</div>
                    <div className="sub">{custName(o.customerId)} · {o.code} · paid {inr(paid(o))} of {inr(o.price)}</div>
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 650, color: "var(--clay)" }} className="tnum">{inr(balance(o))}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-hd"><h3>Transaction history</h3></div>
          <div className="list">
            {ledger.slice(0, 12).map(r => (
              <div className="list-row" key={r.id} onClick={() => openOrder(r.order)}>
                <div className="grow">
                  <div className="title" style={{ fontSize: 13.5 }}>
                    {custName(r.order.customerId)} <span className="faint" style={{ fontWeight: 400 }}>· {r.order.code}</span>
                  </div>
                  <div className="sub">{fmtDate(r.at)} · {r.method.toUpperCase()}</div>
                </div>
                <Badge tone={r.kind === "advance" ? "info" : r.kind === "refund" ? "urgent" : "ok"}>{r.kind}</Badge>
                <div className="tnum" style={{ fontWeight: 650, width: 78, textAlign: "right" }}>
                  {r.kind === "refund" ? "−" : "+"}{inr(r.amount)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </>
  );
}
