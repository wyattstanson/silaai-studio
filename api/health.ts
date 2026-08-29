import { route, ok } from "../lib/http";
import { prisma } from "../lib/prisma";

export default route({
  GET: async (_req, res) => {
    let db = false;
    try { await prisma.$queryRaw`SELECT 1`; db = true; } catch { /* db unreachable */ }
    ok(res, { ok: true, db, time: new Date().toISOString() });
  },
});
