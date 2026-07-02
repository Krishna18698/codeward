"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type Props = {
  problemId: string;
  userId: string;
  initialContent: string;
};

export default function NotesPanel({ problemId, userId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (text: string) => {
    setSaveState("saving");
    await fetch("/api/notes/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, userId, content: text }),
    });
    setSaveState("saved");
    toast.success("Notes saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [problemId, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSaveState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), 800);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800/60 shrink-0">
        <span className="text-[11px] text-slate-600">Markdown supported</span>
        <span className={`text-[11px] transition ${
          saveState === "saving" ? "text-sky-400" :
          saveState === "saved" ? "text-emerald-400" :
          "text-slate-700"
        }`}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Auto-save"}
        </span>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Your notes for this problem… Approach, complexity, edge cases."
        className="flex-1 w-full resize-none bg-transparent px-4 py-3 text-sm text-slate-300 placeholder-slate-700 outline-none font-mono leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}
