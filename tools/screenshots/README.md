# Screenshot harness

Renders the real app (the production build) in Chromium, captures every screen
and state on phone and desktop in dark and light, frames them, and composes the
contact sheet, portfolio covers and portfolio card. It also runs an end-to-end
test through the main journeys.

Nothing it does writes to the database. See [Read-only by construction](#read-only-by-construction).

## Run it

```sh
npm run shots          # build, then capture → frames → contact sheet → covers → card
npm run shots:compose  # redo frames/sheet/covers/card from the existing captures
npm run shots:e2e      # build, then the end-to-end journeys (must pass)
npm run shots:readme   # README-sized copies into docs/screenshots/ (committed)
npm run shots:video    # the portfolio's hover clip (after `npm run shots`)
```

It signs in as a real account and photographs its data as it stands. Put that
account's credentials in `.env.screenshots` at the repo root (gitignored by the
`.env*` rule, so they never reach the public repo):

```sh
SHOTS_EMAIL=you@example.com
SHOTS_PASSWORD=…
```

It starts its own server on port 3217 and refuses to reuse one that is already
running. Only the server it starts carries the read-only guard and the fixed
clock.

## What you get (`examples/`, gitignored)

| Path | What |
|---|---|
| `raw/<phone\|desktop>/<dark\|light>/NN-name.png` | Viewport captures. Phone 1179×2277 (393×759 @3x), desktop 2880×1800 (@2x) |
| `framed/…` | The same captures in an iPhone 15 Pro bezel or a browser window, on a transparent background |
| `contact-sheet.png` | Every framed capture on one page |
| `covers/cover-N-*.png` / `.jpg` | Three 4:3 portfolio covers: 3200×2400 PNG and 1600×1200 JPG |
| `featured/codeward-card.png` (+ `@2x`, `.jpg`) | The portfolio card image, built to read at ~300px wide |
| `featured/card-preview.png`, `card-preview-300px.png` | That image inside a portfolio card, at card width and at exactly 300px |
| `featured/codeward-cover-16x9.png` / `.jpg` | The same card laid out for a 16:9 box, 1920×1080 |
| `featured/codeward-hover.mp4` / `.webm` / `-poster.jpg` | The hover clip: a code review being graded. 1920×1080, 30fps, ~3s, no audio, loops seamlessly |
| `featured/hover-preview.html` | A 16:9 card that shows the cover and plays the clip on hover |
| `.cache/` | Auth state, the DB-guard log, review sheets, test results |

### The project README's images

`examples/` is gitignored, so the project README can't point at it.
`npm run shots:readme` writes JPEG copies of a chosen set (`README_SHOTS` in
`readme.spec.ts`) to `docs/screenshots/<dark|light>/`, which is committed. Each
framed capture is composited onto that GitHub theme's page colour, and the README
serves them through `<picture>`, so readers see the capture that matches their
GitHub theme. Profile is left out because it shows the account's email.

### The hover clip

`video.spec.ts` records Codeward's one idea in about 3 seconds: two review
comments land on the buggy lines of a real PR, the review is submitted, and the
score ring fills to 100 — "6/6 issues caught". A virtual camera zooms on the
lines being flagged, then glides to the result. The page is 1024×576 (a
1280×720 window at 125%, since the clip shows at about 560×315), drawn at
1.875× for a 1920×1080 file.

It is recorded frame by frame on a virtual clock rather than in real time:

- JavaScript timers belong to Playwright's fake clock, advanced exactly 1/30s
  per frame.
- CSS transitions (the ring filling) run on the compositor's real clock, so
  each is paused and its `currentTime` set from the same virtual clock.
- The camera is a CSS transform on `<html>`, so the browser redraws the text at
  the zoomed size and it stays sharp.

The last half second crossfades into the first frame, so the loop has no seam.

Read-only: the grade request is answered with the account's real stored attempt
for that PR (what "View attempt" reads), so there is no model call and nothing
is saved. The comments are the reviewer's own words from that attempt.

### The phone frame and safe areas

The page is captured at 393×759, the iPhone 15 Pro screen minus the 59px
status bar and the 34px home-indicator strip. The frame paints those two strips
*around* the capture, so nothing the app draws can sit under either. The strips
take their colour from the capture's own first and last rows, and the status bar
text flips to black on light pages.

## The clock

The server is started with `server/clock.cjs` preloaded, and every page gets
`page.clock.setFixedTime`. Both use the same instant, so the dashboard greeting,
"3 days ago" and the activity heatmap agree across every screen.

The default is **10:30 IST today**. Set `SHOTS_NOW` (any ISO timestamp) for an
exact rerun:

```sh
SHOTS_NOW=2026-09-23T10:30:00+05:30 npm run shots
```

## Read-only by construction

Two independent layers:

1. **Browser (`lib/guard.ts`).** Every database write in the app lives in a
   `POST`, `PATCH` or `DELETE` route. No `GET` route and no page writes during
   render. So every context the harness opens allows `GET` and NextAuth's
   sign-in, sign-out and log posts (sessions are JWTs, so none of them write).
   A write the shot or test needs, such as saving a note or flagging a problem,
   is answered **in the browser** with the same body the real route returns,
   and the request never leaves. Anything else is aborted and fails the run.
   That also stops `/api/auth/forgot-password`, which would send a real email,
   and every rate-limited, Groq, JDoodle and Brevo route, since all of those are
   posts.
2. **Server (`server/db-readonly.cjs`).** The app reaches Neon over HTTP, one
   `fetch` per query with the SQL in the body. The harness's server has that
   `fetch` wrapped: any statement that isn't a read is refused before it leaves
   the process. The counts land in `examples/.cache/db-guard.json`, and both
   the compose step and the e2e run fail unless reads happened and **zero**
   writes were attempted.

To add a shot that triggers a new kind of write, add a stub for it in
`WRITE_STUBS`. Until then the run fails, which is the point.

## Adding a shot

Add an entry to `shots.ts`: an id, a title, a path, whether it's signed in, and
optionally a `run` step that puts the page into the state. The contact sheet,
frames and review sheets pick it up. Loading and error states are real UI with
the delay or failure injected at the network (`page.route`), as in shots 23
and 24.

## What it can't show

- **Onboarding.** Only shown to accounts that haven't completed it, and
  completing or resetting it is a write.
- **The data is the account's data.** Custom sheet names, the display name
  and past attempts appear as they are stored.

## Photos and licences

No photographs are used. Everything in the images is either the app's own UI or
drawn by the harness. The UI shows company marks (Amazon, Google, Meta,
Microsoft, Apple, …) and the LeetCode and GeeksforGeeks marks, which are
trademarks of their owners, shown as they appear in the product. Fonts in the
composed images are Geist, Geist Mono and Instrument Serif (all SIL Open Font
License), loaded from Google Fonts. No attribution line is required.
