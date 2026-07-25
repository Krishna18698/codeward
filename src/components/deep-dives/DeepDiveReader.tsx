"use client";
import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import ArticleMarkdown from "./ArticleMarkdown";
import type { DeepDiveSection } from "@/lib/deepDiveSections";
import type { DeepDiveReference } from "@/content/deep-dives";

type Props = {
  slug: string;
  sections: DeepDiveSection[];
  prerequisites?: string;
  afterThis?: string;
  suggestedFirstPass?: string;
  references?: DeepDiveReference[];
};

export default function DeepDiveReader({ slug, sections, prerequisites, afterThis, suggestedFirstPass, references }: Props) {
  const storageKey = `dd:progress:${slug}`;
  const [done, setDone] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  // Hydrate persisted per-section progress once on mount. Starts empty so the
  // server render and first client render match; localStorage is client-only.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load of client-only persisted state
      if (raw) setDone(new Set(JSON.parse(raw) as number[]));
    } catch {
      /* ignore malformed storage */
    }
  }, [storageKey]);

  const toggleDone = (i: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };
  const toggleOpen = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const completed = done.size;
  const pct = sections.length ? Math.round((completed / sections.length) * 100) : 0;
  const hasGuide = prerequisites || afterThis || suggestedFirstPass || (references && references.length > 0);

  return (
    <div>
      {/* Prerequisites / references guide */}
      {hasGuide && (
        <div className="mb-6 space-y-2 rounded-2xl border border-border bg-surface p-5">
          {prerequisites && <p className="text-sm leading-relaxed text-secondary"><span className="font-semibold text-primary">Prerequisites:</span> {prerequisites}</p>}
          {afterThis && <p className="text-sm leading-relaxed text-secondary"><span className="font-semibold text-primary">After this:</span> {afterThis}</p>}
          {suggestedFirstPass && <p className="text-sm leading-relaxed text-secondary"><span className="font-semibold text-primary">Suggested first pass:</span> {suggestedFirstPass}</p>}
          {references && references.length > 0 && (
            <p className="mt-2 border-t border-border pt-2 text-xs text-muted">
              References:{" "}
              {references.map((r, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-secondary underline underline-offset-2 hover:text-accent">{r.label}</a>
                  ) : (
                    <span className="text-secondary">{r.label}</span>
                  )}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Progress</span>
          <span className="font-mono text-[11px] text-muted">{completed}/{sections.length} complete</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-accent-fill transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Sections */}
      <div className="border-y border-border divide-y divide-border">
        {sections.map((s, i) => {
          const isOpen = open.has(i);
          const isDone = done.has(i);
          return (
            <div key={i}>
              <button onClick={() => toggleOpen(i)} className="group flex w-full items-center gap-3 py-4 text-left">
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]",
                  isDone ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-muted",
                )}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm font-medium text-primary group-hover:text-primary">{s.title}</span>
                <ChevronDown size={14} className={cn("shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="pb-6 pl-9">
                  <ArticleMarkdown body={s.content} />
                  <button
                    onClick={() => toggleDone(i)}
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                      isDone ? "border-accent/30 bg-accent/10 text-accent" : "border-border text-secondary hover:border-border hover:text-primary",
                    )}
                  >
                    <Check size={12} strokeWidth={3} /> {isDone ? "Completed" : "Mark section complete"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
