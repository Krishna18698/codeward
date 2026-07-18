"use client";
import { useState } from "react";
import { Loader2, Check, X as XIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Ring } from "@/components/ui/Ring";
import type { GradeResult, GradedBug } from "@/app/api/review/grade/route";

type FileT = { name: string; code: string };
type PrevAttempt = { id: string; score: number; createdAt: string };

type Props = {
  slug: string;
  files: FileT[];
  bugCount: number;
  previousAttempts: PrevAttempt[];
};

function severityChip(severity: number) {
  const cls =
    severity >= 4
      ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
      : severity === 3
        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
        : "border-neutral-700 bg-white/5 text-neutral-400";
  return (
    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold border", cls)}>
      S{severity}
    </span>
  );
}

function BugCard({ bug, caught }: { bug: GradedBug; caught: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        caught ? "border-emerald-500/25 bg-emerald-500/5" : "border-rose-500/25 bg-rose-500/5",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {severityChip(bug.severity)}
        <span className="font-mono text-[10px] text-neutral-500">{bug.category}</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 font-mono text-[10px]",
            caught ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {caught ? <Check size={10} strokeWidth={3} /> : <XIcon size={10} strokeWidth={3} />}
          {caught ? "caught" : "missed"}
        </span>
      </div>
      <p className="text-xs text-neutral-300 leading-relaxed">{bug.description}</p>
      {caught && bug.evidence && (
        <p className="mt-1.5 text-[11px] text-neutral-500 italic">You wrote: &ldquo;{bug.evidence}&rdquo;</p>
      )}
    </div>
  );
}

export default function CodeReviewWorkspace({ slug, files, bugCount, previousAttempts }: Props) {
  const [activeFile, setActiveFile] = useState(0);
  const [comments, setComments] = useState("");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [filter, setFilter] = useState<"all" | "caught" | "missed">("all");

  const submit = async () => {
    if (grading) return;
    if (comments.trim().length < 30) {
      toast.error("Write a bit more — list the issues you found and where.");
      return;
    }
    setGrading(true);
    try {
      const res = await fetch("/api/review/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, comments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Grading failed");
      setResult(data as GradeResult);
      setFilter("all");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Grading failed. Try again.");
    } finally {
      setGrading(false);
    }
  };

  const file = files[activeFile];
  const lines = file.code.split("\n");
  const shownBugs: GradedBug[] = result
    ? filter === "caught"
      ? result.caught
      : filter === "missed"
        ? result.missed
        : [...result.caught, ...result.missed].sort((a, b) => b.severity - a.severity)
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ── Code pane ── */}
      <div className="min-w-0">
        <div className="rounded-2xl border border-neutral-800 bg-surface overflow-hidden">
          {/* File tabs */}
          <div className="flex items-center border-b border-neutral-800 bg-white/3 px-2">
            {files.map((f, i) => (
              <button
                key={f.name}
                onClick={() => setActiveFile(i)}
                className={cn(
                  "px-3 py-2 font-mono text-xs transition-colors border-b-2",
                  i === activeFile
                    ? "text-white border-emerald-400"
                    : "text-neutral-500 border-transparent hover:text-neutral-300",
                )}
              >
                {f.name}
              </button>
            ))}
            <span className="ml-auto pr-2 font-mono text-[10px] text-neutral-600">
              {bugCount} planted issues
            </span>
          </div>
          {/* Line-numbered code */}
          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[3ch_1fr] gap-4">
                <span className="select-none text-right text-neutral-600">{i + 1}</span>
                <code className="text-neutral-300 whitespace-pre">{line || " "}</code>
              </div>
            ))}
          </pre>
        </div>

        {/* Review input */}
        <div className="mt-4 rounded-2xl border border-neutral-800 bg-white/3 p-4">
          <p className="font-mono text-[11px] text-neutral-500 mb-2">Your review</p>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={6}
            disabled={grading}
            placeholder={`List every issue you find — be specific about the line or behavior. e.g.\n"The cache check and the charge aren't atomic — two concurrent requests with the same key both charge."`}
            className="w-full resize-y rounded-xl border border-neutral-700/60 bg-surface px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 leading-relaxed"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-neutral-500">
              Graded against the planted-bug list by meaning, not wording.
            </p>
            <button
              onClick={submit}
              disabled={grading || comments.trim().length < 30}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {grading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {grading ? "Grading…" : "Submit review"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results / attempts rail ── */}
      <div className="space-y-4">
        {result ? (
          <div className="rounded-2xl border border-neutral-800 bg-white/3 p-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Ring pct={result.score} size={64} stroke={5} color={result.score >= 70 ? "#34d399" : result.score >= 40 ? "#fbbf24" : "#fb7185"} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-sm font-bold text-white">{result.score}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {result.caught.length}/{result.caught.length + result.missed.length} issues caught
                </p>
                <p className="font-mono text-[11px] text-neutral-500 mt-0.5">
                  severity-weighted · /100
                </p>
              </div>
            </div>

            {result.feedback && (
              <p className="mt-4 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-3">
                {result.feedback}
              </p>
            )}

            {/* Filter */}
            <div className="mt-4 flex gap-1">
              {(["all", "caught", "missed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors",
                    filter === f ? "bg-white/6 text-white" : "text-neutral-500 hover:text-neutral-300",
                  )}
                >
                  {f === "all" ? "All" : f === "caught" ? `Caught (${result.caught.length})` : `Missed (${result.missed.length})`}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2.5">
              {shownBugs.map((b) => (
                <BugCard key={b.id} bug={b} caught={result.caught.some((c) => c.id === b.id)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-white/3 p-5">
            <p className="font-mono text-[11px] text-neutral-500 mb-2">How it works</p>
            <ul className="space-y-2 text-xs text-neutral-400 leading-relaxed list-disc ml-4">
              <li>Read the diff like a real PR — correctness first, then security, performance, API design.</li>
              <li>Write your findings below it. Specificity counts; vague gestures don&rsquo;t.</li>
              <li>The AI matches your review against the planted-bug list and scores by severity weight.</li>
            </ul>
          </div>
        )}

        {previousAttempts.length > 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-white/3 p-5">
            <p className="font-mono text-[11px] text-neutral-500 mb-3">Previous attempts</p>
            <div className="space-y-2">
              {previousAttempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">
                    {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <span className={cn("font-mono font-semibold", a.score >= 70 ? "text-emerald-400" : a.score >= 40 ? "text-amber-400" : "text-rose-400")}>
                    {a.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
