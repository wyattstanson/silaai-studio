import { useState } from "react";
import { useStore } from "../data/store";
import { Badge, Button, Card, Field, Input, Modal } from "../components/ui/ui";
import { Icon, type IconName } from "../components/Icon";

const MOD_ICON: Record<string, IconName> = {
  tailoring: "orders", sales: "sales", payments: "payments", reports: "reports",
  course: "course", courier: "courier",
};
const modIcon = (id: string): IconName => MOD_ICON[id] ?? "spark";
import "./modules.css";

export function Settings() {
  const { db, toggleModule, addModule, removeModule, resetData } = useStore();
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Scalability</span>
          <h1>Modules & Settings</h1>
          <p>Unlock only what this shop needs. Enable, disable, add or remove features as the app grows with you.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>＋ Add feature</Button>
      </div>

      <div className="mod-grid">
        {db.modules.map(m => (
          <Card key={m.id} className={`mod-card ${m.enabled ? "" : "off"}`}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="mod-ico"><Icon name={modIcon(m.id)} size={20} /></div>
              <label className="switch" title={m.core ? "Core module, always on" : "Toggle"}>
                <input type="checkbox" checked={m.enabled} disabled={m.core} onChange={() => toggleModule(m.id)} />
                <span className="track"><span className="knob" /></span>
              </label>
            </div>
            <div>
              <h4>{m.name} {m.core && <Badge>core</Badge>}</h4>
              <div className="mod-desc" style={{ marginTop: 4 }}>{m.description}</div>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Badge tone={m.enabled ? "ok" : "neutral"} dot={m.enabled}>{m.enabled ? "Enabled" : "Off"}</Badge>
              {!m.core && (
                <Button variant="danger" size="sm" onClick={() => { if (confirm(`Remove “${m.name}”? This deletes the feature from the app.`)) removeModule(m.id); }}>
                  Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="card-pad" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Studio</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{db.shop.name} · {db.shop.owner} · Batch {db.shop.batch}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {db.families.length} families · {db.customers.length} customers · {db.orders.length} orders, saved on this device.
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => { if (confirm("Reset all data back to the sample studio? This cannot be undone.")) resetData(); }}>
            Reset to sample data
          </Button>
        </div>
      </Card>

      {adding && <AddFeature onClose={() => setAdding(false)} onAdd={(name, description, icon) => { addModule({ id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 5), name, description, icon, enabled: true }); setAdding(false); }} />}
    </>
  );
}

function AddFeature({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, description: string, icon: string) => void }) {
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  return (
    <Modal title="Add a feature" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!name.trim()} onClick={() => onAdd(name.trim(), desc.trim() || "Custom module", "spark")}>Add feature</Button></>}>
      <Field label="Feature name"><Input value={name} placeholder="Inventory" onChange={e => setName(e.target.value)} /></Field>
      <Field label="Description"><Input value={desc} placeholder="What does this feature do?" onChange={e => setDesc(e.target.value)} /></Field>
    </Modal>
  );
}
