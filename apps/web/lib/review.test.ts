import { describe, expect, it, beforeEach } from "vitest";
import type { ReviewCard } from "@shishu/core";
import {
  cardKey, last14Days, perLang, summarize, useReview,
} from "./review";
import { localDay } from "./db";

const NOW = new Date("2026-11-23T10:00:00").getTime();
const DAY = 24 * 60 * 60 * 1000;

const card = (conceptId: string, lang: string, over: Partial<ReviewCard> = {}): ReviewCard => ({
  conceptId, variantLang: lang, ease: 2.5, intervalDays: 0, dueAt: NOW, reps: 0, ...over,
});

const cellsOf = (conceptId: string, ...langs: string[]) =>
  langs.map((langCode) => ({ conceptId, langCode, empty: false }));

beforeEach(() => {
  useReview.setState({ cards: {}, log: {} });
});

describe("cardKey", () => {
  it("is `conceptId|lang` — one meaning in one language", () => {
    expect(cardKey("water", "bn")).toBe("water|bn");
    expect(cardKey("water", "en")).not.toBe(cardKey("water", "bn"));
  });
});

describe("enqueueRow", () => {
  it("puts every non-empty cell of a learned row in the queue, due immediately", () => {
    useReview.getState().enqueueRow(cellsOf("water", "bn", "en", "hi"), NOW);
    const cards = useReview.getState().cards;
    expect(Object.keys(cards).sort()).toEqual(["water|bn", "water|en", "water|hi"].sort());
    for (const c of Object.values(cards)) expect(c.dueAt).toBe(NOW);
  });

  it("skips empty cells and never resets a card that already has a schedule", () => {
    useReview.getState().enqueueRow([{ conceptId: "water", langCode: "bn", empty: false }, { conceptId: "water", langCode: "hi", empty: true }], NOW);
    useReview.getState().grade("water", "bn", 2, NOW);
    const before = useReview.getState().cards["water|bn"];
    useReview.getState().enqueueRow(cellsOf("water", "bn"), NOW + DAY);
    expect(useReview.getState().cards["water|bn"]).toEqual(before);
    expect(useReview.getState().cards["water|hi"]).toBeUndefined();
  });
});

describe("grade", () => {
  beforeEach(() => {
    useReview.setState({ cards: { "water|en": card("water", "en") }, log: {} });
  });

  it("schedules again-cards for tomorrow and counts the day as active", () => {
    useReview.getState().grade("water", "en", 0, NOW);
    const c = useReview.getState().cards["water|en"];
    expect(c.reps).toBe(0);
    expect(c.dueAt).toBe(NOW + DAY);
    expect(useReview.getState().log[localDay(new Date(NOW))]).toBe(1);
  });

  it("a good card grows: 1 day → 3 days → ease-scaled intervals", () => {
    useReview.getState().grade("water", "en", 2, NOW);
    expect(useReview.getState().cards["water|en"].intervalDays).toBe(1);
    useReview.getState().grade("water", "en", 2, NOW + DAY);
    expect(useReview.getState().cards["water|en"].intervalDays).toBe(3);
    useReview.getState().grade("water", "en", 2, NOW + 4 * DAY);
    expect(useReview.getState().cards["water|en"].intervalDays).toBe(8); // 3 × ease 2.5
  });

  it("easy raises the ease factor (capped), hard lowers it (floored)", () => {
    useReview.setState({ cards: { "water|en": card("water", "en", { reps: 2, intervalDays: 3 }) } });
    useReview.getState().grade("water", "en", 3, NOW);
    expect(useReview.getState().cards["water|en"].ease).toBe(2.5); // capped at 2.5
    useReview.setState({ cards: { "water|en": card("water", "en", { reps: 2, intervalDays: 3, ease: 1.4 }) } });
    useReview.getState().grade("water", "en", 1, NOW);
    expect(useReview.getState().cards["water|en"].ease).toBeCloseTo(1.3); // floored at 1.3
    useReview.getState().grade("water", "en", 1, NOW);
    expect(useReview.getState().cards["water|en"].ease).toBeCloseTo(1.3); // never below
  });

  it("a lapse sends the card back to the start, gently", () => {
    useReview.setState({ cards: { "water|en": card("water", "en", { reps: 5, intervalDays: 20 }) } });
    useReview.getState().grade("water", "en", 0, NOW);
    const c = useReview.getState().cards["water|en"];
    expect(c.reps).toBe(0);
    expect(c.intervalDays).toBe(1);
    expect(c.dueAt).toBe(NOW + DAY);
  });

  it("grades only known cards (a drop leaves no ghost)", () => {
    useReview.getState().grade("ghost", "xx", 2, NOW);
    expect(useReview.getState().cards["ghost|xx"]).toBeUndefined();
    expect(Object.keys(useReview.getState().log).length).toBe(0);
  });
});

describe("drop", () => {
  it("removes exactly one card", () => {
    useReview.setState({ cards: { "water|en": card("water", "en"), "water|bn": card("water", "bn") } });
    useReview.getState().drop("water", "en");
    expect(Object.keys(useReview.getState().cards)).toEqual(["water|bn"]);
  });
});

describe("summarize", () => {
  it("counts due now, started and mastered (3+ good reviews)", () => {
    useReview.setState({
      cards: {
        "a|en": card("a", "en"), // due now
        "b|en": card("b", "en", { reps: 1, intervalDays: 1, dueAt: NOW + DAY }),
        "c|en": card("c", "en", { reps: 3, intervalDays: 9, dueAt: NOW + DAY }),
        "d|bn": card("d", "bn", { reps: 2, intervalDays: 3, dueAt: NOW + DAY }),
      },
    });
    expect(summarize(useReview.getState().cards, NOW)).toEqual({ total: 4, due: 1, learned: 3, mastered: 1 });
  });

  it("an empty queue says so honestly", () => {
    expect(summarize({}, NOW)).toEqual({ total: 0, due: 0, learned: 0, mastered: 0 });
  });
});

describe("perLang", () => {
  it("follows the learner's column order and reports per-language progress", () => {
    useReview.setState({
      cards: {
        "a|bn": card("a", "bn", { reps: 3 }),
        "b|bn": card("b", "bn"),
        "a|en": card("a", "en", { reps: 1 }),
      },
    });
    const rows = perLang(useReview.getState().cards, ["bn", "en", "hi"], NOW);
    expect(rows.map((r) => r.lang)).toEqual(["bn", "en", "hi"]);
    expect(rows[0]).toEqual({ lang: "bn", total: 2, learned: 1, mastered: 1 });
    expect(rows[1]).toEqual({ lang: "en", total: 1, learned: 1, mastered: 0 });
    expect(rows[2]).toEqual({ lang: "hi", total: 0, learned: 0, mastered: 0 });
  });
});

describe("last14Days", () => {
  it("returns 14 local days ending today, oldest first", () => {
    const days = last14Days("2026-11-23");
    expect(days.length).toBe(14);
    expect(days[0]).toBe("2026-11-10");
    expect(days[13]).toBe("2026-11-23");
  });
});
