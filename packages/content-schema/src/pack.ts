import { z } from "zod";

export const PhonemeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  audioUrl: z.string().optional(),
});

export const LetterSchema = z.object({
  id: z.string(),
  char: z.string(),
  name: z.string(),
  sound: z.string(),
  audioUrl: z.string().optional(),
  tracePath: z.string().optional(),
});

export const NumberSchema = z.object({
  value: z.number().int().nonnegative(),
  word: z.string(),
  audioUrl: z.string().optional(),
});

export const WordSchema = z.object({
  id: z.string(),
  conceptId: z.string(),
  label: z.string(),
  audioUrl: z.string().optional(),
  image: z.string().optional(),
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
  audioUrl: z.string().optional(),
  translation: z.string().optional(),
});

export const StageActivitySchema = z.object({
  id: z.string(),
  type: z.enum([
    "color-letter", "color-number", "trace-letter", "tap-sound",
    "match-picture-word", "find-in-scene", "listen-repeat", "concept-table-review",
  ]),
  prompt: z.string(),
  itemId: z.string(),
  options: z.array(z.string()).optional(),
  audioUrl: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const LanguagePackSchema = z.object({
  code: z.string().min(2),
  name: z.string(),
  nativeName: z.string(),
  script: z.string(),
  direction: z.enum(["ltr", "rtl"]),
  phonemes: z.array(PhonemeSchema),
  letters: z.array(LetterSchema),
  numbers: z.array(NumberSchema),
  words: z.array(WordSchema),
  conceptTables: z.array(ConceptTableSchema),
  phrases: z.array(PhraseSchema),
  stages: z.object({
    toddler: z.array(StageActivitySchema),
    preschool: z.array(StageActivitySchema),
    prek: z.array(StageActivitySchema),
    k1: z.array(StageActivitySchema),
    junior: z.array(StageActivitySchema),
    tween: z.array(StageActivitySchema),
  }),
});

export type LanguagePack = z.infer<typeof LanguagePackSchema>;

export function validatePack(data: unknown): LanguagePack {
  return LanguagePackSchema.parse(data);
}
