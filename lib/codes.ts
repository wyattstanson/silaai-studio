import type { Prisma } from "@prisma/client";

/**
 * Atomically mint the next human-readable code (CUS-0001, S-42) from a
 * monotonic counter row, inside the caller's transaction so it never collides
 * under concurrency at scale.
 */
export async function nextCode(
  tx: Prisma.TransactionClient,
  name: string,
  format: (n: number) => string,
): Promise<string> {
  const row = await tx.counter.upsert({
    where: { name },
    create: { name, value: 1 },
    update: { value: { increment: 1 } },
  });
  return format(row.value);
}

export const custCode = (n: number) => `CUS-${String(n).padStart(4, "0")}`;
export const orderCode = (n: number) => `S-${n}`;
export const reqCode = (n: number) => `REQ-${String(n).padStart(4, "0")}`;
