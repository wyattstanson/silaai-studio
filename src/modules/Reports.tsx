import { useStore } from "../data/store";
import { Card, Stat } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { inr, paid, balance } from "../lib/format";
import { STAGES, STAGE_META, KIND_LABEL, isClosed } from "../lib/stages";
import "./modules.css";

const STAGE_COLOR: Record<string, string> = {
  new: "var(--info)", material: "var(--peacock)", cutting: "var(--acacia)", stitching: "var(--acacia)",
  qc: "var(--acacia-deep)", ready: "var(--sage)", delivered: "var(--sage-deep)", closed: "var(--text-faint)",
};
const KIND_COLOR: Record<string, string> = { stitching: "var(--acacia)", wedding: "var(--clay)", sale: "var(--sage)" };

export function Reports() {
  const { db } = useStore();
  const orders = db.orders;
  const revenue = orders.reduce((s, o) => s + paid(o), 0);
  const pipeline = orders.filter(o => !isClosed(o.stage)).reduce((s, o) => s + o.price, 0);
  const outstanding = orders.reduce((s, o) => s + balance(o), 0);

  const byStage = STAGES.map(s => ({ key: s, label: STAGE_META[s].short, n: orders.filter(o => o.stage === s).length, color: STAGE_COLOR[s] }));
  const byKind = (["stitching", "wedding", "sale"] as const).map(k => ({
    key: k, label: KIND_LABEL[k], n: orders.filter(o => o.kind === k).length,
    value: orders.filter(o => o.kind === k).reduce((s, o) => s + o.price, 0), color: KIND_COLOR[k],
  }));
  const maxStage = Math.max(1, ...byStage.map(s => s.n));
  const maxKind = Math.max(1, ...byKind.map(k => k.value));

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Insight</span>
          <h1>Reports</h1>
          <p>Revenue, workload and where the money is sitting.</p>
        </div>
      </div>

      <div className="grid-stats">
        <Card><Stat icon={<Icon name="payments" size={15} />} label="Revenue collected" value={inr(revenue)} sub="all time" /></Card>
        <Card><Stat icon={<Icon name="clock" size={15} />} label="In pipeline" value={inr(pipeline)} sub="value of active orders" /></Card>
        <Card><Stat icon={<Icon name="reports" size={15} />} label="Outstanding" value={inr(outstanding)} sub="to be collected" /></Card>
        <Card><Stat icon={<Icon name="orders" size={15} />} label="Orders" value={orders.length} sub="in this book" /></Card>
      </div>

      <div className="two-col">
        <Card>
          <div className="card-hd"><h3>Workload by stage</h3></div>
          <div className="card-pad">
            {byStage.map(s => (
              <div className="bar-row" key={s.key}>
                <span className="muted">{s.label}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(s.n / maxStage) * 100}%`, background: s.color }} /></div>
                <span className="report-num">{s.n}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="card-hd"><h3>Value by order type</h3></div>
          <div className="card-pad">
            {byKind.map(k => (
              <div className="bar-row" key={k.key}>
                <span className="muted">{k.label} <span className="faint">· {k.n}</span></span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(k.value / maxKind) * 100}%`, background: k.color }} /></div>
                <span className="report-num" style={{ width: 72, fontSize: 12 }}>{inr(k.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
