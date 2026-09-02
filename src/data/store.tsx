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

const KEY = "silai.db.v4";
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

/* Customer IDs: first three letters of the family name + a 3-digit
   sequence within that family, e.g. Sharma Household -> SHA001, SHA002. */
export const CUSTOMER_ID_RE = /^[A-Z]{3}\d{3}$/;
const custPrefix = (familyName: string) =>
  (familyName || "").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
const makeCustomerId = (familyName: string, customers: Customer[]) => {
  const pre = custPrefix(familyName);
  const used = customers.filter(c => c.id.startsWith(pre)).map(c => parseInt(c.id.slice(3), 10)).filter(n => !Number.isNaN(n));
  return pre + String((used.length ? Math.max(...used) : 0) + 1).padStart(3, "0");
};
const warn = (e: unknown) => console.warn("[silai] sync failed:", e);

export type Mode = "connecting" | "online" | "offline";

interface Store {
  db: DB;
  user: User | null;              // unified principal (staff or the signed-in customer)
  activeCustomer: Customer | null; // set when a customer is signed in
  theme: "light" | "dark";
  mode: Mode;
  toggleTheme: () => void;
  resetData: () => void;

  // auth — staff console login vs customer household lookup
  staffLogin: (phone: string) => User | null;
  customersForPhone: (phone: string) => Customer[];
  customerLogin: (customerId: string) => void;
  customerSignup: (name: string, phone: string) => Customer;
  logout: () => void;

  addFamily: (f: Omit<Family, "id" | "createdAt">) => Family;
  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "measurements"> & { id?: string }) => Customer;
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

type Session = { kind: "staff"; phone: string } | { kind: "customer"; customerId: string };
function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    if (raw.startsWith("{")) return JSON.parse(raw) as Session;
    return { kind: "staff", phone: raw }; // migrate old plain-phone sessions
  } catch { return null; }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [session, setSession] = useState<Session | null>(loadSession);
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
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const staff = useMemo(
    () => session?.kind === "staff" ? (db.users.find(u => normPhone(u.phone) === normPhone(session.phone) && u.role === "owner") ?? null) : null,
    [db.users, session]
  );
  const activeCustomer = useMemo(
    () => session?.kind === "customer" ? (db.customers.find(c => c.id === session.customerId) ?? null) : null,
    [db.customers, session]
  );
  const user = useMemo<User | null>(() => {
    if (staff) return staff;
    if (activeCustomer) return { id: activeCustomer.id, phone: activeCustomer.phone ?? "", name: activeCustomer.name, role: "member", familyId: activeCustomer.familyId, createdAt: activeCustomer.createdAt };
    return null;
  }, [staff, activeCustomer]);

  const store = useMemo<Store>(() => {
    const online = mode === "online";
    const R = refs.current;
    const log = (e: Omit<ActivityEvent, "id" | "at">) =>
      setDb(d => ({ ...d, activity: [{ ...e, id: uid("A"), at: new Date().toISOString() }, ...d.activity] }));
    const actor = () => user?.name ?? "Studio";

    return {
      db, user, activeCustomer, theme, mode,
      toggleTheme: () => setTheme(t => (t === "light" ? "dark" : "light")),
      resetData: () => { setDb(seed()); setSession(null); },

      // ---- Staff / owner console login ----
      staffLogin: (p) => {
        const found = db.users.find(u => normPhone(u.phone) === normPhone(p) && u.role === "owner");
        if (!found) return null;
        setSession({ kind: "staff", phone: found.phone });
        setDb(d => ({ ...d, users: d.users.map(u => u.id === found.id ? { ...u, lastLogin: new Date().toISOString() } : u) }));
        log({ type: "login", summary: `${found.name} opened the console`, actor: found.name });
        return found;
      },

      // ---- Customer household lookup + login ----
      // A phone can belong to several family members, each a separate Customer ID.
      customersForPhone: (p) => {
        const n = normPhone(p);
        if (!n) return [];
        return db.customers.filter(c =>
          normPhone(c.phone ?? "") === n ||
          normPhone(db.families.find(f => f.id === c.familyId)?.phone ?? "") === n);
      },
      customerLogin: (customerId) => {
        const c = db.customers.find(x => x.id === customerId);
        if (!c) return;
        setSession({ kind: "customer", customerId });
        log({ type: "login", summary: `${c.name} signed in`, familyId: c.familyId, customerId, actor: c.name });
      },
      customerSignup: (name, p) => {
        // reuse the household's family if the phone is already known, else start one
        const n = normPhone(p);
        const sibling = db.customers.find(c => normPhone(c.phone ?? "") === n);
        const existingFam = db.families.find(f => f.id === sibling?.familyId) ?? db.families.find(f => normPhone(f.phone) === n);
        const fam: Family = existingFam ?? { id: uid("FAM"), name: `${name.split(" ")[0]}'s Household`, phone: p, createdAt: new Date().toISOString() };
        const cus: Customer = { id: makeCustomerId(fam.name, db.customers), familyId: fam.id, name, phone: p, createdAt: new Date().toISOString(), measurements: [] };
        setDb(d => ({
          ...d,
          families: existingFam ? d.families : [...d.families, fam],
          customers: [...d.customers, cus],
          activity: [{ id: uid("A"), at: new Date().toISOString(), type: "signup" as ActivityType, summary: `${name} created a profile`, familyId: fam.id, customerId: cus.id, actor: name }, ...d.activity],
        }));
        setSession({ kind: "customer", customerId: cus.id });
        if (online) {
          const mkCustomer = (familyId: string) => backend.customers.create({ familyId, name, phone: p, gender: cus.gender })
            .then((srv: any) => { R.customer[cus.id] = srv.id; }).catch(warn);
          if (existingFam) mkCustomer(fam.id);
          else backend.families.create({ name: fam.name, phone: fam.phone }).then((srv: any) => mkCustomer(srv.id)).catch(warn);
        }
        return cus;
      },
      logout: () => setSession(null),

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
        const fam = db.families.find(f => f.id === c.familyId);
        const { id: given, ...rest } = c;
        const id = given && CUSTOMER_ID_RE.test(given) && !db.customers.some(x => x.id === given)
          ? given
          : makeCustomerId(fam?.name ?? "", db.customers);
        const cus: Customer = { ...rest, id, createdAt: new Date().toISOString(), measurements: [] };
        setDb(d => ({ ...d, customers: [...d.customers, cus] }));
        log({ type: "customer_added", summary: `Added member ${cus.name}`, familyId: cus.familyId, customerId: cus.id, actor: actor() });
        if (online) backend.customers.create(customerCreate(rest)).then((srv: any) => { R.customer[cus.id] = srv.id; }).catch(warn);
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
  }, [db, user, activeCustomer, theme, mode]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
