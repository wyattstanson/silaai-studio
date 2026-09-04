import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { Avatar, Badge, Button, Card, Field, Input, Modal, Select, Textarea, Empty } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { fmtDate, measurementStale, daysUntil, phoneDigits, phoneLocal, phoneIntl, isMeasureValue } from "../lib/format";
import type { Customer } from "../data/types";
import "./modules.css";

export function Customers() {
  const { db, addFamily, addCustomer } = useStore();
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Customer | null>(null);
  const [addingFam, setAddingFam] = useState(false);
  const [addingCust, setAddingCust] = useState<string | null>(null); // familyId

  const families = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.families
      .map(f => ({
        ...f,
        members: db.customers.filter(c => c.familyId === f.id &&
          (!t || c.name.toLowerCase().includes(t) || f.name.toLowerCase().includes(t) || (c.phone || "").includes(t))),
      }))
      .filter(f => !t || f.members.length > 0 || f.name.toLowerCase().includes(t));
  }, [db, q]);

  const orderCount = (id: string) => db.orders.filter(o => o.customerId === id).length;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Tailoring</span>
          <h1>Customers & Families</h1>
          <p>One family, one phone. Every member grouped under a shared household ID.</p>
        </div>
        <Button variant="primary" onClick={() => setAddingFam(true)}>＋ New family</Button>
      </div>

      <div className="toolbar">
        <div className="search">
          <span className="faint">⌕</span>
          <input placeholder="Search customer, family or phone" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid-cards">
        {families.length === 0 && <Card><Empty icon={<Icon name="customers" size={30} />} title="No families found" hint="Add a family to begin." /></Card>}
        {families.map(f => (
          <Card key={f.id} className="fam-card">
            <div className="fam-hd">
              <div className="mark" style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--acacia-soft)", color: "var(--acacia-deep)" }}><Icon name="customers" size={19} /></div>
              <div className="who">
                <b>{f.name}</b>
                <span> · {f.phone} · {f.id}</span>
              </div>
              <div className="spacer" />
              <Button size="sm" onClick={() => setAddingCust(f.id)}>＋ Member</Button>
            </div>
            {f.members.length === 0
              ? <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-faint)" }}>No members yet.</div>
              : f.members.map(c => {
                const stale = c.measurements[0] && measurementStale(c.measurements[0].takenAt);
                return (
                  <div className="cust-row" key={c.id} onClick={() => setDetail(c)}>
                    <Avatar name={c.name} />
                    <div className="grow" style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{c.name} <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>· {c.id}</span></div>
                      <div className="faint" style={{ fontSize: 12 }}>{c.phone || f.phone} · {orderCount(c.id)} order{orderCount(c.id) !== 1 ? "s" : ""}</div>
                    </div>
                    <span className="chip">{c.measurements.length} measurement{c.measurements.length !== 1 ? "s" : ""}</span>
                    {stale && <Badge tone="warn">refresh</Badge>}
                  </div>
                );
              })}
          </Card>
        ))}
      </div>

      {detail && <CustomerDetail customer={db.customers.find(c => c.id === detail.id)!} onClose={() => setDetail(null)} />}
      {addingFam && <AddFamily onClose={() => setAddingFam(false)} />}
      {addingCust && <AddCustomer familyId={addingCust} onClose={() => setAddingCust(null)} />}
    </>
  );

  function AddFamily({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [note, setNote] = useState("");
    return (
      <Modal title="New family" onClose={onClose}
        footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || phoneDigits(phone).length !== 10} onClick={() => { addFamily({ name: name.trim(), phone: phoneIntl(phone), note: note.trim() || undefined }); onClose(); }}>Add family</Button></>}>
        <Field label="Household name"><Input value={name} placeholder="Sharma Household" onChange={e => setName(e.target.value)} /></Field>
        <Field label="Shared phone"><div className="phone-inl"><span>+91</span><Input inputMode="numeric" value={phoneLocal(phone)} placeholder="98765 43210" onChange={e => setPhone(phoneDigits(e.target.value))} /></div></Field>
        <Field label="Note"><Input value={note} placeholder="optional" onChange={e => setNote(e.target.value)} /></Field>
      </Modal>
    );
  }

  function AddCustomer({ familyId, onClose }: { familyId: string; onClose: () => void }) {
    const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [gender, setGender] = useState<"F" | "M" | "—">("F");
    // Customer ID is assigned automatically from the name — never typed.
    const previewId = (() => {
      const pre = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
      const used = db.customers.filter(c => c.id.startsWith(pre + "-")).map(c => parseInt(c.id.slice(4), 10)).filter(n => !Number.isNaN(n));
      return `${pre}-${String((used.length ? Math.max(...used) : 0) + 1).padStart(3, "0")}`;
    })();
    return (
      <Modal title="New member" onClose={onClose}
        footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || (phone.length > 0 && phoneDigits(phone).length !== 10)} onClick={() => { const c = addCustomer({ familyId, name: name.trim(), phone: phoneIntl(phone) || undefined, gender }); onClose(); setDetail(c); }}>Add member</Button></>}>
        <Field label="Name"><Input value={name} placeholder="Full name" onChange={e => setName(e.target.value)} /></Field>
        <div className="grid-2">
          <Field label="Own phone"><div className="phone-inl"><span>+91</span><Input inputMode="numeric" value={phoneLocal(phone)} placeholder="falls back to family" onChange={e => setPhone(phoneDigits(e.target.value))} /></div></Field>
          <Field label="Gender"><Select value={gender} onChange={e => setGender(e.target.value as any)}><option value="F">Female</option><option value="M">Male</option><option value="—">—</option></Select></Field>
        </div>
        <div className="id-preview">
          <span>Customer ID</span>
          <b>{name.trim() ? previewId : "—"}</b>
          <em>assigned automatically</em>
        </div>
      </Modal>
    );
  }
}

function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { db, addMeasurement } = useStore();
  const [adding, setAdding] = useState(false);
  const family = db.families.find(f => f.id === customer.familyId);
  const orders = db.orders.filter(o => o.customerId === customer.id);

  return (
    <Modal title={customer.name} onClose={onClose}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      <div className="row" style={{ gap: 12 }}>
        <Avatar name={customer.name} />
        <div>
          <div style={{ fontWeight: 650, fontSize: 15 }}>{customer.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{customer.id} · {customer.phone || family?.phone} · {family?.name}</div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="eyebrow">Measurements</span>
        <Button size="sm" onClick={() => setAdding(true)}>＋ Add</Button>
      </div>

      {customer.measurements.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No measurements recorded yet.</div>}
      {customer.measurements.map(m => {
        const stale = measurementStale(m.takenAt);
        return (
          <div className="meas-card" key={m.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600 }}>{m.garment} <span className="chip" style={{ marginLeft: 4 }}>v{m.version ?? 1}</span></div>
              <div className="row" style={{ gap: 8 }}>
                <span className="faint" style={{ fontSize: 12 }}>{fmtDate(m.takenAt)}</span>
                {stale ? <Badge tone="warn">refresh · {Math.abs(daysUntil(m.takenAt))}d</Badge> : <Badge tone="ok">fresh</Badge>}
              </div>
            </div>
            <div className="meas-grid">
              {m.values.map((v, i) => (
                <div className="meas-cell" key={i}><div className="m-lbl">{v.label}</div><div className="m-val">{v.value}</div></div>
              ))}
            </div>
            {m.note && <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>✎ {m.note}</div>}
          </div>
        );
      })}

      <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
        <span className="eyebrow">Order history</span>
      </div>
      {orders.length === 0 ? <div className="muted" style={{ fontSize: 13 }}>No orders yet.</div> : (
        <div className="list" style={{ border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
          {orders.map(o => (
            <div className="list-row" key={o.id} style={{ cursor: "default" }}>
              <div className="grow"><div className="title" style={{ fontSize: 13.5 }}>{o.garment}</div><div className="sub">{o.code} · {fmtDate(o.deliveryDate)}</div></div>
              <Badge tone="info">{o.stage}</Badge>
            </div>
          ))}
        </div>
      )}

      {adding && <AddMeasurement onClose={() => setAdding(false)} onSave={m => { addMeasurement(customer.id, m); setAdding(false); }} />}
    </Modal>
  );
}

function AddMeasurement({ onClose, onSave }: { onClose: () => void; onSave: (m: { takenAt: string; garment: string; values: { label: string; value: string }[]; note?: string }) => void }) {
  const [garment, setGarment] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{ label: "Chest", value: "" }, { label: "Waist", value: "" }, { label: "Shoulder", value: "" }, { label: "Length", value: "" }]);
  const set = (i: number, k: "label" | "value", v: string) => setRows(rs => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const bad = (v: string) => v.trim().length > 0 && !isMeasureValue(v);
  const anyBad = rows.some(r => bad(r.value));

  return (
    <Modal title="Add measurement" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!garment.trim() || anyBad} onClick={() => onSave({ takenAt: new Date().toISOString(), garment: garment.trim(), values: rows.filter(r => r.value.trim()), note: note.trim() || undefined })}>Save</Button></>}>
      <Field label="Garment"><Input value={garment} placeholder="Blouse, Kurta, Suit…" onChange={e => setGarment(e.target.value)} /></Field>
      <div className="grid-2">
        {rows.map((r, i) => (
          <Field key={i} label={r.label}><Input value={r.value} placeholder='e.g. 36"' className={bad(r.value) ? "input-bad" : undefined} onChange={e => set(i, "value", e.target.value)} /></Field>
        ))}
      </div>
      {anyBad && <div className="field-err">Use a number with an optional unit, e.g. 36, 36.5, 36" or 34"-36".</div>}
      <Field label="Note"><Textarea value={note} placeholder="Deep back, piping edge…" onChange={e => setNote(e.target.value)} /></Field>
    </Modal>
  );
}
