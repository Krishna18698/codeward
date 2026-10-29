import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { AUTH_STATE, CACHE, NOW, ORIGIN, OUT, TIMEZONE } from "./config";
import { installGuard } from "./lib/guard";
import { settle } from "./lib/session";

/**
 * The portfolio's hover preview: a 16:9 clip of a mentor answer streaming in.
 * `npm run shots:video` → examples/featured/codeward-hover.{mp4,webm,jpg}.
 *
 * Recorded frame by frame, not in real time. The answer is typed out by the
 * app's own setInterval (5 characters every 16ms), and Playwright's fake clock
 * owns that timer: each frame advances the clock exactly 1/30s and takes a
 * screenshot. So the clip is a true 30fps however slow the machine is, and the
 * same every run. CSS animations are made instant for the same reason — they
 * run on the compositor's real clock, which the fake one doesn't reach.
 *
 * Read-only like everything here: the question goes to the mentor stub in
 * lib/guard.ts, so there is no model call and nothing is saved.
 */

const FPS = 30;
/** A 1280×720 window zoomed to about 125% — a 1024×576 page — because the clip
 *  is shown at roughly 560×315. Drawn at 1.875× so the file is 1920×1080 and
 *  stays sharp on high-density screens; the layout is the 1024 one either way. */
const ZOOM = Number(process.env.SHOTS_VIDEO_ZOOM ?? 1.25);
const SIZE = { width: 1920, height: 1080 };
const VIEWPORT = { width: Math.round(1280 / ZOOM), height: Math.round(720 / ZOOM) };
const SCALE = SIZE.width / VIEWPORT.width;
const QUESTION = "When do I reach for two pointers instead of a sliding window?";

/** Before the first character, after the last one, and the crossfade home. */
const LEAD_IN = 0.35;
const HOLD = 0.9;
const FADE = 0.45;

test("hover video", async ({ browser }) => {
  test.setTimeout(180_000);
  const frames = path.join(CACHE, "video-frames");
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    colorScheme: "dark",
    timezoneId: TIMEZONE,
    locale: "en-US",
    storageState: AUTH_STATE,
  });
  await context.addInitScript(() => localStorage.setItem("theme", "dark"));
  const guard = await installGuard(context);
  const page = await context.newPage();
  await page.clock.install({ time: new Date(NOW) });

  await page.goto(`${ORIGIN}/dashboard/mentor`);
  await settle(page);

  // A fresh conversation, so the transcript is just this question and answer.
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/mentor/conversations") && r.request().method() === "POST"),
    page.getByRole("button", { name: /new chat/i }).filter({ visible: true }).first().click(),
  ]);
  await page.getByText("Two pointers vs sliding window").filter({ visible: true }).first().waitFor();
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important; animation-delay: 0s !important;
      transition-duration: 0s !important; transition-delay: 0s !important;
      caret-color: transparent !important; scroll-behavior: auto !important; }`,
  });
  await page.mouse.move(VIEWPORT.width - 2, VIEWPORT.height - 2);

  const input = page.getByPlaceholder(/ask me anything/i).last();
  await input.fill(QUESTION);

  // From here on, time moves only when a frame asks it to.
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1000);
  await input.press("Enter");
  await page.getByText(QUESTION).last().waitFor();
  await input.blur();

  const shoot = async (n: number) =>
    page.screenshot({ path: path.join(frames, `${String(n).padStart(4, "0")}.png`) });
  const typedOut = () =>
    page.evaluate(() => (document.querySelector("main")?.innerText ?? "").includes("think pointers."));

  let n = 0;
  for (let i = 0; i < Math.round(LEAD_IN * FPS); i++) await shoot(n++);
  for (let guardFrames = 0; !(await typedOut()); guardFrames++) {
    expect(guardFrames, "the answer never finished typing").toBeLessThan(10 * FPS);
    await page.clock.runFor(1000 / FPS);
    await shoot(n++);
  }
  for (let i = 0; i < Math.round(HOLD * FPS); i++) {
    await page.clock.runFor(1000 / FPS);
    await shoot(n++);
  }

  expect(guard.blocked, "unexpected write attempts").toEqual([]);
  await context.close();

  // Encode. The tail crossfades into the first frame, so the clip's last frame
  // is its first and the loop has no seam.
  const dir = path.join(OUT, "featured");
  fs.mkdirSync(dir, { recursive: true });
  const seconds = n / FPS;
  const loop = [
    "-framerate", String(FPS), "-i", path.join(frames, "%04d.png"),
    "-loop", "1", "-framerate", String(FPS), "-t", String(FADE), "-i", path.join(frames, "0000.png"),
    "-filter_complex",
    `[0:v]settb=AVTB,setpts=PTS-STARTPTS[a];[1:v]settb=AVTB,setpts=PTS-STARTPTS[b];` +
      `[a][b]xfade=transition=fade:duration=${FADE}:offset=${(seconds - FADE).toFixed(3)},format=yuv420p`,
    "-r", String(FPS), "-an",
  ];
  const ffmpeg = (args: string[]) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
  ffmpeg([...loop, "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-profile:v", "high", "-movflags", "+faststart",
    path.join(dir, "codeward-hover.mp4")]);
  ffmpeg([...loop, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-deadline", "good",
    path.join(dir, "codeward-hover.webm")]);
  ffmpeg(["-i", path.join(frames, "0000.png"), "-q:v", "3", path.join(dir, "codeward-hover-poster.jpg")]);

  // A card that behaves like the portfolio's: the 16:9 cover at rest, the clip
  // on hover. Open it in a browser to check the pair before shipping them.
  fs.writeFileSync(path.join(dir, "hover-preview.html"), PREVIEW);
});

const PREVIEW = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Codeward Hover Preview</title>
<style>
  :root { --bg: #1b1b1b; --card: #202020; --line: #2c2c2c; --ink: #ececec; --muted: #8d8d8d; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--bg);
         font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: var(--ink); }
  a.card { color: inherit; text-decoration: none; display: block; }
  .card { width: min(560px, calc(100vw - 32px)); border: 1px solid var(--line); border-radius: 12px; background: var(--card); padding: 6px 6px 14px; }
  /* The 16:9 box the portfolio shows covers in. */
  .media { position: relative; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; background: #07090a; }
  .media img, .media video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .media video { opacity: 0; transition: opacity .2s ease; }
  .card:hover .media video, .card:focus-within .media video { opacity: 1; }
  .title { margin: 12px 8px 0; font-size: 17px; font-weight: 500; }
  .desc { margin: 4px 8px 0; color: var(--muted); }
  @media (prefers-reduced-motion: reduce) { .media video { display: none; } }
</style>
</head>
<body>
  <a class="card" href="#" aria-label="Codeward">
    <div class="media">
      <!-- From the compose step (codeward-cover-16x9.jpg). -->
      <img src="codeward-cover-16x9.jpg" alt="Codeward — interview prep by pattern">
      <!-- Muted, looping, inline: plays on every device. preload="none" so the
           clip only downloads when someone actually hovers. -->
      <video muted loop playsinline preload="none" poster="codeward-hover-poster.jpg" aria-hidden="true">
        <source src="codeward-hover.webm" type="video/webm">
        <source src="codeward-hover.mp4" type="video/mp4">
      </video>
    </div>
    <div class="title">Codeward</div>
    <div class="desc">Hover the card to play the preview.</div>
  </a>
  <script>
    const card = document.querySelector(".card");
    const video = card.querySelector("video");
    const play = () => { video.currentTime = 0; video.play().catch(() => {}); };
    const stop = () => { video.pause(); };
    card.addEventListener("mouseenter", play);
    card.addEventListener("focusin", play);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focusout", stop);
  </script>
</body>
</html>
`;
