import { route, ok, fail, body, param } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { paymentInput } from "../../../lib/validation";

export default route({
  // POST /api/orders/:id/payment  { kind, amount, method, note? }
  POST: async (req, res) => {
    const orderId = param(req, "id");
    const input = body(req, paymentInput);
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: { select: { familyId: true } } } });
    if (!order) return fail(res, 404, "Order not found");

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({ data: { orderId, ...input } });
      const label = input.kind === "ADVANCE" ? "Advance" : input.kind === "REFUND" ? "Refund" : "Balance";
      await tx.activity.create({ data: { type: "PAYMENT", summary: `${label}, ${order.garment}`, familyId: order.customer.familyId, customerId: order.customerId, orderId, amount: input.amount } });
      return p;
    });
    ok(res, payment, 201);
  },
});
