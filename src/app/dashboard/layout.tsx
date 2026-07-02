"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { redirect } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import FloatingMentor from "@/components/dashboard/FloatingMentor";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
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
    <div className="flex h-dvh bg-canvas text-slate-100 overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-canvas shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold text-white">
            Code<span className="text-sky-400">ward</span>
          </span>
          {/* Spacer keeps the logo centered now that the icon is removed */}
          <span className="w-5" aria-hidden />
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 md:p-8" style={{ scrollbarGutter: "stable" }}>
          {children}
        </main>
      </div>

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
