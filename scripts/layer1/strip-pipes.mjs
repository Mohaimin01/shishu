// One-off: strip all "|" parts from the Latin-script language data files.
// For languages already written in Latin letters a trailing "|..." would be parsed
// as a romanisation and pollute the story linker — these languages need no pipes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const LATIN_FILES = ["en", "es", "fr", "de", "pt", "id", "tr"];

for (const code of LATIN_FILES) {
  const file = path.join(here, `${code}.mjs`);
  const src = fs.readFileSync(file, "utf8");
  const out = src.split("\n").map((line) => {
    // entry lines look like:  key: "value",  or  "quoted-key": "value",
    const m = line.match(/^(\s*(?:"[^"]+"|[a-z][a-z0-9-]*)\s*:\s*")(.*)(",?)$/);
    if (!m) return line;
    const value = m[2];
    const cleaned = value
      .split(" ; ")
      .map((term) => term.split("|")[0].trim())
      .filter(Boolean)
      .join(" ; ");
    return `${m[1]}${cleaned}${m[3]}`;
  });
  fs.writeFileSync(file, out.join("\n"), "utf8");
  const pipes = out.join("\n").match(/\|/g)?.length ?? 0;
  console.log(`${code}.mjs: ${pipes} pipes left`);
}
