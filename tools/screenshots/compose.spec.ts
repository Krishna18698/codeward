import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { CACHE, DB_GUARD_LOG, NOW, OUT, PHONE, type Device, type Theme } from "./config";
import { desktopFrame, escapeHtml, phoneFrame } from "./lib/frames";
import { renderCovers, renderFeatured } from "./lib/portfolio";

/**
 * Turns the raw captures into the deliverables:
 *
 *   examples/framed/<device>/<theme>/*.png   every capture in a device frame
 *   examples/contact-sheet.png                everything on one page
 *   examples/covers/                          three 4:3 portfolio covers
 *   examples/featured/                        the portfolio card image + preview
 *
 * Runs after `capture` (and `setup`) as its own Playwright project. To redo
 * only this step without re-shooting: `npm run shots:compose`.
 */

type Meta = {
  id: string;
  title: string;
  group: string;
  device: Device;
  theme: Theme;
  file: string;
  displayPath: string;
};

test.describe.configure({ mode: "serial" });

const readManifest = (): Meta[] => {
  const metas: Meta[] = [];
  for (const device of ["phone", "desktop"] as Device[]) {
    for (const theme of ["dark", "light"] as Theme[]) {
      const dir = path.join(OUT, "raw", device, theme);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
        metas.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      }
    }
  }
  return metas;
};

const rawPath = (m: Meta) => path.join(OUT, "raw", m.device, m.theme, m.file);
const framedPath = (m: Meta) => path.join(OUT, "framed", m.device, m.theme, m.file);
const dataUrl = (file: string) => `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;

test("the database was never written", () => {
  // Written by server/db-readonly.cjs inside the harness's Next server.
  const log = JSON.parse(fs.readFileSync(DB_GUARD_LOG, "utf8"));
  expect(log.blocked, "SQL writes the server refused").toEqual([]);
  expect(log.reads, "no reads went through the guard — is it loaded?").toBeGreaterThan(0);
});

test("frames", async ({ browser }) => {
  const metas = readManifest();
  expect(metas.length).toBeGreaterThan(0);

  for (const device of ["phone", "desktop"] as Device[]) {
    const context = await browser.newContext({
      deviceScaleFactor: device === "phone" ? PHONE.scale : 2,
      viewport: { width: 1600, height: 1200 },
    });
    const page = await context.newPage();
    for (const m of metas.filter((m) => m.device === device)) {
      const html = device === "phone" ? phoneFrame(dataUrl(rawPath(m))) : desktopFrame(dataUrl(rawPath(m)), m.displayPath, m.theme);
      await page.setContent(html);
      if (device === "phone") await page.waitForFunction(() => document.documentElement.dataset.framed === "1");
      else await page.locator("img").evaluate((img: HTMLImageElement) => img.decode());
      const target = page.locator(device === "phone" ? ".device" : "body");
      fs.mkdirSync(path.dirname(framedPath(m)), { recursive: true });
      await target.screenshot({ path: framedPath(m), omitBackground: true });
    }
    await context.close();
  }
});

/** One HTML page of framed thumbnails, rendered to a PNG. */
async function sheet(page: Page, file: string, title: string, sections: { heading: string; items: Meta[] }[], opts: { phoneW: number; desktopW: number; width: number }) {
  const tile = (m: Meta) => {
    const w = m.device === "phone" ? opts.phoneW : opts.desktopW;
    return `<figure style="width:${w}px"><img src="${pathToFileURL(framedPath(m)).href}" style="width:${w}px"><figcaption><span>${m.id}</span>${escapeHtml(m.title)}</figcaption></figure>`;
  };
  const html = /* html */ `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
  <style>
    body { margin: 0; width: ${opts.width}px; background: #0d0f10; color: #e9ecea; font-family: Geist, system-ui, sans-serif; }
    header { padding: 48px 56px 8px; }
    h1 { margin: 0; font-size: 34px; font-weight: 600; letter-spacing: -.02em; }
    h1 em { font-style: normal; color: #34d399; }
    .meta { margin-top: 8px; color: #8b928f; font: 400 14px/1.4 "Geist Mono", monospace; }
    section { padding: 28px 56px 20px; }
    h2 { margin: 0 0 18px; font-size: 13px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #8b928f; display: flex; gap: 12px; align-items: baseline; }
    h2 b { color: #e9ecea; font-weight: 600; }
    .grid { display: flex; flex-wrap: wrap; gap: 28px 24px; align-items: flex-start; }
    figure { margin: 0; }
    img { display: block; }
    figcaption { margin-top: 8px; font-size: 13px; color: #c3c9c6; display: flex; gap: 8px; }
    figcaption span { font-family: "Geist Mono", monospace; color: #34d399; }
  </style></head><body>
  <header><h1>Code<em>ward</em> — ${escapeHtml(title)}</h1>
  <div class="meta">${sections.reduce((n, s) => n + s.items.length, 0)} captures · clock pinned to ${escapeHtml(NOW)} · rendered from the production build</div></header>
  ${sections.map((s) => `<section><h2><b>${escapeHtml(s.heading)}</b> ${s.items.length}</h2><div class="grid">${s.items.map(tile).join("")}</div></section>`).join("")}
  </body></html>`;
  const htmlFile = path.join(CACHE, path.basename(file).replace(/\.png$/, ".html"));
  fs.writeFileSync(htmlFile, html);
  await page.goto(pathToFileURL(htmlFile).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: true });
}

test("contact sheet", async ({ browser }) => {
  const metas = readManifest();
  const context = await browser.newContext({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const sections = (["phone", "desktop"] as Device[]).flatMap((device) =>
    (["dark", "light"] as Theme[]).map((theme) => ({
      heading: `${device === "phone" ? "Phone" : "Desktop"} · ${theme === "dark" ? "Dark" : "Light"}`,
      items: metas.filter((m) => m.device === device && m.theme === theme),
    })),
  );
  await sheet(page, path.join(OUT, "contact-sheet.png"), "every screen", sections, { phoneW: 196, desktopW: 424, width: 2400 });

  // Smaller sheets, large enough to read each capture — the ones to review by eye.
  const review = path.join(CACHE, "review");
  fs.rmSync(review, { recursive: true, force: true });
  for (const s of sections) {
    const per = s.items[0]?.device === "phone" ? 12 : 6;
    for (let i = 0; i < s.items.length; i += per) {
      const name = `${s.heading.toLowerCase().replace(/[^a-z]+/g, "-")}${String(i / per + 1).padStart(2, "0")}.png`;
      await sheet(page, path.join(review, name), s.heading, [{ heading: s.heading, items: s.items.slice(i, i + per) }], {
        phoneW: 250,
        desktopW: 520,
        width: 1720,
      });
    }
  }
  await context.close();
});

test("portfolio covers", async ({ browser }) => {
  await renderCovers(browser);
});

test("featured card", async ({ browser }) => {
  await renderFeatured(browser);
});
