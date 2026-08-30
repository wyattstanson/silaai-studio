// ============================================================
// Silai — typed client for the serverless API (/api/*).
// Same-origin on Vercel; set VITE_API_URL for a split deploy.
// The app still runs fully offline on localStorage when no API
// is reachable — see `apiEnabled()`.
// ============================================================

const BASE = ((import.meta as any).env?.VITE_API_URL ?? "").replace(/\/$/, "");
export const apiEnabled = () => Boolean((import.meta as any).env?.VITE_API_URL) || true; // same-origin /api on Vercel

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new ApiError(r.status, data?.error ?? r.statusText, data?.details);
  return data as T;
}

const qs = (params: Record<string, string | number | boolean | undefined>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");

// ---- Response shapes (server uses UPPERCASE enums + cuid ids) ----
export interface Page<T> { items: T[]; total: number; limit: number; offset: number; nextOffset: number | null; }
export interface Cursor<T> { items: T[]; nextCursor: string | null; }
export interface CustomerRow {
  id: string; code: string; name: string; phone: string | null; gender: string | null; createdAt: string;
  familyId: string; familyName: string; familyPhone: string;
  orders: number; billed: number; collected: number; outstanding: number;
}

export const api = {
  health: () => req<{ ok: boolean; db: boolean; time: string }>("/health"),
  bootstrap: () => req<{ families: any[]; customers: any[]; orders: any[]; activity: any[]; requests: any[] }>("/bootstrap"),

  login: (phone: string) => req<{ user: any }>("/auth", { method: "POST", body: JSON.stringify({ action: "login", phone }) }),
  signup: (name: string, phone: string) => req<{ user: any }>("/auth", { method: "POST", body: JSON.stringify({ action: "signup", name, phone }) }),

  customers: {
    list: (p: { q?: string; sort?: string; limit?: number; offset?: number } = {}) => req<Page<CustomerRow>>(`/customers?${qs(p)}`),
    get: (id: string) => req<any>(`/customers/${id}`),
    create: (data: unknown) => req<any>("/customers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, patch: unknown) => req<any>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => req<{ deleted: string }>(`/customers/${id}`, { method: "DELETE" }),
    addMeasurement: (id: string, m: unknown) => req<any>(`/customers/${id}`, { method: "POST", body: JSON.stringify(m) }),
  },

  requests: {
    create: (data: unknown) => req<any>("/requests", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, status: string, note?: string) => req<any>("/requests", { method: "PATCH", body: JSON.stringify({ id, status, note }) }),
  },

  orders: {
    list: (p: { stage?: string; customerId?: string; deadline?: boolean; q?: string; limit?: number; offset?: number } = {}) => req<Page<any>>(`/orders?${qs(p)}`),
    get: (id: string) => req<any>(`/orders/${id}`),
    create: (data: unknown) => req<any>("/orders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, patch: unknown) => req<any>(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => req<{ deleted: string }>(`/orders/${id}`, { method: "DELETE" }),
    setStage: (id: string, stage: string) => req<any>(`/orders/${id}/action`, { method: "POST", body: JSON.stringify({ action: "stage", stage }) }),
    addPayment: (id: string, p: unknown) => req<any>(`/orders/${id}/action`, { method: "POST", body: JSON.stringify({ action: "payment", ...(p as Record<string, unknown>) }) }),
  },

  families: {
    list: (p: { q?: string; limit?: number; offset?: number } = {}) => req<Page<any>>(`/families?${qs(p)}`),
    create: (data: unknown) => req<any>("/families", { method: "POST", body: JSON.stringify(data) }),
  },

  activity: {
    list: (p: { familyId?: string; customerId?: string; limit?: number; cursor?: string } = {}) => req<Cursor<any>>(`/activity?${qs(p)}`),
  },
};
