import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validatePack } from "./pack";

const packsDir = path.resolve(__dirname, "..", "..", "..", "content-packs");

describe("content packs", () => {
  for (const code of fs.readdirSync(packsDir)) {
    const dir = path.join(packsDir, code);
    if (!fs.statSync(dir).isDirectory()) continue;
    const file = path.join(dir, "pack.json");
    if (!fs.existsSync(file)) continue;
    it(`validates ${code} pack`, () => {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      const pack = validatePack(data);
      expect(pack.code).toBe(code);
      expect(pack.letters.length).toBeGreaterThan(0);
    });
  }
});
