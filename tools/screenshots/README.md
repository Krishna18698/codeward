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
| `.cache/` | Auth state, the DB-guard log, review sheets, test results |

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
