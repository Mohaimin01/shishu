import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/mohaimin/Documents/shishu/node_modules/playwright-core/.local-browsers/chromium-1248/chrome-linux64/chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 720 } });
await page.goto("http://localhost:4173/shishu/play/?lang=bn&stage=toddler&type=color-number&item=1", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/opencode/shishu-bn-number.png" });

// paint the Bangla digit to confirm canvas + Bengali glyph works
const box = await page.locator("canvas").first().boundingBox();
await page.mouse.move(box.x + 40, box.y + box.height * 0.5);
await page.mouse.down();
for (let i = 0; i < 8; i++) {
  await page.mouse.move(box.x + 40 + i * 30, box.y + box.height * 0.5, { steps: 6 });
  await page.mouse.move(box.x + 40 + i * 30, box.y + box.height * 0.28, { steps: 4 });
}
await page.mouse.up();
await page.waitForTimeout(700);
const done = await page.getByText(/wonderful/i).isVisible().catch(() => false);
console.log(done ? "PASS bn digit completes" : "FAIL bn digit");
await page.screenshot({ path: "/tmp/opencode/shishu-bn-number-done.png" });
await browser.close();
