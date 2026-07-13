"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProblemPicker, { type PickerProblem } from "./ProblemPicker";

type Props = { onClose: () => void };

export default function CreateSheetModal({ onClose }: Props) {
  const [name, setName]           = useState("");
  const [selected, setSelected]   = useState<PickerProblem[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const toggleProblem = (p: PickerProblem) => {
    setSelected((prev) =>
      prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError("Sheet name is required"); return; }
    setLoading(true);
    setError("");
    try {
      // 1. Create the sheet
      const res = await fetch("/api/dsa/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Failed to create sheet");
      }
      const { sheet } = await res.json() as { sheet: { id: string } };

      // 2. Add selected problems in parallel
      let failedAdds = 0;
      if (selected.length > 0) {
        const results = await Promise.all(
          selected.map((p) =>
            fetch(`/api/dsa/sheets/${sheet.id}/add-problem`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ problemId: p.id }),
            }).catch(() => null)
          )
        );
        failedAdds = results.filter((r) => !r || !r.ok).length;
      }

      if (failedAdds > 0) {
        toast.warning(`Sheet created, but ${failedAdds} problem${failedAdds > 1 ? "s" : ""} couldn't be added.`);
      } else {
        toast.success(`Sheet "${name.trim()}" created`);
      }

      router.push(`/dashboard/dsa?sheet=${sheet.id}`);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0d1117] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <h2 className="text-base font-semibold text-white mb-0.5">Create New Sheet</h2>
          <p className="text-xs text-slate-500">Name your sheet and optionally add problems to start.</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
          {/* Sheet name */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Sheet name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
              placeholder="e.g. Google Prep, Amazon Grind…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 transition"
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          {/* Problem picker */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">
              Add problems{" "}
              <span className="text-slate-600 font-normal">(optional — search across all sheets)</span>
            </label>
            <ProblemPicker selected={selected} onToggle={toggleProblem} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600">
            {selected.length > 0 ? `${selected.length} problem${selected.length > 1 ? "s" : ""} selected` : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              {loading
                ? selected.length > 0 ? "Creating & adding…" : "Creating…"
                : `Create Sheet${selected.length > 0 ? ` + ${selected.length}` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
