import rawEn from "../../../content-packs/en/pack.json";
import rawBn from "../../../content-packs/bn/pack.json";
import { validatePack, type LanguagePack } from "@shishu/content-schema";

// Packs are bundled at build time for M1 (few, tiny, offline-certain).
// Later: fetched from /packs/{code}/pack.json so community packs don't require app rebuilds.
export const packs: Record<string, LanguagePack> = {
  en: validatePack(rawEn),
  bn: validatePack(rawBn),
};

export const LANGS = [
  { code: "en", nativeName: "English" },
  { code: "bn", nativeName: "বাংলা" },
];

export function getPack(code: string): LanguagePack {
  return packs[code] ?? packs.en;
}

export function langName(code: string): string {
  return LANGS.find((l) => l.code === code)?.nativeName ?? code;
}
