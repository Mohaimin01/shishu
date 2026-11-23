import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  buildRows, cellText, columnOrder, detectScript, devanagariToBengali, bengaliToDevanagari, formFor,
  pageGroups, parseConceptsTsv, parseLexiconTsv, parseTerm, rowText, rowsToTsv, rowsToCsv, rowsToAnkiCsv,
  templateTsv, perDayFor,
  type LexiconLanguage, type ScriptId, SCRIPT_LABEL,
} from "./words";
import { THEMES } from "./themes";

const dir = path.resolve(__dirname, "..", "..", "..", "content-packs", "lexicon");
const metas = JSON.parse(fs.readFileSync(path.join(dir, "languages.json"), "utf8")) as {
  code: string; name: string; nativeName: string; script: ScriptId; rtl?: boolean;
}[];
const { concepts, problems: conceptProblems } = parseConceptsTsv(fs.readFileSync(path.join(dir, "concepts.tsv"), "utf8"));
const langs: Record<string, LexiconLanguage> = {};
const langProblems: string[] = [];
for (const m of metas) {
  const { lang, problems } = parseLexiconTsv(m, fs.readFileSync(path.join(dir, `${m.code}.tsv`), "utf8"));
  langs[m.code] = lang;
  langProblems.push(...problems.map((p) => `${m.code}: ${p}`));
}

describe("scripts", () => {
  it("detects scripts", () => {
    expect(detectScript("পানি")).toBe("bengali");
    expect(detectScript("पानी")).toBe("devanagari");
    expect(detectScript("water")).toBe("latin");
    expect(detectScript("ماء")).toBe("arabic");
    expect(detectScript("вода")).toBe("cyrillic");
    expect(detectScript("水")).toBe("han");
  });

  it("converts Hindi letters to Bengali letters and back", () => {
    expect(devanagariToBengali("जल")).toBe("জল");
    expect(devanagariToBengali("पानी")).toBe("পানী");
    expect(devanagariToBengali("नमस्ते")).toBe("নমস্তে");
    expect(devanagariToBengali("वह")).toBe("বহ");
    expect(bengaliToDevanagari("জল")).toBe("जल");
    expect(bengaliToDevanagari("নমস্তে")).toBe("नमस्ते");
  });

  it("parses a term line", () => {
    expect(parseTerm("জল|jol|formal")).toEqual({ text: "জল", roman: "jol", tag: "formal" });
    expect(parseTerm("water|bengali=ওয়াটার")).toEqual({ text: "water", alt: { bengali: "ওয়াটার" } });
    expect(parseTerm("  ")).toBeNull();
  });
});

describe("the learner's own example: Bengali speaker learning English + Hindi", () => {
  const base = { native: "bn", targets: ["en", "hi"] };
  const water = (readable: ScriptId[], extra = {}) =>
    buildRows(concepts, langs, { ...base, readable, ...extra }).find((r) => r.concept.id === "water")!;

  it("native language is the first column, then the chosen languages in order", () => {
    expect(water(["bengali"]).cells.map((c) => c.langCode)).toEqual(["bn", "en", "hi"]);
  });

  it("keeps every synonym of a meaning together, most used first", () => {
    expect(cellText(water(["bengali", "latin"]).cells[0])).toBe("পানি, বারি, জল");
  });

  it("reads Bengali letters only: পানি, ওয়াটার, জল-style row", () => {
    const row = water(["bengali"]);
    expect(row.cells[0].forms.map((f) => f.text)).toEqual(["পানি", "বারি", "জল"]);
    expect(row.cells[1].forms.map((f) => f.text)).toEqual(["ওয়াটার"]);
    expect(row.cells[2].forms.map((f) => f.text)).toEqual(["পানী", "জল"]);
  });

  it("reads English letters only: pani, water, paani", () => {
    const row = water(["latin"]);
    expect(row.cells.map((c) => c.forms[0].text)).toEqual(["pani", "water", "paani"]);
  });

  it("reads Bengali + English letters but not Hindi: only the Hindi column changes script", () => {
    const row = water(["bengali", "latin"]);
    expect(row.cells[0].forms[0].text).toBe("পানি"); // native, untouched
    expect(row.cells[1].forms[0].text).toBe("water"); // English letters are readable: English stays English
    expect(row.cells[2].forms[0].text).toBe("পানী"); // Hindi shown in the learner's first-choice letters (Bengali)
    const eng = water(["latin", "bengali"]);
    expect(eng.cells[2].forms[0].text).toBe("paani"); // prefers English letters instead
    expect(eng.cells[0].forms[0].text).toBe("পানি"); // Bengali is still readable, so native stays
  });

  it("always shows something readable even when no spelling exists in the learner's scripts", () => {
    const f = formFor({ text: "ماء", roman: "maa'" }, "arabic", ["bengali"]);
    expect(f.text).toBe("maa'");
    expect(f.kind).toBe("fallback");
  });
});

describe("an English speaker learning Bengali + Hindi", () => {
  it("ENGLISH first, then BENGALI, then HINDI, all in English letters", () => {
    const rows = buildRows(concepts, langs, { native: "en", targets: ["bn", "hi"], readable: ["latin"] });
    const water = rows.find((r) => r.concept.id === "water")!;
    expect(water.cells.map((c) => c.langCode)).toEqual(["en", "bn", "hi"]);
    expect(rowText(water)).toBe("water / (pani, bari, jol) / (paani, jal)");
  });
});

describe("ordering, limits and printing", () => {
  it("rows run from the most used meaning to the least used", () => {
    const rows = buildRows(concepts, langs, { native: "en", targets: ["es"], readable: ["latin"] });
    expect(rows.map((r) => r.concept.rank)).toEqual([...rows.map((r) => r.concept.rank)].sort((a, b) => a - b));
    expect(rows[0].concept.id).toBe("i");
    expect(rows[1].concept.id).toBe("you");
  });

  it("window, skip-known and synonym limit work", () => {
    const o = { native: "bn", targets: ["en"], readable: ["bengali"] as ScriptId[] };
    expect(buildRows(concepts, langs, { ...o, limit: 5 })).toHaveLength(5);
    expect(buildRows(concepts, langs, { ...o, offset: 5, limit: 5 })[0].concept.rank).toBe(6);
    expect(buildRows(concepts, langs, { ...o, skip: new Set(["i"]), limit: 1 })[0].concept.id).toBe("you");
    const you = buildRows(concepts, langs, { ...o, maxSynonyms: 1 }).find((r) => r.concept.id === "you")!;
    expect(you.cells[0].forms).toHaveLength(1);
  });

  it("native repeated in targets is not duplicated", () => {
    expect(columnOrder("bn", ["en", "bn", "hi", "en"])).toEqual(["bn", "en", "hi"]);
  });

  it("20 languages print as pages that each repeat the native column", () => {
    const cols = ["bn", ...Array.from({ length: 19 }, (_, i) => `l${i}`)];
    const pages = pageGroups(cols, 4);
    expect(pages.every((p) => p[0] === "bn" && p.length <= 4)).toBe(true);
    expect(pages.flat().filter((c) => c !== "bn").sort()).toEqual(cols.slice(1).sort());
    expect(pages).toHaveLength(7);
  });

  it("plans a month: 81 rows in 30 days", () => {
    expect(perDayFor(81, 30)).toBe(3);
    expect(perDayFor(0, 30)).toBe(1);
  });

  it("exports to TSV for a spreadsheet", () => {
    const rows = buildRows(concepts, langs, { native: "en", targets: ["bn"], readable: ["latin"], limit: 2 });
    const tsv = rowsToTsv(rows, { en: "English", bn: "Bengali" });
    expect(tsv.split("\n")[0]).toBe("#\tmeaning\tEnglish\tBengali");
    expect(tsv.split("\n")).toHaveLength(3);
  });
});

describe("contributing a new language", () => {
  it("the downloadable template round-trips through the parser", () => {
    const tpl = templateTsv(concepts, langs.en);
    expect(tpl).toContain("concept\tmeaning\twords");
    const filled = tpl.replace(/^water\t(.*)\t$/m, "water\t$1\tlabu|labu ; dlo|dlo|slang");
    const { lang, problems } = parseLexiconTsv({ code: "xx", name: "Test", nativeName: "Test", script: "latin" }, filled);
    expect(problems).toEqual([]);
    expect(lang.entries.water.map((t) => t.text)).toEqual(["labu", "dlo"]);
    expect(Object.keys(lang.entries)).toEqual(["water"]); // untouched lines stay untranslated
  });

  it("reports a bad concept id with its line number", () => {
    const { problems } = parseLexiconTsv({ code: "xx", name: "x", nativeName: "x", script: "latin" }, "Water!\tx");
    expect(problems[0]).toMatch(/line 1/);
  });

  it("csv quotes commas and quotes", () => {
    const rows = buildRows(concepts, langs, { native: "en", targets: ["fr"], readable: ["latin"], limit: 1 });
    expect(rowsToCsv(rows, { en: "English", fr: "French" }).split("\r\n")[1]).toBe("1,I (me),I,je ; moi");
  });
});

describe("shipped lexicon data", () => {
  it("concept list is clean and ordered", () => {
    expect(conceptProblems).toEqual([]);
    expect(concepts.length).toBeGreaterThanOrEqual(80);
    const ranks = concepts.map((c) => c.rank);
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it("every language file parses with no problems", () => {
    expect(langProblems).toEqual([]);
  });

  it("every entry belongs to a known concept, and each language is (nearly) complete", () => {
    const ids = new Set(concepts.map((c) => c.id));
    for (const m of metas) {
      const lang = langs[m.code];
      for (const id of Object.keys(lang.entries)) expect(ids.has(id), `${m.code}: unknown concept ${id}`).toBe(true);
      expect(Object.keys(lang.entries).length, m.code).toBe(concepts.length);
    }
  });

  it("script-tagged languages really use their declared script", () => {
    for (const m of metas) {
      if (m.script === "latin" || m.script === "kana") continue;
      for (const [id, terms] of Object.entries(langs[m.code].entries)) {
        for (const t of terms) {
          expect(detectScript(t.text), `${m.code}/${id}: ${t.text}`).toBe(m.script);
          expect(t.roman, `${m.code}/${id}: ${t.text} needs a romanisation`).toBeTruthy();
        }
      }
    }
  });

  it("alt spellings only use known script ids and real script letters", () => {
    for (const m of metas) for (const [id, terms] of Object.entries(langs[m.code].entries)) {
      for (const t of terms) for (const [s, v] of Object.entries(t.alt ?? {})) {
        expect(s in SCRIPT_LABEL, `${m.code}/${id}: ${s}`).toBe(true);
        expect(detectScript(v!), `${m.code}/${id}: ${v}`).toBe(s);
      }
    }
  });

  it("every English word has a Bengali-letter spelling (the first learner's need)", () => {
    for (const [id, terms] of Object.entries(langs.en.entries)) {
      for (const t of terms) expect(t.alt?.bengali, `en/${id}: ${t.text}`).toBeTruthy();
    }
  });

  it("no duplicated words inside one cell", () => {
    for (const m of metas) for (const [id, terms] of Object.entries(langs[m.code].entries)) {
      const texts = terms.map((t) => t.text);
      expect(new Set(texts).size, `${m.code}/${id}`).toBe(texts.length);
    }
  });
});

describe("themes", () => {
  it("every shipped concept carries one of the nine garden themes", () => {
    for (const c of concepts) {
      expect(c.theme, `${c.id} has no theme`).toBeTruthy();
      expect(THEMES.some((t) => t.id === c.theme), `${c.id}: unknown theme ${c.theme}`).toBe(true);
    }
  });

  it("a concept without a theme still parses (theme is optional in the TSV)", () => {
    const { concepts: cs, problems } = parseConceptsTsv("rank\tid\tpos\tgloss\n1\twater\tnoun\twater");
    expect(problems).toEqual([]);
    expect(cs[0].theme).toBeUndefined();
  });
});

describe("rowsToAnkiCsv", () => {
  const rows = buildRows(concepts, langs, { native: "bn", targets: ["en"], readable: ["bengali", "latin"] });
  const names = { bn: "বাংলা", en: "English" };

  it("front is the learner's own language, back the others with the English meaning", () => {
    const csv = rowsToAnkiCsv(rows, "bn", names);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Front,Back");
    expect(lines.find((l) => l.startsWith('"পানি, বারি, জল"'))).toBe(
      `"পানি, বারি, জল",water<br>English: water`,
    );
  });

  it("escapes commas and quotes so Anki imports cleanly", () => {
    const csv = rowsToAnkiCsv(rows, "bn", names);
    const you = rows.find((r) => r.concept.id === "you")!;
    // the bengali you-cell has commas and needs quoting; the plain back does not
    expect(csv).toContain(`"${cellText(you.cells[0])}",you (one person)<br>English: you`);
  });

  it("a row where the own language is empty anchors the card on the English meaning", () => {
    const emptyNative: typeof rows = rows.map((r) => r.concept.id === "water" ? {
      ...r,
      cells: r.cells.map((c) => c.langCode === "bn" ? { ...c, empty: true, forms: [] } : c),
    } : r);
    const csv = rowsToAnkiCsv(emptyNative, "bn", names);
    expect(csv).toContain("water,water<br>English: water");
  });
});
