import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { OUT, ORIGIN, THEMES, type Device } from "./config";
import { openSession, settle } from "./lib/session";
import { SHOTS } from "./shots";

/**
 * Captures every entry in shots.ts on phone and desktop, dark and light, to
 * examples/raw/<device>/<theme>/<id>-<slug>.png, with a sidecar .json the
 * compose step reads (title, group, address-bar path).
 *
 * Viewport captures, not full-page: these are what a screen actually shows,
 * and they are what the device frames are sized for.
 */

const DEVICES: Device[] = ["phone", "desktop"];

const slug = (s: string) =>
  s.toLowerCase().replace(/[—–]/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

test.describe.configure({ mode: "parallel" });

for (const device of DEVICES) {
  for (const theme of THEMES) {
    for (const shot of SHOTS) {
      if (shot.only && shot.only !== device) continue;

      test(`${device} · ${theme} · ${shot.id} ${shot.title}`, async ({ browser }) => {
        const { context, page, guard } = await openSession(browser, device, theme, { signedIn: shot.auth });
        try {
          await page.goto(`${ORIGIN}${shot.path}`);
          await settle(page);
          if (shot.run) {
            await shot.run(page, device);
            await settle(page);
          }

          const dir = path.join(OUT, "raw", device, theme);
          fs.mkdirSync(dir, { recursive: true });
          const base = `${shot.id}-${slug(shot.title)}`;
          await page.screenshot({ path: path.join(dir, `${base}.png`), animations: "disabled", caret: "hide" });
          fs.writeFileSync(
            path.join(dir, `${base}.json`),
            JSON.stringify({
              id: shot.id,
              title: shot.title,
              group: shot.group,
              device,
              theme,
              file: `${base}.png`,
              displayPath: shot.displayPath ?? new URL(page.url()).pathname + new URL(page.url()).search,
            }),
          );

          // Nothing may have tried to write without a stub answering it.
          expect(guard.blocked, "unexpected write attempts").toEqual([]);
        } finally {
          // After a timeout Playwright has already torn the context down; a
          // second close would throw over the real error.
          await context.close().catch(() => {});
        }
      });
    }
  }
}
