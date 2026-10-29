import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { AUTH_STATE, CACHE, NOW, ORIGIN, OUT, ROOT, TIMEZONE } from "./config";
import { installGuard } from "./lib/guard";
import { settle } from "./lib/session";

/**
 * The portfolio's hover preview: a code review being graded, in ~3.6s.
 * `npm run shots:video` → examples/featured/codeward-hover.{mp4,webm,jpg}, with a
 * copy (plus the 16:9 cover and a hover preview) in docs/portfolio — kept in
 * the project but gitignored.
 *
 * Codeward's own idea in one beat: comments land on the buggy lines of a real
 * PR, the review is submitted, and the score ring fills to 100 — "6/6 issues
 * caught". A virtual camera keeps it readable at the ~560×315 it is shown at:
 * zoomed on the lines being flagged, then gliding to the result.
 *
 * Recorded frame by frame on a virtual clock, not in real time:
 * - JavaScript timers (React's effects, requestAnimationFrame) belong to
 *   Playwright's fake clock, advanced exactly 1/30s per frame.
 * - CSS transitions and animations (the ring filling) run on the compositor's
 *   real clock, which the fake one doesn't reach — so each is paused and its
 *   currentTime set from the same virtual clock before every frame.
 * - The camera is a CSS transform on <html>, so the browser redraws the text at
 *   the zoomed size and it stays sharp.
 *
 * Read-only: the grade request is answered with the account's real stored
 * attempt for this PR (the same JSON "View attempt" reads), so there is no
 * model call and nothing is saved. The comments are the reviewer's own words
 * from that attempt, and its full overall note is filled in off-camera, so
 * what gets submitted is the review that earned the score.
 */

const FPS = 30;
/** A 1280×720 window zoomed to about 125% — a 1024×576 page — drawn at
 *  1.875× so the file is 1920×1080 and stays sharp on high-density screens. */
const ZOOM = Number(process.env.SHOTS_VIDEO_ZOOM ?? 1.25);
const SIZE = { width: 1920, height: 1080 };
const VIEWPORT = { width: Math.round(1280 / ZOOM), height: Math.round(720 / ZOOM) };
const SCALE = SIZE.width / VIEWPORT.width;

const SLUG = "idempotency-middleware";
/** The reviewer's words from the stored attempt, on the lines they're about. */
const COMMENTS: [line: number, text: string][] = [
  [12, "Require an idempotency key, scoped to the authenticated customer."],
  [14, "Check-then-charge races under concurrent retries: needs an atomic, durable claim."],
];

/** Frame timeline: flag two lines, glide to the result rail, then submit —
 *  so the ring fills in full view rather than mid-pan. */
const AT = { comment1: 5, comment2: 15, panStart: 22, panEnd: 40, submit: 40, end: 96 };
const FADE = 0.45;
/** Camera zoom on the code, and closer on the result card. */
const ZA = 1.9;
const ZB = 2.8;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

test("hover video", async ({ browser }) => {
  test.setTimeout(240_000);
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

  await page.goto(`${ORIGIN}/dashboard/code-review/${SLUG}`);
  await settle(page);

  // The real stored attempt — read, exactly as "View attempt" reads it.
  const [attemptRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/attempts/review/")),
    page.getByRole("button", { name: /view attempt/i }).first().click(),
  ]);
  const attempt = await attemptRes.json();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const overall = String(attempt.comments).replace(/^Overall:\s*/m, "");
  await page.route("**/api/review/grade", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ score: attempt.score, caught: attempt.caught, missed: attempt.missed, feedback: attempt.feedback }),
    }),
  );

  // Off-camera: the attempt's full overall note, so the submission is the
  // review that earned this grade.
  await page.getByPlaceholder(/anything not tied to a single line/i).fill(overall);

  // Frame the grid: the code pane and the results rail, top just in view.
  await page.addStyleTag({
    content: `.floating-mentor { display: none !important; }
      * { caret-color: transparent !important; scroll-behavior: auto !important; }`,
  });
  const geo = await page.evaluate((lines) => {
    const main = document.querySelector("main")!;
    const surface = document.querySelector(".code-surface")!;
    const grid = surface.closest("div.grid")!;
    main.scrollTop += grid.getBoundingClientRect().top - main.getBoundingClientRect().top - 14;
    const rows = [...surface.children] as HTMLElement[];
    const row = (n: number) => rows[n - 1].getBoundingClientRect();
    const code = surface.getBoundingClientRect();
    const rail = (grid.children[1] as HTMLElement).getBoundingClientRect();
    return { scrollTop: main.scrollTop, codeLeft: code.left, firstTop: row(lines[0] - 2).top, railTop: rail.top, railRight: rail.right };
  }, COMMENTS.map(([l]) => l));

  // Pointer-free from here: no hover state can sneak into a frame.
  await page.addStyleTag({ content: "html { pointer-events: none; }" });

  // Camera windows, in page pixels, both 16:9.
  const win = (z: number) => ({ w: VIEWPORT.width / z, h: VIEWPORT.height / z });
  const A = { x: geo.codeLeft - 10, y: geo.firstTop - 14 };
  const B = { x: geo.railRight + 8 - win(ZB).w, y: geo.railTop - 8 };

  // Virtual time for CSS animations, and the camera, applied before each frame.
  await page.evaluate(() => {
    const w = window as unknown as { __vt: number; __step: (dt: number) => void; __cam: (x: number, y: number, z: number) => void };
    w.__vt = 0;
    w.__step = (dt) => {
      w.__vt += dt;
      for (const a of document.getAnimations() as (Animation & { __t0?: number })[]) {
        // First sight: keep whatever progress it already has. Restarting a
        // finished fill-forwards animation (the page's fade-in) from zero
        // blanked the opening frames.
        if (a.__t0 === undefined) { a.__t0 = w.__vt - (Number(a.currentTime) || 0); a.pause(); }
        a.currentTime = w.__vt - a.__t0;
      }
    };
    w.__cam = (x, y, z) => {
      const h = document.documentElement;
      h.style.transformOrigin = "0 0";
      h.style.transform = `scale(${z}) translate(${-x}px, ${-y}px)`;
    };
  });

  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1000);

  const addComment = async (line: number, text: string) => {
    await page.evaluate((n) => (document.querySelector(".code-surface")!.children[n - 1].firstElementChild as HTMLElement).click(), line);
    const editor = page.getByPlaceholder(/what's wrong with this line/i);
    await editor.fill(text);
    await editor.press("Control+Enter");
    await page.evaluate((top) => { document.querySelector("main")!.scrollTop = top; }, geo.scrollTop);
  };

  for (let f = 0; f < AT.end; f++) {
    if (f === AT.comment1) await addComment(...COMMENTS[0]);
    if (f === AT.comment2) await addComment(...COMMENTS[1]);
    if (f === AT.submit) {
      await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Submit review"))!.click());
      await page.getByText(/issues caught/).waitFor();
    }

    const p = ease(Math.min(1, Math.max(0, (f - AT.panStart) / (AT.panEnd - AT.panStart))));
    // Glide between the two windows, with a slow push-in over the whole clip.
    const z = (ZA + (ZB - ZA) * p) * (1 + 0.04 * (f / AT.end));
    const a = { cx: A.x + win(ZA).w / 2, cy: A.y + win(ZA).h / 2 };
    const b = { cx: B.x + win(ZB).w / 2, cy: B.y + win(ZB).h / 2 };
    const cx = a.cx + (b.cx - a.cx) * p, cy = a.cy + (b.cy - a.cy) * p;
    const x = Math.min(Math.max(0, cx - win(z).w / 2), VIEWPORT.width - win(z).w);
    const y = Math.min(Math.max(0, cy - win(z).h / 2), VIEWPORT.height - win(z).h);

    if (f > 0) await page.clock.runFor(1000 / FPS);
    await page.evaluate(([x, y, z, step]) => {
      const w = window as unknown as { __step: (dt: number) => void; __cam: (x: number, y: number, z: number) => void };
      w.__step(step);
      w.__cam(x, y, z);
    }, [x, y, z, f > 0 ? 1000 / FPS : 0]);
    await page.screenshot({ path: path.join(frames, `${String(f).padStart(4, "0")}.png`) });
  }

  expect(guard.blocked, "unexpected write attempts").toEqual([]);
  await context.close();

  // Encode. The tail crossfades into the first frame, so the clip's last frame
  // is its first and the loop has no seam.
  const n = AT.end;
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

  // And a copy in docs/portfolio, a fixed place in the project to pick them up
  // from. Gitignored, like examples/: the portfolio assets stay out of the repo.
  const keep = path.join(ROOT, "docs", "portfolio");
  fs.mkdirSync(keep, { recursive: true });
  const files = ["codeward-hover.mp4", "codeward-hover.webm", "codeward-hover-poster.jpg", "codeward-cover-16x9.jpg", "hover-preview.html"];
  for (const f of files) {
    expect(fs.existsSync(path.join(dir, f)), `${f} — run \`npm run shots\` first for the cover`).toBe(true);
    fs.copyFileSync(path.join(dir, f), path.join(keep, f));
  }
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
