import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { AUTH_STATE, CACHE, DB_GUARD_LOG, ORIGIN, TIMEZONE } from "./config";
import { installGuard } from "./lib/guard";

/**
 * Before/after numbers for performance work — `npm run shots:perf`.
 * Writes examples/.cache/perf-<label>.json (SHOTS_PERF_LABEL, default "run").
 *
 * - Server: for /dashboard and /dashboard/profile over warm loads, time to
 *   first byte and — because both pages stream, so the first byte is only the
 *   shell — time until the whole response has streamed, which includes the
 *   data work. Plus how many SQL statements each load runs (counted by the
 *   database guard, so it is the real query count, not an estimate).
 * - Editor: JavaScript transferred and time until the editor shows
 *   highlighted code, cold, with the CPU slowed 4× to stand in for a phone.
 *   Plus what the catalog pages that preload the editor download.
 *
 * Read-only like the rest of the harness. Absolute numbers depend on the
 * machine and network to Neon; compare runs taken back to back.
 */

const LABEL = process.env.SHOTS_PERF_LABEL ?? "run";
const LOADS = 8;

test.describe.configure({ mode: "serial" });

const result: Record<string, unknown> = { label: LABEL, at: new Date().toISOString() };
const reads = () => JSON.parse(fs.readFileSync(DB_GUARD_LOG, "utf8")).reads as number;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function newPage(browser: import("@playwright/test").Browser) {
  const context = await browser.newContext({ storageState: AUTH_STATE, timezoneId: TIMEZONE, viewport: { width: 1440, height: 900 } });
  await installGuard(context);
  return { context, page: await context.newPage() };
}

for (const route of ["/dashboard", "/dashboard/profile"]) {
  test(`server: ${route}`, async ({ browser }) => {
    const { context, page } = await newPage(browser);
    const ttfb: number[] = [];
    const done: number[] = [];
    const queries: number[] = [];
    for (let i = 0; i < LOADS + 2; i++) {
      const before = reads();
      await page.goto(`${ORIGIN}${route}`, { waitUntil: "networkidle" });
      const t = await page.evaluate(() => {
        const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        return { first: n.responseStart - n.requestStart, end: n.responseEnd - n.requestStart };
      });
      if (i >= 2) { // the first two warm up
        ttfb.push(Math.round(t.first));
        done.push(Math.round(t.end));
        queries.push(reads() - before);
      }
    }
    result[`server ${route}`] = {
      ttfbMedianMs: median(ttfb),
      streamedMedianMs: median(done),
      streamedMs: done,
      sqlPerLoad: median(queries),
    };
    await context.close();
  });
}

async function scriptBytes(page: Page, run: () => Promise<void>) {
  let bytes = 0;
  const sizes: Promise<void>[] = [];
  page.on("requestfinished", (req) => {
    if (req.resourceType() !== "script" || !req.url().startsWith(ORIGIN)) return;
    sizes.push(req.sizes().then((s) => { bytes += s.responseBodySize; }));
  });
  await run();
  await Promise.all(sizes);
  return bytes;
}

for (const [name, url] of [
  ["editor: bug hunt (TypeScript)", "/dashboard/bug-hunt/double-charge-race"],
  ["editor: build it (C#)", "/dashboard/build-it/thread-safe-wallet"],
] as const) {
  test(name, async ({ browser }) => {
    const { context, page } = await newPage(browser);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    let readyMs = 0;
    const bytes = await scriptBytes(page, async () => {
      const t0 = Date.now();
      await page.goto(`${ORIGIN}${url}`);
      // Highlighted = the language is loaded and has tokenised the code.
      await page.locator(".cm-content .cm-line span[class]").first().waitFor({ timeout: 30_000 });
      readyMs = Date.now() - t0;
      await page.waitForLoadState("networkidle");
    });
    result[name] = { jsKB: Math.round(bytes / 1024), editorReadyMs: readyMs };
    await context.close();
  });
}

for (const url of ["/dashboard/bug-hunt", "/dashboard/build-it"]) {
  test(`catalog: ${url}`, async ({ browser }) => {
    const { context, page } = await newPage(browser);
    const bytes = await scriptBytes(page, async () => {
      await page.goto(`${ORIGIN}${url}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500); // the editor preload runs at idle
      await page.waitForLoadState("networkidle");
    });
    result[`catalog ${url}`] = { jsKB: Math.round(bytes / 1024) };
    await context.close();
  });
}

test.afterAll(() => {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `perf-${LABEL}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  expect(Object.keys(result).length).toBeGreaterThan(2);
});
