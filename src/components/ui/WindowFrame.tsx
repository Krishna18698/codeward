import { cn } from "@/lib/cn";

/**
 * Premium editor-window chrome — mac traffic lights + a context label.
 * Shared by the landing mockups and the real Code Review / Bug Hunt panes so
 * the shipped product looks exactly like the marketing screenshots (no more
 * "cheap knock-off" gap between the two).
 *
 * The body has no built-in padding — callers decide (mockups add `p-4`, the
 * workspaces render their own tab strip + <pre> flush to the edges).
 */
export function WindowFrame({
  label,
  right,
  accent = false,
  className,
  bodyClassName,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  accent?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-surface shadow-[0_24px_70px_-24px_rgba(0,0,0,0.75)]",
        accent ? "border-emerald-500/25" : "border-neutral-800",
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2.5 border-b border-neutral-800 bg-gradient-to-b from-white/[0.055] to-transparent px-3.5 py-2.5">
        <span className="flex shrink-0 gap-2" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-neutral-400">{label}</span>
        {right && <span className="shrink-0">{right}</span>}
      </div>
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  );
}
