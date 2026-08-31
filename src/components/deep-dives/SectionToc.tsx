"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** "On this page" section nav with scroll-spy. Observes the `#dd-section-N`
 *  wrappers rendered by DeepDiveReader — no shared React state needed. */
export default function SectionToc({ titles }: { titles: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = titles
      .map((_, i) => document.getElementById(`dd-section-${i}`))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const idx = Number(visible[0].target.id.split("-").pop());
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      // Activate a section once its top enters the upper band of the viewport.
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // Re-observe only when the number of sections changes; `titles` is a fresh
    // array each render, so depending on it would re-run the effect needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titles.length]);

  const go = (i: number) =>
    document.getElementById(`dd-section-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <nav>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">On this page</p>
      <div className="space-y-0.5">
        {titles.map((t, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-current={i === active ? "true" : undefined}
            className={cn(
              "flex w-full items-baseline gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
              i === active ? "bg-primary/6 text-primary" : "text-muted hover:bg-primary/5 hover:text-secondary",
            )}
          >
            <span className="font-mono text-[10px] text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span className="truncate">{t}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
