export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Full body of one past attempt, fetched when the user opens it.
 *
 *  Kept off the page payload deliberately: a Build It approach or a Bug Hunt
 *  diagnosis can run to thousands of characters, and the workspaces list every
 *  attempt. The list props stay `{ id, score, createdAt }`; this route serves
 *  the rest on demand.
 *
 *  Every lookup is scoped by `userId` as well as `id`. The ids are cuids, but
 *  that is obscurity, not authorisation — without the userId clause anyone
 *  holding an id could read someone else's submission and feedback.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kind, id } = await params;

  if (kind === "review") {
    const a = await prisma.reviewAttempt.findFirst({
      where: { id, userId },
      select: {
        id: true, exerciseSlug: true, score: true, createdAt: true,
        comments: true, caught: true, missed: true, feedback: true,
      },
    });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ kind, ...a });
  }

  if (kind === "bug-hunt") {
    const a = await prisma.bugHuntAttempt.findFirst({
      where: { id, userId },
      select: {
        id: true, exerciseSlug: true, score: true, createdAt: true,
        diagnosis: true, fixedCode: true, findings: true,
        rootCaught: true, fixReasonable: true, feedback: true,
      },
    });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ kind, ...a });
  }

  if (kind === "build-it") {
    const a = await prisma.buildItAttempt.findFirst({
      where: { id, userId },
      select: {
        id: true, problemSlug: true, stage: true, language: true,
        score: true, createdAt: true, approach: true, explanation: true,
        criteria: true, invariantHolds: true, feedback: true,
      },
    });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ kind, ...a });
  }

  return NextResponse.json({ error: "Unknown attempt kind" }, { status: 400 });
}
