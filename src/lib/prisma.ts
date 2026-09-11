import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Neon's HTTP query path (not WebSocket): each read is a one-shot fetch with no
// per-isolate connection handshake, which is lower-latency for the short,
// non-interactive queries this app runs.
//
// The trade-off is real and easy to trip over: this adapter supports NO
// transactions at all, and Prisma opens one implicitly for more than you'd
// expect. A multi-row `createMany`, and a nested `createMany` inside a `create`,
// both throw "Transactions are not supported in HTTP mode" at runtime — they
// type-check fine and only fail once deployed. Write those as individual
// `create` calls instead (setting `createdAt` yourself if read-back order
// matters). `$transaction([...])` and `$transaction(async ...)` are both out.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// Reuse the client across warm serverless invocations in ALL environments
// (previously dev-only), so isolates don't rebuild it on every request.
globalForPrisma.prisma = prisma;
