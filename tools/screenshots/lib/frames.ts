import { DESKTOP, DISPLAY_HOST, PHONE, type Theme } from "../config";

/**
 * Device frames, drawn in HTML and rendered by the same browser. The raw
 * capture is placed inside the frame's safe area, so a frame can never cover
 * app content: the status bar and home indicator get strips of their own.
 */

const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif`;

/** Phone: iPhone 15 Pro proportions — 393×852 screen, 59px status bar,
 *  34px home-indicator strip. The strips take their colour from the capture's
 *  own top and bottom rows, sampled in the page, so the status bar reads as
 *  part of the app the way it does on a real phone. */
export function phoneFrame(imageDataUrl: string) {
  const { width: W, height: H } = PHONE.screen;
  const bezel = 14;
  return /* html */ `<!doctype html>
<html><head><style>
  html, body { margin: 0; background: transparent; }
  .device {
    position: relative; width: ${W + bezel * 2}px; height: ${H + bezel * 2}px;
    border-radius: 69px; background: linear-gradient(145deg, #4a4a4e, #1d1d20 45%, #3a3a3e);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.14), inset 0 0 0 5px #0b0b0c;
  }
  .btn { position: absolute; width: 4px; border-radius: 2px; background: linear-gradient(90deg,#2a2a2d,#4a4a4e); }
  .screen {
    position: absolute; inset: ${bezel}px; border-radius: 55px; overflow: hidden;
    background: var(--top, #000); display: flex; flex-direction: column;
  }
  .status {
    height: ${PHONE.safeTop}px; flex: none; position: relative; color: var(--ink, #fff);
    font: 600 17px/1 ${FONT}; letter-spacing: -.2px;
  }
  .status .time { position: absolute; left: 51px; top: 21px; }
  .status .icons { position: absolute; right: 30px; top: 22px; display: flex; gap: 7px; align-items: center; }
  .island { position: absolute; left: 50%; top: 11px; width: 125px; height: 37px; margin-left: -62.5px; border-radius: 20px; background: #000; }
  .content { flex: none; width: ${W}px; height: ${PHONE.viewport.height}px; display: block; }
  .home { height: ${PHONE.safeBottom}px; flex: none; background: var(--bottom, #000); position: relative; }
  .home::after {
    content: ""; position: absolute; left: 50%; bottom: 8px; width: 139px; height: 5px;
    margin-left: -69.5px; border-radius: 3px; background: var(--bar, #fff);
  }
</style></head><body>
  <div class="device">
    <span class="btn" style="left:-3px;top:170px;height:32px"></span>
    <span class="btn" style="left:-3px;top:230px;height:62px"></span>
    <span class="btn" style="left:-3px;top:305px;height:62px"></span>
    <span class="btn" style="right:-3px;top:250px;height:100px"></span>
    <div class="screen">
      <div class="status">
        <span class="time">9:41</span>
        <span class="island"></span>
        <span class="icons">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 11.6 5.6 9.2a3.4 3.4 0 0 1 4.8 0L8 11.6Zm-4.1-4 1.3 1.3a4 4 0 0 1 5.6 0l1.3-1.3a5.8 5.8 0 0 0-8.2 0ZM1.3 5l1.3 1.3a7.6 7.6 0 0 1 10.8 0L14.7 5A9.5 9.5 0 0 0 1.3 5Z"/></svg>
          <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" opacity=".45"/></svg>
        </span>
      </div>
      <img class="content" id="shot" src="${imageDataUrl}">
      <div class="home"></div>
    </div>
  </div>
  <script>
    // Sample the capture's first and last rows for the strip colours. Done is
    // marked on the document, not on window: setContent keeps the window across
    // documents, so a flag there would still read "done" from the last frame.
    // The same reuse is why this is wrapped in a function: a top-level const
    // would throw "already declared" in every frame after the first.
    (() => {
    const img = document.getElementById("shot");
    img.decode().then(() => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const avg = (y) => {
        const d = g.getImageData(0, y, c.width, 1).data; let r = 0, gg = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 16) { r += d[i]; gg += d[i+1]; b += d[i+2]; n++; }
        return [r/n, gg/n, b/n].map(Math.round);
      };
      const lum = ([r, g, b]) => (0.2126*r + 0.7152*g + 0.0722*b) / 255;
      const top = avg(1), bottom = avg(c.height - 2), s = document.documentElement.style;
      s.setProperty("--top", "rgb(" + top + ")");
      s.setProperty("--bottom", "rgb(" + bottom + ")");
      s.setProperty("--ink", lum(top) > .55 ? "#000" : "#fff");
      s.setProperty("--bar", lum(bottom) > .55 ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.9)");
      document.documentElement.dataset.framed = "1";
    });
    })();
  </script>
</body></html>`;
}

/** Desktop: a browser window with the page's real path in the address bar. */
export function desktopFrame(imageDataUrl: string, displayPath: string, theme: Theme) {
  const { width: W, height: H } = DESKTOP.viewport;
  const bar = 44;
  const dark = theme === "dark";
  const pad = 56;
  return /* html */ `<!doctype html>
<html><head><style>
  html, body { margin: 0; background: transparent; }
  body { padding: ${pad}px; }
  .window {
    width: ${W}px; border-radius: 12px; overflow: hidden;
    box-shadow: 0 0 0 1px ${dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.14)"}, 0 24px 60px rgba(0,0,0,.35), 0 6px 18px rgba(0,0,0,.2);
  }
  .bar {
    height: ${bar}px; display: flex; align-items: center; gap: 8px; padding: 0 16px; position: relative;
    background: ${dark ? "#262628" : "#ececef"};
    border-bottom: 1px solid ${dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)"};
    font: 500 13px/1 ${FONT};
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .url {
    position: absolute; left: 50%; transform: translateX(-50%); width: 560px; height: 28px;
    border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;
    background: ${dark ? "#1b1b1d" : "#ffffff"}; color: ${dark ? "#a1a1a6" : "#56565c"};
  }
  .url b { color: ${dark ? "#e8e8ea" : "#1c1c1e"}; font-weight: 500; }
  img { display: block; width: ${W}px; height: ${H}px; }
</style></head><body>
  <div class="window">
    <div class="bar">
      <span class="dot" style="background:#ff5f57"></span>
      <span class="dot" style="background:#febc2e"></span>
      <span class="dot" style="background:#28c840"></span>
      <span class="url">
        <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor"><path d="M2.5 5V3.5a3 3 0 0 1 6 0V5h.5A1.5 1.5 0 0 1 10.5 6.5v4A1.5 1.5 0 0 1 9 12H2A1.5 1.5 0 0 1 .5 10.5v-4A1.5 1.5 0 0 1 2 5h.5Zm1.5 0h3V3.5a1.5 1.5 0 0 0-3 0V5Z"/></svg>
        <span><b>${DISPLAY_HOST}</b>${escapeHtml(displayPath === "/" ? "" : displayPath)}</span>
      </span>
    </div>
    <img src="${imageDataUrl}">
  </div>
</body></html>`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
