import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { User, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/dashboard/ProfileForm";
import { isLocalAvatar, getAvatarMeta } from "@/lib/avatar";

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
      <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Profile</p>

      {/* Flat, single-column stack — few enough items that a two-column split
          just wasted space. Top to bottom: identity, tags, stats, then account details. */}
      <div className="max-w-md space-y-6">
        <div className="flex items-center gap-4">
          {isLocalAvatar(user.image) ? (
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border ${getAvatarMeta(user.image).bg}`}>
              <span className="text-2xl">{getAvatarMeta(user.image).emoji}</span>
            </div>
          ) : user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "avatar"}
              width={56}
              height={56}
              referrerPolicy="no-referrer"
              className="shrink-0 rounded-xl border border-border object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-lg font-bold text-primary">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-heading text-primary">
              {user.name ?? "No name set"}
            </h2>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>

        {(user.experienceLevel || user.targetCompany) && (
          <div className="flex flex-wrap items-center gap-2">
            {user.experienceLevel && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-accent">
                <User size={10} />
                {user.experienceLevel.charAt(0) + user.experienceLevel.slice(1).toLowerCase()}
              </span>
            )}
            {user.experienceLevel && user.targetCompany && (
              <span className="text-muted">·</span>
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
        <div className="flex gap-6 border-t border-border pt-5">
          <div>
            <p className="text-xl font-bold text-primary">{user._count.problemStatuses}</p>
            <p className="font-mono text-[11px] text-muted">Attempts</p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary">{user._count.customSheets}</p>
            <p className="font-mono text-[11px] text-muted">Sheets</p>
          </div>
        </div>

        {/* Account details — ProfileForm owns its own header + Edit button,
            right above the fields it toggles. */}
        <div className="border-t border-border pt-5">
          <ProfileForm user={{ name: user.name, email: user.email, image: user.image, experienceLevel: user.experienceLevel, targetCompany: user.targetCompany }} />
        </div>
      </div>
    </div>
  );
}
