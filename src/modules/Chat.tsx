import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../data/store";
import { Avatar, Button, Empty } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { fmtDate } from "../lib/format";
import "./chat.css";

/* One conversation thread, shared by both sides.
   `side` is who is viewing ("owner" or "customer"). */
export function ChatThread({ customerId, side }: { customerId: string; side: "owner" | "customer" }) {
  const { db, sendMessage, markThreadRead } = useStore();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const msgs = useMemo(
    () => (db.messages ?? []).filter(m => m.customerId === customerId).sort((a, b) => +new Date(a.at) - +new Date(b.at)),
    [db.messages, customerId]
  );
  const cust = db.customers.find(c => c.id === customerId);

  // mark the other side's messages read whenever the thread is open / changes
  useEffect(() => { markThreadRead(customerId, side); }, [customerId, side, msgs.length, markThreadRead]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const send = () => { if (!text.trim()) return; sendMessage(customerId, side, text); setText(""); };

  return (
    <div className="chat">
      <div className="chat-stream">
        {msgs.length === 0 ? (
          <Empty icon={<Icon name="requests" size={28} />} title="No messages yet"
            hint={side === "owner" ? `Start the conversation with ${cust?.name ?? "this customer"}.` : "Send the studio a message about your order, fitting or fabric."} />
        ) : msgs.map(msg => {
          const mine = msg.from === side;
          return (
            <div key={msg.id} className={"bubble-row" + (mine ? " mine" : "")}>
              {!mine && <Avatar name={msg.from === "owner" ? (db.shop.owner || "Studio") : (cust?.name ?? "?")} />}
              <div className="bubble">
                <div className="bubble-txt">{msg.text}</div>
                <div className="bubble-at">{fmtDate(msg.at)}{mine && msg.read ? " · read" : ""}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="chat-compose">
        <input
          value={text} placeholder={side === "owner" ? "Reply to the customer…" : "Message the studio…"}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <Button variant="primary" disabled={!text.trim()} onClick={send}><Icon name="chevron" size={15} /></Button>
      </div>
    </div>
  );
}

/* Customer side: a single thread with the studio. */
export function CustomerMessages() {
  const { db, activeCustomer } = useStore();
  if (!activeCustomer) return null;
  return (<>
    <div className="page-head">
      <div><span className="eyebrow">{activeCustomer.name}</span><h1>Messages</h1><p>Chat directly with {db.shop.name} about your orders, fittings and fabric.</p></div>
    </div>
    <div className="card" style={{ padding: 14, height: "68vh" }}>
      <ChatThread customerId={activeCustomer.id} side="customer" />
    </div>
  </>);
}

/* Owner inbox: conversation list on the left, the thread on the right. */
export function OwnerMessages() {
  const { db } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const lastAt = (cid: string) => {
    const ms = (db.messages ?? []).filter(m => m.customerId === cid);
    return ms.length ? Math.max(...ms.map(m => +new Date(m.at))) : 0;
  };
  const unread = (cid: string) => (db.messages ?? []).filter(m => m.customerId === cid && m.from === "customer" && !m.read).length;

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const withMsgs = new Set((db.messages ?? []).map(m => m.customerId));
    return db.customers
      .filter(c => (t ? (c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t)) : withMsgs.has(c.id)))
      .sort((a, b) => (unread(b.id) - unread(a.id)) || (lastAt(b.id) - lastAt(a.id)) || a.name.localeCompare(b.name))
      .slice(0, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.customers, db.messages, q]);

  const preview = (cid: string) => {
    const ms = (db.messages ?? []).filter(m => m.customerId === cid).sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return ms[0]?.text ?? "No messages yet";
  };
  const selCust = db.customers.find(c => c.id === sel);

  return (<>
    <div className="page-head">
      <div><span className="eyebrow">Manage</span><h1>Messages</h1><p>Chat with customers about orders, fittings and fabric.</p></div>
    </div>
    <div className="inbox">
      <div className="inbox-list">
        <div className="search" style={{ margin: "0 0 10px" }}>
          <Icon name="search" size={15} className="faint" />
          <input placeholder="Search a customer to message" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {list.length === 0 ? <div className="muted" style={{ padding: 12, fontSize: 13 }}>No conversations yet. Search a customer to start one.</div> :
          list.map(c => {
            const u = unread(c.id);
            return (
              <button key={c.id} className={"inbox-row" + (sel === c.id ? " on" : "")} onClick={() => setSel(c.id)}>
                <Avatar name={c.name} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b style={{ fontSize: 13.5 }}>{c.name}</b>
                    {u > 0 && <span className="pill-count">{u}</span>}
                  </div>
                  <div className="inbox-prev">{preview(c.id)}</div>
                </div>
              </button>
            );
          })}
      </div>
      <div className="inbox-thread">
        {selCust ? (<>
          <div className="inbox-thread-hd"><Avatar name={selCust.name} /><div className="who"><b>{selCust.name}</b><span> · {selCust.id}</span></div></div>
          <ChatThread customerId={selCust.id} side="owner" />
        </>) : <Empty icon={<Icon name="requests" size={30} />} title="Pick a conversation" hint="Choose a customer on the left to read and reply." />}
      </div>
    </div>
  </>);
}
