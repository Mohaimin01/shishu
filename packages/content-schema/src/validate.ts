import fs from "node:fs";
import path from "node:path";
import { validatePack } from "./pack";

const root = path.resolve(__dirname, "..", "..", "..");
const packsDir = path.join(root, "content-packs");

let failed = 0;
for (const code of fs.readdirSync(packsDir)) {
  const dir = path.join(packsDir, code);
  if (!fs.statSync(dir).isDirectory()) continue;
  const file = path.join(dir, "pack.json");
  if (!fs.existsSync(file)) {
    console.log(`skip ${code} (no pack.json)`);
    continue;
  }
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    validatePack(data);
    console.log(`OK   ${code}`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${code}:`, (e as Error).message);
  }
}
if (failed > 0) process.exit(1);
console.log("all packs valid");
