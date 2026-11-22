// Scaffolds a children's language pack:  npm run new:pack -- sw "Swahili" "Kiswahili" latin
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [code, name, nativeName, script = "latin"] = process.argv.slice(2);
if (!code || !name || !nativeName) {
  console.log('Usage: npm run new:pack -- <code> "<English name>" "<Native name>" [script]\nExample: npm run new:pack -- sw "Swahili" "Kiswahili" latin');
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "content-packs", code);
if (fs.existsSync(dir)) { console.error(`content-packs/${code} already exists`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const pack = {
  code, name, nativeName, script, direction: ["arabic", "hebrew"].includes(script) ? "rtl" : "ltr",
  letters: [{ id: `${code}-1`, char: "A", name: "A", sound: "ah" }],
  numbers: [{ value: 1, char: "1", word: "one" }],
  words: [
    { id: `${code}-w-water`, conceptId: "water", label: "water", emoji: "💧" },
    { id: `${code}-w-mother`, conceptId: "mother", label: "mother", emoji: "👩" },
    { id: `${code}-w-sun`, conceptId: "sun", label: "sun", emoji: "☀️" },
  ],
  phrases: [{ id: `${code}-p1`, text: "Water, please", tokens: ["Water", "please"], emoji: "💧", translation: "" }],
};
fs.writeFileSync(path.join(dir, "pack.json"), JSON.stringify(pack, null, 2) + "\n");
console.log(`Created content-packs/${code}/pack.json — replace the examples with your language, then run: npm run validate:content`);
