import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Reset tokens live in the existing NextAuth `VerificationToken` table (already
 *  created by the init migration and otherwise unused — no EmailProvider is
 *  configured), so this feature needs no schema migration. The identifier is
 *  namespaced with this prefix so it can never collide if an EmailProvider is
 *  added later. */
const PREFIX = "pwreset:";

/** 1 hour — long enough to find the email, short enough to limit exposure. */
const TTL_MS = 60 * 60 * 1000;

const identifierFor = (email: string) => `${PREFIX}${email.toLowerCase().trim()}`;

/** Only the hash is stored, so a database leak can't be replayed as a reset. */
const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** Issues a single-use reset token, invalidating any previous outstanding one
 *  for that email. Returns the RAW token — emailed to the user, never stored. */
export async function createPasswordResetToken(email: string): Promise<string> {
  const identifier = identifierFor(email);
  const raw = randomBytes(32).toString("hex");

  // One live token per address: a new request supersedes the old one.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: hashToken(raw), expires: new Date(Date.now() + TTL_MS) },
  });

  return raw;
}

/** Verifies and consumes a token. Single-use: the row is deleted on success,
 *  and expired rows are cleaned up rather than left behind. */
export async function consumePasswordResetToken(email: string, raw: string): Promise<boolean> {
  const identifier = identifierFor(email);
  const token = hashToken(raw);

  const record = await prisma.verificationToken.findFirst({ where: { identifier, token } });
  if (!record) return false;

  // Consume it either way — an expired token is spent, not retryable.
  await prisma.verificationToken.deleteMany({ where: { identifier, token } });

  return record.expires.getTime() > Date.now();
}
