// Validates every story in stories.mjs against the real lexicon and, only if ALL are
// honest, appends them to content-packs/readings/{lang}.tsv (tab-separated, like the
// existing rows). Refuses to write anything when a single story has a problem.
//
//   npx tsx scripts/layer1/add-stories.ts
import fs from "node:fs";
import path from "node:path";
import { parseConceptsTsv, parseLexiconTsv, type LexiconLanguage, type ScriptId } from "../../packages/core/src/words";
import { validateReading, type Reading } from "../../packages/core/src/reading";
import { STORIES } from "./stories.mjs";

const root = path.resolve(__dirname, "..", "..");
const lexDir = path.join(root, "content-packs", "lexicon");
const readingsDir = path.join(root, "content-packs", "readings");

const metas = JSON.parse(fs.readFileSync(path.join(lexDir, "languages.json"), "utf8")) as {
  code: string; name: string; nativeName: string; script: ScriptId;
}[];
const { concepts } = parseConceptsTsv(fs.readFileSync(path.join(lexDir, "concepts.tsv"), "utf8"));
const langs: Record<string, LexiconLanguage> = {};
for (const m of metas) {
  langs[m.code] = parseLexiconTsv(m, fs.readFileSync(path.join(lexDir, `${m.code}.tsv`), "utf8")).lang;
}

let bad = 0;
for (const s of STORIES) {
  const reading: Reading = { id: s.id, lang: s.lang, level: s.level, title: s.title, concepts: s.concepts, text: s.text };
  const problems = validateReading(reading, concepts, langs[s.lang]);
  if (problems.length) {
    bad++;
    console.error(`FAIL ${s.id}:`);
    problems.forEach((p) => console.error(`   - ${p.problem}`));
  }
}
if (bad) {
  console.error(`${bad} of ${STORIES.length} stories have problems — nothing written`);
  process.exit(1);
}

// append, grouped per language file, preserving tabs
const byLang = new Map<string, typeof STORIES>();
for (const s of STORIES) byLang.set(s.lang, [...(byLang.get(s.lang) ?? []), s]);
for (const [lang, list] of byLang) {
  const file = path.join(readingsDir, `${lang}.tsv`);
  const text = fs.readFileSync(file, "utf8");
  const rows = list.map((s) => [s.id, s.lang, String(s.level), s.title, s.concepts.join(","), s.text].join("\t"));
  fs.writeFileSync(file, text.replace(/\n*$/, "\n") + rows.join("\n") + "\n", "utf8");
  console.log(`${lang}.tsv: +${rows.length} stories`);
}
console.log(`${STORIES.length} stories validated and written`);
