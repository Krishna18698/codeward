import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUILD_IT_META } from "@/content/build-it";
import PreloadCodeEditor from "@/components/ui/PreloadCodeEditor";
import ModeCatalog, { type CatalogItem, type CatalogFilter, type BadgeTone } from "@/components/dashboard/ModeCatalog";

const CATEGORY_TONE: Record<string, BadgeTone> = {
  concurrency: "rose",
  distributed: "amber",
  payments: "accent",
  api: "sky",
};
const CATEGORIES = ["concurrency", "distributed", "payments", "api"];
const MASTERED = 70;

type Props = { searchParams: Promise<{ status?: string; category?: string }> };

export default async function BuildItPage({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { status, category } = await searchParams;

  const attempts = await prisma.buildItAttempt.groupBy({
    by: ["problemSlug", "stage"],
    where: { userId },
    _max: { score: true },
  });
  // per-problem: which stages were started, and which were mastered (>=70)
  const started = new Map<string, Set<number>>();
  const mastered = new Map<string, Set<number>>();
  const add = (map: Map<string, Set<number>>, slug: string, stage: number) => {
    const set = map.get(slug) ?? new Set<number>();
    set.add(stage);
    map.set(slug, set);
  };
  for (const a of attempts) {
    add(started, a.problemSlug, a.stage);
    if ((a._max.score ?? 0) >= MASTERED) add(mastered, a.problemSlug, a.stage);
  }

  const statusOf = (slug: string, totalStages: number): "not-started" | "in-progress" | "complete" => {
    if ((mastered.get(slug)?.size ?? 0) >= totalStages) return "complete";
    if ((started.get(slug)?.size ?? 0) > 0) return "in-progress";
    return "not-started";
  };

  const done = BUILD_IT_META.filter((p) => statusOf(p.slug, p.stages.length) === "complete").length;

  const filtered = BUILD_IT_META.filter(
    (p) => (!status || statusOf(p.slug, p.stages.length) === status) && (!category || p.category === category),
  );

  const items: CatalogItem[] = filtered.map((p) => {
    const st = statusOf(p.slug, p.stages.length);
    const doneStages = mastered.get(p.slug) ?? new Set<number>();
    return {
      href: `/dashboard/build-it/${p.slug}`,
      title: p.title,
      badges: [{ label: p.category, tone: CATEGORY_TONE[p.category] ?? "muted" }],
      brief: p.brief,
      meta: `${p.stages.length} stages · ~${p.totalMinutes} min`,
      cta: st === "complete" ? "Review →" : st === "in-progress" ? "Continue →" : "Start designing →",
      trailing: (
        <span className="flex items-center gap-1.5" title={`${doneStages.size}/${p.stages.length} stages passed`}>
          {p.stages.map((s) => (
            <span
              key={s.stage}
              className={`h-1.5 w-1.5 rounded-full ${doneStages.has(s.stage) ? "bg-accent-hover" : "border border-border"}`}
            />
          ))}
        </span>
      ),
    };
  });

  const statusFilter = (label: string, value: string): CatalogFilter => ({
    label,
    href: value
      ? `/dashboard/build-it?status=${value}${category ? `&category=${category}` : ""}`
      : `/dashboard/build-it${category ? `?category=${category}` : ""}`,
    active: (status ?? "") === value,
  });
  const categoryFilter = (label: string, value: string): CatalogFilter => ({
    label,
    href: value
      ? `/dashboard/build-it?category=${value}${status ? `&status=${status}` : ""}`
      : `/dashboard/build-it${status ? `?status=${status}` : ""}`,
    active: (category ?? "") === value,
  });

  return (
    <>
      <PreloadCodeEditor />
      <ModeCatalog
        eyebrow="Build It"
        title="Design it. Break it. Fix it."
        subtitle="Five real low-level-design problems, each evolving across 4 stages as new constraints break your last design. Stage 3 always asks you to prove a correctness invariant holds under concurrency — that's the senior filter."
        statChips={[`${BUILD_IT_META.length} problems`, "all free", "4 stages each", "C# · Python · Kotlin"]}
        progress={{ done, total: BUILD_IT_META.length, label: "complete" }}
        filterRows={[
          [
            statusFilter("All", ""),
            statusFilter("Not started", "not-started"),
            statusFilter("In progress", "in-progress"),
            statusFilter("Complete", "complete"),
          ],
          [
            categoryFilter("All categories", ""),
            ...CATEGORIES.map((c) => categoryFilter(c, c)),
          ],
        ]}
        items={items}
        emptyText="No problems match those filters yet."
      />
    </>
  );
}
