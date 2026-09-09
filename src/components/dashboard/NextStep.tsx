import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NextStep as Step } from "@/lib/nextStep";

/** The single recommended next action. Deliberately ONE card, not a checklist —
 *  the point is to answer "what do I do now?" without the user choosing between
 *  seven modes. Reuses the accent card language already used by the DSA and
 *  Deep Dives "Start here" cards. */
export default function NextStep({ step }: { step: Step }) {
  return (
    <Link
      href={step.href}
      className="group flex flex-col justify-between gap-4 rounded-2xl border border-accent/25 bg-accent/6 p-5 transition-colors hover:border-accent/40 sm:flex-row sm:items-center"
    >
      <div className="min-w-0">
        <p className="mb-1 font-mono text-[13px] text-accent">{step.eyebrow}</p>
        <p className="text-sm font-semibold text-primary">{step.title}</p>
        <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-secondary">{step.body}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-accent-fill px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-accent-hover sm:self-center">
        {step.cta}
        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
