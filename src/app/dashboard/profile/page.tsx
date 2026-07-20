import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { User, Target } from "lucide-react";
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
      <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-400">Profile</p>

      {/* Flat, borderless layout — a single vertical rule splits identity from
          the editor, no nested card boxes (matches the landing page's editorial feel). */}
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:divide-x lg:divide-neutral-800">
        {/* ── Left: identity ── */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:pr-8">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                width={56}
                height={56}
                referrerPolicy="no-referrer"
                className="shrink-0 rounded-xl border border-neutral-800 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-lg font-bold text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-heading text-white">
                {user.name ?? "No name set"}
              </h2>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>

          {(user.experienceLevel || user.targetCompany) && (
            <div className="flex flex-wrap items-center gap-2">
              {user.experienceLevel && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <User size={10} />
                  {user.experienceLevel.charAt(0) + user.experienceLevel.slice(1).toLowerCase()}
                </span>
              )}
              {user.experienceLevel && user.targetCompany && (
                <span className="text-neutral-700">·</span>
              )}
              {user.targetCompany && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-rose-400">
                  <Target size={10} />
                  {user.targetCompany}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 border-t border-neutral-800 pt-5">
            <div>
              <p className="text-xl font-bold text-white">{user._count.problemStatuses}</p>
              <p className="font-mono text-[11px] text-neutral-500">Attempts</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{user._count.customSheets}</p>
              <p className="font-mono text-[11px] text-neutral-500">Sheets</p>
            </div>
          </div>
        </aside>

        {/* ── Right: editor ── */}
        <div className="lg:pl-8">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-widest text-neutral-500">Account details</p>
          <ProfileForm user={{ name: user.name, email: user.email, image: user.image, experienceLevel: user.experienceLevel, targetCompany: user.targetCompany }} />
        </div>
      </div>
    </div>
  );
}
