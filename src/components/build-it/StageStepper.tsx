import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

type StepInfo = {
  stage: number;
  title: string;
  submitted: boolean;
  bestScore: number | null;
};

type Props = {
  steps: StepInfo[];
  highestUnlockedStage: number;
  activeStage: number;
  onSelect: (stage: number) => void;
};

export default function StageStepper({ steps, highestUnlockedStage, activeStage, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {steps.map((s) => {
        const locked = s.stage > highestUnlockedStage;
        const active = s.stage === activeStage;
        return (
          <button
            key={s.stage}
            type="button"
            disabled={locked}
            onClick={() => onSelect(s.stage)}
            title={s.title}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              locked && "cursor-not-allowed border-neutral-800 text-neutral-700",
              !locked && active && "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
              !locked && !active && "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200",
            )}
          >
            {locked ? (
              <Lock size={11} />
            ) : s.submitted ? (
              <Check size={11} className="text-emerald-400" strokeWidth={3} />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
            Stage {s.stage}
            {s.submitted && s.bestScore !== null && (
              <span className="font-mono text-[10px] text-neutral-500">{s.bestScore}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
