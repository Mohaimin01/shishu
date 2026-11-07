import { packs as bundledPacks } from "./packs";
import type { LanguagePack, Phrase } from "@shishu/content-schema";
import type { Stage } from "@shishu/core";

export type ActivityType =
  | "color-letter"
  | "color-number"
  | "trace-letter"
  | "tap-sound"
  | "match-picture-word"
  | "sentence-strip"
  | "listen-repeat"
  | "concept-bridge";

export type ActivityCard = {
  key: string;      // `${type}:${itemId}`
  type: ActivityType;
  itemId: string;
  label: string;
  glyph: string;    // shown on the card
  glyphScript?: "bengali" | "latin";
};

/** Whether tap-sound is speakable for this pack (single latin letters only). */
function latinLetter(p: LanguagePack): boolean {
  return p.letters.every((l) => /^[A-Za-z]$/.test(l.char));
}

/** Word tiles for a phrase — authored where available, else the text split on spaces. */
export function tokensOf(phrase: Phrase): string[] {
  if (phrase.tokens && phrase.tokens.length > 0) return phrase.tokens;
  return phrase.text.split(/\s+/).filter(Boolean);
}

/** Board dosing: sentences grow with the child — 2 words at 3, 3 at 4, 4 at 5+. */
export function maxTokensFor(stage: Stage): number {
  switch (stage) {
    case "toddler": return 2;
    case "preschool": return 3;
    case "prek": return 3;
    case "k1": return 4;
    default: return 5;
  }
}

export function listForPack(p: LanguagePack, stage?: Stage): ActivityCard[] {
  const cards: ActivityCard[] = [];
  const script = p.script === "bengali" ? "bengali" : "latin";
  const cap = stage ? maxTokensFor(stage) : undefined;

  for (const l of p.letters) {
    cards.push({ key: `color-letter:${l.id}`, type: "color-letter", itemId: l.id, label: "color", glyph: l.char, glyphScript: script });
    cards.push({ key: `trace-letter:${l.id}`, type: "trace-letter", itemId: l.id, label: "trace", glyph: l.char, glyphScript: script });
  }
  for (const n of p.numbers) {
    cards.push({ key: `color-number:${n.value}`, type: "color-number", itemId: String(n.value), label: "color", glyph: n.char ?? String(n.value), glyphScript: script === "bengali" ? "bengali" : "latin" });
  }
  for (const w of p.words) {
    cards.push({ key: `match-picture-word:${w.id}`, type: "match-picture-word", itemId: w.id, label: "word", glyph: w.emoji ?? "☑", glyphScript: "latin" });
  }
  if (latinLetter(p)) {
    for (const l of p.letters) {
      cards.push({ key: `tap-sound:${l.id}`, type: "tap-sound", itemId: l.id, label: "hear", glyph: l.char, glyphScript: script });
    }
  }
  for (const ph of p.phrases) {
    if (cap !== undefined && tokensOf(ph).length > cap) continue;
    cards.push({
      key: `sentence-strip:${ph.id}`,
      type: "sentence-strip",
      itemId: ph.id,
      label: ph.text,
      glyph: ph.emoji ?? "🧩",
      glyphScript: "latin",
    });
  }
  for (const w of p.words) {
    cards.push({ key: `listen-repeat:${w.id}`, type: "listen-repeat", itemId: w.id, label: "say", glyph: w.emoji ?? "🗣", glyphScript: "latin" });
  }
  return cards;
}

export function listForStage(lang: string): ActivityCard[] {
  const p = bundledPacks[lang];
  if (p) return listForPack(p);
  // unknown (downloaded) lang: fall back to first bundled pack's layout
  return listForPack(bundledPacks.en);
}

export function findCard(lang: string, type: string, itemId: string): ActivityCard | undefined {
  return listForStage(lang).find((c) => c.type === type && c.itemId === itemId);
}

export function nextAfter(lang: string, card: ActivityCard): ActivityCard | undefined {
  const list = listForStage(lang);
  return list[list.findIndex((c) => c.key === card.key) + 1];
}

export const TYPE_TITLE: Record<ActivityType, string> = {
  "color-letter": "Color the letter",
  "color-number": "Color the number",
  "trace-letter": "Trace the letter",
  "tap-sound": "Tap what you hear",
  "match-picture-word": "Find the picture",
  "sentence-strip": "Build the sentence",
  "listen-repeat": "Say it together",
  "concept-bridge": "One idea, many languages",
};

// ---------- Multi-language lanes ----------

export type Lane = { code: string; pack: LanguagePack; name: string; bundled: boolean };

export function resolveBundled(code: string): LanguagePack | undefined {
  return (bundledPacks as Record<string, LanguagePack>)[code];
}

/**
 * The "Together" lane: one row per concept shared by 2+ active language packs.
 * Same idea → each home word, side by side — never corrective, always additive
 * ("one water, many names").
 */
export type BridgeCard = {
  conceptId: string;
  emoji: string;
  langs: { code: string; label: string; audioUrl?: string }[];
};

export function bridgeCards(lanes: Lane[]): BridgeCard[] {
  const map = new Map<string, BridgeCard>();
  for (const lane of lanes) {
    for (const w of lane.pack.words) {
      const row = map.get(w.conceptId) ?? { conceptId: w.conceptId, emoji: "☑", langs: [] };
      if (row.emoji === "☑" && w.emoji) row.emoji = w.emoji;
      row.langs.push({ code: lane.code, label: w.label, audioUrl: w.audioUrl });
      map.set(w.conceptId, row);
    }
  }
  return [...map.values()].filter((row) => row.langs.length >= 2);
}

/** A word from one language, plus the respectful "also called" mirrors in others. */
export function variantsOf(lanes: Lane[], conceptId: string): BridgeCard | undefined {
  return bridgeCards(lanes).find((c) => c.conceptId === conceptId);
}
