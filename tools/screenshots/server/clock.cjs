/* Preloaded into the harness's Next server with `--require`.
 *
 * Moves the server's clock to SHOTS_NOW, so everything rendered on the server —
 * the dashboard greeting, "3 days ago", the activity heatmap's today — agrees
 * with the browser, which Playwright pins to the same instant.
 *
 * Anchored, not frozen: the clock starts at SHOTS_NOW and runs forward in real
 * time. A frozen clock would stall anything that waits for Date.now() to pass a
 * deadline; over a run of a few minutes the difference is invisible.
 *
 * A Proxy rather than a subclass, so `x instanceof Date` stays true for every
 * Date in the process — including ones Node creates internally, which a
 * replacement class would fail.
 */
const anchor = Date.parse(process.env.SHOTS_NOW ?? "");

if (!Number.isNaN(anchor)) {
  const RealDate = Date;
  const realNow = RealDate.now.bind(RealDate);
  const offset = anchor - realNow();
  const now = () => realNow() + offset;

  RealDate.now = now;
  globalThis.Date = new Proxy(RealDate, {
    construct(target, args, newTarget) {
      return Reflect.construct(target, args.length ? args : [now()], newTarget);
    },
    // `Date()` called as a function returns the current time as a string.
    apply() {
      return new RealDate(now()).toString();
    },
  });
}
