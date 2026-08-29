import { route, ok, fail, body, param } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { orderPatch } from "../../lib/validation";

export default route({
  GET: async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: param(req, "id") },
      include: { customer: { include: { family: true } }, payments: { orderBy: { at: "asc" } } },
    });
    if (!order) return fail(res, 404, "Order not found");
    ok(res, order);
  },

  PATCH: async (req, res) => {
    const id = param(req, "id");
    const patch = body(req, orderPatch);
    const data = { ...patch, ...(patch.deliveryDate ? { deliveryDate: new Date(patch.deliveryDate) } : {}) };
    const order = await prisma.order.update({ where: { id }, data });
    ok(res, order);
  },

  DELETE: async (req, res) => {
    await prisma.order.delete({ where: { id: param(req, "id") } });
    ok(res, { deleted: param(req, "id") });
  },
});
