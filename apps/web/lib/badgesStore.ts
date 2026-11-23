"use client";

// Badge store — badges are visitors to the garden: they arrive once and never leave.
// `sync` evaluates the learner's current stats (pure, from @shishu/core) and returns
// only the NEWLY earned ids, so the UI can greet each visitor exactly once.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { earnedBadges, type BadgeId, type BadgeStats } from "@shishu/core";
import type { Concept, LexiconLanguage } from "@shishu/core";

type BadgesState = {
  earned: BadgeId[];
  /** the learner has seen every earned badge (clears the little celebration) */
  seen: boolean;
  /** Evaluate now; keeps everything already earned. Returns only the new ids. */
  sync: (stats: BadgeStats) => BadgeId[];
  markSeen: () => void;
  reset: () => void;
};

export const useBadges = create<BadgesState>()(
  persist(
    (set, get) => ({
      earned: [],
      seen: true,
      sync: (stats) => {
        const now = earnedBadges(stats);
        const fresh = now.filter((id) => !get().earned.includes(id));
        if (fresh.length > 0) set((s) => ({ earned: [...s.earned, ...fresh], seen: false }));
        return fresh;
      },
      markSeen: () => set({ seen: true }),
      reset: () => set({ earned: [], seen: true }),
    }),
    { name: "shishu-badges", version: 1 },
  ),
);

/** Gathers badge stats from the learner's own device data (no server, nothing to fetch). */
export function computeBadgeStats(args: {
  known: readonly string[];
  concepts: Concept[];
  langs: Record<string, LexiconLanguage>;
  columns: string[];
  bestStreak: number;
  gapDays: number;
}): BadgeStats {
  const { known, concepts, langs, columns, bestStreak, gapDays } = args;
  const knownSet = new Set(known);

  // how many of the chosen languages a single learned row can span
  let widestRowLangs = 0;
  // languages with at least one word in the table at all (a language with no rows can't count against the learner)
  const withWords = new Set<string>();
  // languages the learner has actually learned a word in
  const learnedIn = new Set<string>();
  for (const c of concepts) {
    let span = 0;
    for (const col of columns) {
      const lang = langs[col];
      if (!lang) continue;
      if ((lang.entries[c.id]?.length ?? 0) > 0) {
        withWords.add(col);
        span += 1;
        if (knownSet.has(c.id)) learnedIn.add(col);
      }
    }
    if (knownSet.has(c.id) && span > widestRowLangs) widestRowLangs = span;
  }

  return {
    bestStreak,
    rowsLearned: known.length,
    widestRowLangs,
    langsSelected: withWords.size,
    langsLearned: learnedIn.size,
    gapDays,
  };
}
