import { route, ok, fail, body } from "../lib/http";
import { prisma } from "../lib/prisma";
import { loginInput, signupInput } from "../lib/validation";
import { nextCode, custCode } from "../lib/codes";

const norm = (p: string) => p.replace(/\s+/g, "").replace(/[^\d+]/g, "");

export default route({
  POST: async (req, res) => {
    const action = String((req.body as { action?: string })?.action ?? "");

    if (action === "login") {
      const { phone } = body(req, loginInput);
      const user = await prisma.user.findUnique({ where: { phone: norm(phone) } });
      if (!user) return fail(res, 404, "No account with this number");
      await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
      await prisma.activity.create({ data: { type: "LOGIN", summary: `${user.name} signed in`, familyId: user.familyId, actor: user.name } });
      return ok(res, { user });
    }

    if (action === "signup") {
      const { name, phone } = body(req, signupInput);
      const nphone = norm(phone);
      const existing = await prisma.user.findUnique({ where: { phone: nphone } });
      if (existing) return ok(res, { user: existing, existed: true });

      const result = await prisma.$transaction(async (tx) => {
        const family = await tx.family.create({ data: { name: `${name.split(" ")[0]}'s Household`, phone: nphone } });
        const code = await nextCode(tx, "customer", custCode);
        const customer = await tx.customer.create({ data: { code, familyId: family.id, name, phone: nphone } });
        const user = await tx.user.create({ data: { phone: nphone, name, role: "MEMBER", familyId: family.id } });
        await tx.activity.create({ data: { type: "SIGNUP", summary: `${name} created an account`, familyId: family.id, customerId: customer.id, actor: name } });
        return { user, family, customer };
      });
      return ok(res, result, 201);
    }

    return fail(res, 400, "Unknown action; expected 'login' or 'signup'");
  },
});
