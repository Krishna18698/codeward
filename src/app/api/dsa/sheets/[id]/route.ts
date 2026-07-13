import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { id } = await params;

  const sheet = await prisma.sheet.findFirst({
    where: { id, userId, isPreset: false },
  });

  if (!sheet) return NextResponse.json({ error: "Sheet not found" }, { status: 404 });

  await prisma.sheet.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
