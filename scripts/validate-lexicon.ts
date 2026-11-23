// Checks every word list in content-packs/lexicon (and every Story Rows story in
// content-packs/readings) and prints what is still missing, in plain words.
import fs from "node:fs";
import path from "node:path";
import {
  detectScript, missingConcepts, parseConceptsTsv, parseLexiconTsv,
  type LexiconLanguage, type ScriptId,
} from "../packages/core/src/words";
import { isTheme } from "../packages/core/src/themes";
import { parseReadingsTsv, validateReadings } from "../packages/core/src/reading";

const dir = path.resolve(__dirname, "..", "content-packs", "lexicon");
const metas = JSON.parse(fs.readFileSync(path.join(dir, "languages.json"), "utf8")) as {
  code: string; name: string; nativeName: string; script: ScriptId; rtl?: boolean;
}[];
const { concepts, problems: cp } = parseConceptsTsv(fs.readFileSync(path.join(dir, "concepts.tsv"), "utf8"));
let failed = cp.length;
cp.forEach((p) => console.error(`concepts.tsv: ${p}`));
const ids = new Set(concepts.map((c) => c.id));

// every meaning must carry one of the nine garden themes (ThemeMap groups by it)
for (const c of concepts) {
  if (!c.theme) { console.error(`concepts.tsv: meaning "${c.id}" has no theme`); failed++; }
  else if (!isTheme(c.theme)) { console.error(`concepts.tsv: meaning "${c.id}" has unknown theme "${c.theme}"`); failed++; }
}

const langs: Record<string, LexiconLanguage> = {};
for (const m of metas) {
  const file = path.join(dir, `${m.code}.tsv`);
  if (!fs.existsSync(file)) { console.error(`FAIL ${m.code}: ${m.code}.tsv is missing`); failed++; continue; }
  const { lang, problems } = parseLexiconTsv(m, fs.readFileSync(file, "utf8"));
  langs[m.code] = lang;
  const errs = [...problems];
  for (const [id, terms] of Object.entries(lang.entries)) {
    if (!ids.has(id)) errs.push(`unknown meaning "${id}" (not in concepts.tsv)`);
    const texts = terms.map((t) => t.text);
    if (new Set(texts).size !== texts.length) errs.push(`"${id}" lists the same word twice`);
    for (const t of terms) {
      if (m.script !== "latin" && m.script !== "kana" && detectScript(t.text) !== m.script) errs.push(`"${id}": "${t.text}" is not written in ${m.script} letters`);
      if (m.script !== "latin" && !t.roman) errs.push(`"${id}": "${t.text}" needs a romanisation (text|romanisation)`);
    }
  }
  const missing = missingConcepts(concepts, lang);
  if (errs.length) { failed++; console.error(`FAIL ${m.code} (${m.name}):\n  - ${errs.join("\n  - ")}`); }
  else console.log(`OK   ${m.code.padEnd(4)} ${m.name}: ${concepts.length - missing.length}/${concepts.length} meanings${missing.length ? ` (missing: ${missing.slice(0, 5).map((c) => c.id).join(", ")}${missing.length > 5 ? "…" : ""})` : ""}`);
}

// Story Rows: every word in every story must open a real row (or a closed function word)
const readingsDir = path.resolve(__dirname, "..", "content-packs", "readings");
if (fs.existsSync(readingsDir)) {
  const files = fs.readdirSync(readingsDir).filter((f) => f.endsWith(".tsv"));
  const parsed = files.map((f) => parseReadingsTsv(fs.readFileSync(path.join(readingsDir, f), "utf8")));
  const readings = parsed.flatMap((p) => p.readings);
  for (let i = 0; i < files.length; i++) {
    parsed[i].problems.forEach((p) => console.error(`readings/${files[i]}: ${p}`));
    failed += parsed[i].problems.length;
  }
  const rp = validateReadings(readings, concepts, langs);
  failed += rp.length;
  for (const { reading, problem } of rp) console.error(`FAIL story ${reading}: ${problem}`);
  if (rp.length === 0 && parsed.every((p) => p.problems.length === 0)) {
    console.log(`OK   readings: ${readings.length} stories in ${files.length} languages, every word opens a row`);
  }
}

if (failed) process.exit(1);
console.log("all word lists and stories valid");
