import { useState } from "react";
import { useStore } from "../data/store";
import { useWindows } from "../components/windows/WindowManager";
import { Avatar, Badge, Button, Field, Input, Select } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { STAGE_META } from "../lib/stages";
import { inr, balance, paid, fmtDate, measurementStale, phoneDigits, phoneLocal, phoneIntl, isMeasureValue } from "../lib/format";
import { exportCustomerCSV, exportCustomerJSON } from "../lib/exportData";
import "./modules.css";

export function CustomerAdmin({ customerId }: { customerId: string }) {
  const { db, updateCustomer, addMeasurement, deleteCustomer } = useStore();
  const wm = useWindows();
  const customer = db.customers.find(c => c.id === customerId);
  const family = db.families.find(f => f.id === customer?.familyId);
  const orders = db.orders.filter(o => o.customerId === customerId);

  // controlled edit fields, seeded from record
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(phoneDigits(customer?.phone ?? ""));
  const [gender, setGender] = useState(customer?.gender ?? "—");
  const [dirty, setDirty] = useState(false);
  const [addM, setAddM] = useState(false);

  if (!customer) return <div className="empty" style={{ padding: 30 }}>This customer was removed.</div>;

  const billed = orders.reduce((s, o) => s + o.price, 0);
  const outstanding = orders.reduce((s, o) => s + balance(o), 0);
  const edit = (fn: () => void) => { fn(); setDirty(true); };
  const save = () => { updateCustomer(customer.id, { name: name.trim() || customer.name, phone: phoneIntl(phone) || undefined, gender: gender as any }); setDirty(false); };

  return (
    <div className="ca">
      <div className="ca-head">
        <Avatar name={name || customer.name} />
        <div className="grow">
          <div style={{ fontWeight: 650, fontSize: 15 }}>{name || customer.name}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{customer.id} · {family?.name}</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <Button size="sm" onClick={() => exportCustomerJSON(db, customer)}><Icon name="reports" size={13} /> JSON</Button>
          <Button size="sm" onClick={() => exportCustomerCSV(db, customer)}><Icon name="reports" size={13} /> CSV</Button>
        </div>
      </div>

      <div className="ca-stats">
        <div><span className="k">Orders</span><b>{orders.length}</b></div>
        <div><span className="k">Billed</span><b>{inr(billed)}</b></div>
        <div><span className="k">Outstanding</span><b style={{ color: outstanding > 0 ? "var(--clay)" : undefined }}>{inr(outstanding)}</b></div>
      </div>

      <div className="ca-sec">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="eyebrow">Details</span>
          <Button variant="primary" size="sm" disabled={!dirty} onClick={save}>{dirty ? "Save changes" : "Saved"}</Button>
        </div>
        <div className="grid-2" style={{ marginTop: 8 }}>
          <Field label="Name"><Input value={name} onChange={e => edit(() => setName(e.target.value))} /></Field>
          <Field label="Phone"><div className="phone-inl"><span>+91</span><Input inputMode="numeric" value={phoneLocal(phone)} placeholder={phoneDigits(family?.phone ?? "") ? phoneLocal(family?.phone ?? "") : "98765 43210"} onChange={e => edit(() => setPhone(phoneDigits(e.target.value)))} /></div></Field>
          <Field label="Gender">
            <Select value={gender} onChange={e => edit(() => setGender(e.target.value as any))}>
              <option value="F">Female</option><option value="M">Male</option><option value="—">—</option>
            </Select>
          </Field>
        </div>
      </div>

      <div className="ca-sec">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="eyebrow">Measurements</span>
          <Button size="sm" onClick={() => setAddM(v => !v)}><Icon name="plus" size={13} /> Add</Button>
        </div>
        {addM && <AddMeas onSave={m => { addMeasurement(customer.id, m); setAddM(false); }} />}
        {customer.measurements.length === 0 && !addM && <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>None recorded yet.</div>}
        {customer.measurements.map(m => (
          <div className="meas-card" key={m.id} style={{ marginTop: 8 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <b style={{ fontSize: 13.5 }}>{m.garment} <span className="chip">v{m.version ?? 1}</span></b>
              {measurementStale(m.takenAt) ? <Badge tone="warn">refresh · {fmtDate(m.takenAt)}</Badge> : <Badge tone="ok">{fmtDate(m.takenAt)}</Badge>}
            </div>
            <div className="meas-grid">
              {m.values.map((v, i) => <div className="meas-cell" key={i}><div className="m-lbl">{v.label}</div><div className="m-val">{v.value}</div></div>)}
            </div>
          </div>
        ))}
      </div>

      <div className="ca-sec">
        <span className="eyebrow">Orders</span>
        {orders.length === 0 ? <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>No orders yet.</div> : (
          <div className="list" style={{ border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", overflow: "hidden", marginTop: 8 }}>
            {orders.map(o => (
              <div className="list-row" key={o.id} onClick={() => wm.open({ kind: "order", key: o.id, title: o.garment, subtitle: o.code, payload: { orderId: o.id }, w: 460, h: 560 })}>
                <div className="grow">
                  <div className="title" style={{ fontSize: 13.5 }}>{o.garment}</div>
                  <div className="sub">{o.code} · {fmtDate(o.deliveryDate)} · paid {inr(paid(o))}/{inr(o.price)}</div>
                </div>
                <Badge tone={STAGE_META[o.stage].tone}>{STAGE_META[o.stage].label}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ca-sec" style={{ borderTop: "1px solid var(--hairline-soft)", paddingTop: 12 }}>
        <Button variant="danger" size="sm" onClick={() => { if (confirm(`Remove ${customer.name} and their ${orders.length} order(s)? This cannot be undone.`)) deleteCustomer(customer.id); }}>
          Delete customer record
        </Button>
      </div>
    </div>
  );
}

function AddMeas({ onSave }: { onSave: (m: { takenAt: string; garment: string; values: { label: string; value: string }[] }) => void }) {
  const [garment, setGarment] = useState("");
  const [rows, setRows] = useState([{ label: "Chest", value: "" }, { label: "Waist", value: "" }, { label: "Shoulder", value: "" }, { label: "Length", value: "" }]);
  const set = (i: number, v: string) => setRows(rs => rs.map((r, j) => j === i ? { ...r, value: v } : r));
  const bad = (v: string) => v.trim().length > 0 && !isMeasureValue(v);
  const anyBad = rows.some(r => bad(r.value));
  return (
    <div className="meas-card" style={{ marginTop: 8 }}>
      <Field label="Garment"><Input value={garment} placeholder="Blouse, Kurta…" onChange={e => setGarment(e.target.value)} /></Field>
      <div className="meas-grid" style={{ marginTop: 8 }}>
        {rows.map((r, i) => (
          <div key={i}><div className="m-lbl" style={{ marginBottom: 3 }}>{r.label}</div><Input value={r.value} placeholder='36"' className={bad(r.value) ? "input-bad" : undefined} onChange={e => set(i, e.target.value)} /></div>
        ))}
      </div>
      {anyBad && <div className="field-err">Use a number with an optional unit, e.g. 36, 36.5, 36" or 34"-36".</div>}
      <Button variant="primary" size="sm" style={{ marginTop: 10 }} disabled={!garment.trim() || anyBad} onClick={() => onSave({ takenAt: new Date().toISOString(), garment: garment.trim(), values: rows.filter(r => r.value.trim()) })}>Save measurement</Button>
    </div>
  );
}
