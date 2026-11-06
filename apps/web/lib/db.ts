"use client";

import Dexie, { type Table } from "dexie";
import type { ProgressEntry } from "@shishu/core";

export type SessionRow = {
  day: string; // YYYY-MM-DD local
  minutes: number;
};

export class ShishuDB extends Dexie {
  progress!: Table<ProgressEntry, string>;
  sessions!: Table<SessionRow, string>;

  constructor() {
    super("shishu");
    this.version(1).stores({
      progress: "id, childId, lang, updatedAt",
      sessions: "day",
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

export async function addMinutes(min: number) {
  const day = localDay();
  const row = await db.sessions.get(day);
  await db.sessions.put({ day, minutes: (row?.minutes ?? 0) + min });
}

export function localDay(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
