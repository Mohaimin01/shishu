import { describe, it, expect } from "vitest";
import { measureCoverage, isLetterComplete, MIN_PATH_PX } from "./coverage";

const G = 40;

/** a crude capital "A": two legs meeting at the top plus a crossbar */
function letterA(): Uint8Array {
  const m = new Uint8Array(G * G);
  for (let y = 5; y < 35; y++) {
    const half = Math.round(((y - 5) / 30) * 12);
    for (const x of [20 - half, 20 + half]) {
      for (let dx = -1; dx <= 1; dx++) m[y * G + (x + dx)] = 1;
    }
  }
  for (let x = 14; x <= 26; x++) for (let y = 24; y <= 26; y++) m[y * G + x] = 1;
  return m;
}

function paintDisc(ink: Uint8Array, cx: number, cy: number, r: number) {
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) ink[y * G + x] = 1;
  }
}

describe("letter coverage", () => {
  it("a single touch at the apex does NOT finish the letter", () => {
    const mask = letterA();
    const ink = new Uint8Array(G * G);
    paintDisc(ink, 20, 6, 5);
    const c = measureCoverage(mask, ink, G);
    expect(isLetterComplete(c, 20, 0.7)).toBe(false);
    expect(c.zonesOk).toBe(false);
  });

  it("painting only the left leg does not finish it either", () => {
    const mask = letterA();
    const ink = new Uint8Array(G * G);
    for (let y = 5; y < 35; y++) paintDisc(ink, 20 - Math.round(((y - 5) / 30) * 12), y, 3);
    const c = measureCoverage(mask, ink, G);
    expect(isLetterComplete(c, 400, 0.7)).toBe(false);
  });

  it("painting the whole letter finishes it", () => {
    const mask = letterA();
    const ink = new Uint8Array(G * G);
    for (let i = 0; i < mask.length; i++) if (mask[i]) paintDisc(ink, i % G, Math.floor(i / G), 2);
    const c = measureCoverage(mask, ink, G);
    expect(c.ratio).toBeGreaterThan(0.95);
    expect(isLetterComplete(c, MIN_PATH_PX + 10, 0.7)).toBe(true);
  });

  it("a long path is required even if the ink is all there", () => {
    const mask = letterA();
    const ink = new Uint8Array(G * G);
    for (let i = 0; i < mask.length; i++) if (mask[i]) ink[i] = 1;
    const c = measureCoverage(mask, ink, G);
    expect(isLetterComplete(c, 30, 0.7)).toBe(false);
  });
});
