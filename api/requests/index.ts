import { route, ok, fail, body } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requestInput, requestUpdate } from "../../lib/validation";
import { nextCode, reqCode } from "../../lib/codes";

export default route({
  // POST /api/requests — customer raises a request
  POST: async (req, res) => {
    const input = body(req, requestInput);
    const request = await prisma.$transaction(async (tx) => {
      const code = await nextCode(tx, "request", reqCode);
      const r = await tx.request.create({
        data: {
          code,
          customerId: input.customerId,
          familyId: input.familyId,
          type: input.type,
          garment: input.garment,
          orderId: input.orderId,
          preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
          timeSlot: input.timeSlot,
          address: input.address,
          express: input.express ?? false,
          reference: input.reference,
          notes: input.notes,
          history: [{ at: new Date().toISOString(), status: "SUBMITTED" }],
        },
      });
      await tx.activity.create({ data: { type: "CUSTOMER_ADDED", summary: `Requested ${input.type.toLowerCase()}`, familyId: input.familyId, customerId: input.customerId } });
      return r;
    });
    ok(res, request, 201);
  },

  // PATCH /api/requests — advance/schedule/decline  { id, status, note? }
  PATCH: async (req, res) => {
    const { id, status, note } = body(req, requestUpdate);
    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) return fail(res, 404, "Request not found");
    const history = (Array.isArray(existing.history) ? existing.history : []) as unknown[];
    const request = await prisma.request.update({
      where: { id },
      data: { status, history: [...history, { at: new Date().toISOString(), status, note }] as any },
    });
    ok(res, request);
  },
});
