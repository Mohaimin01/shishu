import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validatePack, lintPack } from "./pack";

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

describe("friendly contributions", () => {
  it("accepts a tiny pack (docs promise stages can be {} / omitted)", () => {
    const p = validatePack({ code: "xx", name: "Test", nativeName: "Test", letters: [{ id: "a", char: "A", name: "A", sound: "ah" }], stages: {} });
    expect(p.words).toEqual([]);
    expect(p.stages.toddler).toEqual([]);
    expect(p.script).toBe("latin");
  });

  it("explains mistakes with the field path", () => {
    expect(() => validatePack({ code: "x", name: "T", nativeName: "T" })).toThrow(/code: /);
    expect(() => validatePack({ code: "xx", name: "T", nativeName: "T", words: [{ id: "w" }] })).toThrow(/words\[0\]\.conceptId/);
  });

  it("lint gives gentle advice, never throws", () => {
    const p = validatePack({ code: "xx", name: "T", nativeName: "T" });
    expect(lintPack(p).length).toBeGreaterThan(0);
  });
});
