// Checks every word list in content-packs/lexicon and prints what is still missing, in plain words.
import fs from "node:fs";
import path from "node:path";
import { detectScript, missingConcepts, parseConceptsTsv, parseLexiconTsv, type ScriptId } from "../packages/core/src/words";

const dir = path.resolve(__dirname, "..", "content-packs", "lexicon");
const metas = JSON.parse(fs.readFileSync(path.join(dir, "languages.json"), "utf8")) as {
  code: string; name: string; nativeName: string; script: ScriptId; rtl?: boolean;
}[];
const { concepts, problems: cp } = parseConceptsTsv(fs.readFileSync(path.join(dir, "concepts.tsv"), "utf8"));
let failed = cp.length;
cp.forEach((p) => console.error(`concepts.tsv: ${p}`));
const ids = new Set(concepts.map((c) => c.id));

for (const m of metas) {
  const file = path.join(dir, `${m.code}.tsv`);
  if (!fs.existsSync(file)) { console.error(`FAIL ${m.code}: ${m.code}.tsv is missing`); failed++; continue; }
  const { lang, problems } = parseLexiconTsv(m, fs.readFileSync(file, "utf8"));
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
if (failed) process.exit(1);
console.log("all word lists valid");
