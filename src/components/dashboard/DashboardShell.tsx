"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import FloatingMentor from "@/components/dashboard/FloatingMentor";

export type NavUser = { name: string | null; image: string | null; email: string | null };

/** Client shell for the dashboard. The user is fetched server-side in the
 *  layout and passed in, so the nav's avatar/name render in the SSR HTML
 *  instead of popping in after the client session resolves. */
export default function DashboardShell({ user, children }: { user: NavUser; children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-dvh flex-col bg-canvas text-primary overflow-hidden">
      <TopNav user={user} />

      <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          {children}
        </div>
      </main>

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
