import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  ActivityEvent, ActivityType, Customer, DB, Family, Measurement, ModuleDef, Order, OrderStage, Payment,
  RequestStatus, ServiceRequest, User,
} from "./types";
import { seed } from "./seed";
import { api as backend } from "./api";
import {
  bootstrapDb, customerCreate, customerPatch, orderCreate, orderPatch,
  paymentCreate, measurementCreate, requestCreate, stageUp, type Refs,
} from "./remote";

const KEY = "silai.db.v3";
const SESSION_KEY = "silai.session";
const THEME_KEY = "silai.theme";

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.users && parsed.activity) {
        parsed.requests = parsed.requests ?? []; // migrate older caches
        return parsed;
      }
    }
  } catch { /* fall through to seed */ }
  return seed();
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;
const pad = (n: number) => String(n).padStart(4, "0");
const normPhone = (p: string) => p.replace(/\s+/g, "").replace(/[^\d+]/g, "");
const warn = (e: unknown) => console.warn("[silai] sync failed:", e);

export type Mode = "connecting" | "online" | "offline";

interface Store {
  db: DB;
  user: User | null;
  theme: "light" | "dark";
  mode: Mode;
  toggleTheme: () => void;
  resetData: () => void;

  login: (phone: string) => User | null;
  signup: (name: string, phone: string) => User;
  logout: () => void;

  addFamily: (f: Omit<Family, "id" | "createdAt">) => Family;
  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "measurements">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  updateFamily: (id: string, patch: Partial<Family>) => void;
  deleteCustomer: (id: string) => void;
  generateDemoCustomers: (n: number) => void;
  clearDemoCustomers: () => void;
  addMeasurement: (customerId: string, m: Omit<Measurement, "id" | "version">) => void;
  addRequest: (r: Omit<ServiceRequest, "id" | "code" | "status" | "createdAt" | "updatedAt" | "history">) => ServiceRequest;
  setRequestStatus: (id: string, status: RequestStatus, note?: string) => void;
  addOrder: (o: Omit<Order, "id" | "code" | "payments" | "placedAt">) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  setStage: (id: string, stage: OrderStage) => void;
  addPayment: (orderId: string, p: Omit<Payment, "id" | "at">) => void;

  toggleModule: (id: string) => void;
  addModule: (m: Omit<ModuleDef, "core">) => void;
  removeModule: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [phone, setPhone] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light"
  );
  const [mode, setMode] = useState<Mode>("connecting");
  const refs = useRef<Refs>({ customer: {}, order: {}, request: {} });

  // Try the API once on mount. If a database is reachable, hydrate from it and
  // switch to online (writes mirror to the server). Otherwise stay offline on
  // localStorage — the app is fully functional either way.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const health = await backend.health();
        if (!alive) return;
        if (!health.db) { setMode("offline"); return; }
        const { db: remote, refs: r } = await bootstrapDb();
        if (!alive) return;
        refs.current = r;
        setDb(remote);
        setMode("online");
      } catch {
        if (alive) setMode("offline");
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)); }, [db]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  useEffect(() => {
    if (phone) localStorage.setItem(SESSION_KEY, phone);
    else localStorage.removeItem(SESSION_KEY);
  }, [phone]);

  const user = useMemo(() => db.users.find(u => normPhone(u.phone) === normPhone(phone ?? "")) ?? null, [db.users, phone]);

  const store = useMemo<Store>(() => {
    const online = mode === "online";
    const R = refs.current;
    const log = (e: Omit<ActivityEvent, "id" | "at">) =>
      setDb(d => ({ ...d, activity: [{ ...e, id: uid("A"), at: new Date().toISOString() }, ...d.activity] }));
    const actor = () => user?.name ?? "Studio";

    return {
      db, user, theme, mode,
      toggleTheme: () => setTheme(t => (t === "light" ? "dark" : "light")),
      resetData: () => { setDb(seed()); setPhone(null); },

      login: (p) => {
        const found = db.users.find(u => normPhone(u.phone) === normPhone(p));
        if (!found) return null;
        setPhone(found.phone);
        setDb(d => ({ ...d, users: d.users.map(u => u.id === found.id ? { ...u, lastLogin: new Date().toISOString() } : u) }));
        log({ type: "login", summary: `${found.name} signed in`, familyId: found.familyId, actor: found.name });
        return found;
      },
      signup: (name, p) => {
        const existing = db.users.find(u => normPhone(u.phone) === normPhone(p));
        if (existing) { setPhone(existing.phone); return existing; }
        const fam: Family = { id: uid("FAM"), name: `${name.split(" ")[0]}'s Household`, phone: p, createdAt: new Date().toISOString() };
        const cus: Customer = { id: `CUS-${pad(db.customers.length + 1)}`, familyId: fam.id, name, phone: p, createdAt: new Date().toISOString(), measurements: [] };
        const usr: User = { id: uid("USR"), phone: p, name, role: "member", familyId: fam.id, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() };
        setDb(d => ({
          ...d,
          families: [...d.families, fam],
          customers: [...d.customers, cus],
          users: [...d.users, usr],
          activity: [{ id: uid("A"), at: new Date().toISOString(), type: "signup" as ActivityType, summary: `${name} created an account`, familyId: fam.id, customerId: cus.id, actor: name }, ...d.activity],
        }));
        setPhone(p);
        if (online) backend.signup(name, p).then((res: any) => {
          if (res?.customer?.id) R.customer[cus.id] = res.customer.id;
          if (res?.family?.id) setDb(d => ({ ...d, families: d.families.map(f => f.id === fam.id ? { ...f, id: res.family.id } : f) }));
        }).catch(warn);
        return usr;
      },
      logout: () => setPhone(null),

      addFamily: (f) => {
        const fam: Family = { ...f, id: uid("FAM"), createdAt: new Date().toISOString() };
        setDb(d => ({ ...d, families: [...d.families, fam] }));
        log({ type: "family_added", summary: `Added family ${fam.name}`, familyId: fam.id, actor: actor() });
        if (online) backend.families.create({ name: fam.name, phone: fam.phone, note: fam.note })
          .then((srv: any) => setDb(d => ({ ...d, families: d.families.map(x => x.id === fam.id ? { ...x, id: srv.id } : x) })))
          .catch(warn);
        return fam;
      },
      addCustomer: (c) => {
        const cus: Customer = { ...c, id: `CUS-${pad(db.customers.length + 1)}`, createdAt: new Date().toISOString(), measurements: [] };
        setDb(d => ({ ...d, customers: [...d.customers, cus] }));
        log({ type: "customer_added", summary: `Added member ${cus.name}`, familyId: cus.familyId, customerId: cus.id, actor: actor() });
        if (online) backend.customers.create(customerCreate(c)).then((srv: any) => { R.customer[cus.id] = srv.id; }).catch(warn);
        return cus;
      },
      updateCustomer: (id, patch) => {
        const c = db.customers.find(x => x.id === id);
        setDb(d => ({ ...d, customers: d.customers.map(x => x.id === id ? { ...x, ...patch } : x) }));
        if (c) log({ type: "customer_added", summary: `Updated ${patch.name ?? c.name}'s details`, familyId: c.familyId, customerId: id, actor: actor() });
        if (online && R.customer[id]) backend.customers.update(R.customer[id], customerPatch(patch)).catch(warn);
      },
      updateFamily: (id, patch) =>
        setDb(d => ({ ...d, families: d.families.map(x => x.id === id ? { ...x, ...patch } : x) })),
      deleteCustomer: (id) => {
        const c = db.customers.find(x => x.id === id);
        setDb(d => ({ ...d, customers: d.customers.filter(x => x.id !== id), orders: d.orders.filter(o => o.customerId !== id) }));
        if (c) log({ type: "customer_added", summary: `Removed ${c.name} from records`, familyId: c.familyId, actor: actor() });
        if (online && R.customer[id]) { backend.customers.remove(R.customer[id]).catch(warn); delete R.customer[id]; }
      },
      generateDemoCustomers: (n) => setDb(d => {
        const firsts = ["Aarav", "Vivaan", "Diya", "Anaya", "Kabir", "Myra", "Reyansh", "Aisha", "Ishaan", "Sara", "Arjun", "Kiara", "Vihaan", "Riya", "Advait", "Zara", "Rohan", "Tara", "Neha", "Aditya"];
        const lasts = ["Sharma", "Verma", "Iyer", "Khan", "Mehta", "Nair", "Reddy", "Gupta", "Bose", "Rao", "Malhotra", "Chopra", "Das", "Menon", "Shah"];
        const startIdx = d.customers.filter(c => c.id.startsWith("CUS-D")).length;
        const fams: Family[] = [];
        const custs: Customer[] = [];
        for (let i = 0; i < n; i++) {
          const idx = startIdx + i;
          const last = lasts[idx % lasts.length];
          const first = firsts[(idx * 7) % firsts.length];
          const ph = "+91 " + (60000 + (idx % 39999)).toString() + " " + String(10000 + (idx * 13) % 89999);
          if (i % 3 === 0) fams.push({ id: `FAM-D${idx}`, name: `${last} Household`, phone: ph, createdAt: new Date().toISOString() });
          const famId = fams.length ? fams[fams.length - 1].id : `FAM-D${idx}`;
          custs.push({ id: `CUS-D${idx}`, familyId: famId, name: `${first} ${last}`, phone: ph, gender: idx % 2 ? "F" : "M", createdAt: new Date(Date.now() - (idx % 400) * 86400000).toISOString(), measurements: [] });
        }
        return { ...d, families: [...d.families, ...fams], customers: [...d.customers, ...custs] };
      }),
      clearDemoCustomers: () => setDb(d => ({
        ...d,
        customers: d.customers.filter(c => !c.id.startsWith("CUS-D")),
        families: d.families.filter(f => !f.id.startsWith("FAM-D")),
        orders: d.orders.filter(o => !o.customerId.startsWith("CUS-D")),
      })),
      addMeasurement: (customerId, m) => {
        const c = db.customers.find(x => x.id === customerId);
        const prev = (c?.measurements ?? []).filter(x => x.garment.toLowerCase() === m.garment.toLowerCase());
        const version = prev.reduce((mx, x) => Math.max(mx, x.version ?? 1), 0) + 1;
        setDb(d => ({ ...d, customers: d.customers.map(c => c.id === customerId ? { ...c, measurements: [{ ...m, id: uid("M"), version }, ...c.measurements] } : c) }));
        log({ type: "measurement", summary: `Recorded ${m.garment} measurement v${version}`, familyId: c?.familyId, customerId, actor: actor() });
        if (online && R.customer[customerId]) backend.customers.addMeasurement(R.customer[customerId], measurementCreate(m)).catch(warn);
      },

      addRequest: (r) => {
        const now = new Date().toISOString();
        const req: ServiceRequest = { ...r, id: uid("REQ"), code: `REQ-${pad(db.requests.length + 1)}`, status: "submitted", createdAt: now, updatedAt: now, history: [{ at: now, status: "submitted" }] };
        setDb(d => ({ ...d, requests: [req, ...d.requests] }));
        log({ type: "customer_added", summary: `Requested ${r.type.replace(/_/g, " ")}`, familyId: r.familyId, customerId: r.customerId, actor: actor() });
        if (online && R.customer[r.customerId]) {
          backend.requests.create({ ...requestCreate(r), customerId: R.customer[r.customerId], orderId: r.orderId ? (R.order[r.orderId] ?? r.orderId) : undefined })
            .then((srv: any) => { R.request[req.id] = srv.id; }).catch(warn);
        }
        return req;
      },
      setRequestStatus: (id, status, note) => {
        const now = new Date().toISOString();
        const rq = db.requests.find(x => x.id === id);
        setDb(d => ({ ...d, requests: d.requests.map(x => x.id === id ? { ...x, status, updatedAt: now, history: [...x.history, { at: now, status, note }] } : x) }));
        if (rq) log({ type: "customer_added", summary: `Request ${rq.code} ${status.replace(/_/g, " ")}`, familyId: rq.familyId, customerId: rq.customerId, actor: actor() });
        if (online && R.request[id]) backend.requests.update(R.request[id], stageUp(status), note).catch(warn);
      },

      addOrder: (o) => {
        const n = 42 + db.orders.length + 1;
        const c = db.customers.find(x => x.id === o.customerId);
        // lock a snapshot of the customer's latest measurements for this order
        let snapshot = o.measurementSnapshot;
        if (!snapshot && c) {
          const match = c.measurements.find(x => x.garment.toLowerCase() === o.garment.toLowerCase()) ?? c.measurements[0];
          if (match) snapshot = { garment: match.garment, version: match.version, values: match.values };
        }
        const ord: Order = { ...o, measurementSnapshot: snapshot, id: `ORD-${pad(n)}`, code: `S-${n}`, placedAt: new Date().toISOString(), payments: [] };
        setDb(d => ({ ...d, orders: [ord, ...d.orders] }));
        log({ type: "order_placed", summary: `Placed order for ${ord.garment} (${ord.code})`, familyId: c?.familyId, customerId: o.customerId, orderId: ord.id, actor: actor() });
        if (online && R.customer[o.customerId]) {
          backend.orders.create({ ...orderCreate(o), customerId: R.customer[o.customerId] })
            .then((srv: any) => { R.order[ord.id] = srv.id; }).catch(warn);
        }
        return ord;
      },
      updateOrder: (id, patch) => {
        setDb(d => ({ ...d, orders: d.orders.map(o => (o.id === id ? { ...o, ...patch } : o)) }));
        if (online && R.order[id]) backend.orders.update(R.order[id], orderPatch(patch)).catch(warn);
      },
      setStage: (id, stage) => {
        const o = db.orders.find(x => x.id === id);
        const c = db.customers.find(x => x.id === o?.customerId);
        setDb(d => ({ ...d, orders: d.orders.map(o => (o.id === id ? { ...o, stage } : o)) }));
        if (o) log({ type: "stage", summary: `${o.garment} advanced to ${stage}`, familyId: c?.familyId, customerId: o.customerId, orderId: id, actor: actor() });
        if (online && R.order[id]) backend.orders.setStage(R.order[id], stageUp(stage)).catch(warn);
      },
      addPayment: (orderId, p) => {
        const pay: Payment = { ...p, id: uid("P"), at: new Date().toISOString() };
        const o = db.orders.find(x => x.id === orderId);
        const c = db.customers.find(x => x.id === o?.customerId);
        setDb(d => ({ ...d, orders: d.orders.map(o => (o.id === orderId ? { ...o, payments: [...o.payments, pay] } : o)) }));
        if (o) log({ type: "payment", summary: `${p.kind === "advance" ? "Advance" : p.kind === "refund" ? "Refund" : "Balance"}, ${o.garment}`, familyId: c?.familyId, customerId: o.customerId, orderId, amount: p.amount, actor: actor() });
        if (online && R.order[orderId]) backend.orders.addPayment(R.order[orderId], paymentCreate(p)).catch(warn);
      },

      toggleModule: (id) => setDb(d => ({ ...d, modules: d.modules.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m)) })),
      addModule: (m) => setDb(d => ({ ...d, modules: [...d.modules, { ...m, core: false }] })),
      removeModule: (id) => setDb(d => ({ ...d, modules: d.modules.filter(m => m.id !== id || m.core) })),
    };
  }, [db, user, theme, mode]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
