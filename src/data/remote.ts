// ============================================================
// Silai — translation between the API (UPPERCASE enums, cuid ids)
// and the app's in-memory model (lowercase enums, human ids).
// In online mode the customer/order *id* is its human code
// (CUS-0001 / S-42); a code→cuid ref map lets the store address
// the API. Nothing in the UI has to change.
// ============================================================
import { api } from "./api";
import type {
  ActivityEvent, ActivityType, Customer, DB, Family, Fulfilment, MaterialSource, Measurement,
  Order, OrderKind, OrderStage, Payment,
} from "./types";
import { seed } from "./seed";

const low = (s: string) => s.toLowerCase();
const up = (s: string) => s.toUpperCase();

const KIND = (s: string) => low(s) as OrderKind;
const STAGE = (s: string) => low(s) as OrderStage;
const SOURCE = (s: string) => low(s) as MaterialSource;
const FULFIL = (s: string) => low(s) as Fulfilment;

const ACT: Record<string, ActivityType> = {
  SIGNUP: "signup", LOGIN: "login", ORDER_PLACED: "order_placed", STAGE: "stage",
  PAYMENT: "payment", MEASUREMENT: "measurement", CUSTOMER_ADDED: "customer_added",
  FAMILY_ADDED: "family_added", CUSTOMER_UPDATED: "customer_added", CUSTOMER_REMOVED: "customer_added",
};

export interface Refs { customer: Record<string, string>; order: Record<string, string> }

function mapMeasurement(m: any): Measurement {
  return { id: m.id, takenAt: m.takenAt, garment: m.garment, values: Array.isArray(m.values) ? m.values : [], note: m.note ?? undefined };
}
function mapPayment(p: any): Payment {
  return { id: p.id, at: p.at, kind: low(p.kind) as Payment["kind"], amount: p.amount, method: low(p.method) as Payment["method"], note: p.note ?? undefined };
}

/** Fetch the whole working set and shape it into the app's DB. */
export async function bootstrapDb(): Promise<{ db: DB; refs: Refs }> {
  const [{ families, customers, orders, activity }, base] = await Promise.all([api.bootstrap(), Promise.resolve(seed())]);

  const codeByCuid: Record<string, string> = {};       // customer cuid -> code
  const orderCodeByCuid: Record<string, string> = {};
  const refs: Refs = { customer: {}, order: {} };

  const outCustomers: Customer[] = customers.map((c: any) => {
    codeByCuid[c.id] = c.code;
    refs.customer[c.code] = c.id;
    return {
      id: c.code, familyId: c.familyId, name: c.name,
      phone: c.phone ?? undefined, gender: (c.gender ?? undefined) as Customer["gender"],
      createdAt: c.createdAt, measurements: (c.measurements ?? []).map(mapMeasurement),
    };
  });

  const outOrders: Order[] = orders.map((o: any) => {
    orderCodeByCuid[o.id] = o.code;
    refs.order[o.code] = o.id;
    return {
      id: o.code, code: o.code, customerId: codeByCuid[o.customerId] ?? o.customerId,
      kind: KIND(o.kind), garment: o.garment, materialSource: SOURCE(o.materialSource), fulfilment: FULFIL(o.fulfilment),
      design: o.design ?? undefined, material: o.material ?? undefined, samplePhoto: o.samplePhoto ?? undefined,
      qty: o.qty, stage: STAGE(o.stage), deadline: o.deadline, placedAt: o.placedAt, deliveryDate: o.deliveryDate,
      price: o.price, remarks: o.remarks ?? undefined, payments: (o.payments ?? []).map(mapPayment),
    };
  });

  const outFamilies: Family[] = families.map((f: any) => ({ id: f.id, name: f.name, phone: f.phone, note: f.note ?? undefined, createdAt: f.createdAt }));

  const outActivity: ActivityEvent[] = activity.map((a: any): ActivityEvent => ({
    id: a.id, at: a.at, type: ACT[a.type] ?? "login", summary: a.summary,
    familyId: a.familyId ?? undefined,
    customerId: a.customerId ? (codeByCuid[a.customerId] ?? a.customerId) : undefined,
    orderId: a.orderId ? (orderCodeByCuid[a.orderId] ?? a.orderId) : undefined,
    amount: a.amount ?? undefined, actor: a.actor ?? undefined,
  }));

  const db: DB = {
    ...base, // keeps modules + shop + seeded demo users so logins resolve
    families: outFamilies, customers: outCustomers, orders: outOrders, activity: outActivity,
  };
  return { db, refs };
}

// ---- app -> API payload builders (lowercase -> UPPERCASE) ----
export const customerCreate = (c: Omit<Customer, "id" | "createdAt" | "measurements">) =>
  ({ familyId: c.familyId, name: c.name, phone: c.phone, gender: c.gender });
export const customerPatch = (p: Partial<Customer>) =>
  ({ ...(p.name !== undefined ? { name: p.name } : {}), ...(p.phone !== undefined ? { phone: p.phone } : {}), ...(p.gender !== undefined ? { gender: p.gender } : {}) });

export const orderCreate = (o: Omit<Order, "id" | "code" | "payments" | "placedAt">) => ({
  customerId: o.customerId, kind: up(o.kind), garment: o.garment,
  materialSource: up(o.materialSource), fulfilment: up(o.fulfilment),
  design: o.design, material: o.material, samplePhoto: o.samplePhoto,
  qty: o.qty, deadline: o.deadline, deliveryDate: o.deliveryDate, price: o.price, remarks: o.remarks,
});
export const orderPatch = (p: Partial<Order>) => ({
  ...(p.deadline !== undefined ? { deadline: p.deadline } : {}),
  ...(p.stage !== undefined ? { stage: up(p.stage) } : {}),
  ...(p.remarks !== undefined ? { remarks: p.remarks } : {}),
});
export const paymentCreate = (p: Omit<Payment, "id" | "at">) => ({ kind: up(p.kind), amount: p.amount, method: up(p.method), note: p.note });
export const measurementCreate = (m: Omit<Measurement, "id">) => ({ garment: m.garment, values: m.values, note: m.note, takenAt: m.takenAt });
export const stageUp = up;
