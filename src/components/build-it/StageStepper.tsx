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
              locked && "cursor-not-allowed border-border text-muted",
              !locked && active && "border-accent/50 bg-accent/10 text-accent-hover",
              !locked && !active && "border-border text-secondary hover:border-border hover:text-primary",
            )}
          >
            {locked ? (
              <Lock size={11} />
            ) : s.submitted ? (
              <Check size={11} className="text-accent" strokeWidth={3} />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
            Stage {s.stage}
            {s.submitted && s.bestScore !== null && (
              <span className="font-mono text-[10px] text-muted">{s.bestScore}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
