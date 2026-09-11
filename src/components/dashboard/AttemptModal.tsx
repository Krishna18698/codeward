"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/useScrollLock";
import { X, Check, X as XIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Ring } from "@/components/ui/Ring";

/** Read-only view of one past attempt.
 *
 *  The three workspaces already listed previous attempts, but only as a date and
 *  a score — the submission and the grader's feedback were stored and then
 *  unreachable, so there was no way to revisit yesterday's mistakes without
 *  submitting again. This fetches the full row on open.
 */

export type AttemptKind = "review" | "bug-hunt" | "build-it";

type GradedBug = { id: string; severity: number; category: string; description: string; evidence?: string };
type BugFinding = { file: string; line: number | null; category: string; status: string; title: string; detail: string };
type GradedCriterion = { id: string; description: string; weight: number; met: boolean; evidence?: string };

type Attempt = {
  kind: AttemptKind;
  id: string;
  score: number;
  createdAt: string;
  feedback: string;
  // review
  comments?: string;
  caught?: GradedBug[];
  missed?: GradedBug[];
  // bug-hunt
  diagnosis?: string;
  fixedCode?: string | null;
  findings?: BugFinding[] | null;
  rootCaught?: boolean;
  fixReasonable?: boolean;
  // build-it
  stage?: number;
  language?: string;
  approach?: string;
  explanation?: string;
  criteria?: GradedCriterion[];
  invariantHolds?: boolean | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted mb-2">{title}</p>
      {children}
    </div>
  );
}

/** Long submissions scroll inside their own box — the modal must not grow to
 *  fit a 200-line paste. */
function Body({ text }: { text: string }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-canvas p-3 font-mono text-[11.5px] leading-5 text-secondary whitespace-pre-wrap">
      {text?.trim() ? text : "(empty)"}
    </pre>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="max-h-56 overflow-auto rounded-xl border border-border bg-canvas p-3 text-[13px] leading-relaxed text-secondary whitespace-pre-wrap">
      {text?.trim() ? text : "(empty)"}
    </div>
  );
}

export default function AttemptModal({
  kind,
  attemptId,
  onClose,
}: {
  kind: AttemptKind;
  attemptId: string;
  onClose: () => void;
}) {
  useScrollLock();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus moves into the dialog on open and returns to whatever opened it on
  // close, so keyboard users aren't dropped back at the top of the document.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/attempts/${kind}/${attemptId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Couldn't load this attempt");
        return r.json();
      })
      .then((d) => { if (!cancelled) setAttempt(d as Attempt); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load this attempt"); });
    return () => { cancelled = true; };
  }, [kind, attemptId]);

  const when = attempt
    ? new Date(attempt.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  // Portalled into <body> for the same reason as the note sheet: an ancestor
  // with a transform — `animate-fade-up` leaves an identity one behind —
  // becomes the containing block for position:fixed and drags the overlay off
  // the viewport entirely. See NoteModal.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-canvas/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Previous attempt"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface outline-none"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {attempt && (
              <div className="relative shrink-0">
                <Ring pct={attempt.score} size={40} stroke={4} color={attempt.score >= 70 ? "#34d399" : attempt.score >= 40 ? "#fbbf24" : "#fb7185"} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[11px] font-bold text-primary">{attempt.score}</span>
                </div>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary truncate">
                Previous attempt
                {attempt?.stage !== undefined && ` · Stage ${attempt.stage}`}
              </p>
              <p className="font-mono text-[11px] text-muted">
                {when}
                {attempt?.language && ` · ${attempt.language}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-elevated hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {error && <p className="text-sm text-rose-400">{error}</p>}

          {!attempt && !error && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
              <Loader2 size={14} className="animate-spin" /> Loading attempt…
            </div>
          )}

          {attempt?.kind === "review" && (
            <>
              <Section title="Your review comments"><Body text={attempt.comments ?? ""} /></Section>
              <div className="grid gap-4 sm:grid-cols-2">
                <Section title={`Caught (${attempt.caught?.length ?? 0})`}>
                  <BugList bugs={attempt.caught ?? []} tone="good" />
                </Section>
                <Section title={`Missed (${attempt.missed?.length ?? 0})`}>
                  <BugList bugs={attempt.missed ?? []} tone="bad" />
                </Section>
              </div>
            </>
          )}

          {attempt?.kind === "bug-hunt" && (
            <>
              <div className="flex flex-wrap gap-2">
                <Verdict ok={!!attempt.rootCaught} label="Root cause" />
                <Verdict ok={!!attempt.fixReasonable} label="Fix reasonable" />
              </div>
              <Section title="Your diagnosis"><Prose text={attempt.diagnosis ?? ""} /></Section>
              {attempt.fixedCode?.trim() && (
                <Section title="Your edited code"><Body text={attempt.fixedCode} /></Section>
              )}
              {!!attempt.findings?.length && (
                <Section title="Findings">
                  <ul className="space-y-2">
                    {attempt.findings.map((f, i) => (
                      <li key={i} className="rounded-xl border border-border bg-canvas p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13px] font-medium text-primary">{f.title}</span>
                          <span className="font-mono text-[10px] uppercase text-muted shrink-0">{f.status}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-secondary">{f.detail}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted">
                          {f.file}{f.line !== null ? `:${f.line}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}

          {attempt?.kind === "build-it" && (
            <>
              {attempt.invariantHolds !== null && attempt.invariantHolds !== undefined && (
                <Verdict ok={attempt.invariantHolds} label={attempt.invariantHolds ? "Invariant held" : "Invariant not established"} />
              )}
              <Section title="Your design"><Body text={attempt.approach ?? ""} /></Section>
              <Section title="Your reasoning"><Prose text={attempt.explanation ?? ""} /></Section>
              {!!attempt.criteria?.length && (
                <Section title="Rubric">
                  <ul className="space-y-1.5">
                    {attempt.criteria.map((c) => (
                      <li key={c.id} className="flex items-start gap-2 text-xs">
                        {c.met
                          ? <Check size={13} className="mt-0.5 shrink-0 text-accent" strokeWidth={3} />
                          : <XIcon size={13} className="mt-0.5 shrink-0 text-rose-400" strokeWidth={3} />}
                        <span className="text-secondary leading-relaxed">
                          {c.description}
                          {c.evidence && <span className="block text-muted mt-0.5">{c.evidence}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}

          {attempt && (
            <Section title="Grader feedback"><Prose text={attempt.feedback} /></Section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Verdict({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium",
      ok ? "border-accent/25 bg-accent/5 text-accent" : "border-rose-500/25 bg-rose-500/5 text-rose-400",
    )}>
      {ok ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
      {label}
    </span>
  );
}

function BugList({ bugs, tone }: { bugs: GradedBug[]; tone: "good" | "bad" }) {
  if (bugs.length === 0) return <p className="text-xs text-muted">None.</p>;
  return (
    <ul className="space-y-1.5">
      {bugs.map((b) => (
        <li key={b.id} className="rounded-lg border border-border bg-canvas p-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn("font-mono text-[10px] uppercase", tone === "good" ? "text-accent" : "text-rose-400")}>
              {b.category}
            </span>
            <span className="font-mono text-[10px] text-muted shrink-0">sev {b.severity}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-secondary">{b.description}</p>
        </li>
      ))}
    </ul>
  );
}
