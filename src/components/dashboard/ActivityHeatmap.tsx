import { Flame } from "lucide-react";
import { dayKey, type ActivityData } from "@/lib/activity";

/** ~26 weeks of activity. Server component — no state, no client JS.
 *
 *  Motion note: the entrance wave is staggered per COLUMN, not per cell — 26
 *  animated nodes instead of 186. The wave still reads left-to-right, at a
 *  seventh of the cost, and `.animate-cell-pop` is dropped entirely below `sm`
 *  so a phone just paints the finished grid. */
export default function ActivityHeatmap({ data, weeks = 26 }: { data: ActivityData; weeks?: number }) {
  // Build columns of 7, ending on today, starting from the most recent Sunday
  // going back `weeks` weeks so rows line up as weekdays.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  const columns: { key: string; count: number; future: boolean }[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks + 1; w++) {
    const col: { key: string; count: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const k = dayKey(cursor);
      col.push({ key: k, count: data.byDay[k] ?? 0, future: cursor > today });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
  }

  // Four steps is enough to read at a glance; more just adds noise.
  const level = (n: number) => (n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4);
  const tone = [
    "bg-border/60",
    "bg-accent/25",
    "bg-accent/45",
    "bg-accent/70",
    "bg-accent",
  ];

  const monthFmt = new Intl.DateTimeFormat(undefined, { month: "short" });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 animate-fade-up">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Activity</h2>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          {data.streak > 0 && (
            <span className="inline-flex items-center gap-1 text-accent">
              <Flame size={12} />
              {data.streak} day{data.streak === 1 ? "" : "s"}
            </span>
          )}
          <span className="text-muted">{data.total} in {weeks} weeks</span>
        </div>
      </div>

      {/* Scrolls on small screens rather than squashing the cells */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-[3px]">
          {columns.map((col, ci) => {
            const first = new Date(col[0].key);
            const showMonth = first.getDate() <= 7;
            return (
              <div
                key={ci}
                className="flex flex-col gap-[3px] animate-cell-pop"
                style={{ animationDelay: `${ci * 18}ms` }}
              >
                <span className="h-3 font-mono text-[9px] leading-3 text-muted">
                  {showMonth ? monthFmt.format(first) : ""}
                </span>
                {col.map((cell) =>
                  cell.future ? (
                    <span key={cell.key} className="h-[10px] w-[10px]" />
                  ) : (
                    <span
                      key={cell.key}
                      title={`${cell.count} on ${cell.key}`}
                      className={`h-[10px] w-[10px] rounded-[2px] ${tone[level(cell.count)]}`}
                    />
                  ),
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted">
        <span>Less</span>
        {tone.map((t, i) => <span key={i} className={`h-[10px] w-[10px] rounded-[2px] ${t}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}
