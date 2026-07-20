"use client";
import { useState, useRef, useLayoutEffect } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Code2, Network, Sparkles, LogOut, Loader2, BookOpen, GitPullRequest, Bug,
  Menu, X, type LucideIcon,
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

const NAV_LINK_CLASS = "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap";

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
  const [menuOpen, setMenuOpen] = useState(false);

  // Full text+icon nav vs. hamburger is decided by actually measuring whether
  // the nav's natural width fits the space available — no guessed breakpoint,
  // and no in-between icon-only state.
  const slotRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    const measure = measureRef.current;
    if (!slot || !measure) return;
    const check = () => setFits(measure.scrollWidth <= slot.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(slot);
    ro.observe(measure);
    return () => ro.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-neutral-800 bg-black/85 backdrop-blur-[20px]">
      <div className="flex h-14 w-full items-center gap-3 px-4 md:px-6">
        {/* Brand (also the Home link) — far left */}
        <Link
          href="/dashboard"
          aria-label="Codeward home"
          className="flex shrink-0 items-center gap-1.5 text-sm font-bold tracking-tight text-white"
        >
          <Sparkles size={14} className="text-emerald-400" />
          <span>
            Code<span className="text-emerald-400">ward</span>
          </span>
        </Link>

        {/* Nav slot — sized by flexbox from whatever's left; holds the full
            nav only when it actually fits (measured, not guessed). */}
        <div ref={slotRef} className="flex min-w-0 flex-1 items-center overflow-hidden">
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
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 -z-10 flex items-center gap-1"
        >
          {nav.map(({ label, href, icon: Icon }) => (
            <span key={href} className={NAV_LINK_CLASS}>
              <Icon size={15} className="shrink-0" />
              {label}
            </span>
          ))}
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
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          )}

          {/* Divider */}
          <span className="mx-1 hidden h-5 w-px bg-neutral-800 sm:block" />

          {/* User + sign out */}
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

      {/* Nav dropdown — shown whenever the full nav doesn't fit, at any width */}
      {!fits && menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40"
          />
          <nav className="absolute inset-x-4 top-[calc(100%+8px)] z-40 rounded-xl border border-neutral-800 bg-black/95 p-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:inset-x-auto sm:right-4 sm:w-64">
            {nav.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                    active
                      ? "text-white bg-white/6"
                      : "text-neutral-400 hover:text-white hover:bg-white/4",
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </header>
  );
}
