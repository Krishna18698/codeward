import type { BugHuntExercise } from "./types";

export const timezoneExpiryBug: BugHuntExercise = {
  slug: "timezone-expiry-bug",
  title: "Coupons expire a day early for some users",
  brief:
    "Support gets tickets that valid coupons are rejected — but only from users in certain regions, and clustered around midnight. " +
    "The coupon clearly hasn't expired. Find the date bug.",
  language: "TypeScript",
  minutes: 10,
  files: [
    {
      name: "coupon.ts",
      code: `export function isCouponValid(coupon: Coupon): boolean {
  // coupon.expiresOn is a date string like "2026-08-01" (last valid day)
  const today = new Date().toISOString().slice(0, 10); // "2026-07-31"

  // Valid through the end of expiresOn
  return today <= coupon.expiresOn;
}`,
    },
  ],
  testOutput: `=== RUN   TestCouponExpiry
    coupon expiresOn: "2026-08-01"  (valid through Aug 1 local)
    user timezone:    UTC+10 (Sydney)
    local time:       2026-08-01 09:00  (should be VALID)
    server UTC time:  2026-07-31 23:00
--- Case passes when checked, but:
    user at 2026-08-02 08:00 local (UTC+10):
    server UTC time:  2026-08-01 22:00  → today = "2026-08-01" → VALID
--- FAIL: user at 2026-08-01 08:00 local, server just past UTC midnight
    server UTC: 2026-07-31 22:00 → today = "2026-07-31" ✓
    but user at 2026-08-02 09:00 Sydney, server 2026-08-01 23:00 UTC
    → today "2026-08-01" → still VALID a day late for +10 users
    Symmetric failure for negative offsets: valid coupons rejected early.`,
  rootCause:
    "The validity check uses the server's UTC date (`new Date().toISOString()`), not the user's local date. 'Today' in UTC and 'today' for a user in UTC+10 or UTC-8 are different calendar dates for several hours around midnight. So near midnight, users in offset timezones get a UTC date that's a day off from their own — coupons appear expired a day early (or valid a day late) depending on the sign of the offset. It clusters around midnight and by region because that's exactly when and where UTC and local dates disagree.",
  category: "correctness",
  ruledOut: [
    "The coupon data is wrong — no; expiresOn is correct. The comparison uses the wrong 'today'.",
    "Daylight saving time — DST shifts the offset by an hour but isn't the root cause; even without DST, a fixed offset makes UTC-vs-local dates diverge around midnight.",
    "String comparison of dates is unreliable — ISO date strings actually compare correctly lexicographically; the bug is which date you're comparing, not how.",
  ],
  canonicalFix:
    "Compare in the user's timezone, or define expiry unambiguously in UTC. Either (a) compute 'today' in the user's timezone before comparing (`Intl.DateTimeFormat('en-CA', { timeZone: user.tz })` to get their local YYYY-MM-DD), or (b) store the coupon expiry as a precise UTC instant (end of the intended day in a defined zone) and compare timestamps, not calendar-date strings. The rule: never compare a user-facing calendar date against the server's UTC date — resolve both to the same timezone first.",
};
