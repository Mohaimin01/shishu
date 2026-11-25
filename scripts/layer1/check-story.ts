// Authoring helper: check a draft Story Rows story against the lexicon before it is
// appended to the TSV. Prints unknown words, cap violations, and the exact concepts
// column the story must declare.
//
//   npx tsx scripts/layer1/check-story.mjs <lang> <level> "<title>" "<text>"
import fs from "node:fs";
import path from "node:path";
import { parseConceptsTsv, parseLexiconTsv, type LexiconLanguage, type ScriptId } from "../../packages/core/src/words";
import { LEVEL_RANK_CAP, linkTokens, type ReadingLevel } from "../../packages/core/src/reading";

const lexDir = path.resolve(__dirname, "..", "..", "content-packs", "lexicon");
const metas = JSON.parse(fs.readFileSync(path.join(lexDir, "languages.json"), "utf8")) as {
  code: string; name: string; nativeName: string; script: ScriptId;
}[];
const meta = metas.find((m) => m.code === process.argv[2]);
if (!meta) { console.error("unknown lang code"); process.exit(1); }
const level = Number(process.argv[3]) as ReadingLevel;
const title = process.argv[4] ?? "";
const text = process.argv[5] ?? "";

const { concepts } = parseConceptsTsv(fs.readFileSync(path.join(lexDir, "concepts.tsv"), "utf8"));
const lang: LexiconLanguage = parseLexiconTsv(meta, fs.readFileSync(path.join(lexDir, `${meta.code}.tsv`), "utf8")).lang;
const cap = LEVEL_RANK_CAP[level];

const tokens = [...linkTokens(title, lang, concepts), ...linkTokens(text, lang, concepts)];
const unknown = tokens.filter((t) => t.word && !t.conceptId && !t.function);
const overCap = tokens.filter((t) => t.conceptId && (concepts.find((c) => c.id === t.conceptId)?.rank ?? 0) > cap);
const used = [...new Set(tokens.flatMap((t) => (t.conceptId ? [t.conceptId] : [])))];

console.log("unknown words:", unknown.map((t) => t.word).join(", ") || "(none)");
console.log("above cap:", overCap.map((t) => `${t.word}→${t.conceptId}`).join(", ") || "(none)");
console.log("concepts column:", used.join(","));
