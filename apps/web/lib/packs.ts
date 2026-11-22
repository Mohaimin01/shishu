import rawEn from "../../../content-packs/en/pack.json";
import rawBn from "../../../content-packs/bn/pack.json";
import rawEs from "../../../content-packs/es/pack.json";
import rawFr from "../../../content-packs/fr/pack.json";
import rawDe from "../../../content-packs/de/pack.json";
import rawPt from "../../../content-packs/pt/pack.json";
import rawTr from "../../../content-packs/tr/pack.json";
import rawId from "../../../content-packs/id/pack.json";
import rawRu from "../../../content-packs/ru/pack.json";
import rawAr from "../../../content-packs/ar/pack.json";
import rawUr from "../../../content-packs/ur/pack.json";
import rawHi from "../../../content-packs/hi/pack.json";
import rawZh from "../../../content-packs/zh/pack.json";
import rawJa from "../../../content-packs/ja/pack.json";
import { validatePack, type LanguagePack } from "@shishu/content-schema";
import { db } from "./db";

// Bundled packs are compiled in (tiny, offline-certain). Community packs that a grown-up
// downloads live in IndexedDB; `loadDownloadedPacks()` registers them into this same map so
// every activity (which reads packs through getPack) can use them — not just the lane list.
export const packs: Record<string, LanguagePack> = {
  en: validatePack(rawEn),
  bn: validatePack(rawBn),
  es: validatePack(rawEs),
  fr: validatePack(rawFr),
  de: validatePack(rawDe),
  pt: validatePack(rawPt),
  tr: validatePack(rawTr),
  id: validatePack(rawId),
  ru: validatePack(rawRu),
  ar: validatePack(rawAr),
  ur: validatePack(rawUr),
  hi: validatePack(rawHi),
  zh: validatePack(rawZh),
  ja: validatePack(rawJa),
};

export const BUNDLED_CODES = Object.keys(packs);

export const LANGS = [
  { code: "en", nativeName: "English" },
  { code: "bn", nativeName: "বাংলা" },
  { code: "hi", nativeName: "हिन्दी" },
  { code: "ur", nativeName: "اردو" },
  { code: "ar", nativeName: "العربية" },
  { code: "es", nativeName: "Español" },
  { code: "fr", nativeName: "Français" },
  { code: "de", nativeName: "Deutsch" },
  { code: "pt", nativeName: "Português" },
  { code: "ru", nativeName: "Русский" },
  { code: "tr", nativeName: "Türkçe" },
  { code: "id", nativeName: "Bahasa Indonesia" },
  { code: "zh", nativeName: "中文" },
  { code: "ja", nativeName: "日本語" },
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

export function unregisterPack(code: string): void {
  if (!BUNDLED_CODES.includes(code)) delete packs[code];
}
