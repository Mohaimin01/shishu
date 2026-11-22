import rawEn from "../../../content-packs/en/pack.json";
import rawBn from "../../../content-packs/bn/pack.json";
import { validatePack, type LanguagePack } from "@shishu/content-schema";
import { db } from "./db";

// Bundled packs are compiled in (tiny, offline-certain). Community packs that a grown-up
// downloads live in IndexedDB; `loadDownloadedPacks()` registers them into this same map so
// every activity (which reads packs through getPack) can use them — not just the lane list.
export const packs: Record<string, LanguagePack> = {
  en: validatePack(rawEn),
  bn: validatePack(rawBn),
};

export const BUNDLED_CODES = Object.keys(packs);

export const LANGS = [
  { code: "en", nativeName: "English" },
  { code: "bn", nativeName: "বাংলা" },
];

export function getPack(code: string): LanguagePack {
  return packs[code] ?? packs.en;
}

export function hasPack(code: string): boolean {
  return Boolean(packs[code]);
}

export function langName(code: string): string {
  return packs[code]?.nativeName ?? LANGS.find((l) => l.code === code)?.nativeName ?? code;
}

/** Registers every downloaded community pack so activities can play it. Safe to call often. */
export async function loadDownloadedPacks(): Promise<string[]> {
  try {
    const rows = await db.packs.toArray();
    for (const p of rows) {
      if (!BUNDLED_CODES.includes(p.code)) packs[p.code] = p;
    }
    return rows.map((r) => r.code);
  } catch {
    return [];
  }
}

export function unregisterPack(code: string) {
  if (!BUNDLED_CODES.includes(code)) delete packs[code];
}
