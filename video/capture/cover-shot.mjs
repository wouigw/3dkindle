import { chromium } from "playwright";
import fs from "node:fs";

const CHROME = process.env.CHROME_PATH ||
  (process.env.LOCALAPPDATA + "\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe");

const OUT = "capture/shots/cover";
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function drag(page, x0, y0, dx, dy, ms) {
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  const steps = Math.max(6, Math.round(ms / 20));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(x0 + dx * e, y0 + dy * e);
    await sleep(20);
  }
  await page.mouse.up();
}

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--disable-lcd-text"],
});
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
});
await page.goto("http://127.0.0.1:8137/3dkindle/", { waitUntil: "load" });
await page.waitForFunction(() => window.UI && window.UI.view === "library", { timeout: 30000 });
await page.addStyleTag({ content: ".brand,.top-actions,.hints,.toast{display:none!important}" });
await sleep(1600);

// 每个角度累计拖拽，yaw 约 -0.2 / -0.3 / -0.4 rad
const steps = [0, 55, 75, 95];
let acc = 0;
for (let i = 0; i < steps.length; i++) {
  const target = steps[i];
  if (target !== acc) {
    await drag(page, 320, 900, target - acc, 0, 900);
    acc = target;
  }
  await sleep(1400);
  await page.screenshot({ path: `${OUT}/angle-${i}.png` });
}

console.log("done", acc);
await browser.close();
