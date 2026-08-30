import { route, ok, fail, body, param } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { customerPatch, measurementInput } from "../../lib/validation";

export default route({
  // POST /api/customers/:id — add a measurement to this customer
  POST: async (req, res) => {
    const customerId = param(req, "id");
    const input = body(req, measurementInput);
    const measurement = await prisma.measurement.create({
      data: { customerId, garment: input.garment, values: input.values, note: input.note, takenAt: input.takenAt ? new Date(input.takenAt) : undefined },
    });
    const c = await prisma.customer.findUnique({ where: { id: customerId }, select: { familyId: true } });
    await prisma.activity.create({ data: { type: "MEASUREMENT", summary: `New measurement recorded, ${input.garment}`, familyId: c?.familyId, customerId } });
    ok(res, measurement, 201);
  },

  // GET /api/customers/:id — full record for the admin card
  GET: async (req, res) => {
    const id = param(req, "id");
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        family: true,
        measurements: { orderBy: { takenAt: "desc" } },
        orders: { orderBy: { placedAt: "desc" }, include: { payments: { orderBy: { at: "asc" } } } },
      },
    });
    if (!customer) return fail(res, 404, "Customer not found");
    ok(res, customer);
  },

  // PATCH /api/customers/:id — live edit
  PATCH: async (req, res) => {
    const id = param(req, "id");
    const patch = body(req, customerPatch);
    const customer = await prisma.customer.update({ where: { id }, data: patch });
    await prisma.activity.create({ data: { type: "CUSTOMER_UPDATED", summary: `Updated ${customer.name}'s details`, familyId: customer.familyId, customerId: id } });
    ok(res, customer);
  },

  // DELETE /api/customers/:id — cascades orders, payments, measurements
  DELETE: async (req, res) => {
    const id = param(req, "id");
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return fail(res, 404, "Customer not found");
    await prisma.customer.delete({ where: { id } });
    await prisma.activity.create({ data: { type: "CUSTOMER_REMOVED", summary: `Removed ${customer.name} from records`, familyId: customer.familyId } });
    ok(res, { deleted: id });
  },
});
