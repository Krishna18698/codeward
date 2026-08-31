import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CODE_REVIEWS_META } from "@/content/code-reviews";
import ModeCatalog, { type CatalogItem, type CatalogFilter, type BadgeTone } from "@/components/dashboard/ModeCatalog";

const DIFF_TONE = { Easy: "accent", Medium: "amber", Hard: "rose" } as const;
const MASTERED = 70;

type Props = { searchParams: Promise<{ status?: string }> };

export default async function CodeReviewPage({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { status } = await searchParams;

  const attempts = await prisma.reviewAttempt.groupBy({
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

  const done = CODE_REVIEWS_META.filter((e) => statusOf(e.slug) === "mastered").length;

  const filtered = CODE_REVIEWS_META.filter((e) => !status || statusOf(e.slug) === status);

  const items: CatalogItem[] = filtered.map((ex) => {
    const stat = bySlug.get(ex.slug);
    const best = stat?._max.score ?? null;
    return {
      href: `/dashboard/code-review/${ex.slug}`,
      title: ex.title,
      badges: [
        { label: ex.difficulty, tone: DIFF_TONE[ex.difficulty] },
        ...(best !== null ? [{ label: `best ${best}/100`, tone: (best >= MASTERED ? "accent" : "amber") as BadgeTone }] : []),
      ],
      brief: ex.brief,
      meta: `${ex.language} · ~${ex.minutes} min · ${ex.bugCount} planted issues${stat ? ` · ${stat._count._all} attempt${stat._count._all > 1 ? "s" : ""}` : ""}`,
      cta: best !== null ? "Review again →" : "Start reviewing →",
    };
  });

  const mkFilter = (label: string, value?: string): CatalogFilter => ({
    label,
    href: value ? `/dashboard/code-review?status=${value}` : "/dashboard/code-review",
    active: (status ?? "") === (value ?? ""),
  });

  return (
    <ModeCatalog
      eyebrow="Code Review"
      title="Pick a PR to review."
      subtitle="Hand-authored diffs with planted bugs — the same class of issues a senior reviewer would catch. Write your review; the AI grades it against the ground-truth bug list."
      statChips={[`${CODE_REVIEWS_META.length} PRs`, "all free", "TypeScript", "AI-graded"]}
      progress={{ done, total: CODE_REVIEWS_META.length, label: "mastered" }}
      filterRows={[[
        mkFilter("All"),
        mkFilter("Not started", "not-started"),
        mkFilter("Attempted", "attempted"),
        mkFilter("Mastered", "mastered"),
      ]]}
      items={items}
      emptyText="No reviews match that filter yet."
    />
  );
}
