"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreateSheetModal from "./CreateSheetModal";

type Sheet = { id: string; name: string; isPreset: boolean; problemCount: number };

type Props = {
  sheets: Sheet[];
  activeSheetId: string | undefined; // server-provided default (first sheet)
};

export default function DSAPageClient({ sheets, activeSheetId: defaultSheetId }: Props) {
  const searchParams = useSearchParams();
  // Resolve active sheet from URL first, fall back to server default
  const activeSheetId = searchParams.get("sheet") ?? defaultSheetId;

  const [showCreate, setShowCreate]           = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting]               = useState(false);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await fetch(`/api/dsa/sheets/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      if (id === activeSheetId) {
        router.push("/dashboard/dsa");
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const navigate = (sheetId: string) => {
    router.push(`/dashboard/dsa?sheet=${sheetId}`);
    router.refresh();
  };

  return (
    <>
      {/* Sheet tabs row */}
      <div className="flex gap-2 flex-wrap items-center">
        {sheets.map((s) => {
          const isActive = s.id === activeSheetId;
          const isCustom = !s.isPreset;

          return (
            <div key={s.id} className="relative flex items-center group">
              <button
                onClick={() => navigate(s.id)}
                className={`rounded-xl px-3.5 py-1.5 text-sm transition-all duration-150 border whitespace-nowrap ${
                  isActive
                    ? "bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                    : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800/40"
                } ${isCustom ? "pr-7" : ""}`}
              >
                {s.name}
                <span className="ml-2 text-[11px] opacity-50">{s.problemCount}</span>
              </button>

              {/* Delete button — custom sheets only */}
              {isCustom && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                  title="Delete sheet"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* New Sheet */}
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl border border-dashed border-sky-500/25 px-3.5 py-1.5 text-sm text-sky-500/60 hover:text-sky-400 hover:border-sky-500/50 transition-colors"
        >
          + New sheet
        </button>
      </div>

      {/* Delete confirmation inline dialog */}
      {confirmDeleteId && (() => {
        const sheet = sheets.find((s) => s.id === confirmDeleteId);
        return (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
            <span className="text-slate-300 flex-1">
              Delete <span className="font-medium text-white">{sheet?.name}</span>? This removes all problems inside it.
            </span>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="text-slate-500 hover:text-slate-300 text-xs border border-slate-700 rounded-lg px-3 py-1.5 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(confirmDeleteId)}
              disabled={deleting}
              className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 hover:border-red-500/60 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        );
      })()}

      {/* Modals */}
      {showCreate && <CreateSheetModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
