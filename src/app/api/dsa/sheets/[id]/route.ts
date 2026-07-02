import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const sheet = await prisma.sheet.findFirst({
    where: { id, userId: user.id, isPreset: false },
  });

  if (!sheet) return NextResponse.json({ error: "Sheet not found" }, { status: 404 });

  await prisma.sheet.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
