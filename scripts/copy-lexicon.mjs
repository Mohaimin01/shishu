// Copies the community-editable word lists (content-packs/lexicon) into the web app's public
// folder so they are served — and cached offline — as plain static files. No build tooling needed
// to contribute: edit a .tsv, open a pull request.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "content-packs", "lexicon");
const to = path.join(root, "apps", "web", "public", "lexicon");

fs.rmSync(to, { recursive: true, force: true });
fs.mkdirSync(to, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(from)) {
  if (/\.(tsv|json)$/.test(f)) {
    fs.copyFileSync(path.join(from, f), path.join(to, f));
    n++;
  }
}
console.log(`lexicon: copied ${n} files -> apps/web/public/lexicon`);
