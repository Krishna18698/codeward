"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSheetProgress } from "./SheetProgressProvider";
import CreateSheetModal from "./CreateSheetModal";

type Sheet = { id: string; name: string; isPreset: boolean; problemCount: number; solvedCount: number };

type Props = {
  sheets: Sheet[];
  activeSheetId: string | undefined; // server-provided default (first sheet)
};

export default function DSAPageClient({ sheets, activeSheetId: defaultSheetId }: Props) {
  const searchParams = useSearchParams();
  const { deltaBySheet } = useSheetProgress();
  // Resolve active sheet from URL first, fall back to server default
  const activeSheetId = searchParams.get("sheet") ?? defaultSheetId;

  const [showCreate, setShowCreate]           = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting]               = useState(false);
  const [pendingSheetId, setPendingSheetId]   = useState<string | null>(null);
  const [isPending, startTransition]          = useTransition();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/dsa/sheets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete the sheet — try again.");
        return; // keep the dialog open
      }
      toast.success("Sheet deleted");
      setConfirmDeleteId(null);
      if (id === activeSheetId) {
        router.push("/dashboard/dsa");
      }
      router.refresh();
    } catch {
      toast.error("Couldn't delete the sheet — try again.");
    } finally {
      setDeleting(false);
    }
  };

  const navigate = (sheetId: string) => {
    setPendingSheetId(sheetId);
    startTransition(() => {
      router.push(`/dashboard/dsa?sheet=${sheetId}`);
      router.refresh();
    });
  };

  return (
    <>
      {/* Sheet selector — cards, not pills. A tab that only carried a total
          made choosing a sheet and seeing your progress in it two separate
          glances; the numbered card answers both at once. */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.map((s, i) => {
          const isActive  = s.id === activeSheetId;
          const isCustom  = !s.isPreset;
          const isLoading = isPending && pendingSheetId === s.id;
          // solvedCount is the server's count at page load; the delta is what
          // has been toggled since. Without it this card read 2/75 while the
          // stats bar right below already said 3.
          const solved = Math.min(
            s.problemCount,
            Math.max(0, s.solvedCount + (deltaBySheet[s.id] ?? 0)),
          );
          const pct = s.problemCount > 0 ? (solved / s.problemCount) * 100 : 0;

          return (
            <div key={s.id} className="relative group">
              <button
                onClick={() => navigate(s.id)}
                aria-current={isActive ? "true" : undefined}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  isActive
                    ? "border-accent/40 bg-accent/10"
                    : "border-border bg-surface hover:border-border-accent hover:bg-elevated"
                } ${isCustom ? "pr-9" : ""} ${isPending && !isLoading ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                      isActive ? "bg-accent text-black" : "border border-border text-muted"
                    }`}
                  >
                    {isLoading ? <Loader2 size={11} className="animate-spin" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${isActive ? "text-accent" : "text-primary"}`}>
                      {s.name}
                    </span>
                    <span className="block font-mono text-[11px] text-muted">
                      {solved} / {s.problemCount} solved
                    </span>
                  </span>
                </div>

                <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full w-full origin-left rounded-full bg-accent-fill transition-transform duration-700"
                    style={{ transform: `scaleX(${pct / 100})` }}
                  />
                </span>
              </button>

              {/* Delete button — custom sheets only. Always visible on touch
                  devices; hover-revealed on desktop. */}
              {isCustom && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                  title="Delete sheet"
                  aria-label={`Delete sheet ${s.name}`}
                  className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg text-muted opacity-100 transition hover:bg-red-500/10 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
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
          className="flex min-h-[76px] items-center justify-center rounded-xl border border-dashed border-accent/25 p-3 text-sm text-accent/60 transition-colors hover:border-accent/50 hover:text-accent"
        >
          + New sheet
        </button>
      </div>

      {/* Delete confirmation inline dialog */}
      {confirmDeleteId && (() => {
        const sheet = sheets.find((s) => s.id === confirmDeleteId);
        return (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
            <span className="text-secondary flex-1">
              Delete <span className="font-medium text-primary">{sheet?.name}</span>? This removes all problems inside it.
            </span>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="text-muted hover:text-secondary text-xs border border-border rounded-lg px-3 py-1.5 transition"
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
