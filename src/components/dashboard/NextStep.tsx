import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { NextStep as Step } from "@/lib/nextStep";
import { METHOD, methodIndex } from "@/content/method";

/** The stated method, with the user's current stage lit up.
 *
 *  Static copy would answer "what is this site's approach?"; tying it to the
 *  live next step also answers "and where am I in it?" — which is the part a
 *  new user actually needs. Stages before the current one read as done. */
function MethodStrip({ active }: { active: Step["stage"] }) {
  const activeAt = methodIndex(active);

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {METHOD.map((m, i) => {
        const isActive = i === activeAt;
        const isPast = i < activeAt;
        return (
          <li key={m.id} className="flex items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                isActive
                  ? "border-accent/40 bg-accent/12 text-accent"
                  : isPast
                    ? "border-border bg-surface text-secondary"
                    : "border-border bg-surface text-muted",
              ].join(" ")}
            >
              {isPast && <Check size={10} aria-hidden />}
              {m.label}
            </span>
            {i < METHOD.length - 1 && (
              <span aria-hidden className="font-mono text-[11px] text-muted">
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The single recommended next action, under the method it belongs to.
 *  Deliberately ONE card, not a checklist — the point is to answer "what do I
 *  do now?" without the user choosing between seven modes. Reuses the accent
 *  card language already used by the DSA and Deep Dives "Start here" cards. */
export default function NextStep({ step }: { step: Step }) {
  const stage = METHOD[methodIndex(step.stage)];

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">The method</h2>
          <p className="mt-1 text-xs text-secondary">{stage?.blurb}</p>
        </div>
        <MethodStrip active={step.stage} />
      </div>

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
    </section>
  );
}
