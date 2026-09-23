import type { Page } from "@playwright/test";
import type { Device } from "./config";

/**
 * Every screen and state the harness captures. Each runs on phone and desktop,
 * in dark and light, unless `only` narrows it.
 *
 * `run` puts the page into the state being shown. Writes it triggers (marking a
 * note, flagging a hint) are answered by the stubs in lib/guard.ts and never
 * reach the server, so nothing here changes the account's data.
 */
export type Shot = {
  id: string;
  title: string;
  path: string;
  /** Signed in as the harness account. Public pages are shot signed out. */
  auth: boolean;
  only?: Device;
  /** Section in the contact sheet. */
  group: "Public" | "Dashboard" | "DSA" | "Practice" | "Mentor" | "States";
  run?: (page: Page, device: Device) => Promise<void>;
  /** The address bar in the desktop frame, when it differs from `path`. */
  displayPath?: string;
};

/** Opens Array → Two Pointers so problem rows are on screen. */
async function openTwoPointers(page: Page) {
  await page.getByRole("heading", { name: "Array", level: 3 }).click();
  await page.getByRole("button", { name: /^two pointers/i }).click();
  await page.locator(".problem-row").first().waitFor();
}

/** Scrolls the dashboard's scroll container so `locator` sits near the top. */
async function scrollTo(page: Page, selector: string, offset = 96) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string);
      if (!el) throw new Error(`scrollTo: nothing matches ${sel}`);
      const scroller = document.querySelector("main") ?? document.scrollingElement!;
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top: Math.max(0, top - (off as number)), behavior: "instant" });
      window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - (off as number)), behavior: "instant" });
    },
    [selector, offset],
  );
}

async function openAttempt(page: Page) {
  await page.getByRole("button", { name: /view attempt/i }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  // The body is fetched on open; wait for the skeleton to give way.
  await page.waitForFunction(() => !document.querySelector('[role="dialog"] .animate-pulse'));
}

export const SHOTS: Shot[] = [
  // ── Public ────────────────────────────────────────────────────────────────
  { id: "01", title: "Landing", path: "/", auth: false, group: "Public" },
  {
    id: "02", title: "Landing — features", path: "/", auth: false, group: "Public",
    run: async (page) => {
      // The heading, by role: the hero paragraph also contains this phrase.
      await page.getByRole("heading", { name: "Seven ways to actually get ready" }).evaluate((el) => {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: "instant" });
      });
    },
  },
  { id: "03", title: "About", path: "/about", auth: false, group: "Public" },
  { id: "04", title: "Contact", path: "/contact", auth: false, group: "Public" },
  { id: "05", title: "Sign in", path: "/login", auth: false, group: "Public" },
  {
    id: "06", title: "Sign in — wrong password", path: "/login", auth: false, group: "States",
    // The credentials check is a read; the session is a JWT. Nothing is written.
    run: async (page) => {
      // A made-up address gives the same message and keeps the real
      // account's email out of the pictures.
      await page.locator('input[name="email"]').fill("asha.rao@example.com");
      await page.locator('input[name="password"]').fill("not-the-password");
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.getByText(/invalid email or password/i).waitFor();
    },
  },
  { id: "07", title: "Create account", path: "/register", auth: false, group: "Public" },
  {
    id: "08", title: "Create account — validation", path: "/register", auth: false, group: "States",
    // Client-side validation only; the form never submits.
    run: async (page) => {
      await page.locator('input[name="name"]').fill("Asha Rao");
      // A valid address: the field is type="email", so a malformed one is
      // stopped by the browser before the form's own validation ever runs.
      await page.locator('input[name="email"]').fill("asha.rao@example.com");
      await page.locator('input[name="password"]').fill("short");
      await page.getByRole("button", { name: /create account/i }).click();
      await page.getByText(/at least 8 characters/i).waitFor();
    },
  },
  { id: "09", title: "Forgot password", path: "/forgot-password", auth: false, group: "Public" },
  { id: "10", title: "Reset link — invalid", path: "/reset-password", auth: false, group: "States" },
  { id: "11", title: "Privacy", path: "/privacy", auth: false, group: "Public" },
  { id: "12", title: "Page not found", path: "/this-page-does-not-exist", auth: false, group: "States" },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  { id: "13", title: "Dashboard", path: "/dashboard", auth: true, group: "Dashboard" },
  {
    id: "14", title: "Menu", path: "/dashboard", auth: true, group: "Dashboard", only: "phone",
    run: async (page) => {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("button", { name: "Close menu" }).first().waitFor();
    },
  },
  {
    id: "15", title: "AI Mentor — quick panel", path: "/dashboard", auth: true, group: "Mentor",
    run: async (page) => {
      await page.getByRole("button", { name: /open ai mentor/i }).click();
      await page.getByPlaceholder(/ask me anything/i).first().waitFor();
    },
  },
  { id: "16", title: "Profile", path: "/dashboard/profile", auth: true, group: "Dashboard" },

  // ── DSA ───────────────────────────────────────────────────────────────────
  { id: "17", title: "DSA sheets", path: "/dashboard/dsa", auth: true, group: "DSA" },
  {
    id: "18", title: "Problems by pattern", path: "/dashboard/dsa", auth: true, group: "DSA",
    run: async (page) => {
      await openTwoPointers(page);
      await scrollTo(page, "h2, h3", 24);
      await scrollTo(page, ".problem-row", 150);
    },
  },
  {
    id: "19", title: "Hint revealed", path: "/dashboard/dsa", auth: true, group: "DSA",
    run: async (page) => {
      await openTwoPointers(page);
      await page.locator('button[title^="Show hint"]').first().click();
      await scrollTo(page, ".problem-row", 150);
    },
  },
  {
    id: "20", title: "Notes", path: "/dashboard/dsa", auth: true, group: "DSA",
    run: async (page) => {
      await openTwoPointers(page);
      await scrollTo(page, ".problem-row", 150);
      await page.locator('button[data-note-trigger]').first().click();
      const area = page.getByRole("dialog").locator("textarea");
      await area.waitFor();
      // Written over whatever the account has saved: the save is answered by
      // the stub, so the stored note is untouched.
      await area.fill(
        "Sort first, then fix i and walk two pointers inward.\n\n- Skip duplicates for i, lo and hi\n- Stop once nums[i] > 0\n- O(n²) time, O(1) extra space",
      );
      await page.waitForTimeout(1100); // debounce → stubbed save → "saved"
    },
  },
  {
    id: "21", title: "Flagged for revision", path: "/dashboard/dsa", auth: true, group: "DSA",
    run: async (page) => {
      await page.locator("button[aria-pressed]", { hasText: "For revision" }).click();
      // Rows mount only when their group is open; both flagged problems here
      // are Two Pointers.
      await openTwoPointers(page);
      await scrollTo(page, 'input[placeholder^="Search problems"]', 110);
    },
  },
  {
    id: "22", title: "Search — no results", path: "/dashboard/dsa", auth: true, group: "States",
    run: async (page) => {
      await page.getByPlaceholder(/search problems/i).fill("zzqx");
      await page.getByText(/no problems/i).first().waitFor();
      await scrollTo(page, 'input[placeholder^="Search problems"]', 140);
    },
  },
  {
    id: "23", title: "Loading", path: "/dashboard", auth: true, group: "States",
    displayPath: "/dashboard/dsa",
    run: async (page, device) => {
      // Hold the navigation's page request open (prefetches still answer, so the
      // route's loading.tsx is ready) and follow a link to the DSA page.
      await page.route(/\/dashboard\/dsa(\?.*)?$/, (route) => {
        const h = route.request().headers();
        if (h["rsc"] && !h["next-router-prefetch"]) return new Promise(() => {});
        return route.continue();
      });
      if (device === "phone") await page.getByRole("button", { name: "Open menu" }).click();
      await page.locator('a[href="/dashboard/dsa"]:visible').first().click();
      await page.locator("main .skeleton").first().waitFor();
      await page.mouse.move(1, 1); // leave no hover tooltip on the rail
    },
  },
  {
    id: "24", title: "Past attempt failed to load", path: "/dashboard/code-review/idempotency-middleware", auth: true, group: "States",
    // The real modal's real error branch, with the failure injected at the
    // network: the attempt request is answered with a 500.
    run: async (page) => {
      await page.route("**/api/attempts/**", (route) =>
        route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"Couldn\'t load this attempt"}' }),
      );
      await page.getByRole("button", { name: /view attempt/i }).first().click();
      await page.getByRole("dialog").getByText(/couldn.t load this attempt/i).waitFor();
    },
  },
  {
    id: "25", title: "New sheet", path: "/dashboard/dsa", auth: true, group: "DSA",
    run: async (page) => {
      await page.getByText("+ New sheet").click();
      await page.getByRole("dialog").or(page.locator(".fixed.inset-0").last()).first().waitFor();
    },
  },
  {
    id: "26", title: "Delete sheet — confirm", path: "/dashboard/dsa", auth: true, group: "States",
    run: async (page) => {
      await page.locator('button[aria-label^="Delete sheet"]').first().click();
      const confirm = page.getByText("This removes all problems inside it.");
      await confirm.waitFor();
      // Inline, under the sheet cards — below the fold on a phone.
      await confirm.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    },
  },
  { id: "27", title: "Problem Bank", path: "/dashboard/dsa?view=bank", auth: true, group: "DSA" },
  {
    id: "28", title: "Add to a sheet", path: "/dashboard/dsa?view=bank", auth: true, group: "DSA",
    run: async (page) => {
      await page.locator("main button[aria-expanded]").first().click();
      const row = page.locator(".problem-row").first();
      await row.waitFor();
      await scrollTo(page, ".problem-row", 180);
      await row.getByRole("button", { name: /add/i }).click();
      await page.waitForTimeout(300);
    },
  },

  // ── Practice ──────────────────────────────────────────────────────────────
  { id: "29", title: "System design", path: "/dashboard/system-design", auth: true, group: "Practice" },
  { id: "30", title: "System design — question", path: "/dashboard/system-design/sd-1", auth: true, group: "Practice" },
  { id: "31", title: "Code review", path: "/dashboard/code-review", auth: true, group: "Practice" },
  { id: "32", title: "Code review — PR", path: "/dashboard/code-review/idempotency-middleware", auth: true, group: "Practice" },
  {
    id: "33", title: "Code review — past attempt", path: "/dashboard/code-review/idempotency-middleware", auth: true, group: "Practice",
    run: openAttempt,
  },
  { id: "34", title: "Bug hunt", path: "/dashboard/bug-hunt", auth: true, group: "Practice" },
  { id: "35", title: "Bug hunt — incident", path: "/dashboard/bug-hunt/double-charge-race", auth: true, group: "Practice" },
  {
    id: "36", title: "Bug hunt — past attempt", path: "/dashboard/bug-hunt/double-charge-race", auth: true, group: "Practice",
    run: openAttempt,
  },
  { id: "37", title: "Build it", path: "/dashboard/build-it", auth: true, group: "Practice" },
  { id: "38", title: "Build it — stage", path: "/dashboard/build-it/thread-safe-wallet", auth: true, group: "Practice" },
  { id: "39", title: "Deep dives", path: "/dashboard/deep-dives", auth: true, group: "Practice" },
  { id: "40", title: "Deep dive — article", path: "/dashboard/deep-dives/idempotency-exactly-once", auth: true, group: "Practice" },

  // ── Mentor ────────────────────────────────────────────────────────────────
  { id: "41", title: "AI Mentor", path: "/dashboard/mentor", auth: true, group: "Mentor" },
  {
    id: "42", title: "AI Mentor — answer", path: "/dashboard/mentor", auth: true, group: "Mentor",
    // The question goes to a stub that streams a canned answer: no model call.
    run: async (page, device) => {
      // A fresh conversation (its creation is stubbed), so the transcript is
      // just this question and its answer.
      if (device === "phone") await page.locator("button:has(> svg.lucide-chevron-left)").first().click();
      // The chat is keyed by the conversation id, which arrives with the
      // create response: typing before it lands sends into a chat that is about
      // to be remounted, and the reply is lost with it.
      await Promise.all([
        page.waitForResponse((r) => r.url().endsWith("/api/mentor/conversations") && r.request().method() === "POST"),
        page.getByRole("button", { name: /new chat/i }).filter({ visible: true }).first().click(),
      ]);
      // The header shows the new conversation's title (from the stub) once the
      // chat has remounted under its id.
      await page.getByText("Two pointers vs sliding window").filter({ visible: true }).first().waitFor();
      const input = page.getByPlaceholder(/ask me anything/i).last();
      await input.fill("When do I reach for two pointers instead of a sliding window?");
      await input.press("Enter");
      await page.getByText(/a quick tell/i).last().waitFor({ timeout: 15_000 });
      await page.waitForTimeout(400);
    },
  },

  // ── States ────────────────────────────────────────────────────────────────
  { id: "43", title: "Dashboard — not found", path: "/dashboard/dsa?sheet=deleted-sheet", auth: true, group: "States" },
];
