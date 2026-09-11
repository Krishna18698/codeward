import { prisma } from "@/lib/prisma";

/**
 * Who may read a sheet: anyone for the preset sheets, only the owner for a
 * custom one.
 *
 * Being signed in is not enough on its own. Sheet ids are cuids, but that is
 * obscurity rather than authorisation — a route that filters on `sheetId`
 * alone will hand a custom sheet's contents to any signed-in caller who has
 * the id. This mirrors the listing query in dashboard/dsa/page.tsx, which has
 * always been scoped; it exists so the two can't drift apart.
 */
export function sheetVisibleTo(userId: string) {
  return { OR: [{ isPreset: true }, { userId }] };
}

/** Resolves false for a sheet that is missing *or* not the caller's — the two
 *  are deliberately indistinguishable, so a probe can't confirm an id exists. */
export async function canReadSheet(sheetId: string, userId: string): Promise<boolean> {
  const sheet = await prisma.sheet.findFirst({
    where: { id: sheetId, ...sheetVisibleTo(userId) },
    select: { id: true },
  });
  return sheet !== null;
}
