"use client";
import { useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Code2, Network, Sparkles, LogOut, Loader2, BookOpen, GitPullRequest, Bug, Blocks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import UserAvatar from "@/components/ui/UserAvatar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { NavUser } from "@/components/dashboard/DashboardShell";

// Home is the Codeward logo itself (links to /dashboard) — no separate Home item.
const nav = [
  { label: "DSA Sheets",    href: "/dashboard/dsa",           icon: Code2 },
  { label: "System Design", href: "/dashboard/system-design", icon: Network },
  { label: "Code Review",   href: "/dashboard/code-review",   icon: GitPullRequest },
  { label: "Bug Hunt",      href: "/dashboard/bug-hunt",      icon: Bug },
  { label: "Build It",      href: "/dashboard/build-it",      icon: Blocks },
  { label: "Deep Dives",    href: "/dashboard/deep-dives",    icon: BookOpen },
  { label: "AI Mentor",     href: "/dashboard/mentor",        icon: Sparkles },
];

const NAV_LINK_CLASS = "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap";

// Full nav vs. hamburger is a pure CSS breakpoint (measured once: the full nav
// needs ~1092px of row, so it shows at >=1120px and collapses below). Doing it
// in CSS rather than a post-hydration JS measurement means the correct nav is in
// the server-rendered HTML and painted on the first frame — no blank gap on
// desktop reload, and no full-nav-then-hamburger flash on mobile reload.
const SHOW_FULL = "min-[1120px]:flex";     // full nav / desktop profile group
const HIDE_FULL = "min-[1120px]:hidden";   // hamburger

/** Swaps the nav icon for a same-size spinner while the route loads — instant
 *  click feedback with zero layout shift. Must live inside the <Link>. */
function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  return pending
    ? <Loader2 size={13} className="shrink-0 animate-spin text-accent" />
    : <Icon size={13} className="shrink-0" />;
}

/** Three-bar hamburger that morphs into an X — each bar animates its own
 *  transform/opacity, rather than swapping between two unrelated icons. */
function HamburgerIcon({ open }: { open: boolean }) {
  const bar = "absolute h-[1.5px] w-[18px] rounded-full bg-current transition-all duration-300 ease-in-out";
  return (
    <span className="relative flex h-[18px] w-[18px] items-center justify-center">
      <span className={cn(bar, open ? "rotate-45" : "-translate-y-[5px]")} />
      <span className={cn(bar, "transition-opacity", open ? "opacity-0" : "opacity-100")} />
      <span className={cn(bar, open ? "-rotate-45" : "translate-y-[5px]")} />
    </span>
  );
}

export default function TopNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-canvas/85 backdrop-blur-[20px]">
      <div className="flex h-14 w-full items-center gap-3 px-4 md:px-6">
        {/* Brand (also the Home link) — far left */}
        <Link
          href="/dashboard"
          aria-label="Codeward home"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-primary"
        >
          <Sparkles size={19} className="text-accent" />
          <span>
            Code<span className="text-accent">ward</span>
          </span>
        </Link>

        {/* Full nav — shown only at >=1120px (CSS). Hidden below, so it never
            paints on mobile. */}
        <nav className={cn("hidden min-w-0 flex-1 items-center justify-end gap-1", SHOW_FULL)}>
          {nav.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  NAV_LINK_CLASS,
                  "transition-colors duration-150",
                  active
                    ? "text-primary bg-primary/6"
                    : "text-secondary hover:text-primary hover:bg-primary/5",
                )}
              >
                <NavIcon icon={icon} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right-fixed group. ml-auto pushes it right on mobile (where the
            flex-1 nav above is hidden); on desktop the nav's flex-1 already
            fills the gap, so ml-auto is a no-op. */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {/* Theme toggle — always visible. */}
          <ThemeToggle className="border-0" />

          {/* Desktop: profile + sign out */}
          <div className={cn("hidden items-center gap-1.5", SHOW_FULL)}>
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <Link
              href="/dashboard/profile"
              aria-label="Profile"
              aria-current={pathname.startsWith("/dashboard/profile") ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-150",
                pathname.startsWith("/dashboard/profile") ? "bg-primary/6" : "hover:bg-primary/5",
              )}
            >
              <UserAvatar image={user.image} name={user.name} size={26} />
              <span className="max-w-[120px] truncate text-xs font-medium text-secondary">
                {user.name ?? "Profile"}
              </span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile: hamburger + dropdown (below the breakpoint). The dropdown
              anchors to the button's own edge via this relative wrapper. */}
          <div className={cn("relative", HIDE_FULL)}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <HamburgerIcon open={menuOpen} />
            </button>

            {menuOpen && (
              <>
                <button
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40"
                />
                <nav className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-[8px] border border-border bg-elevated py-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
                  {nav.map(({ label, href }) => {
                    const active = pathname === href || pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block px-4 py-3 text-sm transition-colors duration-150",
                          active
                            ? "text-primary bg-primary/6"
                            : "text-secondary hover:text-primary hover:bg-primary/5",
                        )}
                      >
                        {label}
                      </Link>
                    );
                  })}

                  <div className="my-1.5 h-px bg-border" />
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMenuOpen(false)}
                    aria-current={pathname.startsWith("/dashboard/profile") ? "page" : undefined}
                    className={cn(
                      "block px-4 py-3 text-sm transition-colors duration-150",
                      pathname.startsWith("/dashboard/profile")
                        ? "text-primary bg-primary/6"
                        : "text-secondary hover:text-primary hover:bg-primary/5",
                    )}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-secondary transition-colors duration-150 hover:bg-primary/5 hover:text-primary"
                  >
                    Sign out
                  </button>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
