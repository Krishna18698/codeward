import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get("sheetId");
  const preset  = searchParams.get("preset");

  if (!sheetId && !preset) return NextResponse.json({ error: "sheetId or preset required" }, { status: 400 });

  const rows = await prisma.problem.findMany({
    where: preset
      ? { sheet: { isPreset: true }, NOT: { companies: { isEmpty: true } } }
      : {
          sheetId: sheetId!,
          sheet: { OR: [{ isPreset: true }, { userId: user.id }] },
          NOT: { companies: { isEmpty: true } },
        },
    select: { companies: true },
  });

  const companies = [...new Set(rows.flatMap((r) => r.companies))].sort();
  return NextResponse.json({ companies });
}
