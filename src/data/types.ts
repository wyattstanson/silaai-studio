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

export interface Measurement {
  id: ID;
  takenAt: string;       // ISO date — used for the 2-month refresh reminder
  garment: string;       // "Blouse", "Kurta", "Suit"
  values: { label: string; value: string }[]; // Chest 38", Waist 32" ...
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
export type OrderStage = "new" | "cutting" | "stitching" | "ready" | "delivered";

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
  deadline: boolean;     // "to be completed first"
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

export interface ModuleDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  core: boolean;         // core modules can't be removed
}

export interface DB {
  families: Family[];
  customers: Customer[];
  orders: Order[];
  modules: ModuleDef[];
  users: User[];
  activity: ActivityEvent[];
  shop: { name: string; owner: string; batch: string; phone: string };
}
