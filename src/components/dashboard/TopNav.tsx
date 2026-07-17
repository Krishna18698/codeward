"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Code2, Network, Sparkles, LogOut, Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import UserAvatar from "@/components/ui/UserAvatar";

const nav = [
  { label: "Home",          href: "/dashboard",               icon: LayoutDashboard },
  { label: "DSA Sheets",    href: "/dashboard/dsa",           icon: Code2 },
  { label: "System Design", href: "/dashboard/system-design", icon: Network },
  { label: "AI Mentor",     href: "/dashboard/mentor",        icon: Sparkles },
];

/** Swaps the nav icon for a same-size spinner while the route loads — instant
 *  click feedback with zero layout shift. Must live inside the <Link>. */
function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  return pending
    ? <Loader2 size={15} className="shrink-0 animate-spin text-emerald-400" />
    : <Icon size={15} className="shrink-0" />;
}

export default function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-neutral-800 bg-black/85 backdrop-blur-[20px]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="mr-2 flex shrink-0 items-center gap-1.5 text-sm font-bold tracking-tight text-white md:mr-5"
        >
          <Sparkles size={13} className="text-emerald-400" />
          <span className="hidden sm:inline">
            Code<span className="text-emerald-400">ward</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex min-w-0 flex-1 items-center gap-0.5 md:gap-1">
          {nav.map(({ label, href, icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150",
                  active
                    ? "text-white bg-white/6"
                    : "text-neutral-400 hover:text-white hover:bg-white/4",
                )}
              >
                <NavIcon icon={icon} />
                <span className="hidden md:inline whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="flex shrink-0 items-center gap-1.5">
          {user && (
            <Link
              href="/dashboard/profile"
              aria-label="Profile"
              aria-current={pathname.startsWith("/dashboard/profile") ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-150",
                pathname.startsWith("/dashboard/profile")
                  ? "bg-white/6"
                  : "hover:bg-white/4",
              )}
            >
              <UserAvatar image={user.image} name={user.name} size={26} />
              <span className="hidden lg:block max-w-[120px] truncate text-xs font-medium text-neutral-300">
                {user.name ?? "Profile"}
              </span>
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white/4 hover:text-neutral-200"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
