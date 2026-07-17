"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { redirect } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import FloatingMentor from "@/components/dashboard/FloatingMentor";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
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

  // Redirect if not authed (server already gates each page, this is a client-side backup).
  // Note: we intentionally do NOT blank the layout while the session is resolving —
  // the page content is server-rendered and ready, so render it immediately.
  if (status === "unauthenticated") redirect("/login");

  return (
    <div className="flex h-dvh flex-col bg-canvas text-neutral-100 overflow-hidden">
      <TopNav />

      <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Floating AI Mentor */}
      <FloatingMentor />

      {/* Onboarding — fetch lazily via API so layout stays client-side */}
      <OnboardingGate session={session} />
    </div>
  );
}

function OnboardingGate({ session }: { session: ReturnType<typeof useSession>["data"] }) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const email = session?.user?.email;

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
