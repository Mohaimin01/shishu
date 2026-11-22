"use client";

// One-file backup of everything Shishu keeps on this device — the no-server answer to
// "keep my progress". Save the file, move phones, restore the garden, the words and the
// family voices. Nothing ever goes through a server; the file only travels where you put it.

import { db } from "./db";

const LS_PREFIX = "shishu-"; // zustand-persist keys: settings, words, gamify
const TABLES = ["progress", "sessions", "lanelog", "packs", "lexicons", "familyaudio"] as const;
const TABLE_NAMES: Record<string, string> = {
  progress: "learning progress",
  sessions: "daily minutes",
  lanelog: "language-lane minutes",
  packs: "downloaded children's packs",
  lexicons: "Word Rows languages",
  familyaudio: "family voice recordings",
};

export type BackupFile = {
  app: "shishu";
  version: 1;
  createdAt: string;
  localStorage: Record<string, string>;
  tables: Record<string, Record<string, unknown>[]>;
};

export function backupFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `shishu-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
}

/** Blob → base64 so recordings can live inside the JSON file. */
async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, type: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Reads every Shishu store on this device into one portable object. */
export async function buildBackup(): Promise<BackupFile> {
  const ls: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LS_PREFIX)) ls[k] = localStorage.getItem(k) ?? "";
  }
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const t of TABLES) {
    const rows = (await db.table(t).toArray()) as Record<string, unknown>[];
    tables[t] = await Promise.all(
      rows.map(async (row) => {
        if (row?.blob instanceof Blob) {
          const { blob, ...rest } = row;
          return { ...rest, blob: await blobToBase64(blob), __blobType: (blob as Blob).type || "audio/webm" };
        }
        return row;
      }),
    );
  }
  return { app: "shishu", version: 1, createdAt: new Date().toISOString(), localStorage: ls, tables };
}

/** Strict, friendly validation of a file chosen for restore. Throws plain-words errors. */
export function parseBackup(data: unknown): BackupFile {
  if (typeof data !== "object" || data === null) throw new Error("That file is not a Shishu backup.");
  const b = data as Partial<BackupFile>;
  if (b.app !== "shishu") throw new Error("This file was not saved by Shishu — nothing was restored.");
  if (b.version !== 1) throw new Error(`Unknown backup version ${String(b.version)} — this app restores version 1.`);
  if (typeof b.localStorage !== "object" || typeof b.tables !== "object") {
    throw new Error("The backup file looks damaged — nothing was restored.");
  }
  return b as BackupFile;
}

/** Puts a validated backup back onto this device (merges over current data, never deletes). */
export async function applyBackup(b: BackupFile): Promise<string[]> {
  const restored: string[] = [];
  for (const [k, v] of Object.entries(b.localStorage)) {
    if (k.startsWith(LS_PREFIX)) localStorage.setItem(k, String(v));
  }
  for (const t of TABLES) {
    const rows = b.tables?.[t] ?? [];
    if (rows.length === 0) continue;
    const fixed = rows.map((row) => {
      if (typeof row?.blob === "string") {
        const type = typeof row.__blobType === "string" ? row.__blobType : "audio/webm";
        return { ...row, blob: base64ToBlob(row.blob, type) };
      }
      return row;
    });
    await db.table(t).bulkPut(fixed);
    restored.push(`${TABLE_NAMES[t]} (${rows.length})`);
  }
  return restored;
}

/** Browser download of the backup as a JSON file. */
export function downloadBackup(b: BackupFile): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFilename();
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
