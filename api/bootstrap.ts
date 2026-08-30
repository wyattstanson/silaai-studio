import { route, ok } from "../lib/http";
import { prisma } from "../lib/prisma";

// One call that hydrates the app's in-memory model. Capped for safety; the
// paginated endpoints (/customers, /orders, /activity) are the path for
// datasets larger than a single working set.
const CUSTOMER_CAP = 1000;
const ORDER_CAP = 2000;

export default route({
  GET: async (_req, res) => {
    const [families, customers, orders, activity, requests] = await Promise.all([
      prisma.family.findMany({ orderBy: { name: "asc" } }),
      prisma.customer.findMany({
        take: CUSTOMER_CAP,
        orderBy: { createdAt: "desc" },
        include: { measurements: { orderBy: { takenAt: "desc" } } },
      }),
      prisma.order.findMany({
        take: ORDER_CAP,
        orderBy: { placedAt: "desc" },
        include: { payments: { orderBy: { at: "asc" } } },
      }),
      prisma.activity.findMany({ take: 100, orderBy: { at: "desc" } }),
      prisma.request.findMany({ take: 500, orderBy: { createdAt: "desc" } }),
    ]);
    ok(res, { families, customers, orders, activity, requests });
  },
});
