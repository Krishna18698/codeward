"use client";
import { useState } from "react";
import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import UserAvatar from "@/components/ui/UserAvatar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { NavUser } from "@/components/dashboard/DashboardShell";
import { NAV_ITEMS } from "@/content/nav";

// Home is the Codeward logo itself (links to /dashboard) — no separate Home item.
// The list is shared with NavRail so a new mode can't appear in one nav only.
const nav = NAV_ITEMS;

/** Three-bar hamburger that morphs into an X — each bar animates its own
 *  transform/opacity, rather than swapping between two unrelated icons. */
function HamburgerIcon({ open }: { open: boolean }) {
  const bar = "absolute h-[1.5px] w-[18px] rounded-full bg-current transition-[transform,opacity] duration-300 ease-in-out";
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
    // Below 1120px only — NavRail is the navigation at and above that width.
    // Same breakpoint the full nav already used, so nothing new is measured.
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-canvas/85 backdrop-blur-[20px] min-[1120px]:hidden">
      <div className="flex h-14 w-full items-center gap-3 px-4 md:px-6">
        {/* Brand (also the Home link) — far left */}
        <Link
          href="/dashboard"
          aria-label="Codeward home"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-primary"
        >
          <Logo size={19} className="text-accent" />
          <span>
            Code<span className="text-accent">ward</span>
          </span>
        </Link>

        {/* Right-fixed group. ml-auto pushes it right on mobile (where the
            flex-1 nav above is hidden); on desktop the nav's flex-1 already
            fills the gap, so ml-auto is a no-op. */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {/* Theme toggle — always visible. */}
          <ThemeToggle className="border-0" />

          {/* Mobile: hamburger + dropdown (below the breakpoint). The dropdown
              anchors to the button's own edge via this relative wrapper. */}
          <div className="relative">
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
                {/* `topnav-menu` sets the right offset — the header's padding
                    is narrower than the content column's and misses main's
                    scrollbar gutter, so `right-0` overhung the cards below.
                    Rows are inset from the panel edge rather than full-bleed:
                    at this corner radius a full-width highlight collides with
                    the curve. */}
                <nav className="topnav-menu absolute top-[calc(100%+8px)] z-40 w-56 rounded-[20px] border border-border bg-overlay p-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
                  {nav.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm transition-colors duration-150",
                          active
                            ? "bg-accent/10 text-accent"
                            : "text-secondary hover:bg-primary/5 hover:text-primary",
                        )}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="truncate">{label}</span>
                      </Link>
                    );
                  })}

                  <div className="my-1.5 h-px bg-border" />
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMenuOpen(false)}
                    aria-current={pathname.startsWith("/dashboard/profile") ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm transition-colors duration-150",
                      pathname.startsWith("/dashboard/profile")
                        ? "bg-accent/10 text-accent"
                        : "text-secondary hover:bg-primary/5 hover:text-primary",
                    )}
                  >
                    <UserAvatar image={user.image} name={user.name} size={20} />
                    <span className="truncate">{user.name ?? "Profile"}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm text-secondary transition-colors duration-150 hover:bg-primary/5 hover:text-primary"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span>Sign out</span>
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
