import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { AUTH_STATE, credentials, DB_GUARD_LOG, ORIGIN } from "./config";
import { installGuard } from "./lib/guard";

/**
 * Signs in once and saves the session for every other test to reuse — one
 * credentials check per run instead of one per screenshot.
 *
 * Signing in only reads: the password is checked against the stored hash and
 * the session is a JWT cookie, so no row is created or updated.
 */
test("sign in", async ({ browser }) => {
  // A run starts here, so its database-guard counts start here too.
  fs.mkdirSync(path.dirname(DB_GUARD_LOG), { recursive: true });
  fs.writeFileSync(DB_GUARD_LOG, JSON.stringify({ reads: 0, blocked: [] }, null, 2));

  const { email, password } = credentials();
  const context = await browser.newContext();
  const guard = await installGuard(context);
  const page = await context.newPage();

  await page.goto(`${ORIGIN}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();

  // The session cookie's expiry is written by a server whose clock is pinned to
  // SHOTS_NOW. Rewrite it as a session cookie so the real clock can't expire it
  // mid-run when SHOTS_NOW is set well in the past.
  const cookies = await context.cookies();
  await context.clearCookies();
  await context.addCookies(cookies.map((c) => ({ ...c, expires: -1 })));

  fs.mkdirSync(path.dirname(AUTH_STATE), { recursive: true });
  await context.storageState({ path: AUTH_STATE });
  expect(guard.blocked).toEqual([]);
  await context.close();
});
