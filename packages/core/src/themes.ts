/**
 * Garden-map themes — the nine fixed buckets every Word Rows meaning belongs to.
 * The theme column in content-packs/lexicon/concepts.tsv is validated against this list,
 * and the "Garden map" tab clusters the learner's words by it.
 */

export type ThemeId =
  | "people" | "courtesy" | "questions" | "actions" | "school"
  | "food" | "describing" | "numbers" | "world";

export type ThemeDef = { id: ThemeId; emoji: string; name: string };

export const THEMES: ThemeDef[] = [
  { id: "people", emoji: "👥", name: "People & family" },
  { id: "courtesy", emoji: "👋", name: "Kind words" },
  { id: "questions", emoji: "❓", name: "Questions" },
  { id: "actions", emoji: "🏃", name: "Doing words" },
  { id: "school", emoji: "📚", name: "School & books" },
  { id: "food", emoji: "🍎", name: "Food & drink" },
  { id: "describing", emoji: "🎨", name: "Describing words" },
  { id: "numbers", emoji: "🔢", name: "Numbers" },
  { id: "world", emoji: "🌍", name: "The world around" },
];

const SET = new Set(THEMES.map((t) => t.id));

export function isTheme(v: string): v is ThemeId {
  return SET.has(v as ThemeId);
}

export function themeById(id: string): ThemeDef | undefined {
  return THEMES.find((t) => t.id === id);
}
