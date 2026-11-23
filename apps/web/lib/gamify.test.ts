import { describe, expect, it, beforeEach } from "vitest";
import { localDay } from "./db";
import { dayGap, LEVELS, levelOf, useGamify, XP_BY_TYPE } from "./gamify";

const dayShift = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDay(d);
};

beforeEach(() => {
  useGamify.setState({ xp: 0, streak: 0, bestStreak: 0, lastDay: null, gapDays: 0 });
});

describe("garden levels", () => {
  it("starts at Seed with zero seeds", () => {
    const { level, next } = levelOf(0);
    expect(level.name).toBe("Seed");
    expect(level.emoji).toBe("🌱");
    expect(next?.name).toBe("Sprout");
  });

  it("levels are strictly ascending and every level is reachable", () => {
    for (let i = 0; i < LEVELS.length - 1; i++) {
      expect(LEVELS[i].at).toBeLessThan(LEVELS[i + 1].at);
      expect(levelOf(LEVELS[i + 1].at).level.name).toBe(LEVELS[i + 1].name);
    }
  });

  it("the last level has no next", () => {
    const top = LEVELS[LEVELS.length - 1];
    const { level, next } = levelOf(top.at + 500);
    expect(level.name).toBe(top.name);
    expect(next).toBeNull();
  });

  it("levels up exactly at each threshold", () => {
    expect(levelOf(29).level.name).toBe("Seed");
    expect(levelOf(30).level.name).toBe("Sprout");
    expect(levelOf(79).level.name).toBe("Sprout");
    expect(levelOf(80).level.name).toBe("Leaf");
  });
});

describe("seeds (XP)", () => {
  it("every activity type earns at least one seed", () => {
    for (const v of Object.values(XP_BY_TYPE)) expect(v).toBeGreaterThanOrEqual(1);
  });

  it("award() adds the type's seeds, returns what it added, and counts the day", () => {
    const got = useGamify.getState().award("trace-letter");
    expect(got).toBe(2);
    expect(useGamify.getState().xp).toBe(2);
    expect(useGamify.getState().streak).toBe(1);
    expect(useGamify.getState().lastDay).toBe(dayShift(0));
  });

  it("awards accumulate across activities", () => {
    const g = useGamify.getState();
    g.award("color-letter");
    g.award("sentence-strip");
    g.award("concept-bridge");
    expect(useGamify.getState().xp).toBe(1 + 3 + 3);
  });

  it("an unknown type still earns a gentle default", () => {
    const got = useGamify.getState().award("mystery" as never);
    expect(got).toBe(1);
  });
});

describe("streaks", () => {
  it("first day of play starts the streak at 1", () => {
    useGamify.getState().touchDay();
    expect(useGamify.getState().streak).toBe(1);
    expect(useGamify.getState().bestStreak).toBe(1);
  });

  it("same-day touches do not inflate the streak", () => {
    useGamify.getState().touchDay();
    useGamify.getState().touchDay();
    useGamify.getState().touchDay();
    expect(useGamify.getState().streak).toBe(1);
  });

  it("yesterday's streak continues today", () => {
    useGamify.setState({ lastDay: dayShift(1), streak: 3, bestStreak: 3 });
    useGamify.getState().touchDay();
    expect(useGamify.getState().streak).toBe(4);
    expect(useGamify.getState().bestStreak).toBe(4);
  });

  it("a missed day resets the streak but keeps the best", () => {
    useGamify.setState({ lastDay: dayShift(2), streak: 5, bestStreak: 5 });
    useGamify.getState().touchDay();
    expect(useGamify.getState().streak).toBe(1);
    expect(useGamify.getState().bestStreak).toBe(5);
  });
});

describe("gaps (for the ✨ welcome-back badge)", () => {
  it("dayGap counts whole days between local day strings", () => {
    expect(dayGap("2026-11-10", "2026-11-23")).toBe(13);
    expect(dayGap("2026-11-23", "2026-11-23")).toBe(0);
    expect(dayGap("2026-11-23", "2026-11-10")).toBe(-13);
    expect(dayGap("not-a-day", "2026-11-23")).toBe(0);
  });

  it("a same-day return reports no gap", () => {
    useGamify.setState({ lastDay: dayShift(0) });
    useGamify.getState().touchDay();
    expect(useGamify.getState().gapDays).toBe(0);
  });

  it("returning after one missed day reports 1", () => {
    useGamify.setState({ lastDay: dayShift(2) });
    useGamify.getState().touchDay();
    expect(useGamify.getState().gapDays).toBe(1);
  });

  it("returning after a week away reports 7 — the sparkles are earned", () => {
    useGamify.setState({ lastDay: dayShift(8), streak: 4, bestStreak: 4 });
    useGamify.getState().touchDay();
    expect(useGamify.getState().gapDays).toBe(7);
    expect(useGamify.getState().streak).toBe(1); // a fresh start, gently
    expect(useGamify.getState().bestStreak).toBe(4); // the best is never lost
  });

  it("a first-ever visit has no gap to report", () => {
    useGamify.getState().touchDay();
    expect(useGamify.getState().gapDays).toBe(0);
  });
});
