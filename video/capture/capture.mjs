import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.APP_URL || "http://localhost:8123/index.html";
const RAW = "capture/raw";
const SHOTS = "capture/shots";
mkdirSync(RAW, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mode = process.argv[2] || "probe";

const CHROME = process.env.CHROME_PATH ||
  (process.env.LOCALAPPDATA + "\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe");

const browser = await chromium.launch({
  executablePath: CHROME,
  args: [
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--disable-lcd-text",
  ],
});

const pageErrors = [];

async function open({ video = null } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    ...(video ? { recordVideo: { dir: `${RAW}/${video}`, size: { width: 1920, height: 1080 } } } : {}),
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForFunction(() => window.UI && window.UI.view === "library", null, { timeout: 30000 });
  await page.addStyleTag({
    content: ".brand,.top-actions,.hints,.toast{display:none!important}",
  });
  await page.waitForTimeout(700);
  return { ctx, page };
}

/** Project a texture-space point (0..1) on the e-ink screen to client pixels. */
async function project(page, u, v) {
  return page.evaluate(([u, v]) => {
    const dev = window.Scene._debug.device;
    const cam = window.Scene._debug.camera;
    const THREE = window.THREE;
    let mesh = null;
    dev.traverse((o) => {
      if (o.isMesh && Math.abs(o.position.z - 0.409) < 1e-4) mesh = o;
    });
    if (!mesh) return null;
    const g = mesh.geometry.parameters;
    const p = new THREE.Vector3((u - 0.5) * g.width, (0.5 - v) * g.height, 0);
    mesh.localToWorld(p);
    p.project(cam);
    return {
      x: Math.round((p.x * 0.5 + 0.5) * window.innerWidth),
      y: Math.round((-p.y * 0.5 + 0.5) * window.innerHeight),
    };
  }, [u, v]);
}

async function drag(page, x0, y0, x1, y1, ms) {
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  const steps = Math.max(4, Math.round(ms / 20));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e);
    await sleep(20);
  }
  await page.mouse.up();
}

async function clickUV(page, u, v) {
  const p = await project(page, u, v);
  if (!p) throw new Error("screen mesh not found");
  await page.mouse.move(p.x, p.y);
  await sleep(120);
  await page.mouse.down();
  await sleep(90);
  await page.mouse.up();
  return p;
}

if (mode === "probe") {
  const { ctx, page } = await open();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${SHOTS}/01-library.png` });

  const corners = {};
  for (const [k, u, v] of [["tl", 0, 0], ["tr", 1, 0], ["bl", 0, 1], ["br", 1, 1], ["c", 0.5, 0.5]]) {
    corners[k] = await project(page, u, v);
  }
  console.log("CORNERS", JSON.stringify(corners));
  console.log("STATE", JSON.stringify(await page.evaluate(() => ({
    view: window.UI.view,
    books: window.UI.books.map((b) => ({ id: b.id, title: b.title })),
    settings: window.UI.settings,
  }))));

  await page.click("#btnFocus");
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOTS}/02-focus.png` });
  const focusCorners = {};
  for (const [k, u, v] of [["tl", 0, 0], ["tr", 1, 0], ["bl", 0, 1], ["br", 1, 1], ["c", 0.5, 0.5]]) {
    focusCorners[k] = await project(page, u, v);
  }
  console.log("FOCUS_CORNERS", JSON.stringify(focusCorners));
  console.log("WGL", await page.evaluate(() => {
    const gl = document.getElementById("gl").getContext("webgl2") || document.getElementById("gl").getContext("webgl");
    return gl ? gl.getParameter(gl.RENDERER) : "none";
  }));
  console.log("ERRORS", JSON.stringify(pageErrors));
  await ctx.close();
} else if (mode === "record") {
  // clip 1: hero rotation
  {
    const { ctx, page } = await open({ video: "rotate" });
    await page.waitForTimeout(1200);
    await drag(page, 250, 790, 420, 720, 2600);
    await sleep(700);
    await drag(page, 420, 720, 150, 800, 3000);
    await sleep(600);
    await drag(page, 150, 800, 300, 760, 2200);
    await sleep(1400);
    const v = page.video();
    await ctx.close();
    console.log("rotate", await v.path());
  }

} else if (mode === "reading") {
  // clip 2: focus library + open guide + read + panels
  const { ctx, page } = await open({ video: "reading" });
  await page.evaluate(() => {
    window.UI.settings.flash = false;
    localStorage.setItem("kindle.settings", JSON.stringify(window.UI.settings));
  });
  await page.waitForTimeout(1100);
  await page.evaluate(() => {
    const b = document.getElementById("btnFocus");
    b.click();
    b.style.display = "none";
  });
  await page.waitForTimeout(2000);
  console.log("CLICK", JSON.stringify(await clickUV(page, 0.21, 0.32)));
  await page.waitForTimeout(3000);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(2600);
  await page.keyboard.press("m");
  await page.waitForTimeout(2400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  await page.evaluate(() => window.UI.open({ type: "toc" }));
  await page.waitForTimeout(3000);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  await page.evaluate(() => window.UI.open({ type: "panel", tab: "font" }));
  await page.waitForTimeout(3200);
  await page.evaluate(() => {
    window.UI.settings.theme = "night";
    window.UI.requestDraw();
  });
  await page.waitForTimeout(2800);
  await page.evaluate(() => {
    window.UI.settings.theme = "paper";
    window.UI.requestDraw();
  });
  await page.waitForTimeout(1800);
  const v = page.video();
  await ctx.close();
  console.log("reading", await v.path());
}

await browser.close();
console.log("ERRORS", JSON.stringify(pageErrors));
