import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { User, Target, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, image: true,
      experienceLevel: true, targetCompany: true,
      _count: { select: { problemStatuses: true, customSheets: true } },
    },
  });
  if (!user) redirect("/login");

  const initials = (user.name ?? "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header — matches the other dashboard sections */}
      <div>
        <p className="font-mono text-[13px] text-emerald-400 mb-2">Profile</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white">
          Your account &amp; study preferences
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-xl">
          Set your experience level and target company — the AI mentor uses them to
          shape your sheets, pattern picks, and system-design depth.
        </p>
      </div>

      {/* Dashboard layout: summary rail (left) + editor (right) */}
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        {/* ── Left rail ── */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          {/* Identity card */}
          <div className="rounded-2xl border border-neutral-800 bg-white/3 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "avatar"}
                    width={80}
                    height={80}
                    referrerPolicy="no-referrer"
                    className="rounded-2xl border-2 border-neutral-700 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-neutral-700 bg-neutral-800 text-2xl font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-neutral-900 bg-emerald-400" />
              </div>
              <h2 className="mt-3 truncate text-base font-semibold tracking-heading text-white">
                {user.name ?? "No name set"}
              </h2>
              <p className="max-w-full truncate text-xs text-neutral-500">{user.email}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {user.experienceLevel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                    <User size={10} />
                    {user.experienceLevel.charAt(0) + user.experienceLevel.slice(1).toLowerCase()}
                  </span>
                )}
                {user.targetCompany && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-400">
                    <Target size={10} />
                    {user.targetCompany}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-800 pt-4">
              <div className="rounded-xl border border-neutral-800 bg-black/20 py-3 text-center">
                <p className="text-2xl font-bold text-white">{user._count.problemStatuses}</p>
                <p className="text-[11px] text-neutral-500">Attempts</p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-black/20 py-3 text-center">
                <p className="text-2xl font-bold text-white">{user._count.customSheets}</p>
                <p className="text-[11px] text-neutral-500">Sheets</p>
              </div>
            </div>
          </div>

          {/* AI mentor tip */}
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed text-neutral-400">
              Keeping these current means every generated sheet and mentor answer is
              tuned to where you are and where you&apos;re headed.
            </p>
          </div>
        </aside>

        {/* ── Right: editor ── */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="mb-5 text-sm font-semibold text-neutral-300">Edit profile</h2>
          <ProfileForm user={{ name: user.name, email: user.email, image: user.image, experienceLevel: user.experienceLevel, targetCompany: user.targetCompany }} />
        </div>
      </div>
    </div>
  );
}
