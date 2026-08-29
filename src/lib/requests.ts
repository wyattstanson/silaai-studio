import type { IconName } from "../components/Icon";
import type { RequestStatus, RequestType } from "../data/types";

export type ReqField = "garment" | "order" | "date" | "address" | "reference";

export interface ReqTypeMeta {
  type: RequestType;
  label: string;
  icon: IconName;
  blurb: string;
  tone: "accent" | "sage" | "clay" | "plum" | "neutral";
  needs: ReqField[];
  express?: boolean;
}

// Feature set distilled from major made-to-measure brands (Indochino,
// Suitsupply, Proper Cloth, Bombay Shirt Company, Knot Standard, Sumissura…).
export const REQUEST_TYPES: ReqTypeMeta[] = [
  { type: "stitching", label: "New stitching", icon: "orders", tone: "accent", blurb: "A fresh made-to-measure piece.", needs: ["garment", "date", "reference"] },
  { type: "alteration", label: "Alteration", icon: "needle", tone: "sage", blurb: "Adjust the fit of an existing piece.", needs: ["order", "date"] },
  { type: "pickup", label: "Home pickup", icon: "courier", tone: "clay", blurb: "We collect your cloth from home.", needs: ["date", "address"] },
  { type: "delivery", label: "Delivery", icon: "courier", tone: "clay", blurb: "We deliver your finished order.", needs: ["order", "date", "address"] },
  { type: "fitting", label: "Fitting / trial", icon: "measure", tone: "plum", blurb: "Book a trial or fitting slot.", needs: ["date"] },
  { type: "consultation", label: "Style consult", icon: "spark", tone: "plum", blurb: "Fabric & style advice with us.", needs: ["date"] },
  { type: "reorder", label: "Reorder", icon: "history", tone: "sage", blurb: "Remake a past piece from your measurements.", needs: ["order", "date"] },
  { type: "express", label: "Express / rush", icon: "flag", tone: "clay", blurb: "Speed up an order's turnaround.", needs: ["order"], express: true },
  { type: "measurement", label: "Home measurement", icon: "measure", tone: "accent", blurb: "We take fresh measurements at home.", needs: ["date", "address"] },
  { type: "remake", label: "Fit issue / remake", icon: "back", tone: "plum", blurb: "Report a fit problem for a remake.", needs: ["order", "reference"] },
];

export const reqMeta = (t: RequestType) => REQUEST_TYPES.find(r => r.type === t) ?? REQUEST_TYPES[0];

export const REQ_STATUS: Record<RequestStatus, { label: string; tone: "neutral" | "info" | "warn" | "ok" | "urgent"; step: number }> = {
  submitted:   { label: "Submitted",   tone: "info",    step: 0 },
  acknowledged:{ label: "Acknowledged",tone: "info",    step: 1 },
  scheduled:   { label: "Scheduled",   tone: "warn",    step: 2 },
  in_progress: { label: "In progress", tone: "warn",    step: 3 },
  completed:   { label: "Completed",   tone: "ok",      step: 4 },
  declined:    { label: "Declined",    tone: "urgent",  step: -1 },
  cancelled:   { label: "Cancelled",   tone: "neutral", step: -1 },
};

export const REQ_FLOW: RequestStatus[] = ["submitted", "acknowledged", "scheduled", "in_progress", "completed"];
export const nextStatus = (s: RequestStatus): RequestStatus | null => {
  const i = REQ_FLOW.indexOf(s);
  return i >= 0 && i < REQ_FLOW.length - 1 ? REQ_FLOW[i + 1] : null;
};

export const TIME_SLOTS = ["9am – 11am", "11am – 1pm", "2pm – 4pm", "4pm – 6pm", "6pm – 8pm"];
