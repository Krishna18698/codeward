import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Code2, Network, Sparkles, TrendingUp, Target, BookOpen, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getDashboardData(userId: string) {
  const [sheets, statuses, sdTotal] = await Promise.all([
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
  ]);
  return { sheets, statuses, sdTotal };
}

// SVG circular progress ring
function Ring({ pct, size = 56, stroke = 4, color = "#34d399" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262626" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [user, { sheets, statuses, sdTotal }] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true, targetCompany: true, experienceLevel: true },
    }),
    getDashboardData(userId),
  ]);
  if (!user) redirect("/login");

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
    <div className="max-w-3xl space-y-6 animate-fade-up">

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900 via-neutral-900/95 to-emerald-950/40 p-6">
          {/* Background accent */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
               style={{ background: "radial-gradient(ellipse 80% 80% at 100% 50%, rgba(52, 211, 153,0.08) 0%, transparent 70%)" }} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {userImage ? (
                <Image
                  src={userImage}
                  alt={firstName}
                  width={52}
                  height={52}
                  referrerPolicy="no-referrer"
                  className="rounded-full border-2 border-emerald-500/30 shrink-0"
                />
              ) : (
                <div className="w-13 h-13 rounded-full border-2 border-emerald-500/30 bg-linear-to-br from-emerald-500/20 to-rose-500/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {firstName[0]}
                </div>
              )}

              <div>
                <p className="text-xs text-neutral-500 mb-0.5">{greeting}</p>
                <h1 className="text-xl font-bold text-white">{firstName} 👋</h1>
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
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Solved",
              value: doneCount,
              icon: Target,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20",
              ring: "#34d399",
              sub: doneCount > 0 ? `${overallPct}% of tracked` : "Get started!",
            },
            {
              label: "Sheets",
              value: sheets.length,
              icon: BookOpen,
              color: "text-rose-400",
              bg: "bg-rose-500/10",
              border: "border-rose-500/20",
              ring: "#fb7185",
              sub: `${sheets.filter(s => !s.isPreset).length} custom`,
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`relative overflow-hidden rounded-2xl border ${stat.border} bg-neutral-900/60 p-5 animate-fade-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-xl p-2 ${stat.bg}`}>
                  <stat.icon size={16} className={stat.color} />
                </div>
                <Ring pct={stat.label === "Solved" ? overallPct : stat.label === "Sheets" ? Math.min(100, (stat.value / 5) * 100) : Math.min(100, (stat.value / 5) * 100)} size={36} stroke={3} color={stat.ring} />
              </div>
              <p className={`text-3xl font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
              <p className="text-xs font-medium text-neutral-300">{stat.label}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Quick nav ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/dashboard/dsa"
            className="group flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-emerald-500/30 hover:bg-neutral-900/80 transition-all duration-200"
          >
            <div className="rounded-xl bg-emerald-500/10 p-3 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <Code2 size={20} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">DSA Practice</p>
              <p className="text-xs text-neutral-500 truncate">{doneCount} solved</p>
            </div>
            <ArrowRight size={14} className="text-neutral-700 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
          </Link>

          <Link
            href="/dashboard/system-design"
            className="group flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-rose-500/30 hover:bg-neutral-900/80 transition-all duration-200"
          >
            <div className="rounded-xl bg-rose-500/10 p-3 shrink-0 group-hover:bg-rose-500/20 transition-colors">
              <Network size={20} className="text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">System Design</p>
              <p className="text-xs text-neutral-500 truncate">{sdTotal} questions · 3 levels</p>
            </div>
            <ArrowRight size={14} className="text-neutral-700 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
          </Link>
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

        {/* ── Pattern progress ── */}
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
  );
}
