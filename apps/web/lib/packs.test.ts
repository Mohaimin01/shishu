import { describe, it, expect } from "vitest";
import { packs, BUNDLED_CODES, LANGS } from "./packs";
import { listForPack, nextAfter, tokensOf } from "./activities";

/**
 * Every bundled language carries its FULL alphabet for the trace/colour sections,
 * the same 14 founding concepts (so lanes can bridge), and the in-order Next flow.
 */

const EXPECTED: Record<string, { letters: number; first: string; last: string }> = {
  en: { letters: 26, first: "A", last: "Z" },
  bn: { letters: 49, first: "অ", last: "জ্ঞ" },
  es: { letters: 27, first: "A", last: "Z" },
  fr: { letters: 26, first: "A", last: "Z" },
  de: { letters: 30, first: "A", last: "ß" },
  pt: { letters: 26, first: "A", last: "Z" },
  tr: { letters: 29, first: "A", last: "Z" },
  id: { letters: 26, first: "A", last: "Z" },
  ru: { letters: 33, first: "А", last: "Я" },
  ar: { letters: 28, first: "ا", last: "ي" },
  ur: { letters: 39, first: "ا", last: "ے" },
  hi: { letters: 46, first: "अ", last: "ह" },
  zh: { letters: 20, first: "一", last: "好" },
  ja: { letters: 92, first: "あ", last: "ン" },
};

describe("bundled language packs", () => {
  it("ships all 14 languages with matching LANGS entries", () => {
    expect(BUNDLED_CODES.sort()).toEqual(Object.keys(EXPECTED).sort());
    expect(LANGS.map((l) => l.code).sort()).toEqual(BUNDLED_CODES.slice().sort());
    for (const l of LANGS) expect(l.nativeName.length).toBeGreaterThan(0);
  });

  it.each(Object.keys(EXPECTED))("%s carries its complete alphabet in order", (code) => {
    const p = packs[code];
    const exp = EXPECTED[code];
    expect(p.letters).toHaveLength(exp.letters);
    expect(p.letters[0].char).toBe(exp.first);
    expect(p.letters[p.letters.length - 1].char).toBe(exp.last);
    const ids = p.letters.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicate ids
    for (const l of p.letters) expect(l.char.length).toBeGreaterThan(0);
  });

  it("keeps the en/bn letters families already knew (ids never renumbered)", () => {
    expect(packs.en.letters.map((l) => l.id).slice(0, 8)).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
    // bn's original 8 ids all survive, in canonical order, with the new letters slotted in
    const bnIds = packs.bn.letters.map((l) => l.id);
    const kept = ["bn-a", "bn-aa", "bn-i", "bn-u", "bn-e", "bn-k", "bn-kh", "bn-g"];
    const idx = kept.map((id) => bnIds.indexOf(id));
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    expect(packs.bn.letters.map((l) => l.char).slice(0, 11)).toEqual(
      ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "ঋ", "এ", "ঐ", "ও", "ঔ"],
    );
  });

  it.each(BUNDLED_CODES)("%s has the shared 14 concepts, 10 numbers, phrases", (code) => {
    const p = packs[code];
    expect(p.numbers).toHaveLength(10);
    expect(p.numbers.map((n) => n.value)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(p.words.map((w) => w.conceptId).sort()).toEqual(
      packs.en.words.map((w) => w.conceptId).sort(),
    );
    expect(p.words.every((w) => w.emoji && w.label.length > 0)).toBe(true);
    expect(p.phrases.length).toBeGreaterThanOrEqual(4);
    for (const ph of p.phrases) {
      const tiles = tokensOf(ph); // authored tokens, or the text split on spaces
      expect(tiles.length).toBeGreaterThan(0);
      expect(tiles.length).toBeLessThanOrEqual(6);
      expect((ph.translation ?? "").length).toBeGreaterThan(0);
    }
  });

  it("marks the right-to-left languages", () => {
    expect(packs.ar.direction).toBe("rtl");
    expect(packs.ur.direction).toBe("rtl");
    for (const code of BUNDLED_CODES.filter((c) => c !== "ar" && c !== "ur")) {
      expect(packs[code].direction).toBe("ltr");
    }
  });

  it("gives every pack traceable letters (mask-able single glyphs)", () => {
    for (const code of BUNDLED_CODES) {
      for (const l of packs[code].letters) {
        // canvas mask + TTS tap-sound both work on letters made of letters/marks
        expect([...l.char].every((ch) => /\p{L}|\p{M}/u.test(ch))).toBe(true);
      }
    }
  });
});

describe("the Next flow walks the whole alphabet in order", () => {
  it("starts at colour-the-letter, then trace, letter by letter", () => {
    const en = listForPack(packs.en);
    expect(en[0]).toMatchObject({ type: "color-letter", itemId: "a" });
    expect(en[1]).toMatchObject({ type: "trace-letter", itemId: "a" });
    expect(en[2]).toMatchObject({ type: "color-letter", itemId: "b" });
    // last letter card is trace Z, then numbers begin
    expect(en[51]).toMatchObject({ type: "trace-letter", itemId: "z" });
    expect(en[52]).toMatchObject({ type: "color-number", itemId: "0" });
  });

  it("mid-alphabet cards continue to the next letter (existing links keep working)", () => {
    const mid = listForPack(packs.en).find((c) => c.key === "trace-letter:m")!;
    const next = nextAfter("en", mid);
    expect(next).toMatchObject({ type: "color-letter", itemId: "n" });
  });

  it.each(BUNDLED_CODES)("%s: last letter flows into numbers, none dead-end", (code) => {
    const list = listForPack(packs[code]);
    const letterCards = list.filter((c) => c.type === "color-letter" || c.type === "trace-letter");
    expect(letterCards.length).toBe(packs[code].letters.length * 2);
    // walk every letter card: the next one always exists within the alphabet
    for (let i = 0; i < letterCards.length - 1; i++) {
      expect(nextAfter(code, letterCards[i])).toBeDefined();
    }
    const last = letterCards[letterCards.length - 1];
    expect(nextAfter(code, last)?.type).toBe("color-number");
  });
});
