"use client";

import { validatePack, type LanguagePack } from "@shishu/content-schema";
import { db } from "./db";
import { packs, unregisterPack, BUNDLED_CODES } from "./packs";

/**
 * Community pack downloader — parent-gated, no accounts, no telemetry.
 * A pack = one JSON file (raw.githubusercontent or any static host).
 * After download it lives in IndexedDB and works fully offline like the bundled packs.
 */
export async function fetchAndStashPack(url: string): Promise<LanguagePack> {
  const clean = url.trim();
  if (!/^https:\/\/[^\s]+$/i.test(clean)) throw new Error("Only https:// URLs are accepted");
  const res = await fetch(clean);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: unknown = await res.json();
  const pack = validatePack(raw); // zod rejects malformed packs
  if (BUNDLED_CODES.includes(pack.code)) {
    throw new Error(`"${pack.code}" is a built-in language — please use a different code for your pack`);
  }
  await db.packs.put(pack);
  packs[pack.code] = pack;
  return pack;
}

export async function downloadedPacks(): Promise<LanguagePack[]> {
  return db.packs.toArray();
}

export async function removePack(code: string): Promise<void> {
  await db.packs.delete(code);
  unregisterPack(code);
}
