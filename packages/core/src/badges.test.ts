import { describe, expect, it } from "vitest";
import { BADGES, badgeById, earnedBadges, type BadgeStats } from "./badges";

const stats = (over: Partial<BadgeStats> = {}): BadgeStats => ({
  bestStreak: 0,
  rowsLearned: 0,
  widestRowLangs: 0,
  langsSelected: 2,
  langsLearned: 0,
  gapDays: 0,
  ...over,
});

describe("garden badges", () => {
  it("has five friendly visitors, each with a name a child can love", () => {
    expect(BADGES.map((b) => b.id)).toEqual([
      "streak-7", "rows-50", "row-5-langs", "all-langs", "welcome-back",
    ]);
    for (const b of BADGES) {
      expect(b.emoji.length).toBeGreaterThan(0);
      expect(b.description.endsWith(".")).toBe(false);
    }
  });

  it("badgeById finds each badge and refuses unknown ids", () => {
    expect(badgeById("rows-50").emoji).toBe("🐝");
    expect(() => badgeById("nope" as never)).toThrow(/unknown badge/);
  });

  it("a fresh learner has no badges yet — nothing is given away for nothing", () => {
    expect(earnedBadges(stats())).toEqual([]);
  });

  it("the butterfly lands on the 7th day in a row (bestStreak keeps it even after a broken streak)", () => {
    expect(earnedBadges(stats({ bestStreak: 6 })).includes("streak-7")).toBe(false);
    expect(earnedBadges(stats({ bestStreak: 7 })).includes("streak-7")).toBe(true);
    // bestStreak, not the current streak: the badge never expires
    expect(earnedBadges(stats({ bestStreak: 7, gapDays: 9 })).includes("streak-7")).toBe(true);
  });

  it("the busy bee arrives at 50 learned rows, not one earlier", () => {
    expect(earnedBadges(stats({ rowsLearned: 49 })).includes("rows-50")).toBe(false);
    expect(earnedBadges(stats({ rowsLearned: 50 })).includes("rows-50")).toBe(true);
  });

  it("the little bird needs one meaning that spans 5 languages", () => {
    expect(earnedBadges(stats({ widestRowLangs: 4 })).includes("row-5-langs")).toBe(false);
    expect(earnedBadges(stats({ widestRowLangs: 5 })).includes("row-5-langs")).toBe(true);
    expect(earnedBadges(stats({ widestRowLangs: 7 })).includes("row-5-langs")).toBe(true);
  });

  it("the rainbow needs a learned word in EVERY language that has words at all", () => {
    expect(earnedBadges(stats({ langsSelected: 3, langsLearned: 2 })).includes("all-langs")).toBe(false);
    expect(earnedBadges(stats({ langsSelected: 3, langsLearned: 3 })).includes("all-langs")).toBe(true);
    expect(earnedBadges(stats({ langsSelected: 5, langsLearned: 5 })).includes("all-langs")).toBe(true);
  });

  it("the rainbow cannot be earned when there is nothing to learn (empty table)", () => {
    expect(earnedBadges(stats({ langsSelected: 0, langsLearned: 0 })).includes("all-langs")).toBe(false);
  });

  it("welcome back sparkles only after a full week away", () => {
    expect(earnedBadges(stats({ gapDays: 6 })).includes("welcome-back")).toBe(false);
    expect(earnedBadges(stats({ gapDays: 7 })).includes("welcome-back")).toBe(true);
  });

  it("a returning learner can earn several badges at once, in stable order", () => {
    const all = earnedBadges(stats({
      bestStreak: 7, rowsLearned: 50, widestRowLangs: 5, langsSelected: 2, langsLearned: 2, gapDays: 7,
    }));
    expect(all).toEqual(["streak-7", "rows-50", "row-5-langs", "all-langs", "welcome-back"]);
  });

  it("the description speaks of celebration, never of shame or loss", () => {
    for (const b of BADGES) {
      expect(b.description.toLowerCase()).not.toMatch(/fail|lose|lost|shame|punish/);
    }
  });
});
