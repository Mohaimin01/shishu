import { describe, it, expect } from "vitest";
import { shuffle, shuffleUnsolved } from "./shuffle";

describe("shuffle", () => {
  it("keeps every item", () => {
    expect(shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("never returns the solved order for a sentence (when another order exists)", () => {
    const words = ["I", "love", "you"];
    for (let i = 0; i < 200; i++) {
      expect(shuffleUnsolved(words, (a, b) => a === b)).not.toEqual(words);
    }
  });
  it("handles all-identical tiles without looping forever", () => {
    expect(shuffleUnsolved(["a", "a"], (a, b) => a === b)).toEqual(["a", "a"]);
  });
});
