import type { Customer, DB, Order } from "../data/types";
import { paid, balance } from "./format";

/** Trigger a client-side file download (works in a normal browser tab). */
export function download(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Generic array-of-objects to CSV. Column set is stable across rows. */
export function toCSV(rows: Record<string, unknown>[], headers?: string[]): string {
  if (!rows.length) return headers ? headers.join(",") : "";
  const cols = headers ?? Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  return [cols.join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\n");
}

/** One flat row summarising a customer (used for the "export all" table). */
export function customerRow(db: DB, c: Customer) {
  const orders = db.orders.filter(o => o.customerId === c.id);
  const family = db.families.find(f => f.id === c.familyId);
  return {
    customerId: c.id,
    name: c.name,
    family: family?.name ?? "",
    phone: c.phone || family?.phone || "",
    gender: c.gender ?? "",
    orders: orders.length,
    totalBilled: orders.reduce((s, o) => s + o.price, 0),
    collected: orders.reduce((s, o) => s + paid(o), 0),
    outstanding: orders.reduce((s, o) => s + balance(o), 0),
    since: c.createdAt.slice(0, 10),
  };
}

/** Per-order flat rows for a single customer. */
export function orderRows(orders: Order[]) {
  return orders.map(o => ({
    ticket: o.code,
    garment: o.garment,
    kind: o.kind,
    stage: o.stage,
    material: o.material ?? "",
    materialSource: o.materialSource,
    fulfilment: o.fulfilment,
    qty: o.qty,
    placed: o.placedAt.slice(0, 10),
    delivery: o.deliveryDate.slice(0, 10),
    price: o.price,
    paid: paid(o),
    balance: balance(o),
  }));
}

/** Full structured dossier for one customer (JSON export / backup). */
export function customerDossier(db: DB, c: Customer) {
  const family = db.families.find(f => f.id === c.familyId);
  const orders = db.orders.filter(o => o.customerId === c.id);
  const activity = db.activity.filter(a => a.customerId === c.id);
  return {
    exportedAt: new Date().toISOString(),
    shop: db.shop.name,
    customer: { ...c, family: family?.name, familyPhone: family?.phone },
    summary: {
      orders: orders.length,
      totalBilled: orders.reduce((s, o) => s + o.price, 0),
      collected: orders.reduce((s, o) => s + paid(o), 0),
      outstanding: orders.reduce((s, o) => s + balance(o), 0),
    },
    orders: orders.map(o => ({ ...o, paid: paid(o), balance: balance(o) })),
    activity,
  };
}

export const exportCustomerJSON = (db: DB, c: Customer) =>
  download(`${c.id}-${c.name.replace(/\s+/g, "-").toLowerCase()}.json`, JSON.stringify(customerDossier(db, c), null, 2), "application/json");

export const exportCustomerCSV = (db: DB, c: Customer) => {
  const orders = db.orders.filter(o => o.customerId === c.id);
  download(`${c.id}-orders.csv`, toCSV(orderRows(orders)), "text/csv");
};

export const exportAllCustomersCSV = (db: DB) =>
  download(`silai-customers-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(db.customers.map(c => customerRow(db, c))), "text/csv");

export const exportBackupJSON = (db: DB) =>
  download(`silai-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(db, null, 2), "application/json");
