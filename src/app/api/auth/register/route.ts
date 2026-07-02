import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomAvatarKey } from "@/lib/avatar";
import { registerLimiter } from "@/lib/ratelimit";

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
  if (registerLimiter) {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
    const { success } = await registerLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
  }

  const body = await req.json();
  const { name, email, password } = body as { name?: string; email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Password must be 8–128 characters" }, { status: 400 });
  }
  if (name && name.length > 100) {
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name: name?.trim() ?? null, email: email.toLowerCase().trim(), password: hashed, image: randomAvatarKey() },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
