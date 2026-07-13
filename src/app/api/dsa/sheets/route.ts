import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { name } = await req.json() as { name?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Sheet name is required" }, { status: 400 });
  }

  const sheet = await prisma.sheet.create({
    data: { name: name.trim(), source: "CUSTOM", isPreset: false, userId },
  });

  return NextResponse.json({ sheet });
}
