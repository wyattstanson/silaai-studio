// ============================================================
// Silai — Domain model
// Mirrors the shop's paper workflow: families → customers →
// measurements → orders (stitching/sales) → payments.
// ============================================================

export type ID = string;

export interface Family {
  id: ID;
  name: string;          // "Sharma Family"
  phone: string;         // shared household number
  note?: string;
  createdAt: string;
}

export interface MeasureValue { label: string; value: string }

export interface Measurement {
  id: ID;
  version: number;       // increments per customer + garment; history is kept, never overwritten
  takenAt: string;       // ISO date — used for the 2-month refresh reminder
  garment: string;       // "Blouse", "Kurta", "Suit"
  values: MeasureValue[]; // Chest 38", Waist 32" ...
  note?: string;
}

export interface Customer {
  id: ID;                // Customer ID (auto: CUS-0007)
  familyId: ID;
  name: string;
  phone?: string;        // own number; falls back to family phone
  gender?: "F" | "M" | "—";
  createdAt: string;
  measurements: Measurement[];
}

export type MaterialSource = "shop" | "outside";
export type Fulfilment = "local" | "outside"; // outside → courier dispatch
export type OrderKind = "stitching" | "sale" | "wedding";
export type OrderPriority = "normal" | "urgent" | "express";
// Full lifecycle (Threadline §3.3)
export type OrderStage = "new" | "material" | "cutting" | "stitching" | "qc" | "ready" | "delivered" | "closed";

// Immutable copy of the measurements used for an order (Threadline §3.2)
export interface MeasurementSnapshot {
  garment: string;
  version?: number;
  values: MeasureValue[];
}

export interface Payment {
  id: ID;
  at: string;
  kind: "advance" | "balance" | "refund";
  amount: number;
  method: "cash" | "upi" | "card";
  note?: string;
}

export interface Order {
  id: ID;                // ORD-0042
  code: string;          // human ticket, e.g. "S-42"
  customerId: ID;
  kind: OrderKind;
  garment: string;       // "Bridal Lehenga"
  materialSource: MaterialSource;
  fulfilment: Fulfilment;
  design?: string;       // design remark
  material?: string;     // material remark
  samplePhoto?: string;  // emoji/label stand-in for an attached sample
  qty: number;
  stage: OrderStage;
  priority: OrderPriority;         // Normal / Urgent / Express
  deadline: boolean;              // "to be completed first"
  measurementSnapshot?: MeasurementSnapshot; // locked at creation
  placedAt: string;
  deliveryDate: string;  // promised date
  price: number;         // agreed total
  payments: Payment[];
  remarks?: string;
}

export type Role = "owner" | "member";

export interface User {
  id: ID;
  phone: string;          // login identity — shared across a family
  name: string;
  role: Role;
  familyId?: ID;          // members are linked to a household
  createdAt: string;
  lastLogin?: string;
}

export type ActivityType =
  | "signup" | "login" | "order_placed" | "stage" | "payment"
  | "measurement" | "customer_added" | "family_added";

export interface ActivityEvent {
  id: ID;
  at: string;
  type: ActivityType;
  summary: string;        // human sentence: "Advanced Bridal Lehenga to Stitching"
  familyId?: ID;
  customerId?: ID;
  orderId?: ID;
  amount?: number;        // for payments
  actor?: string;         // who did it
}

// ---- Customer service requests (MTM-brand-inspired) ----------
export type RequestType =
  | "stitching"     // new made-to-measure garment
  | "alteration"    // alter an existing piece
  | "pickup"        // home pickup of cloth/garment
  | "delivery"      // deliver a ready order
  | "fitting"       // book a fitting / trial slot
  | "consultation"  // fabric / style advice
  | "reorder"       // reorder a past garment from saved measurements
  | "express"       // rush an order
  | "measurement"   // home measurement service
  | "remake";       // fit issue / remake under guarantee

export type RequestStatus =
  | "submitted" | "acknowledged" | "scheduled" | "in_progress" | "completed" | "declined" | "cancelled";

export interface RequestEvent { at: string; status: RequestStatus; note?: string; }

export interface ServiceRequest {
  id: ID;
  code: string;            // REQ-0001
  customerId: ID;
  familyId?: ID;
  type: RequestType;
  status: RequestStatus;
  garment?: string;
  orderId?: ID;            // linked order for alteration/delivery/reorder/express/remake
  preferredDate?: string;  // ISO date for pickup/delivery/fitting/measurement
  timeSlot?: string;       // "10am – 12pm"
  address?: string;
  express?: boolean;
  reference?: string;      // photo / inspiration stand-in
  notes?: string;
  createdAt: string;
  updatedAt: string;
  history: RequestEvent[];
}

export interface ModuleDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  core: boolean;         // core modules can't be removed
}

// ---- Customer <-> owner chat --------------------------------
export interface Message {
  id: ID;
  customerId: ID;          // the thread is per customer
  from: "owner" | "customer";
  text: string;
  at: string;
  read?: boolean;          // read by the other side
}

export interface DB {
  families: Family[];
  customers: Customer[];
  orders: Order[];
  modules: ModuleDef[];
  users: User[];
  activity: ActivityEvent[];
  requests: ServiceRequest[];
  messages: Message[];
  shop: { name: string; owner: string; batch: string; phone: string };
}
