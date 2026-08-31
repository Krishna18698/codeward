import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUG_HUNTS_META } from "@/content/bug-hunts";
import PreloadCodeEditor from "@/components/ui/PreloadCodeEditor";
import ModeCatalog, { type CatalogItem, type CatalogFilter, type BadgeTone } from "@/components/dashboard/ModeCatalog";

const CATEGORY_TONE: Record<string, BadgeTone> = {
  concurrency: "rose",
  performance: "amber",
  "resource-leak": "rose",
  correctness: "accent",
};
const CATEGORIES = ["concurrency", "performance", "resource-leak", "correctness"];
const MASTERED = 70;

type Props = { searchParams: Promise<{ status?: string; category?: string }> };

export default async function BugHuntPage({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { status, category } = await searchParams;

  const attempts = await prisma.bugHuntAttempt.groupBy({
    by: ["exerciseSlug"],
    where: { userId },
    _max: { score: true },
    _count: { _all: true },
  });
  const bySlug = new Map(attempts.map((a) => [a.exerciseSlug, a]));

  const statusOf = (slug: string): "not-started" | "attempted" | "mastered" => {
    const s = bySlug.get(slug);
    if (!s) return "not-started";
    return (s._max.score ?? 0) >= MASTERED ? "mastered" : "attempted";
  };

  const done = BUG_HUNTS_META.filter((e) => statusOf(e.slug) === "mastered").length;

  const filtered = BUG_HUNTS_META.filter(
    (e) => (!status || statusOf(e.slug) === status) && (!category || e.category === category),
  );

  const items: CatalogItem[] = filtered.map((ex) => {
    const stat = bySlug.get(ex.slug);
    const best = stat?._max.score ?? null;
    return {
      href: `/dashboard/bug-hunt/${ex.slug}`,
      title: ex.title,
      badges: [
        { label: ex.category, tone: CATEGORY_TONE[ex.category] ?? "muted" },
        ...(best !== null ? [{ label: `best ${best}/100`, tone: (best >= MASTERED ? "accent" : "amber") as BadgeTone }] : []),
      ],
      brief: ex.brief,
      meta: `${ex.language} · ~${ex.minutes} min${stat ? ` · ${stat._count._all} attempt${stat._count._all > 1 ? "s" : ""}` : ""}`,
      cta: best !== null ? "Try again →" : "Start debugging →",
    };
  });

  const qs = (next: { status?: string; category?: string }) => {
    const p = new URLSearchParams();
    const s = next.status ?? status;
    const c = next.category ?? category;
    if (s) p.set("status", s);
    if (c) p.set("category", c);
    const str = p.toString();
    return `/dashboard/bug-hunt${str ? `?${str}` : ""}`;
  };
  // "clear" sentinel: pass empty string to drop a param
  const statusFilter = (label: string, value: string): CatalogFilter => ({
    label,
    href: value ? qs({ status: value }) : `/dashboard/bug-hunt${category ? `?category=${category}` : ""}`,
    active: (status ?? "") === value,
  });
  const categoryFilter = (label: string, value: string): CatalogFilter => ({
    label,
    href: value ? qs({ category: value }) : `/dashboard/bug-hunt${status ? `?status=${status}` : ""}`,
    active: (category ?? "") === value,
  });

  return (
    <>
      <PreloadCodeEditor />
      <ModeCatalog
        eyebrow="Bug Hunt"
        title="Diagnose the failure."
        subtitle="Broken code, failing tests, real log excerpts. Find the root cause — not the symptom — write your diagnosis, and the AI grades it, then reveals the canonical fix."
        statChips={[`${BUG_HUNTS_META.length} exercises`, "all free", "AI-graded"]}
        progress={{ done, total: BUG_HUNTS_META.length, label: "mastered" }}
        filterRows={[
          [
            statusFilter("All", ""),
            statusFilter("Not started", "not-started"),
            statusFilter("Attempted", "attempted"),
            statusFilter("Mastered", "mastered"),
          ],
          [
            categoryFilter("All categories", ""),
            ...CATEGORIES.map((c) => categoryFilter(c, c)),
          ],
        ]}
        items={items}
        emptyText="No exercises match those filters yet."
      />
    </>
  );
}
