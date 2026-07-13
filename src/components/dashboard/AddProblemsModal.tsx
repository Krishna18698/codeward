"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProblemPicker, { type PickerProblem } from "./ProblemPicker";

type Props = {
  sheetId: string;
  sheetName: string;
  onClose: () => void;
};

export default function AddProblemsModal({ sheetId, sheetName, onClose }: Props) {
  const [selected, setSelected] = useState<PickerProblem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const router = useRouter();

  const toggleProblem = (p: PickerProblem) => {
    setSelected((prev) =>
      prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0) { onClose(); return; }
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        selected.map((p) =>
          fetch(`/api/dsa/sheets/${sheetId}/add-problem`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ problemId: p.id }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok && r.status !== 409).length;
      if (failed > 0) throw new Error(`${failed} problem(s) failed to add`);
      toast.success(`Added ${selected.length} problem${selected.length > 1 ? "s" : ""} to ${sheetName}`);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#0d1117]/95 shadow-2xl backdrop-blur-xl flex flex-col max-h-[82vh]">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Add Problems</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Adding to{" "}
            <span className="text-slate-300 font-medium">{sheetName}</span>
            {" "}— search by name or filter by company.
          </p>
        </div>

        {/* Picker */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          <ProblemPicker
            excludeSheetId={sheetId}
            selected={selected}
            onToggle={toggleProblem}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 shrink-0">
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 flex-1">
              {selected.length > 0
                ? `${selected.length} problem${selected.length > 1 ? "s" : ""} selected`
                : "Nothing selected yet"}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:border-slate-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
            >
              {loading
                ? "Adding…"
                : selected.length > 0
                ? `Add ${selected.length}`
                : "Done"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
