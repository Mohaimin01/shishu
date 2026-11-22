import { z } from "zod";

export const PhonemeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  audioUrl: z.string().optional(),
});

export const LetterSchema = z.object({
  id: z.string(),
  char: z.string(),
  /** what the letter is called — device TTS speaks this (falls back to the character) */
  name: z.string().optional(),
  /** not used by the app yet (kept for future recorded audio); optional so first packs stay tiny */
  sound: z.string().optional(),
  audioUrl: z.string().optional(),
  tracePath: z.string().optional(),
});

export const NumberSchema = z.object({
  value: z.number().int().nonnegative(),
  char: z.string().optional(), // digit glyph in the pack's script; falls back to value
  /** the number said aloud — optional; device TTS reads the value when missing */
  word: z.string().optional(),
  audioUrl: z.string().optional(),
});

export const WordSchema = z.object({
  id: z.string(),
  conceptId: z.string(),
  label: z.string(),
  audioUrl: z.string().optional(),
  image: z.string().optional(),
  emoji: z.string().optional(), // M1 placeholder visual until illustrations exist
});

export const VariantSchema = z.object({
  lang: z.string(),
  label: z.string(),
  region: z.string().optional(),
  audioUrl: z.string().optional(),
  contextSentence: z.string().optional(),
});

export const ConceptTableSchema = z.object({
  conceptId: z.string(),
  image: z.string().optional(),
  audioUrl: z.string().optional(),
  variants: z.array(VariantSchema).min(1),
});

export const PhraseSchema = z.object({
  id: z.string(),
  text: z.string(),
  /** Optional explicit word tiles for "build the sentence" — falls back to text split on spaces. */
  tokens: z.array(z.string().min(1)).min(1).max(6).optional(),
  audioUrl: z.string().optional(),
  translation: z.string().optional(),
  emoji: z.string().optional(), // single-subject scene hint, per PACKS.md emoji standards
});

export const StageActivitySchema = z.object({
  id: z.string(),
  type: z.enum([
    "color-letter", "color-number", "trace-letter", "tap-sound",
    "match-picture-word", "sentence-strip", "find-in-scene", "listen-repeat", "concept-table-review",
  ]),
  prompt: z.string(),
  itemId: z.string(),
  options: z.array(z.string()).optional(),
  audioUrl: z.string().optional(),
  imageUrl: z.string().optional(),
});

// Everything except the identity fields is optional-with-default, so a first contribution can be
// tiny (code, names, a handful of letters and words) — docs/PACKS.md promises `"stages": {}` is fine.
const stageList = z.array(StageActivitySchema).default([]);

export const LanguagePackSchema = z.object({
  code: z.string().min(2, "code must be at least 2 letters, e.g. \"es\""),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  script: z.string().min(1).default("latin"),
  direction: z.enum(["ltr", "rtl"]).default("ltr"),
  phonemes: z.array(PhonemeSchema).default([]),
  letters: z.array(LetterSchema).default([]),
  numbers: z.array(NumberSchema).default([]),
  words: z.array(WordSchema).default([]),
  conceptTables: z.array(ConceptTableSchema).default([]),
  phrases: z.array(PhraseSchema).default([]),
  stages: z
    .object({
      toddler: stageList,
      preschool: stageList,
      prek: stageList,
      k1: stageList,
      junior: stageList,
      tween: stageList,
    })
    .default({}),
});

export type LanguagePack = z.infer<typeof LanguagePackSchema>;
export type Letter = z.infer<typeof LetterSchema>;
export type WordItem = z.infer<typeof WordSchema>;
export type NumberItem = z.infer<typeof NumberSchema>;
export type ConceptTable = z.infer<typeof ConceptTableSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type Phrase = z.infer<typeof PhraseSchema>;
export type StageActivity = z.infer<typeof StageActivitySchema>;

export function validatePack(data: unknown): LanguagePack {
  const r = LanguagePackSchema.safeParse(data);
  if (r.success) return r.data;
  throw new Error(describeIssues(r.error));
}

/** Human-readable zod issues: "words[2].label: Required" — one per line. */
export function describeIssues(err: z.ZodError): string {
  return err.issues
    .map((i) => {
      const where = i.path.length
        ? i.path.map((p, n) => (typeof p === "number" ? `[${p}]` : n === 0 ? p : `.${p}`)).join("")
        : "(pack)";
      return `${where}: ${i.message}`;
    })
    .join("\n");
}

/**
 * Friendly, non-fatal advice for contributors (the pack is valid but could be better).
 * Never throws; CI prints these as warnings.
 */
export function lintPack(pack: LanguagePack): string[] {
  const out: string[] = [];
  const dupes = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) out.push(`duplicate ${label} id "${id}"`);
      seen.add(id);
    }
  };
  dupes("letter", pack.letters.map((l) => l.id));
  dupes("word", pack.words.map((w) => w.id));
  dupes("phrase", pack.phrases.map((p) => p.id));
  const concepts = new Set(pack.words.map((w) => w.conceptId));
  for (const t of pack.conceptTables) {
    if (!concepts.has(t.conceptId)) {
      out.push(`conceptTable "${t.conceptId}" has no matching word with that conceptId`);
    }
  }
  for (const w of pack.words) {
    if (!w.emoji && !w.image) out.push(`word "${w.id}" has no emoji/image (children match words to pictures)`);
  }
  for (const l of pack.letters) {
    if ([...l.char].length > 2) out.push(`letter "${l.id}" is ${[...l.char].length} characters — use one letter per card`);
  }
  if (pack.letters.length === 0) out.push("no letters yet — the colour/trace activities need at least a few");
  if (pack.words.length < 5) out.push("fewer than 5 words — aim for 5–20 everyday words to start");
  return out;
}
