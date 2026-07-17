"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

const COMPANIES = ["Meta", "Google", "Amazon", "Apple", "Microsoft", "Netflix", "Startup", "Other"];
const EXP_LEVELS = [
  { value: "JUNIOR", label: "Junior (0–2 yrs)", hint: "Focus on Easy–Medium, core patterns" },
  { value: "MID",    label: "Mid-level (2–5 yrs)", hint: "Medium–Hard, system design basics" },
  { value: "SENIOR", label: "Senior (5+ yrs)", hint: "Hard problems, advanced system design" },
];

export default function OnboardingModal({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState(0);
  const [exp, setExp] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experienceLevel: exp, targetCompany: company, onboarded: true }),
    });
    onDone?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-surface p-8 shadow-2xl animate-scale-in">
        {/* Step dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-6 bg-emerald-400" : i < step ? "w-3 bg-emerald-400/60" : "w-3 bg-neutral-700",
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-1">Welcome to Codeward 👋</h2>
            <p className="text-neutral-400 text-sm mb-6">Quick setup — takes 20 seconds. Helps the AI mentor tailor your prep.</p>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Your experience level</p>
            <div className="space-y-2">
              {EXP_LEVELS.map((l) => {
                const selected = exp === l.value;
                return (
                  <button
                    key={l.value}
                    onClick={() => setExp(l.value)}
                    className={cn(
                      "w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 relative",
                      selected
                        ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                        : "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200",
                    )}
                  >
                    {selected && (
                      <CheckCircle2 size={14} className="absolute right-3 top-3 text-emerald-400" />
                    )}
                    <p className="text-sm font-medium">{l.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{l.hint}</p>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!exp}
              className="mt-5 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white text-sm font-semibold py-3 transition-all duration-150"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-1">Target company</h2>
            <p className="text-neutral-400 text-sm mb-6">The AI mentor will bias your study plan toward this company&apos;s interview style.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {COMPANIES.map((c) => {
                const selected = company === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCompany(c)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm transition-all duration-150 relative",
                      selected
                        ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                        : "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200",
                    )}
                  >
                    {selected && (
                      <CheckCircle2 size={10} className="absolute right-2 top-2 text-emerald-400" />
                    )}
                    {c}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="flex-1 rounded-xl border border-neutral-700 text-neutral-400 text-sm py-2.5 hover:border-neutral-500 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={!company || saving}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white text-sm font-semibold py-2.5 transition-all duration-150"
              >
                {saving ? "Saving…" : "Let's go →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
