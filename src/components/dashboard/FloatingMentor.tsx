"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Sparkles, X, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

// The chat pulls in react-markdown + the remark/rehype stack (~100–200 KB). The
// floating mentor sits on every dashboard page but is closed by default, so we
// lazy-load the chat and only fetch that chunk when the panel is first opened.
const MentorChat = dynamic(() => import("./MentorChat"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[calc(520px-49px)] place-items-center font-mono text-xs text-muted">
      Loading mentor…
    </div>
  ),
});

export default function FloatingMentor() {
  const pathname  = usePathname();
  const [open, setOpen]         = useState(false);
  const [minimised, setMinimised] = useState(false);

  // Full-page mentor has its own layout — hide the float there
  if (pathname === "/dashboard/mentor") return null;

  const context =
    pathname.startsWith("/dashboard/dsa")           ? "dsa"
    : pathname.startsWith("/dashboard/system-design") ? "system-design"
    : "dashboard";

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3">

      {/* Expanded panel */}
      {open && (
        <div
          className={cn(
            "w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden",
            "animate-scale-in origin-bottom-right",
            minimised ? "h-auto" : "h-[520px]",
          )}
        >
          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface shrink-0">
            <Sparkles size={13} className="text-accent" />
            <span className="text-sm font-medium text-primary flex-1">AI Mentor</span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent-hover" />
            <button
              onClick={() => setMinimised((v) => !v)}
              title={minimised ? "Expand" : "Minimise"}
              aria-label={minimised ? "Expand AI Mentor" : "Minimise AI Mentor"}
              className="ml-2 text-muted hover:text-secondary transition-colors"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => { setOpen(false); setMinimised(false); }}
              title="Close"
              aria-label="Close AI Mentor"
              className="text-muted hover:text-secondary transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Chat body — hidden when minimised */}
          {!minimised && (
            <MentorChat
              context={context}
              hideHeader
              className="h-[calc(520px-49px)] rounded-none border-0"
              onSheetOpen={() => { setOpen(false); setMinimised(false); }}
            />
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => { setOpen((v) => !v); setMinimised(false); }}
        title={open ? "Close AI Mentor" : "Open AI Mentor"}
        aria-label={open ? "Close AI Mentor" : "Open AI Mentor"}
        aria-expanded={open}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
          "border",
          open
            ? "bg-border border-border text-secondary hover:text-primary"
            : "bg-accent-fill border-accent/50 text-black hover:bg-accent-hover",
        )}
      >
        {open
          ? <X size={18} />
          : <Sparkles size={18} />
        }
      </button>
    </div>
  );
}
