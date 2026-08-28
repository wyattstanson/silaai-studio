import { useState } from "react";
import type { Order } from "../data/types";
import { useStore } from "../data/store";
import { Badge, Button, Field, Input, Modal, Select } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { STAGES, STAGE_META, nextStage, KIND_LABEL } from "../lib/stages";
import { inr, fmtDate, paid, balance, dueLabel, daysUntil } from "../lib/format";

export function StageStepper({ order }: { order: Order }) {
  const cur = STAGE_META[order.stage].step;
  return (
    <div className="stepper">
      {STAGES.map((s, i) => {
        const state = i < cur ? "done" : i === cur ? "current" : "";
        return (
          <div key={s} className={`node ${state}`}>
            {i > 0 && <span className="bar" style={{ left: "-50%" }} />}
            <span className="dot">{i < cur ? "✓" : i + 1}</span>
            <span className="lbl">{STAGE_META[s].label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function dueBadge(order: Order) {
  if (order.stage === "delivered") return <Badge tone="ok" dot>Delivered</Badge>;
  const d = daysUntil(order.deliveryDate);
  const tone = d < 0 ? "urgent" : d <= 2 ? "warn" : "info";
  return <Badge tone={tone} dot>{dueLabel(order.deliveryDate)}</Badge>;
}

export function OrderDetail({ order, onClose, readOnly = false, bare = false }: { order: Order; onClose?: () => void; readOnly?: boolean; bare?: boolean }) {
  const { db, setStage, addPayment, updateOrder } = useStore();
  const customer = db.customers.find(c => c.id === order.customerId);
  const [payAmt, setPayAmt] = useState("");
  const [payKind, setPayKind] = useState<"advance" | "balance">("balance");
  const [payMethod, setPayMethod] = useState<"cash" | "upi" | "card">("upi");

  const next = nextStage(order.stage);
  const bal = balance(order);

  const record = () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) return;
    addPayment(order.id, { kind: payKind, amount: amt, method: payMethod });
    setPayAmt("");
  };

  const body = (
    <>
      <div className="row" style={{ gap: 12 }}>
        <div className="sample"><Icon name={order.samplePhoto ? "camera" : "needle"} size={22} /></div>
        <div className="grow" style={{ flex: 1 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <Badge tone="plum">{KIND_LABEL[order.kind]}</Badge>
            {order.deadline && <Badge tone="urgent" dot>Deadline first</Badge>}
            {dueBadge(order)}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            {customer?.name} · {customer?.phone || db.families.find(f => f.id === customer?.familyId)?.phone}
          </div>
        </div>
      </div>

      <div style={{ padding: "6px 4px 2px" }}><StageStepper order={order} /></div>

      <dl className="kv">
        <dt>Material</dt><dd>{order.material || "—"} <span className="faint">({order.materialSource === "shop" ? "from shop" : "customer's own"})</span></dd>
        <dt>Design</dt><dd>{order.design || "—"}</dd>
        <dt>Fulfilment</dt><dd>{order.fulfilment === "outside" ? "Outside · courier dispatch" : "Local pickup"}</dd>
        <dt>Quantity</dt><dd>{order.qty}</dd>
        <dt>Placed</dt><dd>{fmtDate(order.placedAt)}</dd>
        <dt>Delivery</dt><dd>{fmtDate(order.deliveryDate)} · {dueLabel(order.deliveryDate)}</dd>
        {order.remarks && <><dt>Remarks</dt><dd>{order.remarks}</dd></>}
      </dl>

      <div className="card" style={{ padding: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <span className="eyebrow">Payment</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {inr(paid(order))} of {inr(order.price)}
          </span>
        </div>
        {order.payments.map(p => (
          <div className="pay-row" key={p.id}>
            <Badge tone={p.kind === "advance" ? "info" : p.kind === "refund" ? "urgent" : "ok"}>{p.kind}</Badge>
            <span className="muted">{fmtDate(p.at)} · {p.method.toUpperCase()}</span>
            <span className="pay-amt">{p.kind === "refund" ? "−" : ""}{inr(p.amount)}</span>
          </div>
        ))}
        <div className="row" style={{ justifyContent: "space-between", marginTop: 10, fontWeight: 650 }}>
          <span>Balance due</span>
          <span className={bal > 0 ? "" : "muted"} style={{ color: bal > 0 ? "var(--clay)" : undefined }}>{inr(bal)}</span>
        </div>

        {!readOnly && bal > 0 && (
          <div className="row wrap" style={{ gap: 8, marginTop: 12, alignItems: "flex-end" }}>
            <Field label="Amount">
              <Input type="number" value={payAmt} placeholder={String(bal)} onChange={e => setPayAmt(e.target.value)} style={{ width: 110 }} />
            </Field>
            <Field label="Type">
              <Select value={payKind} onChange={e => setPayKind(e.target.value as any)}>
                <option value="balance">Balance</option>
                <option value="advance">Advance</option>
              </Select>
            </Field>
            <Field label="Method">
              <Select value={payMethod} onChange={e => setPayMethod(e.target.value as any)}>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </Select>
            </Field>
            <Button variant="primary" onClick={record}>Record</Button>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="row wrap" style={{ gap: 8, justifyContent: "space-between", marginTop: 2 }}>
          {order.stage !== "delivered" ? (
            <Button variant={order.deadline ? "danger" : "default"} size="sm" onClick={() => updateOrder(order.id, { deadline: !order.deadline })}>
              <Icon name="flag" size={13} style={{ marginRight: 6 }} />{order.deadline ? "Deadline flagged" : "Flag as deadline"}
            </Button>
          ) : <span />}
          <div className="row" style={{ gap: 8 }}>
            {order.stage === "ready" && <Button size="sm" onClick={() => setStage(order.id, "delivered")}>Mark delivered</Button>}
            {next && <Button variant="primary" size="sm" onClick={() => setStage(order.id, next)}>Advance to {STAGE_META[next].label} →</Button>}
          </div>
        </div>
      )}
    </>
  );

  if (bare) return <div className="sheet-bd">{body}</div>;
  return (
    <Modal
      title={`${order.garment} · ${order.code}`}
      onClose={onClose ?? (() => {})}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      {body}
    </Modal>
  );
}
