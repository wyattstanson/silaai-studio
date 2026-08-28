import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { useWindows } from "../components/windows/WindowManager";
import { Avatar, Badge, Button, Card, Stat, Empty } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { VirtualList } from "../components/VirtualList";
import { inr, balance, paid } from "../lib/format";
import { customerRow, exportAllCustomersCSV, exportBackupJSON } from "../lib/exportData";
import "./modules.css";

type SortKey = "name" | "orders" | "outstanding" | "billed";
const ROW_H = 58;
const LIST_H = 496;

export function Admin() {
  const { db, generateDemoCustomers, clearDemoCustomers } = useStore();
  const wm = useWindows();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("outstanding");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = db.customers.map(c => customerRow(db, c))
      .filter(r => !t || r.name.toLowerCase().includes(t) || r.phone.includes(t) || r.family.toLowerCase().includes(t) || r.customerId.toLowerCase().includes(t));
    list.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name)
        : sort === "orders" ? b.orders - a.orders
          : sort === "billed" ? b.totalBilled - a.totalBilled
            : b.outstanding - a.outstanding);
    return list;
  }, [db, q, sort]);

  const totals = useMemo(() => ({
    customers: db.customers.length,
    billed: db.orders.reduce((s, o) => s + o.price, 0),
    collected: db.orders.reduce((s, o) => s + paid(o), 0),
    outstanding: db.orders.reduce((s, o) => s + balance(o), 0),
  }), [db]);

  const hasDemo = db.customers.some(c => c.id.startsWith("CUS-D"));
  const openCustomer = (id: string, name: string) =>
    wm.open({ kind: "customer", key: id, title: name, subtitle: id, payload: { customerId: id }, w: 500, h: 620 });

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Shopkeeper · Admin</span>
          <h1>Customer Console</h1>
          <p>Every customer record in one place. Open a card to edit live, or export the data.</p>
        </div>
        <div className="row wrap" style={{ gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={() => exportAllCustomersCSV(db)}><Icon name="reports" size={15} /> Export CSV</Button>
          <Button onClick={() => exportBackupJSON(db)}><Icon name="courier" size={15} /> Backup JSON</Button>
        </div>
      </div>

      <div className="grid-stats">
        <Card><Stat icon={<Icon name="customers" size={15} />} label="Customers" value={totals.customers.toLocaleString("en-IN")} sub={`${db.families.length.toLocaleString("en-IN")} families`} /></Card>
        <Card><Stat icon={<Icon name="reports" size={15} />} label="Total billed" value={inr(totals.billed)} sub="across all orders" /></Card>
        <Card><Stat icon={<Icon name="payments" size={15} />} label="Collected" value={inr(totals.collected)} sub="paid to date" /></Card>
        <Card><Stat icon={<Icon name="clock" size={15} />} label="Outstanding" value={inr(totals.outstanding)} sub="to collect" /></Card>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={15} className="faint" />
          <input placeholder="Search name, phone, family or ID" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="spacer" />
        {hasDemo
          ? <Button size="sm" variant="danger" onClick={clearDemoCustomers}>Clear demo</Button>
          : <Button size="sm" onClick={() => generateDemoCustomers(2000)}><Icon name="plus" size={13} /> Load 2,000 demo</Button>}
        <div className="seg">
          {(["outstanding", "billed", "orders", "name"] as SortKey[]).map(k => (
            <button key={k} aria-pressed={sort === k} onClick={() => setSort(k)}>{k[0].toUpperCase() + k.slice(1)}</button>
          ))}
        </div>
      </div>

      <Card>
        <div className="cust-grid cust-head">
          <span>Customer</span><span>Family</span><span>Phone</span><span>Orders</span><span>Billed</span><span>Outstanding</span><span />
        </div>
        {rows.length === 0 ? <Empty icon={<Icon name="customers" size={30} />} title="No matching customers" /> : (
          <VirtualList
            items={rows}
            rowHeight={ROW_H}
            height={Math.min(LIST_H, rows.length * ROW_H)}
            renderRow={(r) => (
              <div className="cust-grid cust-r" onClick={() => openCustomer(r.customerId, r.name)}>
                <div className="row" style={{ gap: 9, minWidth: 0 }}>
                  <Avatar name={r.name} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{r.customerId}</div>
                  </div>
                </div>
                <div className="muted ellip">{r.family}</div>
                <div className="mono muted ellip">{r.phone}</div>
                <div className="mono">{r.orders}</div>
                <div className="mono">{inr(r.totalBilled)}</div>
                <div className="mono" style={{ color: r.outstanding > 0 ? "var(--clay)" : "var(--text-faint)", fontWeight: 600 }}>{r.outstanding > 0 ? inr(r.outstanding) : "—"}</div>
                <div className="faint"><Icon name="chevron" size={15} /></div>
              </div>
            )}
          />
        )}
      </Card>
      <div className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>
        {rows.length.toLocaleString("en-IN")} record{rows.length !== 1 ? "s" : ""}{q ? " matching" : ""} · windowed list renders only what's on screen.
      </div>
    </>
  );
}
