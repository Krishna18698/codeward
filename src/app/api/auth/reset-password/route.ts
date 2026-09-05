import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { passwordResetLimiter } from "@/lib/ratelimit";
import { consumePasswordResetToken } from "@/lib/passwordReset";

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
  if (passwordResetLimiter) {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
    const { success } = await passwordResetLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
  }

  const { email, token, password } = (await req.json()) as {
    email?: string;
    token?: string;
    password?: string;
  };

  if (!email || !EMAIL_RE.test(email) || !token) {
    return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
  }
  // Same rule the register endpoint enforces.
  if (!password || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Password must be 8–128 characters" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();

  // Single-use: this consumes the token whether or not it had expired.
  const valid = await consumePasswordResetToken(normalized, token);
  if (!valid) {
    return NextResponse.json(
      { error: "This reset link has expired or already been used. Request a new one." },
      { status: 400 },
    );
  }

  // Same case-insensitive resolution as the forgot endpoint, preferring the
  // account that has a password (the one the reset applies to).
  const candidates = await prisma.user.findMany({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, password: true },
  });
  const user = candidates.find((u) => u.password) ?? null;
  if (!user) {
    return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 12) },
  });

  return NextResponse.json({ success: true });
}
