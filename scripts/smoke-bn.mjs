import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "https://mohaimin01.github.io";

const browser = await chromium.launch({
  executablePath: "/home/mohaimin/Documents/shishu/node_modules/playwright-core/.local-browsers/chromium-1248/chrome-linux64/chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 720 } });
await page.goto(`${BASE}/shishu/play/?lang=bn&stage=toddler&type=color-number&item=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const box = await page.locator("canvas").first().boundingBox();
const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];

// trace the Bangla digit shape with an imperfect but shape-following trail
await page.mouse.move(...at(0.5, 0.12));
await page.mouse.down();
await page.mouse.move(...at(0.42, 0.3), { steps: 8 });
await page.mouse.move(...at(0.56, 0.42), { steps: 8 });
await page.mouse.move(...at(0.46, 0.62), { steps: 8 });
await page.mouse.move(...at(0.54, 0.86), { steps: 8 });
// curve back over the hook
await page.mouse.move(...at(0.68, 0.64), { steps: 8 });
await page.mouse.move(...at(0.6, 0.44), { steps: 8 });
await page.mouse.move(...at(0.46, 0.32), { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(700);
const done = await page.getByText(/wonderful/i).isVisible().catch(() => false);
console.log(done ? "PASS bn digit trace completes" : "FAIL bn digit trace completes");
await page.screenshot({ path: "/tmp/opencode/shishu-bn-number-done.png" });

if (!done) process.exit(1);
await browser.close();
