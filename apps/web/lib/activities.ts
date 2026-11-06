import { packs } from "./packs";

export type ActivityType =
  | "color-letter"
  | "color-number"
  | "trace-letter"
  | "tap-sound"
  | "match-picture-word";

export type ActivityCard = {
  key: string;      // `${type}:${itemId}`
  type: ActivityType;
  itemId: string;
  label: string;
  glyph: string;    // shown on the card
  glyphScript?: "bengali" | "latin";
};

export function listForStage(lang: string): ActivityCard[] {
  const p = packs[lang] ?? packs.en;
  const cards: ActivityCard[] = [];

  for (const l of p.letters) {
    cards.push({
      key: `color-letter:${l.id}`, type: "color-letter", itemId: l.id,
      label: "color", glyph: l.char,
      glyphScript: p.script === "bengali" ? "bengali" : "latin",
    });
    cards.push({
      key: `trace-letter:${l.id}`, type: "trace-letter", itemId: l.id,
      label: "trace", glyph: l.char,
      glyphScript: p.script === "bengali" ? "bengali" : "latin",
    });
  }
  for (const n of p.numbers) {
    cards.push({
      key: `color-number:${n.value}`, type: "color-number", itemId: String(n.value),
      label: "color", glyph: n.char ?? String(n.value), glyphScript: "latin",
    });
  }
  for (const w of p.words) {
    cards.push({
      key: `match-picture-word:${w.id}`, type: "match-picture-word", itemId: w.id,
      label: "word", glyph: w.emoji ?? "☑", glyphScript: "latin",
    });
  }
  if (lang === "en") {
    for (const l of p.letters) {
      cards.push({
        key: `tap-sound:${l.id}`, type: "tap-sound", itemId: l.id,
        label: "hear", glyph: l.char, glyphScript: "latin",
      });
    }
  }
  return cards;
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
};
