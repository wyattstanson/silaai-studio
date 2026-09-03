import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { Avatar, Badge, Button, Card, Field, Input, Empty } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { fmtDate, measurementStale } from "../lib/format";
import "./modules.css";

/* Owner-side measurement book: every customer with their sizes on file,
   and an add/refresh form per customer. */
export function Measurements() {
  const { db, addMeasurement } = useStore();
  const [q, setQ] = useState("");
  const [addFor, setAddFor] = useState<string | null>(null);

  const customers = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.customers
      .filter(c => !t || c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t))
      .slice(0, 200);
  }, [db.customers, q]);

  const total = db.customers.reduce((s, c) => s + c.measurements.length, 0);

  return (<>
    <div className="page-head">
      <div>
        <span className="eyebrow">Tailoring</span>
        <h1>Measurements</h1>
        <p>Every customer's sizes on file — {total} recorded. Add or refresh measurements per customer.</p>
      </div>
    </div>

    <div className="search" style={{ marginBottom: 14 }}>
      <Icon name="search" size={15} className="faint" />
      <input placeholder="Search customer or ID (e.g. ANJ-001)" value={q} onChange={e => setQ(e.target.value)} />
    </div>

    {customers.length === 0 ? <Empty icon={<Icon name="measure" size={30} />} title="No customers found" /> : (
      <div className="grid-cards">
        {customers.map(c => {
          const open = addFor === c.id;
          return (
            <Card key={c.id}>
              <div className="row" style={{ justifyContent: "space-between", padding: "12px 14px", borderBottom: open || c.measurements.length ? "1px solid var(--hairline-soft)" : undefined }}>
                <div className="fam-hd" style={{ padding: 0, minWidth: 0 }}>
                  <Avatar name={c.name} />
                  <div className="who" style={{ minWidth: 0 }}><b>{c.name}</b><span> · {c.id}</span></div>
                </div>
                <Button size="sm" variant={open ? undefined : "primary"} onClick={() => setAddFor(open ? null : c.id)}>
                  <Icon name={open ? "close" : "plus"} size={13} /> {open ? "Cancel" : "Add"}
                </Button>
              </div>

              {open && <AddMeas onSave={m => { addMeasurement(c.id, m); setAddFor(null); }} />}

              {c.measurements.length === 0 && !open && (
                <div className="muted" style={{ padding: 14, fontSize: 13 }}>No measurements yet.</div>
              )}
              {c.measurements.map(m => (
                <div key={m.id} style={{ padding: 14, borderTop: "1px solid var(--hairline-soft)" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b style={{ fontSize: 13.5 }}>{m.garment} <span className="chip">v{m.version ?? 1}</span></b>
                    {measurementStale(m.takenAt) ? <Badge tone="warn">refresh · {fmtDate(m.takenAt)}</Badge> : <Badge tone="ok">{fmtDate(m.takenAt)}</Badge>}
                  </div>
                  <div className="meas-grid">
                    {m.values.map((v, i) => <div className="meas-cell" key={i}><div className="m-lbl">{v.label}</div><div className="m-val">{v.value}</div></div>)}
                  </div>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    )}
  </>);
}

function AddMeas({ onSave }: { onSave: (m: { takenAt: string; garment: string; values: { label: string; value: string }[] }) => void }) {
  const [garment, setGarment] = useState("");
  const [rows, setRows] = useState([{ label: "Chest", value: "" }, { label: "Waist", value: "" }, { label: "Shoulder", value: "" }, { label: "Length", value: "" }, { label: "Sleeve", value: "" }]);
  const set = (i: number, v: string) => setRows(rs => rs.map((r, j) => j === i ? { ...r, value: v } : r));
  return (
    <div style={{ padding: 14 }}>
      <Field label="Garment"><Input value={garment} placeholder="Blouse, Kurta, Lehenga…" autoFocus onChange={e => setGarment(e.target.value)} /></Field>
      <div className="meas-grid" style={{ marginTop: 10 }}>
        {rows.map((r, i) => (
          <div key={i}><div className="m-lbl" style={{ marginBottom: 3 }}>{r.label}</div><Input value={r.value} placeholder={'36"'} onChange={e => set(i, e.target.value)} /></div>
        ))}
      </div>
      <Button variant="primary" size="sm" style={{ marginTop: 12 }} disabled={!garment.trim() || !rows.some(r => r.value.trim())}
        onClick={() => onSave({ takenAt: new Date().toISOString(), garment: garment.trim(), values: rows.filter(r => r.value.trim()) })}>
        Save measurement
      </Button>
    </div>
  );
}
