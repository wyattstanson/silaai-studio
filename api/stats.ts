import { route, ok } from "../lib/http";
import { prisma } from "../lib/prisma";

// Studio/Admin headline figures, computed in the database (not by loading rows).
export default route({
  GET: async (_req, res) => {
    const [customers, families, billedAgg, collected] = await Promise.all([
      prisma.customer.count(),
      prisma.family.count(),
      prisma.order.aggregate({ _sum: { price: true } }),
      prisma.$queryRaw<{ paid: number }[]>`
        SELECT COALESCE(SUM(CASE WHEN kind='REFUND' THEN -amount ELSE amount END),0)::int AS paid FROM "Payment"`,
    ]);
    const billed = billedAgg._sum.price ?? 0;
    const paid = collected[0]?.paid ?? 0;
    ok(res, {
      customers, families,
      billed, collected: paid,
      outstanding: Math.max(billed - paid, 0),
    });
  },
});
