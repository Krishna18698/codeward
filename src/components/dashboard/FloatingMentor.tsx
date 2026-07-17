"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import MentorChat from "./MentorChat";

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
            "w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-neutral-700/60 bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden",
            "animate-scale-in origin-bottom-right",
            minimised ? "h-auto" : "h-[520px]",
          )}
        >
          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900/60 shrink-0">
            <Sparkles size={13} className="text-emerald-400" />
            <span className="text-sm font-medium text-white flex-1">AI Mentor</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <button
              onClick={() => setMinimised((v) => !v)}
              title={minimised ? "Expand" : "Minimise"}
              aria-label={minimised ? "Expand AI Mentor" : "Minimise AI Mentor"}
              className="ml-2 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => { setOpen(false); setMinimised(false); }}
              title="Close"
              aria-label="Close AI Mentor"
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
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
          "shadow-[0_4px_24px_rgba(52, 211, 153,0.35)] border",
          open
            ? "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200"
            : "bg-emerald-500 border-emerald-400/50 text-white hover:bg-emerald-400",
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
