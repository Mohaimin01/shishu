"use client";

import Dexie, { type Table } from "dexie";
import type { ProgressEntry } from "@shishu/core";
import type { LanguagePack } from "@shishu/content-schema";

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

export class ShishuDB extends Dexie {
  progress!: Table<ProgressEntry, string>;
  sessions!: Table<SessionRow, string>;
  lanelog!: Table<LaneSession, string>;
  packs!: Table<LanguagePack, string>; // downloaded community packs

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

export function localDay(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Sum of a language's learning minutes across the last 7 days (inclusive of today). */
export async function laneMinutesLast7(lang: string): Promise<number> {
  const cut = new Date(Date.now() - 6 * 86400000);
  const cutoffDay = cut.toISOString().slice(0, 10);
  const rows = await db.lanelog.where("lang").equals(lang).toArray();
  return rows.filter((r) => r.day >= cutoffDay).reduce((s, r) => s + r.minutes, 0);
}
