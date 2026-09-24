import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { OUT, ROOT, type Device, type Theme } from "./config";

/**
 * README images — `npm run shots:readme`, after `npm run shots`.
 *
 * The captures live in examples/, which is gitignored and ~100MB of PNGs, so
 * the README can't point at them. This writes small JPEGs of a chosen set to
 * docs/screenshots/<dark|light>/, which ARE committed.
 *
 * Both themes of every shot, so the README can serve each through a <picture>:
 * GitHub shows the dark capture to readers in dark mode and the light one in
 * light mode. Each framed capture is composited onto that GitHub theme's own
 * page colour, so the frame's shadow sits on the ground it will be seen on.
 *
 * Profile is left out on purpose: it shows the signed-in account's email.
 */

const DOCS = path.join(ROOT, "docs", "screenshots");

/** GitHub's page backgrounds, so a frame's shadow reads as it will on the page. */
const GROUND: Record<Theme, string> = { dark: "#0d1117", light: "#ffffff" };

/** Rendered width: desktop frames are shown up to full README width, phones
 *  four to a row — both at roughly 1.5× their display size. */
const WIDTH: Record<Device, number> = { desktop: 1400, phone: 420 };

export const README_SHOTS: { device: Device; id: string }[] = [
  ...["01", "02", "03", "04", "05", "07", "09", "11", "12",
      "13", "15", "17", "18", "19", "20", "21", "22", "23", "24", "25", "27", "28",
      "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43",
  ].map((id) => ({ device: "desktop" as const, id })),
  ...["01", "05", "06", "08", "10", "12", "13", "14", "15", "17", "18", "19", "20", "21", "22", "23", "24", "25",
      "26", "27", "28", "30", "32", "33", "35", "36", "38", "40", "42", "43",
  ].map((id) => ({ device: "phone" as const, id })),
];

const framedFile = (device: Device, theme: Theme, id: string) => {
  const dir = path.join(OUT, "framed", device, theme);
  const file = fs.readdirSync(dir).find((f) => f.startsWith(`${id}-`) && f.endsWith(".png"));
  if (!file) throw new Error(`no framed ${device}/${theme} capture for ${id} — run \`npm run shots\` first`);
  return path.join(dir, file);
};

test("README images", async ({ browser }) => {
  fs.rmSync(DOCS, { recursive: true, force: true });
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  for (const theme of ["dark", "light"] as Theme[]) {
    fs.mkdirSync(path.join(DOCS, theme), { recursive: true });
    for (const { device, id } of README_SHOTS) {
      const src = framedFile(device, theme, id);
      const width = WIDTH[device];
      await page.setContent(`<!doctype html><html><body style="margin:0;background:${GROUND[theme]}">
        <img src="${pathToFileURL(src).href}" style="display:block;width:${width}px"></body></html>`);
      // setContent pages are about:blank, which can't load file:// images —
      // go through a file:// page instead.
      const html = path.join(OUT, ".cache", "readme-frame.html");
      fs.writeFileSync(html, await page.content());
      await page.goto(pathToFileURL(html).href);
      const img = page.locator("img");
      await img.evaluate((el: HTMLImageElement) => el.decode());
      const out = path.join(DOCS, theme, `${device}-${path.basename(src, ".png")}.jpg`);
      await img.screenshot({ path: out, type: "jpeg", quality: 84 });
    }
  }

  // The portfolio images, as they are.
  fs.copyFileSync(path.join(OUT, "featured", "codeward-card.jpg"), path.join(DOCS, "codeward.jpg"));
  for (const f of fs.readdirSync(path.join(OUT, "covers")).filter((f) => f.endsWith(".jpg"))) {
    fs.copyFileSync(path.join(OUT, "covers", f), path.join(DOCS, f));
  }

  await page.close();
  expect(fs.readdirSync(path.join(DOCS, "dark"))).toHaveLength(README_SHOTS.length);
});
