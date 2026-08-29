import { route, ok, fail, body, param } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { stageInput, paymentInput } from "../../../lib/validation";

// One function for the two order mutations, to stay under the Hobby-plan
// function limit. POST { action: "stage" | "payment", ...fields }
export default route({
  POST: async (req, res) => {
    const orderId = param(req, "id");
    const action = String((req.body as { action?: string })?.action ?? "");

    if (action === "stage") {
      const { stage } = body(req, stageInput);
      const order = await prisma.order.update({
        where: { id: orderId }, data: { stage },
        include: { customer: { select: { familyId: true } } },
      });
      await prisma.activity.create({ data: { type: "STAGE", summary: `${order.garment} advanced to ${stage.toLowerCase()}`, familyId: order.customer.familyId, customerId: order.customerId, orderId } });
      return ok(res, order);
    }

    if (action === "payment") {
      const input = body(req, paymentInput);
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: { select: { familyId: true } } } });
      if (!order) return fail(res, 404, "Order not found");
      const payment = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.create({ data: { orderId, ...input } });
        const label = input.kind === "ADVANCE" ? "Advance" : input.kind === "REFUND" ? "Refund" : "Balance";
        await tx.activity.create({ data: { type: "PAYMENT", summary: `${label}, ${order.garment}`, familyId: order.customer.familyId, customerId: order.customerId, orderId, amount: input.amount } });
        return p;
      });
      return ok(res, payment, 201);
    }

    return fail(res, 400, "action must be 'stage' or 'payment'");
  },
});
