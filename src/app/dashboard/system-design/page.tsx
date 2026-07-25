import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ChallengeSpinner from "@/components/system-design/ChallengeSpinner";

type Props = { searchParams: Promise<{ level?: string; exp?: string }> };

export default async function SystemDesignPage({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { level, exp } = await searchParams;
  const diffFilter = (level as "EASY" | "MEDIUM" | "HARD" | undefined) ?? undefined;
  const expFilter = (exp as "JUNIOR" | "MID" | "SENIOR" | undefined) ?? undefined;

  const questions = await prisma.systemDesignQuestion.findMany({
    where: {
      ...(diffFilter ? { difficulty: diffFilter } : {}),
      ...(expFilter ? { experienceLevel: expFilter } : {}),
    },
    orderBy: [{ mustDo: "desc" }, { order: "asc" }],
  });

  const difficultyBg = {
    EASY: "bg-accent/10 border-accent/20 text-accent",
    MEDIUM: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    HARD: "bg-red-500/10 border-red-500/20 text-red-400",
  };

  const tabs = [
    { label: "All", value: undefined },
    { label: "Easy", value: "EASY" },
    { label: "Medium", value: "MEDIUM" },
    { label: "Hard", value: "HARD" },
  ];

  const expTabs = [
    { label: "All levels", value: undefined },
    { label: "Junior", value: "JUNIOR" },
    { label: "Mid", value: "MID" },
    { label: "Senior", value: "SENIOR" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-heading text-primary">System Design</h1>
        <p className="text-muted text-sm mt-1">
          Practice system design from fundamentals to senior-level architecture.
        </p>
      </div>

      {/* Compact challenge spinner — mobile/tablet only */}
      <div className="xl:hidden">
        <ChallengeSpinner compact />
      </div>

      {/* Filters — full width, above the split so both columns below start flush */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={`/dashboard/system-design?${new URLSearchParams({
                ...(tab.value ? { level: tab.value } : {}),
                ...(expFilter ? { exp: expFilter } : {}),
              }).toString()}`}
              className={`rounded-xl px-3 py-1.5 text-xs transition ${
                diffFilter === tab.value
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "border border-border text-secondary hover:border-border hover:text-primary"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-1.5">
          {expTabs.map((tab) => (
            <Link
              key={tab.label}
              href={`/dashboard/system-design?${new URLSearchParams({
                ...(diffFilter ? { level: diffFilter } : {}),
                ...(tab.value ? { exp: tab.value } : {}),
              }).toString()}`}
              className={`rounded-xl px-3 py-1.5 text-xs transition ${
                expFilter === tab.value
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  : "border border-border text-secondary hover:border-border hover:text-primary"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Question list + rail — same row, so both start at the same height */}
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          {questions.length > 0 ? (
            <div className="rounded-xl border border-border bg-surface divide-y divide-border">
              {questions.map((q) => (
                <Link key={q.id} href={`/dashboard/system-design/${q.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-border transition group">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm text-primary group-hover:text-primary transition leading-snug">
                      {q.title}
                    </span>
                    <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">{q.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {q.mustDo && (
                      <span className="text-[10px] text-amber-400/80 border border-amber-500/20 rounded px-1.5 py-0.5 whitespace-nowrap">
                        must do
                      </span>
                    )}
                    <span className={`text-[10px] rounded-full border px-2 py-0.5 ${difficultyBg[q.difficulty]}`}>
                      {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                    </span>
                    <span className="text-[10px] text-muted capitalize whitespace-nowrap">
                      {q.experienceLevel.toLowerCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface px-5 py-16 text-center">
              <p className="text-secondary text-sm font-medium">No questions yet</p>
              <p className="text-muted text-xs mt-1">
                System design questions will appear here once seeded.
              </p>
            </div>
          )}
        </div>

        {/* Right rail: challenge spinner — desktop only */}
        <div className="w-80 shrink-0 hidden xl:block">
          <ChallengeSpinner />
        </div>
      </div>
    </div>
  );
}
