// Appends |bengali=… to every term of the 219 new English rows in en.tsv, using the
// EN_BN table. Idempotent: terms that already carry a script= spelling are left alone.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LAYER1 } from "./concepts.mjs";
import { EN_BN } from "./en-bengali.mjs";

const file = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".."),
  "content-packs", "lexicon", "en.tsv",
);
const lines = fs.readFileSync(file, "utf8").split("\n");
const newIds = new Set(LAYER1.map((c) => c.id));
let patched = 0, missed = [];
const out = lines.map((line) => {
  const t = line.trim();
  if (!t || t.startsWith("#")) return line;
  const parts = line.split("\t");
  const id = parts[0];
  if (!newIds.has(id) || parts.length < 2) return line;
  parts[1] = parts[1].split(" ; ").map((term) => {
    const bare = term.trim();
    if (bare.includes("=")) return term; // already has a script= spelling
    const bn = EN_BN[bare.toLowerCase()];
    if (!bn) { missed.push(bare); return term; }
    patched++;
    return `${bare}|bengali=${bn}`;
  }).join(" ; ");
  return parts.join("\t");
});
fs.writeFileSync(file, out.join("\n"), "utf8");
console.log(`patched ${patched} English terms with Bengali-letter spellings`);
if (missed.length) { console.error("MISSING:", missed.join(", ")); process.exit(1); }
