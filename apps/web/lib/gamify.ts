"use client";

// Gentle gamification — celebration, never pressure (board verdict: no shame states).
// Seeds (XP) for effort, a streak for showing up, and garden levels that only grow.
// Nothing expires, nothing is lost, nothing is locked. All data stays on this device.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActivityType } from "./activities";
import { localDay } from "./db";

/** Seeds earned per completed activity (correct answers only — quizzes complete on success). */
export const XP_BY_TYPE: Record<ActivityType, number> = {
  "color-letter": 1,
  "color-number": 1,
  "trace-letter": 2,
  "tap-sound": 1,
  "match-picture-word": 2,
  "sentence-strip": 3,
  "listen-repeat": 2,
  "concept-table-review": 2,
  "concept-bridge": 3,
};

export type Level = { name: string; emoji: string; at: number };

/** A garden grows with the child — names a 3-year-old can love. */
export const LEVELS: Level[] = [
  { name: "Seed", emoji: "🌱", at: 0 },
  { name: "Sprout", emoji: "🌿", at: 30 },
  { name: "Leaf", emoji: "🍃", at: 80 },
  { name: "Sapling", emoji: "🪴", at: 150 },
  { name: "Tree", emoji: "🌳", at: 300 },
  { name: "Bloom", emoji: "🌸", at: 500 },
  { name: "Garden", emoji: "🏡", at: 800 },
  { name: "Forest", emoji: "🌲", at: 1200 },
];

export function levelOf(xp: number): { level: Level; next: Level | null; into: number; span: number } {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].at) { idx = i; break; }
  }
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const span = next ? next.at - level.at : 1;
  const into = next ? xp - level.at : 1;
  return { level, next, into, span };
}

/** Local-calendar day string (same helper the minutes log uses, so streaks and doses agree). */
function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDay(d);
}

type GamifyState = {
  xp: number;
  streak: number;
  bestStreak: number;
  lastDay: string | null;
  /** Adds seeds for a completed activity and counts today in the streak. Returns seeds earned. */
  award: (type: ActivityType) => number;
  /** Adds seeds outside the play activities (e.g. a Word Rows row learned by an older learner). */
  awardRaw: (n: number) => void;
  /** Counts today as an active day (no seeds — a day of looking still counts as showing up). */
  touchDay: () => void;
};

export const useGamify = create<GamifyState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      bestStreak: 0,
      lastDay: null,
      award: (type) => {
        const n = XP_BY_TYPE[type] ?? 1;
        set((s) => ({ xp: s.xp + n }));
        get().touchDay();
        return n;
      },
      awardRaw: (n) => {
        if (n <= 0) return;
        set((s) => ({ xp: s.xp + n }));
        get().touchDay();
      },
      touchDay: () => {
        const today = localDay();
        set((s) => {
          if (s.lastDay === today) return {};
          const streak = s.lastDay === yesterday() ? s.streak + 1 : 1;
          return { streak, bestStreak: Math.max(s.bestStreak, streak), lastDay: today };
        });
      },
    }),
    { name: "shishu-gamify", version: 1 },
  ),
);
