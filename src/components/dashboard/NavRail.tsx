"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Loader2, type LucideIcon } from "lucide-react";
import Logo from "@/components/ui/Logo";
import UserAvatar from "@/components/ui/UserAvatar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/content/nav";
import type { NavUser } from "@/components/dashboard/DashboardShell";

/** Vertical icon rail — the desktop navigation.
 *
 *  Seven modes plus brand, theme, avatar and sign-out had outgrown a 57px
 *  horizontal bar: it was crowded at 1440 and hidden entirely below 1120. A rail
 *  carries the same items vertically, has room for an eighth mode, and hands the
 *  horizontal space back to the page content.
 *
 *  Shown only at >=960px. Below that TopNav's bar and hamburger are untouched —
 *  the same CSS breakpoint the nav already used, so the correct navigation is in
 *  the server-rendered HTML on the first frame with no hydration flash. */

/** Swaps the icon for a same-size spinner while the route loads. Must be
 *  rendered inside the <Link> for useLinkStatus to see it. */
function RailIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  return pending
    ? <Loader2 size={18} className="animate-spin text-accent" />
    : <Icon size={18} />;
}

export default function NavRail({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/dashboard/profile");

  return (
    <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-4 min-[960px]:flex">
      <Link
        href="/dashboard"
        aria-label="Codeward home"
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-colors hover:bg-accent/20"
      >
        <Logo size={20} />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150",
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-elevated hover:text-primary",
              )}
            >
              <RailIcon icon={icon} />

              {/* Label on hover — the rail is icon-only, so the name has to be
                  reachable without a click. pointer-events-none so it can never
                  sit between the cursor and the link. */}
              <span className="pointer-events-none absolute left-[calc(100%+8px)] z-50 hidden whitespace-nowrap rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs text-primary shadow-[0_8px_24px_rgba(0,0,0,0.35)] group-hover:block">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1.5 border-t border-border pt-3">
        <ThemeToggle className="border-0" />
        <Link
          href="/dashboard/profile"
          title={user.name ?? "Profile"}
          aria-label="Profile"
          aria-current={onProfile ? "page" : undefined}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            onProfile ? "bg-accent/15" : "hover:bg-elevated",
          )}
        >
          <UserAvatar image={user.image} name={user.name} size={26} />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-elevated hover:text-primary"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
