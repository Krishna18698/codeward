import type { ReactNode } from "react";

/** Two-column app layout: content, plus a rail that doesn't scroll away.
 *
 *  The shell is wide now, and width alone doesn't help — a longer line of text
 *  is worse, not better. The rail is what earns the extra space: progress that
 *  is ambient rather than something you navigate to.
 *
 *  Purely presentational and stateless, so server components can use it. Pages
 *  opt in; anything that wants the full width just doesn't wrap.
 *
 *  Below `xl` the rail moves under the content rather than disappearing — on a
 *  phone the progress is still worth seeing, it just isn't worth a column. */
export default function PageWithRail({
  children, rail, railFirstOnMobile = false,
}: {
  children: ReactNode;
  rail: ReactNode;
  /** Put the rail above the content on small screens (progress-led pages). */
  railFirstOnMobile?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
      <div className={`min-w-0 flex-1 ${railFirstOnMobile ? "order-2 xl:order-1" : ""}`}>
        {children}
      </div>

      <aside
        className={`w-full shrink-0 space-y-4 xl:sticky xl:top-0 xl:w-[300px] ${
          railFirstOnMobile ? "order-1 xl:order-2" : ""
        }`}
      >
        {rail}
      </aside>
    </div>
  );
}
