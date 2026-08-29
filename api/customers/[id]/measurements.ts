import { route, ok, body, param } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { measurementInput } from "../../../lib/validation";

export default route({
  // POST /api/customers/:id/measurements
  POST: async (req, res) => {
    const customerId = param(req, "id");
    const input = body(req, measurementInput);
    const measurement = await prisma.measurement.create({
      data: {
        customerId,
        garment: input.garment,
        values: input.values,
        note: input.note,
        takenAt: input.takenAt ? new Date(input.takenAt) : undefined,
      },
    });
    const c = await prisma.customer.findUnique({ where: { id: customerId }, select: { familyId: true } });
    await prisma.activity.create({ data: { type: "MEASUREMENT", summary: `New measurement recorded, ${input.garment}`, familyId: c?.familyId, customerId } });
    ok(res, measurement, 201);
  },
});
