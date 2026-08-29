import { route, ok, body, param } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { familyInput } from "../../lib/validation";

export default route({
  // GET /api/families?q=&limit=&offset=
  GET: async (req, res) => {
    const q = param(req, "q").trim();
    const limit = Math.min(Math.max(Number(param(req, "limit")) || 50, 1), 200);
    const offset = Math.max(Number(param(req, "offset")) || 0, 0);
    const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] } : {};
    const [items, total] = await Promise.all([
      prisma.family.findMany({ where, take: limit, skip: offset, orderBy: { name: "asc" }, include: { _count: { select: { customers: true } } } }),
      prisma.family.count({ where }),
    ]);
    ok(res, { items, total, limit, offset });
  },

  POST: async (req, res) => {
    const input = body(req, familyInput);
    const family = await prisma.family.create({ data: input });
    await prisma.activity.create({ data: { type: "FAMILY_ADDED", summary: `Added family ${family.name}`, familyId: family.id } });
    ok(res, family, 201);
  },
});
