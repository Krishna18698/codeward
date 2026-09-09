"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";
import NavRail from "@/components/dashboard/NavRail";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import FloatingMentor from "@/components/dashboard/FloatingMentor";

export type NavUser = { name: string | null; image: string | null; email: string | null };

/** Client shell for the dashboard. The user is fetched server-side in the
 *  layout and passed in, so the nav's avatar/name render in the SSR HTML
 *  instead of popping in after the client session resolves. */
export default function DashboardShell({ user, children }: { user: NavUser; children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Routes that own the whole viewport rather than sitting in the page column.
  const fullBleed = pathname.startsWith("/dashboard/mentor");

  useEffect(() => {
    if (typeof window !== "undefined") {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    // Row at >=1120px (rail beside the content), column below (bar above it).
    <div className="flex h-dvh bg-canvas text-primary overflow-hidden">
      <NavRail user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav user={user} />

        <main
          ref={mainRef}
          className={fullBleed ? "min-h-0 flex-1 overflow-hidden" : "flex-1 overflow-y-auto"}
          style={fullBleed ? undefined : { scrollbarGutter: "stable" }}
        >
          {/* Full-bleed routes get the raw main element. They used to cancel the
              container with negative margins, which can undo the padding but NOT
              the max-w centering — so on any screen wider than 1440 every border
              stopped short of the edge. Opting out is the only correct fix.

              Otherwise: was max-w-6xl, which left ~352px of empty gutter at 1440.
              The extra width is absorbed by PageWithRail, not by longer lines. */}
          {fullBleed ? children : (
            <div className="mx-auto w-full max-w-[1440px] p-4 md:px-10 md:py-8">
              {children}
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Mentor */}
      <FloatingMentor />

      {/* Onboarding — fetch lazily via API so this stays client-side */}
      <OnboardingGate email={user.email} />
    </div>
  );
}

function OnboardingGate({ email }: { email: string | null }) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((u) => { if (!cancelled) setNeedsOnboarding(!u.onboarded); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [email]);

  if (!needsOnboarding) return null;
  return <OnboardingModal onDone={() => setNeedsOnboarding(false)} />;
}
