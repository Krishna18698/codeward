import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Code2, Network, Sparkles, TrendingUp, BookOpen, ArrowRight, GitPullRequest, Bug, Blocks, RotateCcw, History, Play } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isLocalAvatar, getAvatarMeta } from "@/lib/avatar";
import { Ring } from "@/components/ui/Ring";
import { CODE_REVIEWS_META } from "@/content/code-reviews";
import { BUG_HUNTS_META } from "@/content/bug-hunts";
import { BUILD_IT_META } from "@/content/build-it";
import { DEEP_DIVES } from "@/content/deep-dives";

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (s < 60) return rtf.format(-s, "second");
  if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour");
  return rtf.format(-Math.floor(s / 86400), "day");
}

async function getDashboardData(userId: string) {
  const [sheets, statuses, sdTotal, recent, reviseList] = await Promise.all([
    prisma.sheet.findMany({
      where: { OR: [{ isPreset: true }, { userId }] },
      include: { _count: { select: { problems: true } } },
      orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
    }),
    prisma.userProblemStatus.findMany({
      where: { userId },
      select: { status: true, problem: { select: { sheetId: true, pattern: true } } },
    }),
    prisma.systemDesignQuestion.count(),
    // Recent activity + continue-where-left-off (most recently touched first)
    prisma.userProblemStatus.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        status: true,
        updatedAt: true,
        problem: { select: { id: true, title: true, sheetId: true } },
      },
    }),
    // Revision queue
    prisma.userProblemStatus.findMany({
      where: { userId, toRevise: true },
      orderBy: { updatedAt: "desc" },
      select: { problem: { select: { id: true, title: true, sheetId: true } } },
    }),
  ]);
  return { sheets, statuses, sdTotal, recent, reviseList };
}

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [user, { sheets, statuses, sdTotal, recent, reviseList }] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true, targetCompany: true, experienceLevel: true },
    }),
    getDashboardData(userId),
  ]);
  if (!user) redirect("/login");

  const continueItem = recent[0] ?? null;
  const statusLabel: Record<string, string> = { DONE: "Solved", SOLVING: "Started", TODO: "Marked to do" };

  const doneCount    = statuses.filter((s) => s.status === "DONE").length;
  const totalTracked = sheets.filter((s) => s.isPreset).reduce((sum, s) => sum + s._count.problems, 0);
  const overallPct   = totalTracked > 0 ? Math.round((doneCount / totalTracked) * 100) : 0;

  // Pattern breakdown
  const patternMap: Record<string, { done: number; total: number }> = {};
  for (const s of statuses) {
    const p = s.problem.pattern;
    if (!patternMap[p]) patternMap[p] = { done: 0, total: 0 };
    patternMap[p].total++;
    if (s.status === "DONE") patternMap[p].done++;
  }
  const topPatterns = Object.entries(patternMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const firstName = user.name?.split(" ")[0] ?? "there";
  const greeting  = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const userImage = user.image;

  return (
    <div className="max-w-5xl space-y-6 animate-fade-up">

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-white/3 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {isLocalAvatar(userImage) ? (
                <div className={`w-13 h-13 rounded-full border-2 border-emerald-500/30 flex items-center justify-center shrink-0 ${getAvatarMeta(userImage).bg}`}>
                  <span className="text-2xl">{getAvatarMeta(userImage).emoji}</span>
                </div>
              ) : userImage ? (
                <Image
                  src={userImage}
                  alt={firstName}
                  width={52}
                  height={52}
                  referrerPolicy="no-referrer"
                  className="rounded-full border-2 border-emerald-500/30 shrink-0"
                />
              ) : (
                <div className="w-13 h-13 rounded-full border-2 border-emerald-500/30 bg-neutral-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {firstName[0]}
                </div>
              )}

              <div>
                <p className="text-xs text-neutral-500 mb-0.5">{greeting}</p>
                <h1 className="text-xl font-semibold tracking-heading text-white">{firstName} 👋</h1>
                {user.targetCompany && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Targeting <span className="text-emerald-400 font-medium">{user.targetCompany}</span>
                    {user.experienceLevel && <span> · {user.experienceLevel.charAt(0) + user.experienceLevel.slice(1).toLowerCase()}</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Overall progress ring */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="relative">
                <Ring pct={overallPct} size={64} stroke={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{overallPct}%</span>
                </div>
              </div>
              <span className="text-[10px] text-neutral-500">overall</span>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-500">Total progress</span>
              <span className="text-xs text-neutral-500">{doneCount} / {totalTracked} problems</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {/* Inline stats — folded in from the old Solved/Sheets stat cards */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-neutral-800/60 pt-3 text-xs text-neutral-400">
            <span><span className="font-semibold text-white">{doneCount}</span> solved</span>
            <span><span className="font-semibold text-white">{sheets.length}</span> sheets</span>
            <span><span className="font-semibold text-white">{sheets.filter((s) => !s.isPreset).length}</span> custom</span>
          </div>
        </div>

        {/* ── Continue + Revision queue ── */}
        {(continueItem || reviseList.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {continueItem && (
              <Link
                href={`/dashboard/dsa?sheet=${continueItem.problem.sheetId}`}
                className="group flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/6 p-4 hover:border-emerald-500/40 transition-colors"
              >
                <div className="rounded-xl bg-emerald-500/15 p-2.5 shrink-0">
                  <Play size={16} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-emerald-400">Continue where you left off</p>
                  <p className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                    {continueItem.problem.title}
                  </p>
                  <p className="text-[11px] text-neutral-500">{timeAgo(continueItem.updatedAt)}</p>
                </div>
                <ArrowRight size={14} className="text-neutral-700 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
              </Link>
            )}

            {reviseList.length > 0 && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw size={14} className="text-amber-400" />
                  <p className="font-mono text-[11px] text-amber-400">Revision queue · {reviseList.length}</p>
                </div>
                <div className="space-y-1">
                  {reviseList.slice(0, 3).map((r) => (
                    <Link
                      key={r.problem.id}
                      href={`/dashboard/dsa?sheet=${r.problem.sheetId}`}
                      className="block text-xs text-neutral-300 hover:text-white truncate transition-colors"
                    >
                      • {r.problem.title}
                    </Link>
                  ))}
                  {reviseList.length > 3 && (
                    <p className="text-[11px] text-neutral-500 pt-0.5">+{reviseList.length - 3} more flagged</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Practice modes (compact row) ── */}
        <div>
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Practice</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { href: "/dashboard/dsa",           icon: Code2,           label: "DSA Sheets",    sub: `${doneCount} solved`,             accent: "emerald" },
              { href: "/dashboard/system-design", icon: Network,         label: "System Design", sub: `${sdTotal} qs`,                   accent: "rose" },
              { href: "/dashboard/code-review",   icon: GitPullRequest,  label: "Code Review",   sub: `${CODE_REVIEWS_META.length} PRs`, accent: "emerald" },
              { href: "/dashboard/bug-hunt",      icon: Bug,             label: "Bug Hunt",      sub: `${BUG_HUNTS_META.length} bugs`,   accent: "rose" },
              { href: "/dashboard/build-it",      icon: Blocks,          label: "Build It",      sub: `${BUILD_IT_META.length} builds`,  accent: "emerald" },
              { href: "/dashboard/deep-dives",    icon: BookOpen,        label: "Deep Dives",    sub: `${DEEP_DIVES.length} topics`,     accent: "rose" },
              { href: "/dashboard/mentor",        icon: Sparkles,        label: "AI Mentor",     sub: "Always on",                       accent: "emerald" },
            ].map((m, i) => (
              <Link
                key={m.href}
                href={m.href}
                className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-800 bg-white/3 p-3 text-center hover:border-neutral-700 hover:bg-white/5 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={`rounded-lg p-2 ${m.accent === "emerald" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                  <m.icon size={15} className={m.accent === "emerald" ? "text-emerald-400" : "text-rose-400"} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-tight text-white">{m.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-neutral-500">{m.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Sheets grid ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Your Sheets</h2>
            <Link href="/dashboard/dsa" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* AI build card */}
            <div className="rounded-2xl border border-dashed border-emerald-500/25 bg-emerald-500/5 p-5 flex flex-col gap-2.5 hover:border-emerald-500/50 hover:bg-emerald-500/8 transition-all duration-200 group">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                <p className="text-sm font-semibold text-white">Build a custom sheet</p>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Tell the AI mentor your target company, timeline, or weak patterns and it&apos;ll generate a personalized sheet.
              </p>
              <Link href="/dashboard/mentor" className="inline-flex items-center gap-1 self-start text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors mt-0.5 group-hover:gap-2">
                Ask the mentor <ArrowRight size={11} />
              </Link>
            </div>

            {/* Sheet cards */}
            {sheets.slice(0, 3).map((sheet, i) => {
              const done = statuses.filter((s) => s.problem.sheetId === sheet.id && s.status === "DONE").length;
              const total = sheet._count.problems;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <Link
                  key={sheet.id}
                  href={`/dashboard/dsa?sheet=${sheet.id}`}
                  className="group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 hover:border-neutral-600 hover:bg-neutral-900/80 transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {sheet.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {sheet.isPreset ? "Preset" : "Custom"} · {total} problems
                      </p>
                    </div>
                    <div className="relative">
                      <Ring pct={pct} size={40} stroke={3.5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{pct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-1 rounded-full bg-neutral-800 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{done}/{total} solved</span>
                    <ArrowRight size={12} className="text-neutral-700 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Pattern progress ── */}
        <div className={topPatterns.length > 0 && recent.length > 0 ? "" : "lg:col-span-2"}>
        {topPatterns.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-neutral-500" />
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pattern Breakdown</h2>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 divide-y divide-neutral-800/60">
              {topPatterns.map(([pattern, { done, total }]) => {
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={pattern} className="flex items-center gap-4 px-5 py-3 group hover:bg-neutral-800/20 transition-colors">
                    <span className="w-44 text-xs text-neutral-400 capitalize group-hover:text-neutral-300 transition-colors">
                      {pattern.replace(/_/g, " ").toLowerCase()}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-neutral-500 w-10 text-right">{done}/{total}</span>
                      <span className={`text-[10px] font-medium w-8 text-right ${pct === 100 ? "text-emerald-400" : "text-neutral-500"}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-800 px-5 py-12 text-center">
            <Code2 size={24} className="text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm font-medium">No progress yet</p>
            <p className="text-neutral-500 text-xs mt-1">Start solving problems to see your pattern breakdown here.</p>
            <Link href="/dashboard/dsa" className="inline-flex items-center gap-1 mt-4 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Go to DSA Sheets <ArrowRight size={11} />
            </Link>
          </div>
        )}
        </div>

        {/* ── Recent activity ── */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-neutral-500" />
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recent Activity</h2>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 divide-y divide-neutral-800/60">
              {recent.map((r) => (
                <Link
                  key={r.problem.id + r.updatedAt.toISOString()}
                  href={`/dashboard/dsa?sheet=${r.problem.sheetId}`}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-neutral-800/20 transition-colors group"
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    r.status === "DONE" ? "bg-emerald-400" : r.status === "SOLVING" ? "bg-amber-400" : "bg-neutral-600"
                  }`} />
                  <span className="text-xs text-neutral-300 truncate group-hover:text-white transition-colors flex-1">
                    {r.problem.title}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-600 shrink-0">{statusLabel[r.status] ?? r.status}</span>
                  <span className="text-[10px] text-neutral-500 shrink-0 w-20 text-right">{timeAgo(r.updatedAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>
    </div>
  );
}
