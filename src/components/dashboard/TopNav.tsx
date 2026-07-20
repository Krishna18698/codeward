"use client";
import { useState, useRef, useLayoutEffect } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Code2, Network, Sparkles, LogOut, Loader2, BookOpen, GitPullRequest, Bug,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import UserAvatar from "@/components/ui/UserAvatar";

// Home is the Codeward logo itself (links to /dashboard) — no separate Home item.
const nav = [
  { label: "DSA Sheets",    href: "/dashboard/dsa",           icon: Code2 },
  { label: "System Design", href: "/dashboard/system-design", icon: Network },
  { label: "Code Review",   href: "/dashboard/code-review",   icon: GitPullRequest },
  { label: "Bug Hunt",      href: "/dashboard/bug-hunt",      icon: Bug },
  { label: "Deep Dives",    href: "/dashboard/deep-dives",    icon: BookOpen },
  { label: "AI Mentor",     href: "/dashboard/mentor",        icon: Sparkles },
];

const NAV_LINK_CLASS = "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap";

/** Swaps the nav icon for a same-size spinner while the route loads — instant
 *  click feedback with zero layout shift. Must live inside the <Link>. */
function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  return pending
    ? <Loader2 size={13} className="shrink-0 animate-spin text-emerald-400" />
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

export default function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [menuOpen, setMenuOpen] = useState(false);

  // Full text+icon nav vs. hamburger is decided by actually measuring whether
  // the nav's natural width fits the space available.
  //
  // Critically, the "available space" must NOT depend on which of {hamburger}
  // vs {profile + sign-out} is currently rendered — that would make the
  // measurement depend on its own prior output (hamburger appears -> shrinks
  // available space -> triggers a re-check -> ...), which is what caused the
  // flicker: rapid, self-inflicted true/false flips during a resize drag.
  // So we measure against row/logo/right-group widths that never change
  // because of `fits` itself — the right-group figure always comes from an
  // off-screen clone of its widest (profile+sign-out) form, never the live
  // toggling DOM.
  const rowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navMeasureRef = useRef<HTMLDivElement>(null);
  const rightMeasureRef = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const logo = logoRef.current;
    const navMeasure = navMeasureRef.current;
    const rightMeasure = rightMeasureRef.current;
    if (!row || !logo || !navMeasure || !rightMeasure) return;
    const check = () => {
      // clientWidth includes the row's own padding (px-4/md:px-6), which
      // isn't space the flex children can use — has to be subtracted, or
      // "available" is overestimated by the full padding amount and the
      // first nav item gets clipped instead of the row ever flipping to
      // the hamburger. Measuring padding/gap live instead of assuming a
      // fixed px value keeps this correct if either class ever changes.
      const rowStyle = getComputedStyle(row);
      const paddingX = parseFloat(rowStyle.paddingLeft) + parseFloat(rowStyle.paddingRight);
      const gap = parseFloat(rowStyle.columnGap || rowStyle.gap) || 0;
      const contentWidth = row.clientWidth - paddingX;
      const available = contentWidth - logo.offsetWidth - rightMeasure.offsetWidth - gap * 2;
      setFits(navMeasure.scrollWidth <= available);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(row);
    ro.observe(logo);
    ro.observe(navMeasure);
    ro.observe(rightMeasure);
    return () => ro.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-neutral-800 bg-black/85 backdrop-blur-[20px]">
      <div ref={rowRef} className="flex h-14 w-full items-center gap-3 px-4 md:px-6">
        {/* Brand (also the Home link) — far left */}
        <Link
          ref={logoRef}
          href="/dashboard"
          aria-label="Codeward home"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-white"
        >
          <Sparkles size={19} className="text-emerald-400" />
          <span>
            Code<span className="text-emerald-400">ward</span>
          </span>
        </Link>

        {/* Nav slot — sized by flexbox from whatever's left; holds the full
            nav only when it actually fits (measured, not guessed). */}
        <div className="flex min-w-0 flex-1 items-center justify-end overflow-hidden">
          {fits && (
            <nav className="flex items-center gap-1">
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
                        ? "text-white bg-white/6"
                        : "text-neutral-400 hover:text-white hover:bg-white/4",
                    )}
                  >
                    <NavIcon icon={icon} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Off-screen clone of the nav at its natural (unshrunk) width — used
            purely to measure whether the real nav above would fit. */}
        <div
          ref={navMeasureRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 -z-10 flex items-center gap-1"
        >
          {nav.map(({ label, href, icon: Icon }) => (
            <span key={href} className={NAV_LINK_CLASS}>
              <Icon size={13} className="shrink-0" />
              {label}
            </span>
          ))}
        </div>

        {/* Off-screen clone of the profile+sign-out group (its widest form) —
            used to compute available nav space independent of which control
            (this vs. the hamburger) is actually visible right now. */}
        <div
          ref={rightMeasureRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 -z-10 flex items-center gap-1.5"
        >
          <span className="mx-1 h-5 w-px bg-neutral-800" />
          {user && (
            <span className="flex items-center gap-2 rounded-lg px-1.5 py-1">
              <UserAvatar image={user.image} name={user.name} size={26} />
              <span className="max-w-[120px] truncate text-xs font-medium">{user.name ?? "Profile"}</span>
            </span>
          )}
          <span className="flex h-8 w-8 items-center justify-center rounded-lg">
            <LogOut size={15} />
          </span>
        </div>

        {/* Right-fixed group */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Hamburger — only when the full nav doesn't fit */}
          {!fits && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/4 hover:text-white"
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          )}

          {/* User + sign out — hidden in hamburger mode, since Profile and
              Sign out already live as text entries in that dropdown. */}
          {fits && (
            <>
              <span className="mx-1 hidden h-5 w-px bg-neutral-800 sm:block" />
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
                  <span className="max-w-[120px] truncate text-xs font-medium text-neutral-300">
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
            </>
          )}
        </div>
      </div>

      {/* Nav dropdown — shown whenever the full nav doesn't fit, at any width */}
      {!fits && menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40"
          />
          <nav className="absolute inset-x-4 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-neutral-800 bg-black/95 py-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:inset-x-auto sm:right-4 sm:w-56">
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
                      ? "text-white bg-white/6"
                      : "text-neutral-400 hover:text-white hover:bg-white/4",
                  )}
                >
                  {label}
                </Link>
              );
            })}

            {user && (
              <>
                <div className="my-1.5 h-px bg-neutral-800" />
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname.startsWith("/dashboard/profile") ? "page" : undefined}
                  className={cn(
                    "block px-4 py-3 text-sm transition-colors duration-150",
                    pathname.startsWith("/dashboard/profile")
                      ? "text-white bg-white/6"
                      : "text-neutral-400 hover:text-white hover:bg-white/4",
                  )}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full px-4 py-3 text-left text-sm text-neutral-400 transition-colors duration-150 hover:bg-white/4 hover:text-white"
                >
                  Sign out
                </button>
              </>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
