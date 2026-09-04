import { useMemo, useState } from "react";
import { useStore } from "../data/store";
import { useWindows } from "../components/windows/WindowManager";
import { Avatar, Badge, Button, Card, Empty, Field, Input, Modal, Segmented, Select, Textarea, Stat } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { REQUEST_TYPES, reqMeta, REQ_STATUS, REQ_FLOW, nextStatus, TIME_SLOTS } from "../lib/requests";
import { fmtDate, fmtDay, daysUntil } from "../lib/format";
import type { Order, RequestType, ServiceRequest } from "../data/types";
import "./modules.css";

export function Requests() {
  const { user } = useStore();
  return user?.role === "owner" ? <OwnerRequests /> : <MemberRequests />;
}

/* ============================ MEMBER ============================ */
function MemberRequests() {
  const { db, activeCustomer, addRequest } = useStore();
  const [compose, setCompose] = useState<RequestType | null>(null);
  const [open, setOpen] = useState<ServiceRequest | null>(null);

  const cid = activeCustomer?.id;
  const members = useMemo(() => (activeCustomer ? [activeCustomer] : []), [activeCustomer]);
  const mine = useMemo(
    () => db.requests.filter(r => r.customerId === cid).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [db.requests, cid]
  );
  const open_ = mine.filter(r => !["completed", "declined", "cancelled"].includes(r.status));

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{activeCustomer?.name}</span>
          <h1>Requests</h1>
          <p>Ask the studio for anything: stitching, pickups, fittings and more.</p>
        </div>
      </div>

      <div className="grid-stats">
        <Card><Stat icon={<Icon name="requests" size={15} />} label="Open requests" value={open_.length} sub={`${mine.length} all time`} /></Card>
        <Card><Stat icon={<Icon name="calendar" size={15} />} label="Next visit" value={nextVisit(mine) ? fmtDay(nextVisit(mine)!) : "—"} sub="scheduled pickup or fitting" /></Card>
        <Card><Stat icon={<Icon name="check" size={15} />} label="Completed" value={mine.filter(r => r.status === "completed").length} sub="fulfilled requests" /></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div className="card-hd"><h3>Raise a request</h3></div>
        <div className="req-grid card-pad">
          {REQUEST_TYPES.map(t => (
            <button className="req-type" data-tone={t.tone} key={t.type} onClick={() => setCompose(t.type)}>
              <span className="rt-ico"><Icon name={t.icon} size={18} /></span>
              <span className="rt-name">{t.label}</span>
              <span className="rt-blurb">{t.blurb}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-hd"><h3>Your requests</h3><Badge tone="info">{open_.length} open</Badge></div>
        {mine.length === 0 ? <Empty icon={<Icon name="requests" size={30} />} title="No requests yet" hint="Pick a service above to get started." /> : (
          <div className="list">
            {mine.map(r => <RequestRow key={r.id} r={r} onClick={() => setOpen(r)} custName={id => db.customers.find(c => c.id === id)?.name} />)}
          </div>
        )}
      </Card>

      {compose && <RequestForm type={compose} members={members} orders={db.orders.filter(o => o.customerId === cid)}
        defaultCustomer={cid}
        onClose={() => setCompose(null)}
        onSubmit={data => { const req = addRequest({ ...data, familyId: activeCustomer?.familyId }); setCompose(null); setOpen(req); }} />}
      {open && <RequestDetail request={db.requests.find(r => r.id === open.id)!} onClose={() => setOpen(null)} custName={id => db.customers.find(c => c.id === id)?.name} />}
    </>
  );
}

/* ============================ OWNER ============================ */
type Filter = "all" | "open" | "scheduled" | "done";
function OwnerRequests() {
  const { db } = useStore();
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<ServiceRequest | null>(null);
  const custName = (id: string) => db.customers.find(c => c.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    let list = [...db.requests];
    if (filter === "open") list = list.filter(r => ["submitted", "acknowledged"].includes(r.status));
    else if (filter === "scheduled") list = list.filter(r => ["scheduled", "in_progress"].includes(r.status));
    else if (filter === "done") list = list.filter(r => ["completed", "declined", "cancelled"].includes(r.status));
    if (q.trim()) { const t = q.toLowerCase(); list = list.filter(r => custName(r.customerId).toLowerCase().includes(t) || r.code.toLowerCase().includes(t) || r.type.includes(t)); }
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [db.requests, filter, q]);

  const counts = {
    open: db.requests.filter(r => ["submitted", "acknowledged"].includes(r.status)).length,
    scheduled: db.requests.filter(r => ["scheduled", "in_progress"].includes(r.status)).length,
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Shopkeeper · Requests</span>
          <h1>Request Inbox</h1>
          <p>What customers are asking for. Acknowledge, schedule, or turn into an order.</p>
        </div>
      </div>

      <div className="grid-stats">
        <Card><Stat icon={<Icon name="requests" size={15} />} label="Needs action" value={counts.open} sub="new & unacknowledged" /></Card>
        <Card><Stat icon={<Icon name="calendar" size={15} />} label="Scheduled" value={counts.scheduled} sub="pickups, fittings, in progress" /></Card>
        <Card><Stat icon={<Icon name="check" size={15} />} label="Completed" value={db.requests.filter(r => r.status === "completed").length} sub="fulfilled" /></Card>
      </div>

      <div className="toolbar">
        <Segmented<Filter> value={filter} onChange={setFilter}
          options={[{ value: "open", label: "Needs action" }, { value: "scheduled", label: "Scheduled" }, { value: "done", label: "Closed" }, { value: "all", label: "All" }]} />
        <div className="spacer" />
        <div className="search"><Icon name="search" size={15} className="faint" /><input placeholder="Search customer, ID or type" value={q} onChange={e => setQ(e.target.value)} /></div>
      </div>

      <Card>
        {rows.length === 0 ? <Empty icon={<Icon name="requests" size={30} />} title="Nothing here" hint="No requests match this filter." /> : (
          <div className="list">
            {rows.map(r => <RequestRow key={r.id} r={r} owner onClick={() => setOpen(r)} custName={custName} />)}
          </div>
        )}
      </Card>

      {open && <RequestDetail request={db.requests.find(r => r.id === open.id)!} manage onClose={() => setOpen(null)} custName={id => db.customers.find(c => c.id === id)?.name} />}
    </>
  );
}

/* ============================ SHARED ============================ */
function RequestRow({ r, onClick, owner, custName }: { r: ServiceRequest; onClick: () => void; owner?: boolean; custName: (id: string) => string | undefined }) {
  const m = reqMeta(r.type);
  const s = REQ_STATUS[r.status];
  return (
    <div className="list-row" onClick={onClick}>
      <span className="rt-ico" data-tone={m.tone} style={{ width: 34, height: 34 }}><Icon name={m.icon} size={16} /></span>
      <div className="grow">
        <div className="title" style={{ fontSize: 14 }}>{m.label}{r.express && <span className="flag" style={{ marginLeft: 6 }}><Icon name="flag" size={12} /></span>} <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>· {r.code}</span></div>
        <div className="sub">{owner && <span>{custName(r.customerId)}</span>}{r.garment && <span>{r.garment}</span>}{r.preferredDate && <span>{fmtDay(r.preferredDate)}{r.timeSlot ? `, ${r.timeSlot}` : ""}</span>}</div>
      </div>
      <Badge tone={s.tone}>{s.label}</Badge>
    </div>
  );
}

function Timeline({ request }: { request: ServiceRequest }) {
  const cur = REQ_STATUS[request.status].step;
  const terminal = cur < 0;
  return (
    <div className="req-timeline">
      {!terminal && REQ_FLOW.map((st, i) => {
        const done = i <= cur;
        return (
          <div className={`rt-node ${i < cur ? "done" : i === cur ? "current" : ""}`} key={st}>
            <span className="rt-dot">{i < cur ? <Icon name="check" size={11} /> : i + 1}</span>
            <span className="rt-lbl">{REQ_STATUS[st].label}</span>
            {i < REQ_FLOW.length - 1 && <span className="rt-bar" data-done={done && i < cur} />}
          </div>
        );
      })}
      {terminal && <Badge tone={REQ_STATUS[request.status].tone} dot>{REQ_STATUS[request.status].label}</Badge>}
    </div>
  );
}

function RequestDetail({ request, onClose, manage, custName }: { request: ServiceRequest; onClose: () => void; manage?: boolean; custName: (id: string) => string | undefined }) {
  const { db, setRequestStatus, addOrder } = useStore();
  const wm = useWindows();
  const m = reqMeta(request.type);
  const next = nextStatus(request.status);
  const [schedDate, setSchedDate] = useState(request.preferredDate?.slice(0, 10) ?? "");
  const [schedSlot, setSchedSlot] = useState(request.timeSlot ?? TIME_SLOTS[0]);

  const convertible = ["stitching", "reorder", "alteration"].includes(request.type);
  const canConvert = manage && convertible && !["completed", "declined", "cancelled"].includes(request.status);

  const convert = () => {
    const due = new Date(); due.setDate(due.getDate() + (request.express ? 5 : 14));
    const o = addOrder({
      customerId: request.customerId,
      kind: request.type === "alteration" ? "stitching" : "stitching",
      garment: request.garment || "Custom piece",
      materialSource: "shop", fulfilment: request.type === "delivery" ? "outside" : "local",
      qty: 1, stage: "new", priority: request.express ? "express" : "normal", deadline: !!request.express,
      deliveryDate: (request.preferredDate ? new Date(request.preferredDate) : due).toISOString(),
      price: 0, remarks: `From request ${request.code}. ${request.notes ?? ""}`.trim(),
    });
    setRequestStatus(request.id, "in_progress", `Converted to order ${o.code}`);
    onClose();
    wm.open({ kind: "order", key: o.id, title: o.garment, subtitle: o.code, payload: { orderId: o.id }, w: 460, h: 560 });
  };

  return (
    <Modal title={`${m.label} · ${request.code}`} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {!manage && !["completed", "declined", "cancelled"].includes(request.status) &&
          <Button variant="danger" onClick={() => { setRequestStatus(request.id, "cancelled", "Cancelled by customer"); onClose(); }}>Cancel request</Button>}
        {manage && next && <Button variant="primary" onClick={() => setRequestStatus(request.id, next)}>Mark {REQ_STATUS[next].label}</Button>}
      </>}>
      <div className="row" style={{ gap: 12 }}>
        <span className="rt-ico" data-tone={m.tone} style={{ width: 44, height: 44 }}><Icon name={m.icon} size={20} /></span>
        <div className="grow">
          <div className="row wrap" style={{ gap: 8 }}>
            <Badge tone={REQ_STATUS[request.status].tone} dot>{REQ_STATUS[request.status].label}</Badge>
            {request.express && <Badge tone="urgent" dot>Express</Badge>}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{custName(request.customerId)} · raised {fmtDate(request.createdAt)}</div>
        </div>
      </div>

      <div style={{ padding: "4px 2px" }}><Timeline request={request} /></div>

      <dl className="kv">
        {request.garment && <><dt>Garment</dt><dd>{request.garment}</dd></>}
        {request.orderId && <><dt>Order</dt><dd>{db.orders.find(o => o.id === request.orderId)?.code ?? request.orderId}</dd></>}
        {request.preferredDate && <><dt>Preferred</dt><dd>{fmtDate(request.preferredDate)}{request.timeSlot ? ` · ${request.timeSlot}` : ""}{daysUntil(request.preferredDate) >= 0 ? "" : " (past)"}</dd></>}
        {request.address && <><dt>Address</dt><dd>{request.address}</dd></>}
        {request.notes && <><dt>Notes</dt><dd>{request.notes}</dd></>}
      </dl>

      {manage && !["completed", "declined", "cancelled"].includes(request.status) && (
        <div className="card" style={{ padding: 14 }}>
          <span className="eyebrow">Manage</span>
          {request.status === "submitted" && (
            <div style={{ marginTop: 10 }}>
              <Button variant="primary" size="sm" onClick={() => setRequestStatus(request.id, "acknowledged", "Acknowledged by studio")}>
                <Icon name="check" size={13} style={{ marginRight: 6 }} />Accept request
              </Button>
            </div>
          )}
          {/* Always let the owner set a promised date/slot — required to schedule. */}
          <div className="row wrap" style={{ gap: 8, marginTop: 12, alignItems: "flex-end" }}>
            <Field label={request.type === "alteration" ? "Fitting date" : "Schedule date"}><Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} /></Field>
            <Field label="Slot"><Select value={schedSlot} onChange={e => setSchedSlot(e.target.value)}>{TIME_SLOTS.map(s => <option key={s}>{s}</option>)}</Select></Field>
            <Button variant="primary" disabled={!schedDate}
              onClick={() => setRequestStatus(request.id, "scheduled",
                `${request.type === "alteration" ? "Alteration accepted, fitting" : "Scheduled"} ${fmtDay(schedDate)} · ${schedSlot}`,
                { preferredDate: new Date(schedDate).toISOString(), timeSlot: schedSlot })}>
              {request.type === "alteration" ? "Accept & book fitting" : "Confirm date"}
            </Button>
          </div>
          {!schedDate && <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>Pick a date to confirm the schedule.</div>}
          <div className="row wrap" style={{ gap: 8, marginTop: 12, justifyContent: "space-between" }}>
            <Button variant="danger" size="sm" onClick={() => { setRequestStatus(request.id, "declined", "Declined by studio"); onClose(); }}>Decline</Button>
            {canConvert && <Button variant="primary" size="sm" onClick={convert}><Icon name="orders" size={13} style={{ marginRight: 6 }} />Create order</Button>}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 14 }}>
        <span className="eyebrow">History</span>
        <div className="req-history">
          {[...request.history].reverse().map((h, i) => (
            <div className="rh-row" key={i}>
              <span className="rh-dot" />
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{REQ_STATUS[h.status].label}</div>{h.note && <div className="faint" style={{ fontSize: 12 }}>{h.note}</div>}</div>
              <span className="faint" style={{ marginLeft: "auto", fontSize: 12 }}>{fmtDate(h.at)}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function RequestForm({ type, members, orders, defaultCustomer, onClose, onSubmit }: {
  type: RequestType; members: { id: string; name: string }[]; orders: Order[]; defaultCustomer?: string;
  onClose: () => void; onSubmit: (d: Partial<ServiceRequest> & { type: RequestType; customerId: string }) => void;
}) {
  const m = reqMeta(type);
  const [customerId, setCustomerId] = useState(defaultCustomer ?? members[0]?.id ?? "");
  const [garment, setGarment] = useState("");
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [express, setExpress] = useState(!!m.express);

  const needs = m.needs;
  const valid = customerId && (!needs.includes("order") || orderId) && (!needs.includes("garment") || garment.trim());

  const submit = () => onSubmit({
    type, customerId,
    garment: needs.includes("garment") ? garment.trim() || undefined : (needs.includes("order") ? orders.find(o => o.id === orderId)?.garment : undefined),
    orderId: needs.includes("order") ? orderId : undefined,
    preferredDate: needs.includes("date") && date ? new Date(date).toISOString() : undefined,
    timeSlot: needs.includes("date") && date ? slot : undefined,
    address: needs.includes("address") ? address.trim() || undefined : undefined,
    reference: needs.includes("reference") ? reference.trim() || undefined : undefined,
    notes: notes.trim() || undefined,
    express,
  });

  return (
    <Modal title={m.label} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} onClick={submit}>Submit request</Button></>}>
      <p className="muted" style={{ fontSize: 13, margin: "-2px 0 4px" }}>{m.blurb}</p>
      {members.length > 1 && (
        <Field label="For"><Select value={customerId} onChange={e => setCustomerId(e.target.value)}>{members.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      )}
      {needs.includes("garment") && <Field label="Garment"><Input value={garment} placeholder="e.g. Silk blouse" onChange={e => setGarment(e.target.value)} /></Field>}
      {needs.includes("order") && (
        <Field label="Which order / piece">
          <Select value={orderId} onChange={e => setOrderId(e.target.value)}>
            {orders.length === 0 && <option value="">No past orders</option>}
            {orders.map(o => <option key={o.id} value={o.id}>{o.garment} · {o.code}</option>)}
          </Select>
        </Field>
      )}
      {needs.includes("date") && (
        <div className="grid-2">
          <Field label="Preferred date"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label="Time slot"><Select value={slot} onChange={e => setSlot(e.target.value)}>{TIME_SLOTS.map(s => <option key={s}>{s}</option>)}</Select></Field>
        </div>
      )}
      {needs.includes("address") && <Field label="Address"><Textarea value={address} placeholder="Flat, street, area, city" onChange={e => setAddress(e.target.value)} /></Field>}
      {needs.includes("reference") && <Field label="Reference / inspiration"><Input value={reference} placeholder="Link or short description" onChange={e => setReference(e.target.value)} /></Field>}
      <Field label="Notes"><Textarea value={notes} placeholder="Anything else we should know?" onChange={e => setNotes(e.target.value)} /></Field>
      {!m.express && (
        <label className="row" style={{ gap: 10, cursor: "pointer", fontSize: 13.5, fontWeight: 550 }}>
          <span className="switch"><input type="checkbox" checked={express} onChange={e => setExpress(e.target.checked)} /><span className="track"><span className="knob" /></span></span>
          Mark as express / rush
        </label>
      )}
    </Modal>
  );
}

function nextVisit(reqs: ServiceRequest[]): string | undefined {
  return reqs
    .filter(r => r.preferredDate && r.status === "scheduled" && daysUntil(r.preferredDate) >= 0)
    .sort((a, b) => +new Date(a.preferredDate!) - +new Date(b.preferredDate!))[0]?.preferredDate;
}
