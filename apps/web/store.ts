"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Stage } from "@shishu/core";

export type LastActivity = { lang: string; type: string; itemId: string; stage: string } | null;

type SettingsState = {
  lang: string; // legacy single-language (kept for pkg migration)
  activeLangs: string[]; // language lanes, home language FIRST
  laneNames: Record<string, string>; // editable, e.g. { bn: "মা's ভাষা" }
  stage: Stage;
  age: number;
  sound: boolean;
  capMin: number; // gentle session cap (0 = none)
  showMinutes: boolean; // visible "learning minutes" (hideable)
  childId: string;
  lastActivity: LastActivity; // powering one-tap Continue on home
  set: (patch: Partial<Omit<SettingsState, "set">>) => void;
};

function makeChildId(): string {
  // local-only anonymous id; no PII, no account
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_ACTIVE = ["en", "bn"];

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: "en",
      activeLangs: DEFAULT_ACTIVE,
      laneNames: {},
      stage: "toddler",
      age: 3,
      sound: true,
      capMin: 15,
      showMinutes: true,
      childId: "",
      lastActivity: null,
      set: (patch) => set(patch),
    }),
    {
      name: "shishu-settings",
      version: 2,
      // v2: single `lang` became ordered `activeLangs`; nothing else moved.
      migrate: (state: unknown, version: number) => {
        const s = (state ?? {}) as Partial<SettingsState> & { lang?: string };
        if (version < 2 && (!Array.isArray(s.activeLangs) || s.activeLangs.length === 0)) {
          const legacy = (s as { lang?: string }).lang ?? "en";
          const merged = [legacy, ...DEFAULT_ACTIVE].filter((c, i, a) => Boolean(c) && a.indexOf(c) === i);
          s.activeLangs = merged;
        }
        if (!Array.isArray(s.activeLangs) || s.activeLangs.length === 0) s.activeLangs = DEFAULT_ACTIVE;
        return s as unknown as SettingsState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.childId) state.set({ childId: makeChildId() });
          if (!Array.isArray(state.activeLangs) || state.activeLangs.length === 0) {
            state.set({ activeLangs: DEFAULT_ACTIVE });
          }
        }
      },
    },
  ),
);

/** Non-hook accessor (outside React). */
export function readChildId(): string {
  let id = useSettings.getState().childId;
  if (!id) {
    id = makeChildId();
    useSettings.getState().set({ childId: id });
  }
  return id;
}

/** Friendly lane label: parent's alias beats pack's native name. */
export function laneLabel(activeLangs: string[], i: number, code: string, names: Record<string, string>, nativeNames: Record<string, string>): string {
  return names[code] ?? nativeNames[code] ?? code;
}

/** Weekly gentle dose targets (minutes) by lane order: home, second, third+. */
export function weeklyTargetFor(i: number): number {
  if (i === 0) return 70; // ~10 min/day
  if (i === 1) return 35; // ~5 min/day
  return 15; // ~3 min/day, alternate days
}
