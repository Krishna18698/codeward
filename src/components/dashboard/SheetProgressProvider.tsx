"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

/** Live solved-count deltas, shared across the DSA page.
 *
 *  The sheet selector (DSAPageClient) and the stats bar (SheetContent) are
 *  siblings under a server component, so neither could see the other's state.
 *  SheetContent tracked toggles locally and the selector kept rendering the
 *  server-computed count, which is why marking a problem done moved the bar
 *  from 2 to 3 while the selector sat on 2/75 until a full reload.
 *
 *  Deltas rather than absolute counts: the selector's baseline comes from the
 *  server and the stats bar's from the problems payload, so the only thing both
 *  can agree on is how much has changed since the page loaded.
 */
type SheetProgress = {
  deltaBySheet: Record<string, number>;
  applyDelta: (sheetId: string, delta: number) => void;
};

const SheetProgressContext = createContext<SheetProgress>({
  deltaBySheet: {},
  applyDelta: () => {},
});

export function useSheetProgress() {
  return useContext(SheetProgressContext);
}

export default function SheetProgressProvider({ children }: { children: React.ReactNode }) {
  const [deltaBySheet, setDeltaBySheet] = useState<Record<string, number>>({});

  const applyDelta = useCallback((sheetId: string, delta: number) => {
    if (!sheetId || delta === 0) return;
    setDeltaBySheet((m) => ({ ...m, [sheetId]: (m[sheetId] ?? 0) + delta }));
  }, []);

  const value = useMemo(() => ({ deltaBySheet, applyDelta }), [deltaBySheet, applyDelta]);

  return <SheetProgressContext.Provider value={value}>{children}</SheetProgressContext.Provider>;
}
