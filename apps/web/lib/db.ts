"use client";

import Dexie, { type Table } from "dexie";
import type { ProgressEntry } from "@shishu/core";
import type { LanguagePack } from "@shishu/content-schema";
import type { LexiconLanguage } from "@shishu/core";

export type SessionRow = {
  day: string; // YYYY-MM-DD local (total, all lanes)
  minutes: number;
};

export type LaneSession = {
  key: string; // `${day}|${lang}`
  day: string;
  lang: string;
  minutes: number;
};

/** Family/parent voice recording for one item in one lane. Never leaves the device. */
export type FamilyAudio = {
  key: string; // `${childId}:${lang}:${itemId}`
  blob: Blob;
  updatedAt: number;
};

export class ShishuDB extends Dexie {
  progress!: Table<ProgressEntry, string>;
  sessions!: Table<SessionRow, string>;
  lanelog!: Table<LaneSession, string>;
  packs!: Table<LanguagePack, string>; // downloaded community packs
  familyaudio!: Table<FamilyAudio, string>;
  lexicons!: Table<LexiconLanguage, string>; // word-list languages added by the learner / community

  constructor() {
    super("shishu");
    this.version(1).stores({
      progress: "id, childId, lang, updatedAt",
      sessions: "day",
    });
    // v2: language-lane session log + downloaded packs. Existing data untouched.
    this.version(2).stores({
      progress: "id, childId, lang, updatedAt",
      sessions: "day",
      lanelog: "key, day, lang",
      packs: "code",
    });
    // v3: family voice memories (local only, never synced)
    this.version(3).stores({
      progress: "id, childId, lang, updatedAt",
      sessions: "day",
      lanelog: "key, day, lang",
      packs: "code",
      familyaudio: "key",
    });
    // v4: Word Rows languages imported on this device (any language in the world)
    this.version(4).stores({
      progress: "id, childId, lang, updatedAt",
      sessions: "day",
      lanelog: "key, day, lang",
      packs: "code",
      familyaudio: "key",
      lexicons: "code",
    });
  }
}

export const db = new ShishuDB();

export function entryId(childId: string, lang: string, skill: string, itemId: string) {
  return `${childId}:${lang}:${skill}:${itemId}`;
}

export async function todayMinutes(): Promise<number> {
  const day = localDay();
  const row = await db.sessions.get(day);
  return row?.minutes ?? 0;
}

/** Adds learning minutes to the device total and (when known) to the language lane. */
export async function addMinutes(min: number, lang?: string) {
  if (min <= 0) return;
  const day = localDay();
  const total = await db.sessions.get(day);
  await db.sessions.put({ day, minutes: (total?.minutes ?? 0) + min });
  if (lang) {
    const key = `${day}|${lang}`;
    const lane = await db.lanelog.get(key);
    await db.lanelog.put({ key, day, lang, minutes: (lane?.minutes ?? 0) + min });
  }
}

export function localDay(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Sum of a language's learning minutes across the last 7 days (inclusive of today). */
export async function laneMinutesLast7(lang: string): Promise<number> {
  // local calendar days, same as localDay() (toISOString() is UTC and skews a day near midnight)
  const cut = new Date();
  cut.setDate(cut.getDate() - 6);
  const cutoffDay = localDay(cut);
  const rows = await db.lanelog.where("lang").equals(lang).toArray();
  return rows.filter((r) => r.day >= cutoffDay).reduce((s, r) => s + r.minutes, 0);
}
