import type { Browser, BrowserContext, Page } from "@playwright/test";
import { AUTH_STATE, DESKTOP, NOW, PHONE, TIMEZONE, type Device, type Theme } from "../config";
import { installGuard, type Guard } from "./guard";

export type Session = { context: BrowserContext; page: Page; guard: Guard };

/** A browser context for one device and theme, with the read-only guard and the
 *  fixed clock already in place — nothing opened here can write. */
export async function openSession(
  browser: Browser,
  device: Device,
  theme: Theme,
  { signedIn }: { signedIn: boolean },
): Promise<Session> {
  const context = await browser.newContext({
    ...(device === "phone"
      ? {
          viewport: PHONE.viewport,
          screen: PHONE.screen,
          deviceScaleFactor: PHONE.scale,
          isMobile: true,
          hasTouch: true,
          userAgent: PHONE.userAgent,
        }
      : { viewport: DESKTOP.viewport, deviceScaleFactor: DESKTOP.scale }),
    timezoneId: TIMEZONE,
    locale: "en-US",
    colorScheme: theme,
    storageState: signedIn ? AUTH_STATE : undefined,
  });

  // next-themes reads this before first paint, so the page never flashes the
  // other theme. Set on every navigation: storageState may carry an older value.
  await context.addInitScript((value) => {
    try {
      localStorage.setItem("theme", value);
    } catch {}
  }, theme);

  const guard = await installGuard(context);
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(NOW));
  return { context, page, guard };
}

/** Waits until the page has stopped changing: network quiet, fonts in, and a
 *  frame for anything that renders after hydration. */
export async function settle(page: Page) {
  // Capped: a shot that deliberately holds a request open (the loading state)
  // never goes idle.
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}
