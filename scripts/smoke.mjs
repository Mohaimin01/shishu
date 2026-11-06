/* Smoke test the static export served under /shishu (GitHub Pages layout). */
import { chromium } from "playwright-core";

const BASE = "https://mohaimin01.github.io";
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

  // paint across the whole glyph area (drag in a zig-zag over center)
  const canvasBox = await page.locator("canvas").first().boundingBox();
  await page.mouse.move(canvasBox.x + 30, canvasBox.y + canvasBox.height / 2);
  await page.mouse.down();
  for (let i = 0; i < 14; i++) {
    const x = canvasBox.x + 20 + i * ((canvasBox.width - 40) / 14);
    await page.mouse.move(x, canvasBox.y + canvasBox.height / 2 + Math.sin(i) * 40, { steps: 8 });
  }
  for (let i = 13; i >= 0; i--) {
    const x = canvasBox.x + 20 + i * ((canvasBox.width - 40) / 14);
    await page.mouse.move(x, canvasBox.y + canvasBox.height / 2 - Math.sin(i) * 40, { steps: 8 });
  }
  await page.mouse.up();
  await page.waitForTimeout(600);
  const doneVisible = await page.getByText(/wonderful/i).isVisible().catch(() => false);
  ok("paint completion feedback", doneVisible);

  // tap-sound activity
  await page.goto(`${BASE}/shishu/play/?lang=en&stage=toddler&type=tap-sound&item=a`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const soundCards = await page.locator("button[aria-label^=letter]").count();
  ok("tap-sound three options", soundCards === 3);
  const btn = await page.locator("button[aria-label^=letter]").first().ariaSnapshot?.();
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
