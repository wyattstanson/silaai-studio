import type { Prisma } from "@prisma/client";
import { route, ok, param } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export default route({
  // GET /api/activity?familyId=&customerId=&limit=&cursor=
  // Keyset pagination on id (created order) — scales past OFFSET.
  GET: async (req, res) => {
    const limit = Math.min(Math.max(Number(param(req, "limit")) || 30, 1), 100);
    const cursor = param(req, "cursor");
    const where: Prisma.ActivityWhereInput = {};
    const familyId = param(req, "familyId");
    if (familyId) where.familyId = familyId;
    const customerId = param(req, "customerId");
    if (customerId) where.customerId = customerId;

    const items = await prisma.activity.findMany({
      where, orderBy: { at: "desc" }, take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    ok(res, { items: page, nextCursor: hasMore ? page[page.length - 1].id : null });
  },
});
