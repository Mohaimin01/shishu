import { describe, it, expect } from "vitest";
import { newCard, gradeCard, dueCards } from "./spaced-repetition";

describe("spaced repetition", () => {
  it("new card is due now", () => {
    const c = newCard("water", "en");
    expect(c.dueAt).toBeLessThanOrEqual(Date.now());
  });
  it("grade good increases interval", () => {
    const c = newCard("water", "en");
    const g = gradeCard(c, 2);
    expect(g.intervalDays).toBeGreaterThanOrEqual(1);
    expect(g.reps).toBe(1);
  });
  it("lapse resets", () => {
    const c = newCard("water", "en");
    const g1 = gradeCard(c, 2);
    const lapsed = gradeCard(g1, 0);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.intervalDays).toBe(1);
  });
  it("dueCards filters", () => {
    const c = newCard("water", "en");
    expect(dueCards([c])).toHaveLength(1);
  });
});
