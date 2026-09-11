"use client";
import { useEffect } from "react";

/** Freezes the page behind a dialog for as long as the component is mounted.
 *
 *  There is already a CSS rule keyed on `body:has([role="dialog"])`, but that
 *  leans on `:has()` being supported and on the dialog carrying the right role.
 *  This does not depend on either: it stamps an attribute on <html>, which the
 *  stylesheet matches with a plain attribute selector.
 *
 *  Counted rather than a boolean, so a dialog opened over another dialog does
 *  not unlock the page when only the inner one closes.
 */
let depth = 0;

export function useScrollLock() {
  useEffect(() => {
    depth += 1;
    document.documentElement.setAttribute("data-dialog-open", "");
    return () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) document.documentElement.removeAttribute("data-dialog-open");
    };
  }, []);
}
