import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, Target, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/dashboard/ProfileForm";
import { isLocalAvatar, getAvatarMeta } from "@/lib/avatar";
import { getActivity } from "@/lib/activity";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeading from "@/components/ui/SectionHeading";
import PageWithRail from "@/components/dashboard/PageWithRail";
import { Ring } from "@/components/ui/Ring";
import { CODE_REVIEWS_META } from "@/content/code-reviews";
import { BUG_HUNTS_META } from "@/content/bug-hunts";
import { BUILD_IT_META } from "@/content/build-it";

const MASTERED = 70;

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  // Everything this page shows already existed — it just wasn't surfaced here.
  // One batch, same shape as the dashboard's, so the two pages can't disagree.
  const [user, sheets, statuses, diffTotals, reviews, bugs, builds, sdNotes, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, image: true,
        experienceLevel: true, targetCompany: true,
        _count: { select: { problemStatuses: true, customSheets: true } },
      },
    }),
    prisma.sheet.findMany({
      where: { OR: [{ isPreset: true }, { userId }] },
      select: { id: true, isPreset: true, source: true, _count: { select: { problems: true } } },
    }),
    prisma.userProblemStatus.findMany({
      where: { userId, status: "DONE" },
      select: { problem: { select: { sheetId: true, difficulty: true } } },
    }),
    prisma.problem.groupBy({
      by: ["difficulty"],
      where: { sheet: { isPreset: true, source: { not: "TOP300" } } },
      _count: { _all: true },
    }),
    prisma.reviewAttempt.groupBy({ by: ["exerciseSlug"], where: { userId }, _max: { score: true } }),
    prisma.bugHuntAttempt.groupBy({ by: ["exerciseSlug"], where: { userId }, _max: { score: true } }),
    prisma.buildItAttempt.groupBy({ by: ["problemSlug", "stage"], where: { userId }, _max: { score: true } }),
    prisma.userNote.count({ where: { userId, sdQuestionId: { not: null } } }),
    getActivity(userId),
  ]);
  if (!user) redirect("/login");

  const initials = (user.name ?? "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // Same "tracked" population as the dashboard — the Top 300 bank is a
  // catalogue, not a curriculum, so it stays out of the denominator.
  const trackedIds = new Set(
    sheets.filter((s) => s.isPreset && s.source !== "TOP300").map((s) => s.id),
  );
  const totalTracked = sheets
    .filter((s) => trackedIds.has(s.id))
    .reduce((sum, s) => sum + s._count.problems, 0);

  const DIFFS = ["EASY", "MEDIUM", "HARD"] as const;
  const byDiff: Record<string, { done: number; total: number }> = {
    EASY: { done: 0, total: 0 }, MEDIUM: { done: 0, total: 0 }, HARD: { done: 0, total: 0 },
  };
  for (const g of diffTotals) {
    const b = byDiff[g.difficulty];
    if (b) b.total = g._count._all;
  }
  let trackedDone = 0;
  for (const s of statuses) {
    if (!trackedIds.has(s.problem.sheetId)) continue;
    trackedDone++;
    const b = byDiff[s.problem.difficulty];
    if (b) b.done++;
  }
  const overallPct = totalTracked > 0 ? Math.round((trackedDone / totalTracked) * 100) : 0;

  const diffStyle: Record<string, string> = {
    EASY: "text-accent", MEDIUM: "text-amber-400", HARD: "text-red-400",
  };
  const diffBar: Record<string, string> = {
    EASY: "bg-accent-fill", MEDIUM: "bg-amber-500", HARD: "bg-red-500",
  };

  // Build It counts a problem done when every stage has passed.
  const stagesPassed = new Map<string, Set<number>>();
  for (const b of builds) {
    if ((b._max.score ?? 0) < MASTERED) continue;
    const set = stagesPassed.get(b.problemSlug) ?? new Set<number>();
    set.add(b.stage);
    stagesPassed.set(b.problemSlug, set);
  }
  const buildsDone = BUILD_IT_META.filter(
    (p) => (stagesPassed.get(p.slug)?.size ?? 0) >= p.stages.length,
  ).length;

  // Deep Dives is deliberately absent: its read state lives in localStorage
  // (see ReadBadge), so there is nothing on the server to count. System Design
  // has no attempt table either — notes written is the only real signal.
  const modes = [
    { label: "DSA Sheets",   href: "/dashboard/dsa",         done: trackedDone, total: totalTracked },
    { label: "Code Review",  href: "/dashboard/code-review", done: reviews.filter((r) => (r._max.score ?? 0) >= MASTERED).length, total: CODE_REVIEWS_META.length },
    { label: "Bug Hunt",     href: "/dashboard/bug-hunt",    done: bugs.filter((b) => (b._max.score ?? 0) >= MASTERED).length,    total: BUG_HUNTS_META.length },
    { label: "Build It",     href: "/dashboard/build-it",    done: buildsDone,  total: BUILD_IT_META.length },
  ];

  const rail = (
    <>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <SectionHeading label="Overall" />
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Ring pct={overallPct} size={72} stroke={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{overallPct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{trackedDone} / {totalTracked}</p>
            <p className="text-xs text-muted">problems across the curated sheets</p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {DIFFS.map((d) => {
            const b = byDiff[d];
            const pct = b.total > 0 ? (b.done / b.total) * 100 : 0;
            return (
              <div key={d}>
                <div className="mb-1 flex items-baseline justify-between font-mono text-[11px]">
                  <span className={diffStyle[d]}>{d.charAt(0) + d.slice(1).toLowerCase()}</span>
                  <span className="text-muted">{b.done}/{b.total}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full w-full origin-left rounded-full transition-transform duration-700 ${diffBar[d]}`}
                    style={{ transform: `scaleX(${pct / 100})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-xs text-secondary">
          <span><span className="font-semibold text-primary">{user._count.problemStatuses}</span> attempted</span>
          <span><span className="font-semibold text-primary">{user._count.customSheets}</span> custom sheets</span>
          <span><span className="font-semibold text-primary">{sdNotes}</span> design notes</span>
        </div>
      </div>

      <ActivityHeatmap data={activity} weeks={13} />
    </>
  );

  return (
    <PageWithRail rail={rail}>
      <div className="space-y-6 animate-fade-up">
        <PageHeader
          eyebrow="Profile"
          title={user.name ?? "Your account"}
          subtitle="Your progress across every mode, and the details the AI mentor uses to tailor your prep."
        />

        {/* Identity — a split card, the shape the rest of the app uses. This
            page previously had no cards at all, which is why it read as unfinished. */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            {isLocalAvatar(user.image) ? (
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border ${getAvatarMeta(user.image).bg}`}>
                <span className="text-4xl">{getAvatarMeta(user.image).emoji}</span>
              </div>
            ) : user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                width={80}
                height={80}
                referrerPolicy="no-referrer"
                className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-elevated text-2xl font-bold text-primary">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold tracking-heading text-primary">
                {user.name ?? "No name set"}
              </h2>
              <p className="truncate text-sm text-muted">{user.email}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {user.experienceLevel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent">
                    <User size={11} />
                    {user.experienceLevel.charAt(0) + user.experienceLevel.slice(1).toLowerCase()}
                  </span>
                )}
                {user.targetCompany && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 font-mono text-[11px] text-rose-400">
                    <Target size={11} />
                    {user.targetCompany}
                  </span>
                )}
                {activity.streak > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-secondary">
                    {activity.streak} day streak
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Per-mode progress */}
        <div>
          <SectionHeading label="By mode" title="Where your hours" titleAccent="have gone." />
          <div className="grid gap-2 sm:grid-cols-2">
            {modes.map((m) => {
              const pct = m.total > 0 ? (m.done / m.total) * 100 : 0;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-accent hover:bg-elevated"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-primary group-hover:text-accent-hover">{m.label}</span>
                    <span className="font-mono text-[11px] text-muted">{m.done}/{m.total}</span>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full w-full origin-left rounded-full bg-accent-fill transition-transform duration-700"
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-1 font-mono text-[11px] text-muted">
            Deep Dives progress is stored in your browser, so it isn&apos;t counted here.
            <Link href="/dashboard/deep-dives" className="inline-flex items-center gap-0.5 text-accent hover:text-accent-hover">
              Open <ArrowRight size={10} />
            </Link>
          </p>
        </div>

        {/* Account details — ProfileForm owns its own header + Edit button,
            right above the fields it toggles. */}
        <div>
          <SectionHeading label="Account" title="Details the mentor" titleAccent="uses to tailor prep." />
          <div className="rounded-2xl border border-border bg-surface p-5">
            <ProfileForm user={{ name: user.name, email: user.email, image: user.image, experienceLevel: user.experienceLevel, targetCompany: user.targetCompany }} />
          </div>
        </div>
      </div>
    </PageWithRail>
  );
}
