import path from "node:path";

/** Everything the harness writes lands under examples/ (gitignored). */
export const ROOT = path.resolve(__dirname, "../..");
export const OUT = path.join(ROOT, "examples");
export const CACHE = path.join(OUT, ".cache");
export const AUTH_STATE = path.join(CACHE, "auth.json");
export const MANIFEST = path.join(CACHE, "manifest.json");
export const DB_GUARD_LOG = path.join(CACHE, "db-guard.json");

/** Its own port, so it can never be pointed at a server started some other way
 *  — only this harness's server carries the read-only guard. */
export const PORT = 3217;
export const ORIGIN = `http://localhost:${PORT}`;

/** The domain shown in the desktop frame's address bar. */
export const DISPLAY_HOST = "codeward-7cz5.vercel.app";

export const TIMEZONE = "Asia/Kolkata";

/** The instant the whole run pretends it is — server and browser alike.
 *  Defaults to 10:30 IST today: a morning greeting, and "x days ago" labels
 *  that are true of the data as it stands. Set SHOTS_NOW for an exact rerun. */
export const NOW = process.env.SHOTS_NOW ?? todayAt("10:30", "+05:30");

function todayAt(hhmm: string, offset: string) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
  return `${day}T${hhmm}:00${offset}`;
}

export type Device = "phone" | "desktop";
export type Theme = "dark" | "light";
export const THEMES: Theme[] = ["dark", "light"];

/** iPhone 15 Pro. The page gets the screen minus the status bar and the home
 *  indicator — the safe area — so nothing the app draws can sit under either;
 *  the frame paints those two strips around it. */
export const PHONE = {
  screen: { width: 393, height: 852 },
  safeTop: 59,
  safeBottom: 34,
  scale: 3,
  get viewport() {
    return { width: this.screen.width, height: this.screen.height - this.safeTop - this.safeBottom };
  },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
};

export const DESKTOP = {
  viewport: { width: 1440, height: 900 },
  scale: 2,
};

export const credentials = () => {
  const email = process.env.SHOTS_EMAIL;
  const password = process.env.SHOTS_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set SHOTS_EMAIL and SHOTS_PASSWORD in .env.screenshots (see tools/screenshots/README.md).",
    );
  }
  return { email, password };
};
