"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScriptId } from "@shishu/core";

export type WordsState = {
  native: string;
  /** languages being learned, in the order the learner wants the columns */
  targets: string[];
  /** scripts the learner can read, most preferred first */
  readable: ScriptId[];
  maxSynonyms: number; // Infinity is not JSON-safe: 0 = all
  pageSize: number;    // rows per screen / sheet (0 = all)
  page: number;
  hideKnown: boolean;
  showRoman: boolean;
  rowsPerDay: number;
  /** concept ids the learner marked as learned */
  known: string[];
  perSheet: number; // language columns per printed sheet
  set: (patch: Partial<Omit<WordsState, "set">>) => void;
  toggleKnown: (id: string) => void;
};

export const useWords = create<WordsState>()(
  persist(
    (set, get) => ({
      native: "bn",
      targets: ["en", "hi"],
      readable: ["bengali", "latin"],
      maxSynonyms: 0,
      pageSize: 20,
      page: 0,
      hideKnown: false,
      showRoman: true,
      rowsPerDay: 5,
      known: [],
      perSheet: 4,
      set: (patch) => set(patch),
      toggleKnown: (id) => {
        const k = get().known;
        set({ known: k.includes(id) ? k.filter((x) => x !== id) : [...k, id] });
      },
    }),
    { name: "shishu-words", version: 1 },
  ),
);
