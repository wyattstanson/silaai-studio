import { route, ok, body, param } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { stageInput } from "../../../lib/validation";

export default route({
  // POST /api/orders/:id/stage  { stage }
  POST: async (req, res) => {
    const id = param(req, "id");
    const { stage } = body(req, stageInput);
    const order = await prisma.order.update({
      where: { id }, data: { stage },
      include: { customer: { select: { familyId: true } } },
    });
    await prisma.activity.create({ data: { type: "STAGE", summary: `${order.garment} advanced to ${stage.toLowerCase()}`, familyId: order.customer.familyId, customerId: order.customerId, orderId: id } });
    ok(res, order);
  },
});
