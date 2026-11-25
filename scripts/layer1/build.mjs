// Layer 1 build: appends the 219 new concepts (ranks 82–300) to concepts.tsv and a word
// cell for each of them to all 14 language TSVs. Safe to re-run (no-op once applied).
//
//   node scripts/layer1/build.mjs
//
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LAYER1 } from "./concepts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lexDir = path.join(root, "content-packs", "lexicon");

const readConcepts = () =>
  fs.readFileSync(path.join(lexDir, "concepts.tsv"), "utf8").split(/\r?\n/).filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("#") && !/^rank\b/.test(t);
  });

const existing = new Set(readConcepts().map((l) => l.split("\t")[1]));
if (LAYER1.some((c) => existing.has(c.id))) {
  console.log("layer1 already applied — nothing to do");
  process.exit(0);
}

const lines = readConcepts();
const maxRank = lines.reduce((m, l) => Math.max(m, Number(l.split("\t")[0]) || 0), 0);
console.log(`existing concepts: ${lines.length}, max rank ${maxRank}`);

if (LAYER1.length !== 219) {
  console.error(`expected 219 layer-1 concepts, got ${LAYER1.length}`);
  process.exit(1);
}
const ids = new Set(LAYER1.map((c) => c.id));
if (ids.size !== LAYER1.length) {
  console.error("duplicate ids inside LAYER1");
  process.exit(1);
}
for (const l of lines) {
  const id = l.split("\t")[1];
  if (ids.has(id)) {
    console.error(`concept "${id}" already exists`);
    process.exit(1);
  }
}

// ---- append concepts.tsv ----
const conceptRows = LAYER1.map((c, i) => `${maxRank + 1 + i}\t${c.id}\t${c.pos}\t${c.gloss}\t${c.theme}`);
const conceptFile = path.join(lexDir, "concepts.tsv");
const conceptText = fs.readFileSync(conceptFile, "utf8");
fs.writeFileSync(conceptFile, conceptText.replace(/\n*$/, "\n") + conceptRows.join("\n") + "\n", "utf8");
console.log(`concepts.tsv: +${conceptRows.length} rows (ranks ${maxRank + 1}–${maxRank + LAYER1.length})`);

// ---- append each language ----
const LANGS = ["en", "bn", "hi", "ur", "ar", "es", "fr", "de", "pt", "ru", "tr", "id", "zh", "ja"];
const ROMAN_REQUIRED = new Set(["bn", "hi", "ur", "ar", "ru", "zh", "ja"]); // non-latin scripts

for (const code of LANGS) {
  const words = (await import(`./${code}.mjs`)).default;
  const missing = LAYER1.filter((c) => !words[c.id] || !words[c.id].trim());
  if (missing.length) {
    console.error(`FAIL ${code}: ${missing.length} concepts have no word: ${missing.map((c) => c.id).slice(0, 10).join(", ")}…`);
    process.exit(1);
  }
  // sanity: term syntax — every term of a script language must carry a romanisation
  if (ROMAN_REQUIRED.has(code)) {
    const bad = [];
    for (const c of LAYER1) {
      for (const term of words[c.id].split(" ; ")) {
        const parts = term.split("|").map((p) => p.trim());
        if (!parts[0] || !parts[1]) bad.push(`${c.id}: "${term}"`);
      }
    }
    if (bad.length) {
      console.error(`FAIL ${code} romanisation: ${bad.slice(0, 12).join(" ; ")}`);
      process.exit(1);
    }
  }
  const rows = LAYER1.map((c) => `${c.id}\t${words[c.id]}`);
  const file = path.join(lexDir, `${code}.tsv`);
  const text = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, text.replace(/\n*$/, "\n") + rows.join("\n") + "\n", "utf8");
  console.log(`${code}.tsv: +${rows.length} rows`);
}

console.log("layer 1 written: 300 concepts across 14 languages");
