import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  LEVEL_RANK_CAP, FUNCTION_WORDS, FORMS, linkTokens, parseReadingsTsv, validateReading,
  validateReadings, type Reading,
} from "./reading";
import { parseConceptsTsv, parseLexiconTsv, type LexiconLanguage, type ScriptId } from "./words";

const lexDir = path.resolve(__dirname, "..", "..", "..", "content-packs", "lexicon");
const readDir = path.resolve(__dirname, "..", "..", "..", "content-packs", "readings");
const metas = JSON.parse(fs.readFileSync(path.join(lexDir, "languages.json"), "utf8")) as {
  code: string; name: string; nativeName: string; script: ScriptId; rtl?: boolean;
}[];
const { concepts } = parseConceptsTsv(fs.readFileSync(path.join(lexDir, "concepts.tsv"), "utf8"));
const langs: Record<string, LexiconLanguage> = {};
for (const m of metas) {
  langs[m.code] = parseLexiconTsv(m, fs.readFileSync(path.join(lexDir, `${m.code}.tsv`), "utf8")).lang;
}
const shipped = fs.readdirSync(readDir).filter((f) => f.endsWith(".tsv")).flatMap((f) =>
  parseReadingsTsv(fs.readFileSync(path.join(readDir, f), "utf8")).readings,
);

describe("levels", () => {
  it("level 1 is the gentlest: rank caps are 30, 60, 120, 200, 300", () => {
    expect(LEVEL_RANK_CAP[1]).toBe(30);
    expect(LEVEL_RANK_CAP[2]).toBe(60);
    expect(LEVEL_RANK_CAP[3]).toBe(120);
    expect(LEVEL_RANK_CAP[4]).toBe(200);
    expect(LEVEL_RANK_CAP[5]).toBe(300);
  });
});

describe("parseReadingsTsv", () => {
  const TSV = [
    "# a comment",
    "id\tlang\tlevel\ttitle\tconcepts\ttext",
    "en-hello\ten\t1\tHello\ti,hello\tI say hello.",
    "bn-hello\tbn\t2\tনমস্কার\ti,hello\tআমি বলি, নমস্কার।",
  ].join("\n");

  it("parses stories and skips comments and the header", () => {
    const { readings, problems } = parseReadingsTsv(TSV);
    expect(problems).toEqual([]);
    expect(readings.map((r) => r.id)).toEqual(["en-hello", "bn-hello"]);
    expect(readings[1].level).toBe(2);
    expect(readings[1].concepts).toEqual(["i", "hello"]);
  });

  it("rejects bad levels, duplicate ids and empty concept lists in plain words", () => {
    const { problems } = parseReadingsTsv(
      "id\tlang\tlevel\ttitle\tconcepts\ttext\nx\ten\t6\tT\ti\tHi.\nx\ten\t1\tT\ti\tHi.\ny\ten\t1\tT\t\tHi.",
    );
    expect(problems.some((p) => p.includes("level must be 1, 2, 3, 4 or 5"))).toBe(true);
    expect(problems.some((p) => p.includes('duplicate reading "x"'))).toBe(true);
    expect(problems.some((p) => p.includes("concepts column is empty"))).toBe(true);
  });

  it("rejects ids and concept ids that are not lowercase slugs", () => {
    const { problems } = parseReadingsTsv("id\tlang\tlevel\ttitle\tconcepts\ttext\nBad!\ten\t1\tT\ti\tHi.");
    expect(problems.some((p) => p.includes('bad id "Bad!"'))).toBe(true);
  });
});

describe("linkTokens", () => {
  it("links a plain English word to its row, with the gloss", () => {
    const tokens = linkTokens("I want water.", langs.en, concepts);
    const want = tokens.find((t) => t.word === "want");
    expect(want?.conceptId).toBe("want");
    expect(want?.gloss).toBe("to want");
  });

  it("matches multi-word terms as one token (thank you / por favor / দয়া করে)", () => {
    const en = linkTokens("Thank you!", langs.en, concepts);
    expect(en.map((t) => t.text)).toEqual(["Thank you!"]);
    expect(en[0].conceptId).toBe("thank-you");

    const es = linkTokens("Por favor, dame agua.", langs.es, concepts);
    const pf = es.find((t) => t.text.startsWith("Por favor"));
    expect(pf?.conceptId).toBe("please");
    expect(pf?.span).toBe(2);

    const bn = linkTokens("দয়া করে, পানি দাও।", langs.bn, concepts);
    expect(bn[0].conceptId).toBe("please");
    expect(bn[0].span).toBe(2);
  });

  it("resolves closed inflection forms (bn খাই → eat, es quiero → want, en says → say)", () => {
    expect(linkTokens("আমি খাই।", langs.bn, concepts).find((t) => t.word === "খাই")?.conceptId).toBe("eat");
    expect(linkTokens("Yo quiero agua.", langs.es, concepts).find((t) => t.word === "quiero")?.conceptId).toBe("want");
    expect(linkTokens("He says yes.", langs.en, concepts).find((t) => t.word === "says")?.conceptId).toBe("say");
  });

  it("keeps Bengali combining vowel signs intact (আমি is one word, not আম + ি)", () => {
    const tokens = linkTokens("আমি পানি খাই।", langs.bn, concepts);
    expect(tokens.map((t) => t.word)).toEqual(["আমি", "পানি", "খাই"]);
    expect(tokens[0].conceptId).toBe("i");
    expect(tokens[1].conceptId).toBe("water");
    expect(tokens[1].roman).toBe("pani");
  });

  it("marks closed function words and re-attaches their punctuation", () => {
    const tokens = linkTokens("The water is good!", langs.en, concepts);
    expect(tokens.map((t) => t.function ?? false)).toEqual([true, false, true, false]);
    expect(tokens.find((t) => t.word === "water")?.text).toBe("water");
    expect(tokens[tokens.length - 1].after).toBe("!");
    expect(tokens[tokens.length - 1].conceptId).toBe("good");
  });

  it("leaves unknown words unlinked (the validator will reject them)", () => {
    const tokens = linkTokens("I love xylophones.", langs.en, concepts);
    expect(tokens.find((t) => t.word === "xylophones")?.conceptId).toBeUndefined();
    expect(tokens.find((t) => t.word === "xylophones")?.function).toBeUndefined();
    expect(tokens.find((t) => t.word === "love")?.conceptId).toBe("love");
  });
});

describe("validateReading", () => {
  const reading = (over: Partial<Reading>): Reading => ({
    id: "test", lang: "en", level: 1, title: "Water", concepts: ["water"], text: "Water.", ...over,
  });

  it("accepts an honest level-1 story", () => {
    expect(validateReading(reading({ concepts: ["i", "water"], text: "I am water." }), concepts, langs.en)).toEqual([]);
  });

  it("rejects a level-1 story that sneaks in a rank-40 meaning", () => {
    const problems = validateReading(reading({ text: "My friend.", concepts: ["friend"] }), concepts, langs.en);
    expect(problems.some((p) => p.problem.includes("above the level-1 cap"))).toBe(true);
  });

  it("rejects unknown words with the word itself in the message", () => {
    const problems = validateReading(reading({ text: "The xylophone sings.", concepts: ["water"] }), concepts, langs.en);
    expect(problems.some((p) => p.problem.includes('unknown word "xylophone"'))).toBe(true);
  });

  it("enforces honesty: the declared list must match exactly what the story uses", () => {
    const unused = validateReading(reading({ concepts: ["i", "water"], text: "Water." }), concepts, langs.en);
    expect(unused.some((p) => p.problem.includes('declares concept "i" but the story never uses it'))).toBe(true);

    const sneak = validateReading(reading({ concepts: ["drink"], text: "I drink water." }), concepts, langs.en);
    expect(sneak.some((p) => p.problem.includes('uses concept "water" but does not declare it'))).toBe(true);
  });

  it("checks the title with the same rules as the text", () => {
    const problems = validateReading(reading({ title: "The xylophone", text: "Water." }), concepts, langs.en);
    expect(problems.some((p) => p.problem.startsWith("title:"))).toBe(true);
  });
});

describe("the shipped stories", () => {
  it("the FORMS and FUNCTION_WORDS tables only ever point at real concepts", () => {
    const problems = validateReadings([], concepts, langs);
    expect(problems).toEqual([]);
  });

  it("all 45 shipped stories are honest: every word opens a row, caps respected, lists exact", () => {
    expect(shipped.length).toBe(45);
    expect(new Set(shipped.map((r) => r.lang))).toEqual(new Set(["en", "bn", "es"]));
    const problems = validateReadings(shipped, concepts, langs);
    expect(problems).toEqual([]);
  });

  it("every language ships 3 stories at each of the five levels", () => {
    for (const code of ["en", "bn", "es"]) {
      const mine = shipped.filter((r) => r.lang === code);
      for (const level of [1, 2, 3, 4, 5] as const) {
        expect(mine.filter((r) => r.level === level).length).toBe(3);
      }
    }
  });

  it("function word lists exist for every language with stories", () => {
    for (const code of ["en", "bn", "es"]) {
      expect(FUNCTION_WORDS[code]?.size).toBeGreaterThan(5);
      expect(Object.keys(FORMS[code] ?? {}).length).toBeGreaterThan(5);
    }
  });
});
