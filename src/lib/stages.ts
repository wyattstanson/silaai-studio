import type { OrderPriority, OrderStage } from "../data/types";

// Full Threadline lifecycle (§3.3). Colour coding: queue = indigo (info),
// active work = gold (warn), Ready onward = green (ok), Closed = neutral.
export const STAGES: OrderStage[] = ["new", "material", "cutting", "stitching", "qc", "ready", "delivered", "closed"];

export const STAGE_META: Record<OrderStage, { label: string; short: string; tone: "neutral" | "info" | "warn" | "ok"; step: number }> = {
  new:       { label: "Order Created",       short: "Created",   tone: "info",    step: 0 },
  material:  { label: "Material Received",    short: "Material",  tone: "info",    step: 1 },
  cutting:   { label: "Cutting",             short: "Cutting",   tone: "warn",    step: 2 },
  stitching: { label: "Stitching",           short: "Stitching", tone: "warn",    step: 3 },
  qc:        { label: "Quality Check",       short: "QC",        tone: "warn",    step: 4 },
  ready:     { label: "Ready",               short: "Ready",     tone: "ok",      step: 5 },
  delivered: { label: "Delivered/Dispatched",short: "Dispatch",  tone: "ok",      step: 6 },
  closed:    { label: "Closed",              short: "Closed",    tone: "neutral", step: 7 },
};

const LAST = STAGES.length - 1;
export const stagePct = (s: OrderStage) => (STAGE_META[s].step / LAST) * 100;
export const nextStage = (s: OrderStage): OrderStage | null => {
  const i = STAGES.indexOf(s);
  return i >= 0 && i < LAST ? STAGES[i + 1] : null;
};

// An order is "done" once delivered or closed.
export const isClosed = (s: OrderStage) => s === "delivered" || s === "closed";

export const PRIORITY_META: Record<OrderPriority, { label: string; tone: "neutral" | "warn" | "urgent" }> = {
  normal:  { label: "Normal",  tone: "neutral" },
  urgent:  { label: "Urgent",  tone: "warn" },
  express: { label: "Express", tone: "urgent" },
};

export const KIND_LABEL: Record<string, string> = { stitching: "Stitching", sale: "Material Sale", wedding: "Wedding" };
