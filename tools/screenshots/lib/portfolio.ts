import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Browser } from "@playwright/test";
import { CACHE, OUT } from "../config";

/**
 * Portfolio images, composed from the framed captures:
 *
 *   examples/covers/cover-<n>-<name>.png   3200×2400 (4:3)
 *   examples/covers/cover-<n>-<name>.jpg   1600×1200
 *   examples/featured/codeward-card.*      the card image, built to read at ~300px
 *   examples/featured/card-preview*.png    that image inside a portfolio card
 *
 * Every product shot is a real capture of the production build. The type is
 * the app's own (Geist) and so is the green, so the covers read as Codeward
 * rather than as a template around it.
 */

const framed = (device: "phone" | "desktop", theme: "dark" | "light", id: string) => {
  const dir = path.join(OUT, "framed", device, theme);
  const file = fs.readdirSync(dir).find((f) => f.startsWith(`${id}-`) && f.endsWith(".png"));
  if (!file) throw new Error(`no framed ${device}/${theme} capture for ${id} — run the capture step`);
  return pathToFileURL(path.join(dir, file)).href;
};

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500&family=Instrument+Serif&display=swap">`;

/** Near-black with the brand green rising from below and a faint grid — the
 *  landing page's own ground, not a stock gradient. */
const DARK_GROUND = `
  background:
    radial-gradient(1100px 760px at 72% 118%, rgba(52,211,153,.26), transparent 62%),
    radial-gradient(760px 520px at -6% -10%, rgba(52,211,153,.10), transparent 60%),
    #07090a;`;
const LIGHT_GROUND = `
  background:
    radial-gradient(1100px 760px at 72% 118%, rgba(16,185,129,.20), transparent 62%),
    radial-gradient(760px 520px at -6% -10%, rgba(16,185,129,.08), transparent 60%),
    #eef2f0;`;

function page(body: string, { light = false, width = 1600, height = 1200 } = {}) {
  return /* html */ `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  html, body { margin: 0; }
  .canvas {
    position: relative; width: ${width}px; height: ${height}px; overflow: hidden;
    font-family: Geist, system-ui, sans-serif; ${light ? LIGHT_GROUND : DARK_GROUND}
    color: ${light ? "#0c1512" : "#eef3f0"};
  }
  .canvas::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(${light ? "rgba(12,21,18,.05)" : "rgba(255,255,255,.035)"} 1px, transparent 1px),
      linear-gradient(90deg, ${light ? "rgba(12,21,18,.05)" : "rgba(255,255,255,.035)"} 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 85%);
  }
  .shot { position: absolute; display: block; filter: drop-shadow(0 30px 60px rgba(0,0,0,${light ? ".18" : ".55"})); }
  .mark { font-weight: 600; letter-spacing: -.02em; }
  .mark em { font-style: normal; color: ${light ? "#059669" : "#34d399"}; }
  .line { font-weight: 600; letter-spacing: -.035em; line-height: 1.02; text-wrap: balance; }
  .line em { font-style: normal; color: ${light ? "#059669" : "#34d399"}; }
  .eyebrow { font: 500 15px/1 "Geist Mono", monospace; letter-spacing: .16em; text-transform: uppercase; color: ${light ? "#4b5f57" : "#8fa39b"}; }
  </style></head><body>${body}</body></html>`;
}

async function render(browser: Browser, html: string, name: string, outputs: { file: string; scale: number; type: "png" | "jpeg" }[], size = { width: 1600, height: 1200 }) {
  const htmlFile = path.join(CACHE, `${name}.html`);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(htmlFile, html);
  for (const out of outputs) {
    const context = await browser.newContext({ viewport: size, deviceScaleFactor: out.scale });
    const p = await context.newPage();
    await p.goto(pathToFileURL(htmlFile).href);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    fs.mkdirSync(path.dirname(out.file), { recursive: true });
    await p.locator(".canvas").screenshot({ path: out.file, type: out.type, ...(out.type === "jpeg" ? { quality: 92 } : {}) });
    await context.close();
  }
}

/** Both sizes the brief asks for: 3200×2400 PNG and 1600×1200 JPG. */
const coverOutputs = (base: string) => [
  { file: path.join(OUT, "covers", `${base}.png`), scale: 2, type: "png" as const },
  { file: path.join(OUT, "covers", `${base}.jpg`), scale: 1, type: "jpeg" as const },
];

export async function renderCovers(browser: Browser) {
  fs.rmSync(path.join(OUT, "covers"), { recursive: true, force: true });

  // 1 — The core idea: problems filed by pattern, with a note being written.
  await render(
    browser,
    page(`<div class="canvas">
      <div style="position:absolute;left:96px;top:92px">
        <div class="mark" style="font-size:30px">Code<em>ward</em></div>
        <div class="line" style="font-size:68px;margin-top:22px;max-width:760px">Solve by pattern, <em>not by list.</em></div>
      </div>
      <img class="shot" src="${framed("desktop", "dark", "18")}" style="left:40px;top:330px;width:1180px">
      <img class="shot" src="${framed("phone", "dark", "20")}" style="right:96px;top:250px;height:900px">
    </div>`),
    "cover-1",
    coverOutputs("cover-1-by-pattern"),
  );

  // 2 — The modes beyond DSA, each a real exercise mid-flight.
  await render(
    browser,
    page(`<div class="canvas">
      <div style="position:absolute;left:0;right:0;top:88px;text-align:center">
        <div class="eyebrow">Seven ways to get ready</div>
        <div class="line" style="font-size:64px;margin-top:22px">Review the PR. Find the bug. <em>Ask the mentor.</em></div>
      </div>
      <img class="shot" src="${framed("phone", "dark", "32")}" style="left:170px;top:318px;height:880px">
      <img class="shot" src="${framed("phone", "dark", "35")}" style="left:590px;top:278px;height:880px">
      <img class="shot" src="${framed("phone", "dark", "42")}" style="left:1010px;top:318px;height:880px">
    </div>`),
    "cover-2",
    coverOutputs("cover-2-practice-modes"),
  );

  // 3 — Light theme: the dashboard on desktop, the revision list on a phone.
  await render(
    browser,
    page(
      `<div class="canvas">
      <div style="position:absolute;left:96px;top:92px">
        <div class="mark" style="font-size:30px">Code<em>ward</em></div>
        <div class="line" style="font-size:68px;margin-top:22px;max-width:820px">Pick up <em>where you left off.</em></div>
      </div>
      <img class="shot" src="${framed("desktop", "light", "13")}" style="left:40px;top:330px;width:1180px">
      <img class="shot" src="${framed("phone", "light", "21")}" style="right:96px;top:250px;height:900px">
    </div>`,
      { light: true },
    ),
    "cover-3",
    coverOutputs("cover-3-light"),
  );
}

/** The card image. Codeward is a website, so the card shows the website: the
 *  landing page in front, a product page behind it, both real desktop
 *  captures in browser frames — plus the tagline, set to read at ~300px wide
 *  (about 18px there). The back window is Code Review rather than the DSA page,
 *  whose "Solve by pattern" header would echo the tagline. */
export async function renderFeatured(browser: Browser) {
  const dir = path.join(OUT, "featured");
  fs.rmSync(dir, { recursive: true, force: true });

  const card = page(`<div class="canvas">
    <div style="position:absolute;left:92px;top:64px">
      <div class="mark" style="font-size:44px">Code<em>ward</em></div>
      <div class="line" style="font-size:96px;margin-top:12px;white-space:nowrap">Interview prep<br><em>by pattern.</em></div>
    </div>
    <img class="shot" src="${framed("desktop", "dark", "31")}" style="left:880px;top:110px;width:1060px">
    <!-- Its top edge lands in the gap under the Code Review header, so the
         window behind is cut on empty space, not through a line of text. -->
    <img class="shot" src="${framed("desktop", "dark", "01")}" style="left:10px;top:318px;width:1280px">
  </div>`);

  await render(browser, card, "featured-card", [
    { file: path.join(dir, "codeward-card.png"), scale: 1, type: "png" },
    { file: path.join(dir, "codeward-card@2x.png"), scale: 2, type: "png" },
    { file: path.join(dir, "codeward-card.jpg"), scale: 1, type: "jpeg" },
  ]);

  // The card as it would sit on the portfolio: modelled on the "Proof of Work"
  // grid (dark tile, inset rounded image, title with an arrow, grey one-liner,
  // outlined stack tags). Rendered at the grid's real card width, and again at
  // exactly 300px to check it still reads.
  const img = pathToFileURL(path.join(dir, "codeward-card@2x.png")).href;
  const tags = ["Next.js", "TypeScript", "React", "Tailwind CSS", "Prisma", "PostgreSQL", "NextAuth", "Groq"];
  const preview = (cardWidth: number, pad: number) => /* html */ `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    html, body { margin: 0; }
    .canvas { width: ${cardWidth + pad * 2}px; padding: ${pad}px; box-sizing: border-box; background: #1b1b1b; font-family: Geist, system-ui, sans-serif; }
    h2 { margin: 0 0 22px; font: 400 32px/1 "Instrument Serif", Georgia, serif; color: #d9d9d9; letter-spacing: -.01em; }
    .card { width: ${cardWidth}px; box-sizing: border-box; border: 1px solid #2c2c2c; border-radius: 12px; background: #202020; padding: 6px 6px 14px; }
    .card img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; }
    .head { display: flex; align-items: center; justify-content: space-between; margin: 14px 8px 0; }
    .title { color: #ececec; font-size: 17px; font-weight: 500; letter-spacing: -.01em; }
    .desc { margin: 8px 8px 0; color: #8d8d8d; font-size: 13.5px; line-height: 1.5; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 8px 0; }
    .tags span { border: 1px solid #353535; border-radius: 7px; padding: 4px 8px; font-size: 12px; color: #b9b9b9; }
  </style></head><body><div class="canvas">
    ${pad > 20 ? "<h2>Proof of Work</h2>" : ""}
    <div class="card">
      <img src="${img}">
      <div class="head"><span class="title">Codeward</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8d8d8d" stroke-width="1.5"><path d="M4 10 10 4M5 4h5v5"/></svg></div>
      <div class="desc">Interview prep that teaches the pattern: 500 DSA problems, code reviews, bug hunts and an AI mentor.</div>
      <div class="tags">${tags.map((t) => `<span>${t}</span>`).join("")}</div>
    </div>
  </div></body></html>`;

  for (const [name, width, pad] of [["card-preview", 330, 48], ["card-preview-300px", 300, 16]] as const) {
    const htmlFile = path.join(CACHE, `${name}.html`);
    fs.writeFileSync(htmlFile, preview(width, pad));
    const context = await browser.newContext({ viewport: { width: width + pad * 2, height: 800 }, deviceScaleFactor: 2 });
    const p = await context.newPage();
    await p.goto(pathToFileURL(htmlFile).href);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    await p.locator(".canvas").screenshot({ path: path.join(dir, `${name}.png`) });
    await context.close();
  }
}
