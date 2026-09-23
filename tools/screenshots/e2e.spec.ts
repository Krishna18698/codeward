import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { credentials, DB_GUARD_LOG, ORIGIN } from "./config";
import { MENTOR_REPLY, type Guard } from "./lib/guard";
import { openSession, settle } from "./lib/session";

/**
 * End-to-end journeys through the real UI, against the production build.
 *
 * Read-only by construction, like the screenshots: every write a journey
 * triggers is answered by a stub in lib/guard.ts, and each test asserts the
 * request the app WOULD have sent — so what is checked is that the UI sends the
 * right thing and then behaves as it would after a real save. Nothing is saved.
 * A write with no stub fails the test; the server refuses any non-read SQL.
 */

test.describe.configure({ mode: "parallel" });

/** Every write the test caused must have been one it expected. */
function expectOnlyStubbed(guard: Guard, ...paths: RegExp[]) {
  expect(guard.blocked, "writes with no stub").toEqual([]);
  for (const hit of guard.stubbed) {
    expect(paths.some((p) => p.test(hit.path)), `unexpected write ${hit.method} ${hit.path}`).toBe(true);
  }
}

async function openTwoPointers(page: Page) {
  await page.getByRole("heading", { name: "Array", level: 3 }).click();
  await page.getByRole("button", { name: /^two pointers/i }).click();
  await expect(page.locator(".problem-row").first()).toBeVisible();
}

const row = (page: Page, title: string) =>
  page.locator(".problem-row").filter({ has: page.getByRole("link", { name: title, exact: true }) });

test("sign in: a wrong password is refused, the right one lands on the dashboard", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: false });
  const { email, password } = credentials();

  await page.goto(`${ORIGIN}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("not-the-password");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/dashboard/);
  // Pinned to 10:30 IST — the server renders the greeting from its own clock.
  await expect(page.getByText(/good morning/i).first()).toBeVisible();

  expectOnlyStubbed(guard);
  await context.close();
});

test("DSA: marking a problem done moves the sheet card and the stats bar together", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: true });
  await page.goto(`${ORIGIN}/dashboard/dsa`);
  await settle(page);

  const card = page.getByText(/\d+ \/ 75 solved/).first();
  const before = Number((await card.innerText()).match(/(\d+) \//)![1]);

  await openTwoPointers(page);
  const threeSum = row(page, "3Sum");
  const toggle = threeSum.locator("xpath=..").getByTitle(/^Mark as/);
  const wasDone = (await toggle.getAttribute("title")) === "Mark as To Do";
  await toggle.click();

  const after = wasDone ? before - 1 : before + 1;
  await expect(card).toHaveText(`${after} / 75 solved`);
  await expect(page.getByText(new RegExp(`^${after}$`)).first()).toBeVisible(); // stats bar count
  expect(guard.stubbed.at(-1)).toMatchObject({ path: "/api/dsa/status", body: { status: wasDone ? "TODO" : "DONE" } });

  // And back again: nothing was saved, but the UI has to agree with itself.
  await toggle.click();
  await expect(card).toHaveText(`${before} / 75 solved`);

  expectOnlyStubbed(guard, /^\/api\/dsa\/status$/);
  await context.close();
});

test("DSA: the revision filter shows exactly the flagged problems", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: true });
  await page.goto(`${ORIGIN}/dashboard/dsa`);
  await settle(page);

  const chip = page.locator("button[aria-pressed]", { hasText: "For revision" });
  const flagged = Number((await chip.innerText()).match(/\d+/)![0]);
  expect(flagged).toBeGreaterThan(0);

  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await openTwoPointers(page);
  // Every visible row is flagged, and there are as many as the chip says.
  const rows = page.locator(".problem-row");
  await expect(rows).toHaveCount(flagged);
  await expect(rows.getByTitle("Remove from revision list")).toHaveCount(flagged);

  expectOnlyStubbed(guard);
  await context.close();
});

for (const device of ["desktop", "phone"] as const) {
  test(`DSA: a note is written and saved (${device})`, async ({ browser }) => {
    const { page, context, guard } = await openSession(browser, device, "dark", { signedIn: true });
    await page.goto(`${ORIGIN}/dashboard/dsa`);
    await settle(page);
    await openTwoPointers(page);

    await row(page, "Valid Palindrome").locator("button[data-note-trigger]").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // On a phone this is a bottom sheet — it has to actually be on screen.
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

    const text = "Two pointers from both ends; skip anything that isn't alphanumeric.";
    await dialog.locator("textarea").fill(text);
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toBeHidden();

    const saved = guard.stubbed.filter((h) => h.path === "/api/notes/upsert").at(-1);
    expect(saved?.body).toMatchObject({ content: text });

    expectOnlyStubbed(guard, /^\/api\/notes\/upsert$/);
    await context.close();
  });
}

test("Problem Bank: search narrows the list and a problem can be added to a sheet", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: true });
  await page.goto(`${ORIGIN}/dashboard/dsa`);
  await settle(page);

  await page.getByRole("link", { name: "Problem Bank" }).click();
  await page.waitForURL(/view=bank/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("500 problems");

  await page.getByPlaceholder(/search problems/i).fill("Trapping Rain Water");
  await expect(page.getByText(/^1 problems?$/).first()).toBeVisible();
  // One match, in a pattern group that opens like any other.
  await page.getByRole("button", { name: /^two pointers/i }).click();
  const hit = page.locator(".problem-row").filter({ hasText: "Trapping Rain Water" }).first();
  await expect(hit).toBeVisible();

  await hit.getByRole("button", { name: /add/i }).click();
  const sheetOption = page.getByRole("button", { name: "QA Smoke", exact: true });
  if (await sheetOption.isVisible()) await sheetOption.click();
  await expect(hit.getByText("Added")).toBeVisible();
  expect(guard.stubbed.at(-1)?.path).toMatch(/^\/api\/dsa\/sheets\/[^/]+\/add-problem$/);

  expectOnlyStubbed(guard, /^\/api\/dsa\/sheets\/[^/]+\/add-problem$/);
  await context.close();
});

test("Code review: a past attempt opens, shows the submission, and closes with Escape", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: true });
  await page.goto(`${ORIGIN}/dashboard/code-review/idempotency-middleware`);
  await settle(page);

  const opener = page.getByRole("button", { name: /view attempt/i }).first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/your review comments/i)).toBeVisible();
  await expect(dialog.getByText(/caught/i).first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  expectOnlyStubbed(guard);
  await context.close();
});

test("AI Mentor: a new question streams an answer into a fresh conversation", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: true });
  await page.goto(`${ORIGIN}/dashboard/mentor`);
  await settle(page);

  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/mentor/conversations") && r.request().method() === "POST"),
    page.getByRole("button", { name: /new chat/i }).filter({ visible: true }).first().click(),
  ]);
  await expect(page.getByText("Two pointers vs sliding window").filter({ visible: true }).first()).toBeVisible();

  const question = "When do I reach for two pointers instead of a sliding window?";
  const input = page.getByPlaceholder(/ask me anything/i).last();
  await input.fill(question);
  await input.press("Enter");

  await expect(page.getByText(question)).toBeVisible();
  await expect(page.getByText(/a quick tell/i)).toBeVisible();
  const chat = guard.stubbed.find((h) => h.path === "/api/mentor/chat");
  expect(JSON.stringify(chat?.body)).toContain(question);
  expect(MENTOR_REPLY).toContain("A quick tell");

  expectOnlyStubbed(guard, /^\/api\/mentor\/(chat|conversations(\/[^/]+\/messages)?)$/);
  await context.close();
});

test("URLs: an unknown view is redirected, a dead sheet is a 404", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: true });

  await page.goto(`${ORIGIN}/dashboard/dsa?view=lastminute&utm_source=newsletter`);
  await expect(page).toHaveURL(`${ORIGIN}/dashboard/dsa?utm_source=newsletter`);

  await page.goto(`${ORIGIN}/dashboard/dsa?sheet=deleted-sheet`);
  await expect(page.getByText(/couldn.t find that one/i)).toBeVisible();

  expectOnlyStubbed(guard);
  await context.close();
});

test("Theme and sign-out: the theme switches without a reload, and signing out leaves the dashboard", async ({ browser }) => {
  const { page, context, guard } = await openSession(browser, "desktop", "dark", { signedIn: true });
  await page.goto(`${ORIGIN}/dashboard`);
  await settle(page);

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /switch to light mode/i }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  // The session is a JWT: signing out clears the cookie and writes nothing.
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"));
  await page.goto(`${ORIGIN}/dashboard`);
  await expect(page).toHaveURL(/\/login/);

  expectOnlyStubbed(guard);
  await context.close();
});

test.afterAll(() => {
  // The server-side guard's view of the whole run: reads happened, and not a
  // single statement that would have written was even attempted.
  const log = JSON.parse(fs.readFileSync(DB_GUARD_LOG, "utf8"));
  expect(log.blocked).toEqual([]);
  expect(log.reads).toBeGreaterThan(0);
});
