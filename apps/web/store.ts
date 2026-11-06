"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Stage } from "@shishu/core";

type SettingsState = {
  lang: string;
  stage: Stage;
  age: number;
  sound: boolean;
  capMin: number; // gentle session cap (0 = none)
  childId: string;
  set: (patch: Partial<Omit<SettingsState, "set">>) => void;
};

function makeChildId(): string {
  // local-only anonymous id; no PII, no account
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      lang: "en",
      stage: "toddler",
      age: 3,
      sound: true,
      capMin: 15,
      childId: "",
      set: (patch) => set(patch),
    }),
    {
      name: "shishu-settings",
      // generate childId lazily at first hydration
      onRehydrateStorage: () => (state) => {
        if (state && !state.childId) state.set({ childId: makeChildId() });
      },
    },
  ),
);

/** Non-hook accessor (routes outside React). */
export function readChildId(): string {
  let id = useSettings.getState().childId;
  if (!id) {
    id = makeChildId();
    useSettings.getState().set({ childId: id });
  }
  return id;
}
