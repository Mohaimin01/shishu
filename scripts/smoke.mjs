/* Smoke test the static export served under /shishu (GitHub Pages layout).
 * BASE env overrides the origin, e.g. BASE=http://localhost:4173 node scripts/smoke.mjs
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "https://mohaimin01.github.io";
const results = [];
const ok = (name, cond) => results.push(`${cond ? "PASS" : "FAIL"} ${name}`);

const browser = await chromium.launch({
  executablePath: "/home/mohaimin/Documents/shishu/node_modules/playwright-core/.local-browsers/chromium-1248/chrome-linux64/chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 720 } });

try {
  await page.goto(`${BASE}/shishu/`, { waitUntil: "networkidle" });
  ok("home shows title", await page.getByRole("heading", { name: "shishu" }).isVisible());
  ok("home shows start button", await page.getByRole("link", { name: "Start learning" }).isVisible());

  await page.click("text=Start learning");
  await page.waitForURL("**/shishu/learn/**");
  ok("learn lists letters section", (await page.getByRole("heading", { name: /color the letters/i }).count()) > 0);
  ok("language switch visible", await page.getByRole("link", { name: "বাংলা" }).isVisible());

  // open first color-letter activity
  await page.locator('a[aria-label^="Color the letters: A"]').click();
  await page.waitForURL("**/shishu/play/**");
  await page.waitForSelector("canvas");
  ok("play shows canvas", (await page.locator("canvas").count()) === 1);
  ok("palette visible", (await page.locator('button[aria-label^="choose color"]').count()) === 6);

  const canvasBox = await page.locator("canvas").first().boundingBox();
  const cx = canvasBox.x + canvasBox.width / 2;
  const cy = canvasBox.y + canvasBox.height / 2;
  const at = (fx, fy) => [canvasBox.x + canvasBox.width * fx, canvasBox.y + canvasBox.height * fy];

  // 1) A few taps in the middle must NOT finish the letter early
  for (const [x, y] of [[cx, cy], [cx + 12, cy], [cx - 10, cy + 8]]) {
    await page.mouse.move(x, y);
    await page.mouse.down(); await page.mouse.up();
  }
  await page.waitForTimeout(500);
  const early = await page.getByText(/wonderful/i).isVisible().catch(() => false);
  ok("center scribble does NOT complete the letter", early === false);

  // 2) Tracing across the shape (rows + columns across the whole canvas) must finish it
  const rows = 6, cols = 6;
  await page.mouse.move(...at(0.08, 0.15));
  await page.mouse.down();
  for (let r = 1; r <= rows; r++) {
    const fy = 0.1 + (r / (rows + 1)) * 0.8;
    const fxDir = r % 2 === 0 ? 0.92 : 0.08;
    await page.mouse.move(...at(fxDir, fy), { steps: 10 });
    await page.mouse.move(...at(fxDir === 0.08 ? 0.92 : 0.08, fy), { steps: 10 });
  }
  for (let c = 1; c <= cols; c++) {
    const fx = 0.1 + (c / (cols + 1)) * 0.8;
    await page.mouse.move(...at(fx, 0.9), { steps: 10 });
    await page.mouse.move(...at(fx, 0.1), { steps: 10 });
  }
  await page.mouse.move(...at(0.5, 0.5), { steps: 10 });
  await page.mouse.up();
  const doneVisible = await page.getByText(/wonderful/i).isVisible().catch(() => false);
  ok("shape-following tracing completes", doneVisible);

  // 3) trace-letter mode: child-ish wobbly "A" (imperfect but near the shape) must finish
  await page.goto(`${BASE}/shishu/play/?lang=en&stage=preschool&type=trace-letter&item=a`, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  const tbox = await page.locator("canvas").first().boundingBox();
  const tat = (fx, fy) => [tbox.x + tbox.width * fx, tbox.y + tbox.height * fy];
  await page.mouse.move(...tat(0.28, 0.88));
  await page.mouse.down();
  await page.mouse.move(...tat(0.42, 0.5), { steps: 10 });
  await page.mouse.move(...tat(0.52, 0.14), { steps: 10 });
  await page.mouse.move(...tat(0.6, 0.42), { steps: 10 });
  await page.mouse.move(...tat(0.74, 0.86), { steps: 10 });
  await page.mouse.move(...tat(0.36, 0.62), { steps: 12 });
  await page.mouse.move(...tat(0.66, 0.66), { steps: 12 });
  await page.mouse.up();
  const traceDone = await page.getByText(/wonderful/i).isVisible().catch(() => false);
  ok("wobbly letter A trace completes (trace mode)", traceDone);
  await page.screenshot({ path: "/tmp/opencode/shishu-trace-a.png" });

  // tap-sound activity
  await page.goto(`${BASE}/shishu/play/?lang=en&stage=toddler&type=tap-sound&item=a`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const soundCards = await page.locator("button[aria-label^=letter]").count();
  ok("tap-sound three options", soundCards === 3);
  await page.screenshot({ path: "/tmp/opencode/shishu-tapsound.png" });

  // match word
  await page.goto(`${BASE}/shishu/play/?lang=en&stage=prek&type=match-picture-word&item=w-apple`, { waitUntil: "networkidle" });
  ok("match shows emoji option", (await page.locator('button[aria-label^="picture option"]').count()) === 3);
  await page.screenshot({ path: "/tmp/opencode/shishu-match.png" });

  // parent dashboard
  await page.goto(`${BASE}/shishu/parent/`, { waitUntil: "networkidle" });
  ok("parent shows Grown-ups", await page.getByRole("heading", { name: "Grown-ups" }).isVisible());

  // bengali learn
  await page.goto(`${BASE}/shishu/learn/?lang=bn`, { waitUntil: "networkidle" });
  ok("bengali pack loads", await page.getByRole("heading", { name: "বাংলা" }).isVisible());

  await page.screenshot({ path: "/tmp/opencode/shishu-learn.png", fullPage: true });
} catch (e) {
  results.push(`ERROR ${e.message}`);
} finally {
  await browser.close();
}

console.log(results.join("\n"));
if (results.some((r) => !r.startsWith("PASS"))) process.exit(1);
