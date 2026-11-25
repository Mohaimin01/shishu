"use client";

// The review queue — the SM-2 engine in @shishu/core finally wired to a learner.
// Marking a Word Rows row as learned puts every non-empty cell in it into the queue
// (key `conceptId|lang`), and each rating schedules the next visit. Ratings earn a
// seed: showing up is what counts, forgetting is answered with "again", never with shame.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dueCards, gradeCard, newCard, type Grade, type ReviewCard } from "@shishu/core";
import { localDay } from "./db";

/** Stable card key: one meaning in one language. */
export function cardKey(conceptId: string, lang: string): string {
  return `${conceptId}|${lang}`;
}

export type ReviewSummary = {
  total: number;
  due: number;
  /** cards answered "good/easy" at least once */
  learned: number;
  /** cards that survived 3+ good reviews */
  mastered: number;
};

export type LangProgress = {
  lang: string;
  total: number;
  learned: number;
  mastered: number;
};

export function summarize(cards: Record<string, ReviewCard>, now = Date.now()): ReviewSummary {
  const all = Object.values(cards);
  return {
    total: all.length,
    due: dueCards(all, now).length,
    learned: all.filter((c) => c.reps >= 1).length,
    mastered: all.filter((c) => c.reps >= 3).length,
  };
}

/** Review progress for the chosen languages, in the learner's column order. */
export function perLang(cards: Record<string, ReviewCard>, langs: string[], now = Date.now()): LangProgress[] {
  const all = Object.values(cards);
  return langs.map((lang) => {
    const mine = all.filter((c) => c.variantLang === lang);
    return {
      lang,
      total: mine.length,
      learned: mine.filter((c) => c.reps >= 1).length,
      mastered: mine.filter((c) => c.reps >= 3).length,
    };
  });
}

/** The last 14 local days as `YYYY-MM-DD` strings, oldest first (the quiet activity strip). */
export function last14Days(today = localDay()): string[] {
  const out: string[] = [];
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    out.push(localDay(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

type ReviewState = {
  cards: Record<string, ReviewCard>;
  /** local day → review actions, powering the 14-day activity strip */
  log: Record<string, number>;
  /** Puts one cell in the queue (first visit is due immediately). */
  enqueueCell: (conceptId: string, lang: string, now?: number) => void;
  /** Puts every non-empty cell of a learned row in the queue. */
  enqueueRow: (cells: { conceptId: string; langCode: string; empty: boolean }[], now?: number) => void;
  /** Grades one card and counts the day as active. */
  grade: (conceptId: string, lang: string, g: Grade, now?: number) => void;
  /** Removes a card (e.g. its language was removed). */
  drop: (conceptId: string, lang: string) => void;
  reset: () => void;
};

export const useReview = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: {},
      log: {},
      enqueueCell: (conceptId, lang, now = Date.now()) => {
        const key = cardKey(conceptId, lang);
        if (get().cards[key]) return; // already scheduled — never reset a learner's progress
        set((s) => ({ cards: { ...s.cards, [key]: newCard(conceptId, lang, now) } }));
      },
      enqueueRow: (cells, now = Date.now()) => {
        const fresh: Record<string, ReviewCard> = {};
        for (const c of cells) {
          if (c.empty) continue;
          const key = cardKey(c.conceptId, c.langCode);
          if (get().cards[key]) continue;
          fresh[key] = newCard(c.conceptId, c.langCode, now);
        }
        if (Object.keys(fresh).length > 0) set((s) => ({ cards: { ...s.cards, ...fresh } }));
      },
      grade: (conceptId, lang, g, now = Date.now()) => {
        const key = cardKey(conceptId, lang);
        const card = get().cards[key];
        if (!card) return;
        // the activity log counts the day the review HAPPENED (the graded moment),
        // not the wall-clock day the store happens to be touched on
        const day = localDay(new Date(now));
        set((s) => ({
          cards: { ...s.cards, [key]: gradeCard(card, g, now) },
          log: { ...s.log, [day]: (s.log[day] ?? 0) + 1 },
        }));
      },
      drop: (conceptId, lang) => {
        const key = cardKey(conceptId, lang);
        if (!(key in get().cards)) return;
        set((s) => {
          const cards = { ...s.cards };
          delete cards[key];
          return { cards };
        });
      },
      reset: () => set({ cards: {}, log: {} }),
    }),
    { name: "shishu-review", version: 1 },
  ),
);
