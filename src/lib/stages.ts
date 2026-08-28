import type { OrderStage } from "../data/types";

export const STAGES: OrderStage[] = ["new", "cutting", "stitching", "ready", "delivered"];

export const STAGE_META: Record<OrderStage, { label: string; tone: "neutral" | "info" | "warn" | "ok"; step: number }> = {
  new:       { label: "New",       tone: "neutral", step: 0 },
  cutting:   { label: "Cutting",   tone: "info",    step: 1 },
  stitching: { label: "Stitching", tone: "warn",    step: 2 },
  ready:     { label: "Ready",     tone: "ok",      step: 3 },
  delivered: { label: "Delivered", tone: "ok",      step: 4 },
};

export const stagePct = (s: OrderStage) => (STAGE_META[s].step / 4) * 100;
export const nextStage = (s: OrderStage): OrderStage | null => {
  const i = STAGES.indexOf(s);
  return i < STAGES.length - 1 ? STAGES[i + 1] : null;
};

export const KIND_LABEL: Record<string, string> = { stitching: "Stitching", sale: "Material Sale", wedding: "Wedding" };
