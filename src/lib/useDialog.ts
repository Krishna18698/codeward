"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useScrollLock } from "@/lib/useScrollLock";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusables(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
  );
}

/** What every modal dialog in the app does, in one place.
 *
 *  Each modal used to carry its own subset: Create Sheet closed on Escape only
 *  while its name field had focus, Add Problems not at all, and none of them
 *  kept Tab inside the dialog — so keyboard focus walked out into the page
 *  behind a modal that was supposed to block it.
 *
 *  - Escape closes from anywhere in the dialog (unless it isn't dismissible).
 *  - Tab and Shift+Tab cycle within the dialog.
 *  - Focus moves in when it opens and back to whatever opened it when it
 *    closes — with preventScroll, because a plain focus() scrolls the page's
 *    scroller to bring the element into view.
 *  - The page behind stops scrolling while it's open.
 *
 *  The dialog's own element should carry role="dialog", aria-modal and a
 *  label, and tabIndex={-1} so it can hold focus when it has no controls. */
export function useDialog(
  ref: RefObject<HTMLElement | null>,
  {
    onClose,
    dismissible = true,
    autoFocus = true,
  }: {
    onClose?: () => void;
    /** False for a dialog the user must complete (onboarding). */
    dismissible?: boolean;
    /** False when the dialog focuses a specific field itself. */
    autoFocus?: boolean;
  } = {},
) {
  useScrollLock();

  // Captured on the first render, before a child's autoFocus moves focus in.
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );

  // The latest onClose, without re-subscribing the key handler every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const panel = ref.current;
    if (autoFocus && panel && !panel.contains(document.activeElement)) {
      (focusables(panel)[0] ?? panel).focus({ preventScroll: true });
    }
    return () => opener?.focus?.({ preventScroll: true });
    // Mount and unmount only: the dialog's element and opener don't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const panel = ref.current;
      if (!panel) return;
      if (e.key === "Escape") {
        if (!dismissible) return;
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables(panel);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!first) {
        e.preventDefault();
        panel.focus({ preventScroll: true });
      } else if (!panel.contains(active)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ref, dismissible]);
}
