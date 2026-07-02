import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { User, Target, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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
    <div className="max-w-2xl space-y-6 animate-fade-up">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900 to-slate-900/80 p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(14,165,233,0.06) 0%, transparent 70%)" }}
        />
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                width={80}
                height={80}
                referrerPolicy="no-referrer"
                className="rounded-2xl border-2 border-slate-700 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-linear-to-br from-sky-500/30 to-indigo-500/30 flex items-center justify-center text-2xl font-bold text-white">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user.name ?? "No name set"}</h1>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {user.experienceLevel && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 border border-sky-500/30 bg-sky-500/10 rounded-full px-2.5 py-0.5">
                  <User size={10} />
                  {user.experienceLevel.charAt(0) + user.experienceLevel.slice(1).toLowerCase()}
                </span>
              )}
              {user.targetCompany && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-400 border border-violet-500/30 bg-violet-500/10 rounded-full px-2.5 py-0.5">
                  <Target size={10} />
                  {user.targetCompany}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user._count.problemStatuses}</p>
              <p className="text-[11px] text-slate-500">Attempts</p>
            </div>
            <div className="w-px bg-slate-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user._count.customSheets}</p>
              <p className="text-[11px] text-slate-500">Sheets</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI mentor tip */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <Sparkles size={14} className="text-sky-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Your experience level and target company help the AI mentor tailor your study plan, pattern recommendations, and system design depth.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5">Edit profile</h2>
        <ProfileForm user={{ name: user.name, email: user.email, image: user.image, experienceLevel: user.experienceLevel, targetCompany: user.targetCompany }} />
      </div>
    </div>
  );
}
