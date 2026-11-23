// Garden badges — quiet celebrations of showing up (board verdict: celebration, never pressure).
// A badge is a visitor to the garden: it arrives once, stays forever, and never expires.
// Pure evaluation lives here so it is unit-tested and reusable by the app and by future packs.

export type BadgeId = "streak-7" | "rows-50" | "row-5-langs" | "all-langs" | "welcome-back";

export type BadgeDef = {
  id: BadgeId;
  emoji: string;
  name: string;
  /** one plain sentence a 6-year-old understands */
  description: string;
};

export const BADGES: BadgeDef[] = [
  { id: "streak-7", emoji: "🦋", name: "Butterfly", description: "came back 7 days in a row" },
  { id: "rows-50", emoji: "🐝", name: "Busy bee", description: "learned 50 rows of words" },
  { id: "row-5-langs", emoji: "🐦", name: "Little bird", description: "learned one meaning that spans 5 languages" },
  { id: "all-langs", emoji: "🌈", name: "Rainbow", description: "learned a word in every chosen language" },
  { id: "welcome-back", emoji: "✨", name: "Welcome back", description: "returned after a week away — the garden kept growing" },
];

export function badgeById(id: BadgeId): BadgeDef {
  const hit = BADGES.find((b) => b.id === id);
  if (!hit) throw new Error(`unknown badge ${id}`);
  return hit;
}

/** Everything the badge check needs, already gathered from the learner's device. */
export type BadgeStats = {
  bestStreak: number;
  /** concept rows the learner marked as learned */
  rowsLearned: number;
  /** for the widest single learned row: how many chosen languages have a word for it */
  widestRowLangs: number;
  /** how many chosen languages actually have words in the table (a language with no rows yet can't count against the learner) */
  langsSelected: number;
  /** how many of those languages have at least one learned word */
  langsLearned: number;
  /** full days missed before today's return (0 = no gap) */
  gapDays: number;
};

/** Every badge this learner has earned right now (stable order). */
export function earnedBadges(s: BadgeStats): BadgeId[] {
  const out: BadgeId[] = [];
  if (s.bestStreak >= 7) out.push("streak-7");
  if (s.rowsLearned >= 50) out.push("rows-50");
  if (s.widestRowLangs >= 5) out.push("row-5-langs");
  if (s.langsSelected > 0 && s.langsLearned >= s.langsSelected) out.push("all-langs");
  if (s.gapDays >= 7) out.push("welcome-back");
  return out;
}
