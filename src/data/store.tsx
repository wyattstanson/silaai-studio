import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ActivityEvent, ActivityType, Customer, DB, Family, Measurement, ModuleDef, Order, OrderStage, Payment, User,
} from "./types";
import { seed } from "./seed";

const KEY = "silai.db.v3";
const SESSION_KEY = "silai.session";
const THEME_KEY = "silai.theme";

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      // guard against older shapes
      if (parsed.users && parsed.activity) return parsed;
    }
  } catch { /* fall through to seed */ }
  return seed();
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;
const pad = (n: number) => String(n).padStart(4, "0");
const normPhone = (p: string) => p.replace(/\s+/g, "").replace(/[^\d+]/g, "");

interface Store {
  db: DB;
  user: User | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  resetData: () => void;

  // auth
  login: (phone: string) => User | null;
  signup: (name: string, phone: string) => User;
  logout: () => void;

  // data
  addFamily: (f: Omit<Family, "id" | "createdAt">) => Family;
  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "measurements">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  updateFamily: (id: string, patch: Partial<Family>) => void;
  deleteCustomer: (id: string) => void;
  generateDemoCustomers: (n: number) => void;
  clearDemoCustomers: () => void;
  addMeasurement: (customerId: string, m: Omit<Measurement, "id">) => void;
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

  const api = useMemo<Store>(() => {
    const log = (e: Omit<ActivityEvent, "id" | "at">) =>
      setDb(d => ({ ...d, activity: [{ ...e, id: uid("A"), at: new Date().toISOString() }, ...d.activity] }));
    const actor = () => user?.name ?? "Studio";

    return {
      db, user, theme,
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
        return usr;
      },
      logout: () => setPhone(null),

      addFamily: (f) => {
        const fam: Family = { ...f, id: uid("FAM"), createdAt: new Date().toISOString() };
        setDb(d => ({ ...d, families: [...d.families, fam] }));
        log({ type: "family_added", summary: `Added family ${fam.name}`, familyId: fam.id, actor: actor() });
        return fam;
      },
      addCustomer: (c) => {
        const cus: Customer = { ...c, id: `CUS-${pad(db.customers.length + 1)}`, createdAt: new Date().toISOString(), measurements: [] };
        setDb(d => ({ ...d, customers: [...d.customers, cus] }));
        log({ type: "customer_added", summary: `Added member ${cus.name}`, familyId: cus.familyId, customerId: cus.id, actor: actor() });
        return cus;
      },
      updateCustomer: (id, patch) => {
        const c = db.customers.find(x => x.id === id);
        setDb(d => ({ ...d, customers: d.customers.map(x => x.id === id ? { ...x, ...patch } : x) }));
        if (c) log({ type: "customer_added", summary: `Updated ${patch.name ?? c.name}'s details`, familyId: c.familyId, customerId: id, actor: actor() });
      },
      updateFamily: (id, patch) =>
        setDb(d => ({ ...d, families: d.families.map(x => x.id === id ? { ...x, ...patch } : x) })),
      deleteCustomer: (id) => {
        const c = db.customers.find(x => x.id === id);
        setDb(d => ({
          ...d,
          customers: d.customers.filter(x => x.id !== id),
          orders: d.orders.filter(o => o.customerId !== id),
        }));
        if (c) log({ type: "customer_added", summary: `Removed ${c.name} from records`, familyId: c.familyId, actor: actor() });
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
          const phone = "+91 " + (60000 + (idx % 39999)).toString() + " " + String(10000 + (idx * 13) % 89999);
          if (i % 3 === 0) fams.push({ id: `FAM-D${idx}`, name: `${last} Household`, phone, createdAt: new Date().toISOString() });
          const famId = fams.length ? fams[fams.length - 1].id : `FAM-D${idx}`;
          custs.push({ id: `CUS-D${idx}`, familyId: famId, name: `${first} ${last}`, phone, gender: idx % 2 ? "F" : "M", createdAt: new Date(Date.now() - (idx % 400) * 86400000).toISOString(), measurements: [] });
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
        setDb(d => ({
          ...d,
          customers: d.customers.map(c => c.id === customerId ? { ...c, measurements: [{ ...m, id: uid("M") }, ...c.measurements] } : c),
        }));
        log({ type: "measurement", summary: `New measurement recorded, ${m.garment}`, familyId: c?.familyId, customerId, actor: actor() });
      },

      addOrder: (o) => {
        const n = 42 + db.orders.length + 1;
        const ord: Order = { ...o, id: `ORD-${pad(n)}`, code: `S-${n}`, placedAt: new Date().toISOString(), payments: [] };
        const c = db.customers.find(x => x.id === o.customerId);
        setDb(d => ({ ...d, orders: [ord, ...d.orders] }));
        log({ type: "order_placed", summary: `Placed order for ${ord.garment} (${ord.code})`, familyId: c?.familyId, customerId: o.customerId, orderId: ord.id, actor: actor() });
        return ord;
      },
      updateOrder: (id, patch) => setDb(d => ({ ...d, orders: d.orders.map(o => (o.id === id ? { ...o, ...patch } : o)) })),
      setStage: (id, stage) => {
        const o = db.orders.find(x => x.id === id);
        const c = db.customers.find(x => x.id === o?.customerId);
        setDb(d => ({ ...d, orders: d.orders.map(o => (o.id === id ? { ...o, stage } : o)) }));
        if (o) log({ type: "stage", summary: `${o.garment} advanced to ${stage}`, familyId: c?.familyId, customerId: o.customerId, orderId: id, actor: actor() });
      },
      addPayment: (orderId, p) => {
        const pay: Payment = { ...p, id: uid("P"), at: new Date().toISOString() };
        const o = db.orders.find(x => x.id === orderId);
        const c = db.customers.find(x => x.id === o?.customerId);
        setDb(d => ({ ...d, orders: d.orders.map(o => (o.id === orderId ? { ...o, payments: [...o.payments, pay] } : o)) }));
        if (o) log({ type: "payment", summary: `${p.kind === "advance" ? "Advance" : p.kind === "refund" ? "Refund" : "Balance"}, ${o.garment}`, familyId: c?.familyId, customerId: o.customerId, orderId, amount: p.amount, actor: actor() });
      },

      toggleModule: (id) => setDb(d => ({ ...d, modules: d.modules.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m)) })),
      addModule: (m) => setDb(d => ({ ...d, modules: [...d.modules, { ...m, core: false }] })),
      removeModule: (id) => setDb(d => ({ ...d, modules: d.modules.filter(m => m.id !== id || m.core) })),
    };
  }, [db, user, theme]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
