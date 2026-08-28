import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { Badge, Button, Card, Field, Input, Modal, Segmented, Select, Textarea, Empty, Avatar } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { useWindows } from "../components/windows/WindowManager";
import { dueBadge } from "./OrderSheet";
import { STAGE_META, KIND_LABEL } from "../lib/stages";
import { inr, balance, daysUntil, fmtDay } from "../lib/format";
import type { Order, OrderKind, MaterialSource, Fulfilment } from "../data/types";
import "./modules.css";

type Filter = "all" | "deadline" | "active" | "ready" | "delivered";

export function Orders() {
  const { db, addOrder, addPayment } = useStore();
  const wm = useWindows();
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const custName = (id: string) => db.customers.find(c => c.id === id)?.name ?? "—";
  const openOrder = (o: Order) => wm.open({ kind: "order", key: o.id, title: o.garment, subtitle: o.code, payload: { orderId: o.id }, w: 460, h: 560 });

  const rows = useMemo(() => {
    let list = [...db.orders];
    if (filter === "deadline") list = list.filter(o => o.stage !== "delivered" && (o.deadline || daysUntil(o.deliveryDate) < 0));
    else if (filter === "active") list = list.filter(o => o.stage !== "delivered" && o.stage !== "ready");
    else if (filter === "ready") list = list.filter(o => o.stage === "ready");
    else if (filter === "delivered") list = list.filter(o => o.stage === "delivered");
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(o => o.garment.toLowerCase().includes(t) || o.code.toLowerCase().includes(t) || custName(o.customerId).toLowerCase().includes(t));
    }
    return list.sort((a, b) => {
      if ((b.deadline ? 1 : 0) !== (a.deadline ? 1 : 0)) return (b.deadline ? 1 : 0) - (a.deadline ? 1 : 0);
      return daysUntil(a.deliveryDate) - daysUntil(b.deliveryDate);
    });
  }, [db.orders, filter, q]);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Tailoring</span>
          <h1>Orders</h1>
          <p>Every stitching job, measurements, material, delivery & payment in one ticket.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>＋ New order</Button>
      </div>

      <div className="toolbar">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "deadline", label: "Deadline" },
            { value: "active", label: "In progress" },
            { value: "ready", label: "Ready" },
            { value: "delivered", label: "Delivered" },
          ]}
        />
        <div className="spacer" />
        <div className="search">
          <span className="faint">⌕</span>
          <input placeholder="Search garment, ticket or customer" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <Card>
        {rows.length === 0 ? (
          <Empty icon={<Icon name="orders" size={30} />} title="No orders here" hint="Try a different filter, or create a new order." />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Ticket</th><th>Garment</th><th>Customer</th><th>Stage</th><th>Delivery</th><th>Balance</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => (
                <tr key={o.id} onClick={() => openOrder(o)} style={{ cursor: "pointer" }}>
                  <td className="mono muted">{o.code}</td>
                  <td>
                    <div className="row" style={{ gap: 9 }}>
                      <span style={{ fontWeight: 600 }}>{o.garment}</span>
                      {o.deadline && <span className="flag" title="Deadline"><Icon name="flag" size={14} /></span>}
                    </div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{KIND_LABEL[o.kind]} · {o.materialSource === "shop" ? "shop material" : "own material"}</div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}><Avatar name={custName(o.customerId)} /><span>{custName(o.customerId)}</span></div>
                  </td>
                  <td><Badge tone={STAGE_META[o.stage].tone}>{STAGE_META[o.stage].label}</Badge></td>
                  <td><div style={{ fontWeight: 550 }}>{fmtDay(o.deliveryDate)}</div>{dueBadge(o)}</td>
                  <td className="mono" style={{ color: balance(o) > 0 ? "var(--clay)" : "var(--text-faint)", fontWeight: 600 }}>
                    {balance(o) > 0 ? inr(balance(o)) : "Settled"}
                  </td>
                  <td className="faint">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {creating && <NewOrder onClose={() => setCreating(false)} onCreated={o => { setCreating(false); openOrder(o); }} />}
    </>
  );

  function NewOrder({ onClose, onCreated }: { onClose: () => void; onCreated: (o: Order) => void }) {
    const [customerId, setCustomerId] = useState(db.customers[0]?.id ?? "");
    const [garment, setGarment] = useState("");
    const [kind, setKind] = useState<OrderKind>("stitching");
    const [materialSource, setMaterialSource] = useState<MaterialSource>("shop");
    const [fulfilment, setFulfilment] = useState<Fulfilment>("local");
    const [material, setMaterial] = useState("");
    const [design, setDesign] = useState("");
    const [qty, setQty] = useState("1");
    const [price, setPrice] = useState("");
    const [advance, setAdvance] = useState("");
    const [deliveryDate, setDeliveryDate] = useState(() => {
      const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10);
    });
    const [deadline, setDeadline] = useState(false);
    const [remarks, setRemarks] = useState("");

    const valid = customerId && garment.trim() && Number(price) > 0;

    const submit = () => {
      if (!valid) return;
      const o = addOrder({
        customerId, kind, garment: garment.trim(), materialSource, fulfilment,
        material: material.trim() || undefined, design: design.trim() || undefined,
        qty: Number(qty) || 1, stage: "new", deadline,
        deliveryDate: new Date(deliveryDate).toISOString(), price: Number(price),
        remarks: remarks.trim() || undefined,
      });
      if (Number(advance) > 0) {
        addPayment(o.id, { kind: "advance", amount: Number(advance), method: "upi" });
      }
      onCreated(o);
    };

    return (
      <Modal
        title="New order"
        onClose={onClose}
        footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} onClick={submit}>Create order</Button></>}
      >
        <Field label="Customer">
          <Select value={customerId} onChange={e => setCustomerId(e.target.value)}>
            {db.customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.id}</option>)}
          </Select>
        </Field>
        <div className="grid-2">
          <Field label="Garment"><Input value={garment} placeholder="e.g. Bridal Lehenga" onChange={e => setGarment(e.target.value)} /></Field>
          <Field label="Order type">
            <Select value={kind} onChange={e => setKind(e.target.value as OrderKind)}>
              <option value="stitching">Stitching</option>
              <option value="wedding">Wedding</option>
              <option value="sale">Material Sale</option>
            </Select>
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Material source">
            <Select value={materialSource} onChange={e => setMaterialSource(e.target.value as MaterialSource)}>
              <option value="shop">From shop</option>
              <option value="outside">Customer's own</option>
            </Select>
          </Field>
          <Field label="Fulfilment">
            <Select value={fulfilment} onChange={e => setFulfilment(e.target.value as Fulfilment)}>
              <option value="local">Local pickup</option>
              <option value="outside">Outside · courier</option>
            </Select>
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Material remark"><Input value={material} placeholder="Raw silk, maroon" onChange={e => setMaterial(e.target.value)} /></Field>
          <Field label="Design remark"><Input value={design} placeholder="Zardozi bodice" onChange={e => setDesign(e.target.value)} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Quantity"><Input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} /></Field>
          <Field label="Delivery date"><Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Agreed price (₹)"><Input type="number" min={0} value={price} placeholder="24000" onChange={e => setPrice(e.target.value)} /></Field>
          <Field label="Advance now (₹)"><Input type="number" min={0} value={advance} placeholder="optional" onChange={e => setAdvance(e.target.value)} /></Field>
        </div>
        <Field label="Remarks"><Textarea value={remarks} placeholder="Sample photo, fitting notes, special instructions…" onChange={e => setRemarks(e.target.value)} /></Field>
        <label className="row" style={{ gap: 10, cursor: "pointer", fontSize: 13.5, fontWeight: 550 }}>
          <span className="switch">
            <input type="checkbox" checked={deadline} onChange={e => setDeadline(e.target.checked)} />
            <span className="track"><span className="knob" /></span>
          </span>
          Flag as deadline, to be completed first
        </label>
      </Modal>
    );
  }
}
