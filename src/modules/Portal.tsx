import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { Avatar, Badge, Button, Card, Empty, Field, Input, Stat } from "../components/ui/ui";
import { Icon, type IconName } from "../components/Icon";
import { OrderDetail, dueBadge } from "./OrderSheet";
import { STAGE_META, isClosed } from "../lib/stages";
import { inr, balance, paid, daysUntil, fmtDate, fmtDay, measurementStale, isMeasureValue } from "../lib/format";
import type { ActivityType, Order } from "../data/types";
import "./modules.css";

const ACT_ICON: Record<ActivityType, IconName> = {
  signup: "spark", login: "back", order_placed: "orders", stage: "clock", payment: "payments",
  measurement: "measure", customer_added: "customers", family_added: "customers",
};

export function Portal({ active, go }: { active: string; go: (id: string) => void }) {
  const { db, activeCustomer, addMeasurement } = useStore();
  const [open, setOpen] = useState<Order | null>(null);
  const [addMeas, setAddMeas] = useState(false);

  const cid = activeCustomer?.id;
  const family = db.families.find(f => f.id === activeCustomer?.familyId);
  // this customer's own records (household siblings each have their own login)
  const members = useMemo(() => (activeCustomer ? [activeCustomer] : []), [activeCustomer]);
  const siblings = useMemo(() => db.customers.filter(c => c.familyId === activeCustomer?.familyId && c.id !== cid), [db.customers, activeCustomer, cid]);
  const orders = useMemo(() => db.orders.filter(o => o.customerId === cid), [db.orders, cid]);
  const activity = useMemo(() => db.activity.filter(a => a.customerId === cid), [db.activity, cid]);

  const active_ = orders.filter(o => !isClosed(o.stage));
  const dueDue = orders.reduce((s, o) => s + balance(o), 0);
  const nextDelivery = [...active_].sort((a, b) => daysUntil(a.deliveryDate) - daysUntil(b.deliveryDate))[0];
  const custName = (id: string) => db.customers.find(c => c.id === id)?.name ?? "—";

  const detail = open ? <OrderDetail order={db.orders.find(o => o.id === open.id)!} onClose={() => setOpen(null)} readOnly /> : null;

  if (active === "myorders") {
    return (<>
      <Head eyebrow={activeCustomer?.name} title="My Orders" sub="Every piece we're making for you." />
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
    const me = members[0];
    return (<>
      <Head eyebrow={activeCustomer?.name} title="Measurements" sub="Your sizes on file, kept fresh for a perfect fit. Add your own or let the studio take them." />
      {me && (
        <Card>
          <div className="row" style={{ justifyContent: "space-between", padding: "14px 16px", borderBottom: addMeas ? "1px solid var(--hairline-soft)" : undefined }}>
            <div className="fam-hd" style={{ padding: 0 }}>
              <Avatar name={me.name} />
              <div className="who"><b>{me.name}</b><span> · {me.id}</span></div>
            </div>
            <Button size="sm" variant={addMeas ? undefined : "primary"} onClick={() => setAddMeas(v => !v)}>
              <Icon name={addMeas ? "close" : "plus"} size={13} /> {addMeas ? "Cancel" : "Add my measurement"}
            </Button>
          </div>
          {addMeas && <CustomerAddMeas onSave={m => { addMeasurement(me.id, m); setAddMeas(false); }} />}
          {me.measurements.length === 0 && !addMeas &&
            <div style={{ padding: 16, fontSize: 13, color: "var(--text-faint)" }}>No measurements yet. Add your own above, or visit the studio for a fitting.</div>}
          {me.measurements.map(m => (
            <div key={m.id} style={{ padding: 14, borderTop: "1px solid var(--hairline-soft)" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b style={{ fontSize: 14 }}>{m.garment} <span className="chip">v{m.version ?? 1}</span></b>
                {measurementStale(m.takenAt) ? <Badge tone="warn">refresh · {fmtDate(m.takenAt)}</Badge> : <Badge tone="ok">{fmtDate(m.takenAt)}</Badge>}
              </div>
              <div className="meas-grid">
                {m.values.map((v, i) => <div className="meas-cell" key={i}><div className="m-lbl">{v.label}</div><div className="m-val">{v.value}</div></div>)}
              </div>
            </div>
          ))}
        </Card>
      )}
      {siblings.length > 0 && (
        <p className="faint" style={{ fontSize: 12.5, marginTop: 14, textAlign: "center" }}>
          Family on this number: {siblings.map(s => s.name).join(", ")} — each has their own sign-in and Customer ID.
        </p>
      )}
    </>);
  }

  if (active === "history") {
    return (<>
      <Head eyebrow={activeCustomer?.name} title="Activity History" sub="Everything on your account: orders, fittings and payments, in order." />
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
    <Head eyebrow={`Hello, ${activeCustomer?.name?.split(" ")[0] ?? "there"}`} title="Your Portal" sub={`${activeCustomer?.id ?? ""}${activeCustomer?.phone ? ` · signed in with ${activeCustomer.phone}` : family?.phone ? ` · ${family.phone}` : ""}`} />
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

/* Customer self-service: pick the cloth, then fill in the measurements. */
const GARMENTS: { name: string; fields: string[] }[] = [
  { name: "Blouse", fields: ["Chest", "Waist", "Shoulder", "Sleeve"] },
  { name: "Saree Blouse", fields: ["Chest", "Waist", "Shoulder", "Sleeve"] },
  { name: "Kurta", fields: ["Chest", "Waist", "Length", "Shoulder", "Sleeve"] },
  { name: "Anarkali", fields: ["Chest", "Waist", "Length", "Sleeve"] },
  { name: "Lehenga", fields: ["Waist", "Hip", "Length"] },
  { name: "Salwar Suit", fields: ["Chest", "Waist", "Hip", "Length"] },
  { name: "Sherwani", fields: ["Chest", "Waist", "Length", "Shoulder", "Sleeve"] },
  { name: "Shirt", fields: ["Chest", "Waist", "Length", "Shoulder", "Sleeve", "Collar"] },
  { name: "Trousers", fields: ["Waist", "Hip", "Length", "Thigh"] },
];

type MeasIn = { takenAt: string; garment: string; values: { label: string; value: string }[] };

function CustomerAddMeas({ onSave }: { onSave: (m: MeasIn) => void }) {
  const [garment, setGarment] = useState("");
  const [custom, setCustom] = useState("");
  const [rows, setRows] = useState<{ label: string; value: string }[]>([]);

  const pick = (g: typeof GARMENTS[number]) => {
    setGarment(g.name); setCustom("");
    setRows(g.fields.map(label => ({ label, value: "" })));
  };
  const pickOther = () => {
    setGarment("__other"); setCustom("");
    setRows(["Chest", "Waist", "Length"].map(label => ({ label, value: "" })));
  };
  const set = (i: number, v: string) => setRows(rs => rs.map((r, j) => j === i ? { ...r, value: v } : r));
  const finalName = garment === "__other" ? custom.trim() : garment;
  const bad = (v: string) => v.trim().length > 0 && !isMeasureValue(v);
  const anyBad = rows.some(r => bad(r.value));
  const ready = finalName.length > 0 && rows.some(r => r.value.trim()) && !anyBad;

  return (
    <div style={{ padding: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>1 · Choose the cloth</div>
      <div className="chip-row">
        {GARMENTS.map(g => (
          <button key={g.name} className={"pick-chip" + (garment === g.name ? " on" : "")} onClick={() => pick(g)}>{g.name}</button>
        ))}
        <button className={"pick-chip" + (garment === "__other" ? " on" : "")} onClick={pickOther}>Something else</button>
      </div>

      {garment === "__other" && (
        <Field label="Garment name"><Input value={custom} placeholder="e.g. Nehru Jacket" autoFocus onChange={e => setCustom(e.target.value)} /></Field>
      )}

      {rows.length > 0 && (<>
        <div className="eyebrow" style={{ margin: "14px 0 8px" }}>2 · Your measurements</div>
        <div className="meas-grid">
          {rows.map((r, i) => (
            <div key={i}><div className="m-lbl" style={{ marginBottom: 3 }}>{r.label}</div><Input value={r.value} placeholder={'36"'} className={bad(r.value) ? "input-bad" : undefined} onChange={e => set(i, e.target.value)} /></div>
          ))}
        </div>
        {anyBad && <div className="field-err">Use a number with an optional unit, e.g. 36, 36.5, 36" or 34"-36".</div>}
        <Button variant="primary" size="sm" style={{ marginTop: 12 }} disabled={!ready}
          onClick={() => onSave({ takenAt: new Date().toISOString(), garment: finalName, values: rows.filter(r => r.value.trim()) })}>
          Save measurement
        </Button>
      </>)}
    </div>
  );
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
