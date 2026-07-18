"use client";
import { useState } from "react";
import { Loader2, Send, Check, X as XIcon, Terminal, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Ring } from "@/components/ui/Ring";
import type { BugHuntGradeResult } from "@/app/api/bug-hunt/grade/route";

type FileT = { name: string; code: string };
type PrevAttempt = { id: string; score: number; createdAt: string };

type Props = {
  slug: string;
  files: FileT[];
  testOutput: string;
  logs?: string;
  previousAttempts: PrevAttempt[];
};

export default function BugHuntWorkspace({ slug, files, testOutput, logs, previousAttempts }: Props) {
  const [activeFile, setActiveFile] = useState(0);
  const [diagnosis, setDiagnosis] = useState("");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<BugHuntGradeResult | null>(null);

  const submit = async () => {
    if (grading) return;
    if (diagnosis.trim().length < 30) {
      toast.error("Describe the root cause in a bit more detail first.");
      return;
    }
    setGrading(true);
    try {
      const res = await fetch("/api/bug-hunt/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, diagnosis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Grading failed");
      setResult(data as BugHuntGradeResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Grading failed. Try again.");
    } finally {
      setGrading(false);
    }
  };

  const file = files[activeFile];
  const lines = file.code.split("\n");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ── Left: code + evidence ── */}
      <div className="min-w-0 space-y-4">
        {/* Code */}
        <div className="rounded-2xl border border-neutral-800 bg-surface overflow-hidden">
          <div className="flex items-center border-b border-neutral-800 bg-white/3 px-2">
            {files.map((f, i) => (
              <button
                key={f.name}
                onClick={() => setActiveFile(i)}
                className={cn(
                  "px-3 py-2 font-mono text-xs transition-colors border-b-2",
                  i === activeFile ? "text-white border-emerald-400" : "text-neutral-500 border-transparent hover:text-neutral-300",
                )}
              >
                {f.name}
              </button>
            ))}
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[3ch_1fr] gap-4">
                <span className="select-none text-right text-neutral-600">{i + 1}</span>
                <code className="text-neutral-300 whitespace-pre">{line || " "}</code>
              </div>
            ))}
          </pre>
        </div>

        {/* Test output */}
        {testOutput && (
          <div className="rounded-2xl border border-neutral-800 bg-surface overflow-hidden">
            <div className="flex items-center gap-2 border-b border-neutral-800 bg-white/3 px-3 py-2">
              <Terminal size={12} className="text-rose-400" />
              <span className="font-mono text-[11px] text-neutral-400">test output</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-5 text-neutral-300 whitespace-pre">{testOutput}</pre>
          </div>
        )}

        {/* Logs */}
        {logs && (
          <div className="rounded-2xl border border-neutral-800 bg-surface overflow-hidden">
            <div className="flex items-center gap-2 border-b border-neutral-800 bg-white/3 px-3 py-2">
              <ScrollText size={12} className="text-amber-400" />
              <span className="font-mono text-[11px] text-neutral-400">logs</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-5 text-neutral-300 whitespace-pre">{logs}</pre>
          </div>
        )}

        {/* Diagnosis input */}
        <div className="rounded-2xl border border-neutral-800 bg-white/3 p-4">
          <p className="font-mono text-[11px] text-neutral-500 mb-2">Your diagnosis</p>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={5}
            disabled={grading || !!result}
            placeholder={"What's the ROOT CAUSE (not the symptom)? Then how would you fix it?\ne.g. \"The check and the write aren't atomic, so two concurrent requests both pass the guard. Fix: reserve the key atomically before charging.\""}
            className="w-full resize-y rounded-xl border border-neutral-700/60 bg-surface px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 leading-relaxed disabled:opacity-60"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-neutral-500">Graded on the root cause (70) + fix direction (30).</p>
            {!result && (
              <button
                onClick={submit}
                disabled={grading || diagnosis.trim().length < 30}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {grading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {grading ? "Grading…" : "Submit diagnosis"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: result / attempts ── */}
      <div className="space-y-4">
        {result ? (
          <div className="rounded-2xl border border-neutral-800 bg-white/3 p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Ring pct={result.score} size={64} stroke={5} color={result.score >= 70 ? "#34d399" : result.score >= 40 ? "#fbbf24" : "#fb7185"} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-sm font-bold text-white">{result.score}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className={cn("flex items-center gap-1.5 text-xs", result.rootCaught ? "text-emerald-400" : "text-rose-400")}>
                  {result.rootCaught ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
                  Root cause {result.rootCaught ? "identified" : "missed"}
                </span>
                <span className={cn("flex items-center gap-1.5 text-xs", result.fixReasonable ? "text-emerald-400" : "text-neutral-500")}>
                  {result.fixReasonable ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
                  Fix direction {result.fixReasonable ? "correct" : "off"}
                </span>
              </div>
            </div>

            {result.feedback && (
              <p className="text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-3">{result.feedback}</p>
            )}

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
              <p className="font-mono text-[10px] text-emerald-400 mb-1">Root cause</p>
              <p className="text-xs text-neutral-300 leading-relaxed">{result.rootCause}</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-white/3 p-3">
              <p className="font-mono text-[10px] text-neutral-500 mb-1">Canonical fix</p>
              <p className="text-xs text-neutral-300 leading-relaxed">{result.canonicalFix}</p>
            </div>

            {result.ruledOut.length > 0 && (
              <div>
                <p className="font-mono text-[10px] text-neutral-500 mb-1.5">Hypotheses ruled out</p>
                <ul className="space-y-1">
                  {result.ruledOut.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-500">
                      <XIcon size={10} className="mt-0.5 shrink-0 text-rose-400/70" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-white/3 p-5">
            <p className="font-mono text-[11px] text-neutral-500 mb-2">How it works</p>
            <ul className="space-y-2 text-xs text-neutral-400 leading-relaxed list-disc ml-4">
              <li>Read the code, the failing tests, and the logs together — they triangulate the cause.</li>
              <li>Name the <span className="text-neutral-200">root cause</span>, not the symptom. A symptom is &ldquo;it double-charges&rdquo;; the cause is &ldquo;the guard isn&rsquo;t atomic&rdquo;.</li>
              <li>The AI grades your diagnosis, then reveals the canonical fix and the tempting wrong turns.</li>
            </ul>
          </div>
        )}

        {previousAttempts.length > 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-white/3 p-5">
            <p className="font-mono text-[11px] text-neutral-500 mb-3">Previous attempts</p>
            <div className="space-y-2">
              {previousAttempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">{new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  <span className={cn("font-mono font-semibold", a.score >= 70 ? "text-emerald-400" : a.score >= 40 ? "text-amber-400" : "text-rose-400")}>{a.score}/100</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
