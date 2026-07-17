"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

type Props = { questionId: string; userId: string; initialContent: string };

export default function SDNotesPanel({ questionId, userId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (text: string) => {
    setSaveState("saving");
    await fetch("/api/notes/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sdQuestionId: questionId, userId, content: text }),
    });
    setSaveState("saved");
    toast.success("Notes saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [questionId, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSaveState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), 800);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-neutral-800/60 shrink-0">
        <span className="text-[11px] text-neutral-500">Design notes, diagrams in text, trade-offs</span>
        <span className={`text-[11px] transition ${
          saveState === "saving" ? "text-emerald-400" :
          saveState === "saved"  ? "text-emerald-400" : "text-neutral-700"
        }`}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Auto-save"}
        </span>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={"# Design Notes\n\n## Requirements\n\n## High-level design\n\n## Deep dives\n\n## Trade-offs"}
        className="flex-1 w-full resize-none bg-transparent px-4 py-3 text-sm text-neutral-300 placeholder-neutral-800 outline-none font-mono leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}
