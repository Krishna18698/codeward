"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/** Shows a ✓ on catalog cards for articles the user has opened (localStorage). */
export default function ReadBadge({ slug }: { slug: string }) {
  const [read, setRead] = useState(false);

  useEffect(() => {
    try {
      setRead(localStorage.getItem(`deepdive-read:${slug}`) === "1");
    } catch {}
  }, [slug]);

  if (!read) return null;
  return (
    <span
      title="Read"
      className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400"
    >
      <Check size={9} strokeWidth={3} /> read
    </span>
  );
}

/** Invisible marker — mounts on the article page and records the visit. */
export function MarkRead({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(`deepdive-read:${slug}`, "1");
    } catch {}
  }, [slug]);
  return null;
}
