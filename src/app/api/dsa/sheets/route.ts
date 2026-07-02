import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json() as { name?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Sheet name is required" }, { status: 400 });
  }

  const sheet = await prisma.sheet.create({
    data: { name: name.trim(), source: "CUSTOM", isPreset: false, userId: user.id },
  });

  return NextResponse.json({ sheet });
}
