// Copies the community-editable word lists (content-packs/lexicon) and the Story Rows
// stories (content-packs/readings) into the web app's public folder so they are served —
// and cached offline — as plain static files. No build tooling needed to contribute: edit
// a .tsv, open a pull request.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const copyDir = (fromRel, toRel, pattern) => {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  if (!fs.existsSync(from)) return n;
  for (const f of fs.readdirSync(from)) {
    if (pattern.test(f)) {
      fs.copyFileSync(path.join(from, f), path.join(to, f));
      n++;
    }
  }
  return n;
};

const n = copyDir("content-packs/lexicon", "apps/web/public/lexicon", /\.(tsv|json)$/);
console.log(`lexicon: copied ${n} files -> apps/web/public/lexicon`);

const r = copyDir("content-packs/readings", "apps/web/public/readings", /\.tsv$/);
// the manifest tells the app which story files exist (a new story language needs no code change)
fs.writeFileSync(
  path.join(root, "apps", "web", "public", "readings", "manifest.json"),
  JSON.stringify({ files: fs.readdirSync(path.join(root, "apps", "web", "public", "readings")).filter((f) => f.endsWith(".tsv")).sort() }, null, 2),
);
console.log(`readings: copied ${r} files + manifest -> apps/web/public/readings`);
