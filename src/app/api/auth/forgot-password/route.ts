import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { passwordResetLimiter } from "@/lib/ratelimit";
import { createPasswordResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/** Identical response in every case (unknown email, Google-only account, mail
 *  failure). Anything else would turn this endpoint into an account-existence
 *  oracle. */
const GENERIC = {
  success: true,
  message: "If an account exists for that email, we've sent a reset link.",
};

export async function POST(req: Request) {
  if (passwordResetLimiter) {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
    const { success } = await passwordResetLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
  }

  const { email } = (await req.json()) as { email?: string };
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, password: true },
  });

  // Only credentials accounts can reset a password — a Google-only user has no
  // password to change and should keep signing in with Google.
  if (user?.password) {
    const token = await createPasswordResetToken(normalized);
    const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
    const resetUrl = `${base}/reset-password?token=${token}&email=${encodeURIComponent(normalized)}`;
    await sendPasswordResetEmail(normalized, resetUrl);
  }

  return NextResponse.json(GENERIC);
}
