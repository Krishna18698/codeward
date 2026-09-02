import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Neon's HTTP query path (not WebSocket): each read is a one-shot fetch with no
// per-isolate connection handshake, which is lower-latency for the short,
// non-interactive queries this app runs. Safe here because nothing uses
// interactive ($transaction(async ...)) transactions — implicit/batch writes
// still work over Neon's HTTP transaction endpoint.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// Reuse the client across warm serverless invocations in ALL environments
// (previously dev-only), so isolates don't rebuild it on every request.
globalForPrisma.prisma = prisma;
