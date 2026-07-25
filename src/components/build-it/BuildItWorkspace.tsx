"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Send, AlertTriangle, Check, X as XIcon, Play, Terminal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Ring } from "@/components/ui/Ring";
import { WindowFrame } from "@/components/ui/WindowFrame";
import { BUILD_IT_LANGUAGES } from "@/content/build-it/languages";
import type { BuildItLanguage } from "@/content/build-it/languages";
import type { BuildItProblemMeta } from "@/content/build-it/types";
import type { BuildItGradeResult } from "@/app/api/build-it/grade/route";
import StageStepper from "./StageStepper";

const CodeEditor = dynamic(() => import("@/components/ui/CodeEditor"), {
  ssr: false,
  loading: () => <div className="p-4 font-mono text-xs text-muted">Loading editor…</div>,
});

type RunResult = { passed: boolean | null; output: string; creditsRemaining: number | null };

type PrevAttempt = { id: string; stage: number; score: number; createdAt: string };

type Props = {
  slug: string;
  problem: BuildItProblemMeta;
  previousAttempts: PrevAttempt[];
  highestUnlockedStage: number;
};

export default function BuildItWorkspace({ slug, problem, previousAttempts, highestUnlockedStage }: Props) {
  const startingStage = Math.min(highestUnlockedStage, problem.stages.length);
  const [activeStageNum, setActiveStageNum] = useState(startingStage);
  const [unlocked, setUnlocked] = useState(highestUnlockedStage);
  const [activeLanguage, setActiveLanguage] = useState<BuildItLanguage>("csharp");
  const [approachByCombo, setApproachByCombo] = useState<Record<string, string>>({});
  const [explanationByStage, setExplanationByStage] = useState<Record<number, string>>({});
  const [grading, setGrading] = useState(false);
  const [resultByStage, setResultByStage] = useState<Record<number, BuildItGradeResult>>({});
  const [codeTab, setCodeTab] = useState<"code" | "tests">("code");
  const [running, setRunning] = useState(false);
  const [runByCombo, setRunByCombo] = useState<Record<string, RunResult | undefined>>({});

  const activeStage = problem.stages.find((s) => s.stage === activeStageNum)!;
  const comboKey = `${activeStageNum}:${activeLanguage}`;
  const approach = approachByCombo[comboKey] ?? activeStage.skeletons[activeLanguage].code;
  const explanation = explanationByStage[activeStageNum] ?? "";
  const result = resultByStage[activeStageNum];
  const harness = activeStage.tests?.[activeLanguage];
  const runResult = runByCombo[comboKey];

  const runTests = async () => {
    if (running || !harness) return;
    setRunning(true);
    try {
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "build-it", slug, stage: activeStageNum, language: activeLanguage, code: approach }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunByCombo((p) => ({ ...p, [comboKey]: { passed: null, output: data.error ?? "Run failed", creditsRemaining: null } }));
        if (data.budgetExhausted) toast("Daily run budget reached — you can still submit for grading.");
        else toast.error(data.error ?? "Run failed");
        return;
      }
      setRunByCombo((p) => ({ ...p, [comboKey]: data as RunResult }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed. Try again.");
    } finally {
      setRunning(false);
    }
  };

  const bestScoreForStage = (stage: number): number | null => {
    const scores = previousAttempts.filter((a) => a.stage === stage).map((a) => a.score);
    const fresh = resultByStage[stage]?.score;
    if (fresh !== undefined) scores.push(fresh);
    return scores.length ? Math.max(...scores) : null;
  };
  const submittedStages = new Set([...previousAttempts.map((a) => a.stage), ...Object.keys(resultByStage).map(Number)]);

  const submit = async () => {
    if (grading) return;
    if (approach.trim().length < 20) {
      toast.error("Write a bit more of your design before submitting.");
      return;
    }
    if (explanation.trim().length < 40) {
      toast.error("Explain your reasoning in a bit more detail.");
      return;
    }
    setGrading(true);
    try {
      const res = await fetch("/api/build-it/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, stage: activeStageNum, language: activeLanguage, approach, explanation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Grading failed");
      const graded = data as BuildItGradeResult;
      setResultByStage((prev) => ({ ...prev, [activeStageNum]: graded }));
      if (graded.nextStageUnlocked) setUnlocked((u) => Math.max(u, activeStageNum + 1));
      toast.success(`Stage ${activeStageNum} graded — ${graded.score}/100`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Grading failed. Try again.");
    } finally {
      setGrading(false);
    }
  };

  const goToStage = (stage: number) => {
    setActiveStageNum(stage);
  };

  const continueToNext = () => {
    const next = activeStageNum + 1;
    if (next <= problem.stages.length) setActiveStageNum(next);
  };

  return (
    <div className="space-y-4">
      <StageStepper
        steps={problem.stages.map((s) => ({
          stage: s.stage,
          title: s.title,
          submitted: submittedStages.has(s.stage),
          bestScore: bestScoreForStage(s.stage),
        }))}
        highestUnlockedStage={unlocked}
        activeStage={activeStageNum}
        onSelect={goToStage}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Left: stage content + submission ── */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="font-mono text-[11px] text-accent mb-1">
              Stage {activeStage.stage} · {activeStage.title}
            </p>
            <p className="text-xs font-medium text-secondary mb-2">{activeStage.constraintAdded}</p>
            <p className="text-sm text-secondary leading-relaxed mb-3">{activeStage.narrative}</p>
            <p className="text-sm text-secondary leading-relaxed">{activeStage.prompt}</p>

            {activeStage.invariant && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-rose-400 mb-1">
                  Stage {activeStage.stage} · make-or-break invariant
                </p>
                <p className="text-xs text-secondary leading-relaxed">{activeStage.invariant}</p>
              </div>
            )}
          </div>

          <WindowFrame
            label={`build-it · ${activeStage.skeletons[activeLanguage].fileName}`}
            right={
              <div className="flex gap-1">
                {BUILD_IT_LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { setActiveLanguage(l.value); setCodeTab("code"); }}
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[10px] transition-colors",
                      activeLanguage === l.value
                        ? "bg-accent/15 text-accent"
                        : "text-muted hover:text-secondary",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            }
          >
            {/* Code / Tests sub-tabs + Run */}
            <div className="flex items-center justify-between border-b border-border bg-surface pl-1 pr-2">
              <div className="flex">
                <button
                  onClick={() => setCodeTab("code")}
                  className={cn(
                    "px-3 py-2 font-mono text-xs transition-colors border-b-2",
                    codeTab === "code" ? "text-primary border-accent" : "text-muted border-transparent hover:text-secondary",
                  )}
                >
                  Code
                </button>
                {harness && (
                  <button
                    onClick={() => setCodeTab("tests")}
                    className={cn(
                      "px-3 py-2 font-mono text-xs transition-colors border-b-2",
                      codeTab === "tests" ? "text-primary border-accent" : "text-muted border-transparent hover:text-secondary",
                    )}
                  >
                    Tests
                  </button>
                )}
              </div>
              {harness && !result && (
                <button
                  onClick={runTests}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] text-secondary hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-50"
                >
                  {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                  {running ? "Running…" : "Run Tests"}
                </button>
              )}
            </div>

            {codeTab === "code" ? (
              <CodeEditor
                key={`${comboKey}:code`}
                value={approach}
                onChange={(v) => setApproachByCombo((prev) => ({ ...prev, [comboKey]: v }))}
                language={activeLanguage}
                readOnly={!!result}
                minHeight="320px"
              />
            ) : (
              <CodeEditor
                key={`${comboKey}:tests`}
                value={harness ?? ""}
                language={activeLanguage}
                readOnly
                minHeight="320px"
              />
            )}
          </WindowFrame>

          {/* Run output */}
          {runResult && (
            <div className={cn(
              "rounded-2xl border bg-surface overflow-hidden",
              runResult.passed === true ? "border-accent/30" : runResult.passed === false ? "border-rose-500/30" : "border-border",
            )}>
              <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
                <div className="flex items-center gap-2">
                  <Terminal size={12} className={runResult.passed === true ? "text-accent" : runResult.passed === false ? "text-rose-400" : "text-secondary"} />
                  <span className="font-mono text-[11px] text-secondary">
                    {runResult.passed === true ? "tests passed" : runResult.passed === false ? "tests failed" : "run output"}
                  </span>
                </div>
                {runResult.creditsRemaining !== null && (
                  <span className="font-mono text-[10px] text-muted">{runResult.creditsRemaining} runs left today</span>
                )}
              </div>
              <pre className="max-h-56 overflow-auto p-4 font-mono text-[11.5px] leading-5 text-secondary whitespace-pre-wrap">{runResult.output || "(no output)"}</pre>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-mono text-[11px] text-muted mb-2">
              Your reasoning {activeStage.invariant && <span className="text-rose-400">— argue the invariant explicitly</span>}
            </p>
            <textarea
              value={explanation}
              onChange={(e) => setExplanationByStage((prev) => ({ ...prev, [activeStageNum]: e.target.value }))}
              disabled={!!result}
              rows={5}
              placeholder={
                activeStage.invariant
                  ? "State the invariant in your own words, then walk through a concrete concurrent scenario and explain why your design can't violate it."
                  : "Explain how your design satisfies this stage's new constraint."
              }
              className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-primary placeholder:text-muted leading-relaxed disabled:opacity-60"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted">Graded by meaning — the mechanism matters, not the syntax.</p>
              {!result && (
                <button
                  onClick={submit}
                  disabled={grading}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-fill px-4 py-2 text-xs font-semibold text-black hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {grading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {grading ? "Grading…" : "Submit stage"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: result / attempts ── */}
        <div className="space-y-4">
          {result ? (
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Ring pct={result.score} size={64} stroke={5} color={result.score >= 70 ? "#34d399" : result.score >= 40 ? "#fbbf24" : "#fb7185"} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-sm font-bold text-primary">{result.score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Stage {result.stage} graded</p>
                  <p className="font-mono text-[11px] text-muted mt-0.5">weighted rubric · /100</p>
                </div>
              </div>

              {result.invariantHolds !== null && (
                <div className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2",
                  result.invariantHolds ? "border-accent/25 bg-accent/5" : "border-rose-500/25 bg-rose-500/5",
                )}>
                  {result.invariantHolds ? (
                    <Check size={13} className="text-accent shrink-0" strokeWidth={3} />
                  ) : (
                    <XIcon size={13} className="text-rose-400 shrink-0" strokeWidth={3} />
                  )}
                  <span className={cn("text-xs font-medium", result.invariantHolds ? "text-accent" : "text-rose-400")}>
                    Invariant {result.invariantHolds ? "held" : "not established"}
                  </span>
                </div>
              )}

              {result.feedback && (
                <p className="text-xs text-secondary leading-relaxed border-t border-border pt-3">{result.feedback}</p>
              )}

              <div className="space-y-2">
                {result.criteria.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5",
                      c.met ? "border-accent/25 bg-accent/5" : "border-rose-500/25 bg-rose-500/5",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {c.met ? (
                        <Check size={10} className="text-accent shrink-0" strokeWidth={3} />
                      ) : (
                        <XIcon size={10} className="text-rose-400 shrink-0" strokeWidth={3} />
                      )}
                      <span className="text-[11px] text-secondary leading-snug">{c.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-accent/25 bg-accent/5 p-3">
                <p className="font-mono text-[10px] text-accent mb-1">Canonical approach</p>
                <p className="text-xs text-secondary leading-relaxed">{result.canonicalApproach}</p>
              </div>

              {result.commonPitfalls.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-muted mb-1.5">Common pitfalls</p>
                  <ul className="space-y-1">
                    {result.commonPitfalls.map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted">
                        <AlertTriangle size={10} className="mt-0.5 shrink-0 text-amber-400/70" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeStageNum < problem.stages.length && (
                <button
                  onClick={continueToNext}
                  className="w-full rounded-lg bg-accent/15 border border-accent/30 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors"
                >
                  Continue to Stage {activeStageNum + 1} →
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-mono text-[11px] text-muted mb-2">How it works</p>
              <ul className="space-y-2 text-xs text-secondary leading-relaxed list-disc ml-4">
                <li>Write your approach (interfaces/pseudocode — not compiled) and explain how it satisfies this stage&rsquo;s new constraint.</li>
                <li>Stage 3 asks you to state and defend a correctness invariant — that&rsquo;s the senior filter.</li>
                <li>Submitting unlocks the next stage regardless of score, so you can see the whole problem evolve.</li>
              </ul>
            </div>
          )}

          {previousAttempts.filter((a) => a.stage === activeStageNum).length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-mono text-[11px] text-muted mb-3">Previous attempts · Stage {activeStageNum}</p>
              <div className="space-y-2">
                {previousAttempts
                  .filter((a) => a.stage === activeStageNum)
                  .map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-secondary">
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className={cn("font-mono font-semibold", a.score >= 70 ? "text-accent" : a.score >= 40 ? "text-amber-400" : "text-rose-400")}>
                        {a.score}/100
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
