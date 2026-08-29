import { Prisma } from "@prisma/client";
import { route, ok, body, param } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { customerInput } from "../../lib/validation";
import { nextCode, custCode } from "../../lib/codes";

// Whitelisted sort clauses — never interpolate user input into SQL.
const SORT: Record<string, Prisma.Sql> = {
  outstanding: Prisma.sql`outstanding DESC, c.name ASC`,
  billed: Prisma.sql`billed DESC, c.name ASC`,
  orders: Prisma.sql`orders DESC, c.name ASC`,
  name: Prisma.sql`c.name ASC`,
  recent: Prisma.sql`c."createdAt" DESC`,
};

export default route({
  // GET /api/customers?q=&sort=outstanding&limit=50&offset=0
  GET: async (req, res) => {
    const q = param(req, "q").trim();
    const sort = SORT[param(req, "sort")] ?? SORT.outstanding;
    const limit = Math.min(Math.max(Number(param(req, "limit")) || 50, 1), 200);
    const offset = Math.max(Number(param(req, "offset")) || 0, 0);
    const like = `%${q}%`;
    const where = q
      ? Prisma.sql`WHERE (c.name ILIKE ${like} OR c.phone ILIKE ${like} OR f.name ILIKE ${like} OR c.code ILIKE ${like})`
      : Prisma.empty;

    // Aggregate orders/payments per customer once, then join — no fan-out double counting.
    const rowsSql = Prisma.sql`
      WITH ord AS (
        SELECT "customerId", COUNT(*)::int AS orders, COALESCE(SUM(price),0)::int AS billed
        FROM "Order" GROUP BY "customerId"
      ), pay AS (
        SELECT o."customerId",
          COALESCE(SUM(CASE WHEN p.kind='REFUND' THEN -p.amount ELSE p.amount END),0)::int AS paid
        FROM "Payment" p JOIN "Order" o ON o.id = p."orderId" GROUP BY o."customerId"
      )
      SELECT c.id, c.code, c.name, c.phone, c.gender, c."createdAt",
             f.id AS "familyId", f.name AS "familyName", f.phone AS "familyPhone",
             COALESCE(ord.orders,0) AS orders,
             COALESCE(ord.billed,0) AS billed,
             COALESCE(pay.paid,0) AS collected,
             GREATEST(COALESCE(ord.billed,0) - COALESCE(pay.paid,0), 0) AS outstanding
      FROM "Customer" c
      JOIN "Family" f ON f.id = c."familyId"
      LEFT JOIN ord ON ord."customerId" = c.id
      LEFT JOIN pay ON pay."customerId" = c.id
      ${where}
      ORDER BY ${sort}
      LIMIT ${limit} OFFSET ${offset}`;

    const countSql = Prisma.sql`SELECT COUNT(*)::int AS total FROM "Customer" c JOIN "Family" f ON f.id = c."familyId" ${where}`;

    const [items, count] = await Promise.all([
      prisma.$queryRaw(rowsSql),
      prisma.$queryRaw<{ total: number }[]>(countSql),
    ]);
    const total = count[0]?.total ?? 0;
    ok(res, { items, total, limit, offset, nextOffset: offset + limit < total ? offset + limit : null });
  },

  // POST /api/customers
  POST: async (req, res) => {
    const input = body(req, customerInput);
    const customer = await prisma.$transaction(async (tx) => {
      const code = await nextCode(tx, "customer", custCode);
      const c = await tx.customer.create({ data: { ...input, code } });
      await tx.activity.create({ data: { type: "CUSTOMER_ADDED", summary: `Added member ${c.name}`, familyId: c.familyId, customerId: c.id } });
      return c;
    });
    ok(res, customer, 201);
  },
});
