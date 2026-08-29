import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ZodError, type ZodSchema } from "zod";

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
type Handlers = Partial<Record<"GET" | "POST" | "PATCH" | "PUT" | "DELETE", Handler>>;

export function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export const ok = (res: VercelResponse, data: unknown, status = 200) => res.status(status).json(data);
export const fail = (res: VercelResponse, status: number, message: string, extra?: unknown) =>
  res.status(status).json({ error: message, ...(extra ? { details: extra } : {}) });

/** Method router + CORS + centralized error handling for one endpoint. */
export function route(handlers: Handlers) {
  return async (req: VercelRequest, res: VercelResponse) => {
    cors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    const h = handlers[req.method as keyof Handlers];
    if (!h) return fail(res, 405, `Method ${req.method} not allowed`);
    try {
      await h(req, res);
    } catch (e) {
      if (e instanceof ZodError) return fail(res, 422, "Invalid input", e.flatten());
      const code = (e as { code?: string })?.code;
      if (code === "P2002") return fail(res, 409, "A record with that unique value already exists");
      if (code === "P2025") return fail(res, 404, "Record not found");
      console.error(e);
      return fail(res, 500, "Internal error");
    }
  };
}

/** Parse + validate a JSON body (Vercel pre-parses JSON into req.body). */
export function body<T>(req: VercelRequest, schema: ZodSchema<T>): T {
  const raw = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  return schema.parse(raw);
}

export const param = (req: VercelRequest, key: string): string => {
  const v = req.query[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
};
