import { PrismaClient } from "@prisma/client";

// Reuse the client across warm serverless invocations to avoid exhausting
// Postgres connections. Point DATABASE_URL at a pooled endpoint (Neon pooler
// or Vercel Postgres) with `?pgbouncer=true&connection_limit=1`.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
