"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const WORDS = ["DSA", "system design", "debugging", "code review"];

/** Crossfades through a fixed set of words in place. Grid-stacks every word
 *  in the same cell so the container width settles on the widest one instead
 *  of jumping around as shorter/longer words cycle in. Stops rotating (and
 *  just shows the first word) under prefers-reduced-motion. */
export default function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-grid align-bottom text-left">
      <span aria-hidden className="col-start-1 row-start-1 grid">
        {WORDS.map((word, i) => (
          <span
            key={word}
            className={cn(
              "col-start-1 row-start-1 whitespace-nowrap transition-all duration-500 ease-out",
              i === index ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2",
            )}
          >
            {word}
            <span className="motion-safe:animate-pulse">_</span>
          </span>
        ))}
      </span>
      <span className="sr-only">{WORDS[index]}</span>
    </span>
  );
}
