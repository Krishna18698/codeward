import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json() as {
    name?: string;
    experienceLevel?: string;
    targetCompany?: string;
    onboarded?: boolean;
    image?: string;
  };

  const allowedImageUpdate =
    data.image !== undefined && /^avatar:[a-z0-9_-]{1,50}$/.test(data.image);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.experienceLevel !== undefined && { experienceLevel: data.experienceLevel }),
      ...(data.targetCompany !== undefined && { targetCompany: data.targetCompany }),
      ...(data.onboarded !== undefined && { onboarded: data.onboarded }),
      ...(allowedImageUpdate && { image: data.image }),
    },
    select: { id: true, name: true, experienceLevel: true, targetCompany: true, onboarded: true, image: true },
  });

  return NextResponse.json(updated);
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, image: true, experienceLevel: true, targetCompany: true, onboarded: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
