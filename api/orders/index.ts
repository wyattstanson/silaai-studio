import type { Prisma } from "@prisma/client";
import { route, ok, body, param } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { orderInput } from "../../lib/validation";
import { nextCode, orderCode } from "../../lib/codes";

export default route({
  // GET /api/orders?stage=&customerId=&deadline=true&q=&limit=&offset=
  GET: async (req, res) => {
    const limit = Math.min(Math.max(Number(param(req, "limit")) || 50, 1), 200);
    const offset = Math.max(Number(param(req, "offset")) || 0, 0);
    const q = param(req, "q").trim();

    const where: Prisma.OrderWhereInput = {};
    const stage = param(req, "stage");
    if (stage) where.stage = stage as Prisma.OrderWhereInput["stage"];
    const customerId = param(req, "customerId");
    if (customerId) where.customerId = customerId;
    if (param(req, "deadline") === "true") where.deadline = true;
    if (q) where.OR = [
      { garment: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
    ];

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where, take: limit, skip: offset,
        orderBy: [{ deadline: "desc" }, { deliveryDate: "asc" }],
        include: { customer: { select: { id: true, code: true, name: true } }, payments: { orderBy: { at: "asc" } } },
      }),
      prisma.order.count({ where }),
    ]);
    ok(res, { items, total, limit, offset, nextOffset: offset + limit < total ? offset + limit : null });
  },

  // POST /api/orders
  POST: async (req, res) => {
    const input = body(req, orderInput);
    const order = await prisma.$transaction(async (tx) => {
      const code = await nextCode(tx, "order", orderCode);
      const o = await tx.order.create({ data: { ...input, code, deliveryDate: new Date(input.deliveryDate) } });
      const c = await tx.customer.findUnique({ where: { id: o.customerId }, select: { familyId: true } });
      await tx.activity.create({ data: { type: "ORDER_PLACED", summary: `Placed order for ${o.garment} (${o.code})`, familyId: c?.familyId, customerId: o.customerId, orderId: o.id } });
      return o;
    });
    ok(res, order, 201);
  },
});
