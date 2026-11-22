/**
 * Word Rows — the engine behind the multilingual synonym table.
 *
 * One ROW = one meaning (a "concept"), ordered from the most used meaning to the least used.
 * One CELL = every word a language has for that meaning, most used word first
 * (e.g. Bengali "water": পানি, বারি, জল).
 * The learner's own language is always the FIRST column.
 *
 * Pure functions only (no DOM, no I/O) so they are unit-tested and reusable.
 */

export type ScriptId =
  | "latin" | "bengali" | "devanagari" | "arabic" | "cyrillic" | "han" | "kana" | "hangul"
  | "tamil" | "telugu" | "gurmukhi" | "gujarati" | "thai" | "greek" | "hebrew" | "other";

export const SCRIPT_LABEL: Record<ScriptId, string> = {
  latin: "English letters (a b c)",
  bengali: "Bengali letters (অ আ ক)",
  devanagari: "Hindi / Devanagari letters (अ आ क)",
  arabic: "Arabic / Urdu letters (ا ب ت)",
  cyrillic: "Cyrillic letters (А Б В)",
  han: "Chinese characters (汉字)",
  kana: "Japanese kana (あ ア)",
  hangul: "Korean Hangul (한글)",
  tamil: "Tamil letters",
  telugu: "Telugu letters",
  gurmukhi: "Gurmukhi letters",
  gujarati: "Gujarati letters",
  thai: "Thai letters",
  greek: "Greek letters",
  hebrew: "Hebrew letters",
  other: "Other",
};

/** One word (or fixed phrase) in one language. */
export type Term = {
  /** the word in the language's own script */
  text: string;
  /** the same word in Latin letters (romanisation). Omit for languages already written in Latin. */
  roman?: string;
  /** the same word written in other scripts, supplied by contributors: { bengali: "ওয়াটার" } */
  alt?: Partial<Record<ScriptId, string>>;
  /** register / region, e.g. "formal", "Sylhet", "informal" */
  tag?: string;
};

export type LexiconLanguage = {
  code: string;
  name: string;       // English name, e.g. "Bengali"
  nativeName: string; // e.g. "বাংলা"
  script: ScriptId;
  rtl?: boolean;
  /** concept id → terms, most used first */
  entries: Record<string, Term[]>;
};

export type Concept = {
  id: string;
  /** 1 = the most used meaning. Rows are always ordered by this. */
  rank: number;
  pos?: string;
  /** short English hint so contributors know what the row means, e.g. "you (to a friend)" */
  gloss: string;
};

// ---------- script detection ----------

const RANGES: [ScriptId, RegExp][] = [
  ["bengali", /[\u0980-\u09FF]/],
  ["devanagari", /[\u0900-\u097F]/],
  ["arabic", /[\u0600-\u06FF\u0750-\u077F]/],
  ["cyrillic", /[\u0400-\u04FF]/],
  ["kana", /[\u3040-\u30FF]/],
  ["han", /[\u4E00-\u9FFF]/],
  ["hangul", /[\uAC00-\uD7AF\u1100-\u11FF]/],
  ["tamil", /[\u0B80-\u0BFF]/],
  ["telugu", /[\u0C00-\u0C7F]/],
  ["gurmukhi", /[\u0A00-\u0A7F]/],
  ["gujarati", /[\u0A80-\u0AFF]/],
  ["thai", /[\u0E00-\u0E7F]/],
  ["greek", /[\u0370-\u03FF]/],
  ["hebrew", /[\u0590-\u05FF]/],
  ["latin", /[A-Za-z\u00C0-\u024F]/],
];

export function detectScript(text: string): ScriptId {
  for (const [id, re] of RANGES) if (re.test(text)) return id;
  return "other";
}

// ---------- Devanagari <-> Bengali (both are Brahmic: the Unicode blocks line up) ----------

const DEV = 0x0900;
const BEN = 0x0980;

// Devanagari code points that have no direct Bengali twin
const DEV_ONLY: Record<number, string> = {
  0x0929: "\u09A8", // ऩ → ন
  0x0931: "\u09B0", // ऱ → র
  0x0934: "\u09B2", // ऴ → ল
  0x0950: "\u0993\u0982", // ॐ → ওং
};

// Devanagari letters whose Bengali sound is conventionally a different Bengali letter
const DEV_TO_BEN_FIX: Record<string, string> = {
  "\u0935": "\u09AC", // व → ব   (Bengali has no v: va → ba / wa)
  "\u0936": "\u09B6", // श → শ
  "\u0937": "\u09B7", // ष → ষ
  "\u0938": "\u09B8", // स → স
  "\u0911": "\u0985", // ऑ → অ
  "\u0949": "\u09CB", // ॉ → ো
  "\u0958": "\u0995\u09BC", // क़
  "\u0959": "\u0996\u09BC", // ख़
  "\u095A": "\u0997\u09BC", // ग़
  "\u095B": "\u099C\u09BC", // ज़
  "\u095C": "\u09A1\u09BC", // ड़ → ড়
  "\u095D": "\u09A2\u09BC", // ढ़ → ঢ়
  "\u095E": "\u09AB\u09BC", // फ़
  "\u095F": "\u09AF\u09BC", // य़ → য়
};

/** Hindi/Marathi/Nepali (Devanagari) → Bengali letters. Reading aid, not a spelling authority. */
export function devanagariToBengali(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (DEV_TO_BEN_FIX[ch]) out += DEV_TO_BEN_FIX[ch];
    else if (DEV_ONLY[cp]) out += DEV_ONLY[cp];
    else if (cp >= DEV && cp <= 0x097F && cp !== 0x0964 && cp !== 0x0965) out += String.fromCodePoint(cp - DEV + BEN);
    else if (cp === 0x0964) out += "\u0964"; // danda is shared
    else out += ch;
  }
  return out;
}

const BEN_TO_DEV_FIX: Record<string, string> = {
  "\u09B0\u09BC": "\u0931",
  "\u09DC": "\u095C", // ড়
  "\u09DD": "\u095D", // ঢ়
  "\u09DF": "\u095F", // য়
  "\u09F0": "\u0930", // ৰ (Assamese ra)
  "\u09F1": "\u0935", // ৱ (Assamese wa)
  "\u09CE": "\u0924\u094D", // ৎ → त्
};

/** Bengali → Devanagari letters (so a Hindi reader can read a Bengali word). */
export function bengaliToDevanagari(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (BEN_TO_DEV_FIX[ch]) out += BEN_TO_DEV_FIX[ch];
    else if (cp >= BEN && cp <= 0x09FF && cp - BEN + DEV <= 0x097F) out += String.fromCodePoint(cp - BEN + DEV);
    else out += ch;
  }
  return out;
}

// ---------- choosing the form of a word the learner can read ----------

export type FormKind = "native" | "supplied" | "converted" | "latin" | "fallback";
export type Form = { text: string; kind: FormKind; script: ScriptId };

/**
 * The best spelling of `term` for someone who can read the scripts in `readable`
 * (listed in the learner's order of preference).
 *   1. the language's own script, if the learner reads it
 *   2. then, for each script the learner reads (in their order of preference): a spelling a
 *      contributor supplied, the Latin romanisation, or an automatic Devanagari <-> Bengali conversion
 *   3. otherwise the romanisation, then the native script, so something is always shown
 */
export function formFor(term: Term, langScript: ScriptId, readable: ScriptId[]): Form {
  if (readable.includes(langScript)) return { text: term.text, kind: "native", script: langScript };

  // one pass in the learner's own order of preference, so "Bengali first, then English" is honoured
  for (const s of readable) {
    const supplied = term.alt?.[s];
    if (supplied) return { text: supplied, kind: "supplied", script: s };
    if (s === "latin" && term.roman) return { text: term.roman, kind: "latin", script: "latin" };
    if (s === "bengali" && langScript === "devanagari") {
      return { text: devanagariToBengali(term.text), kind: "converted", script: "bengali" };
    }
    if (s === "devanagari" && langScript === "bengali") {
      return { text: bengaliToDevanagari(term.text), kind: "converted", script: "devanagari" };
    }
  }
  if (term.roman) return { text: term.roman, kind: "fallback", script: "latin" };
  return { text: term.text, kind: "fallback", script: langScript };
}

// ---------- building the table ----------

export type CellForm = Form & {
  tag?: string;
  /** the word exactly as the language writes it — what a voice should read aloud */
  term: Term;
};

export type Cell = {
  langCode: string;
  forms: CellForm[];
  /** language has nothing for this concept yet */
  empty: boolean;
};

export type Row = {
  concept: Concept;
  /** native first, then targets in the learner's order */
  cells: Cell[];
};

export type TableOptions = {
  native: string;
  targets: string[];
  readable: ScriptId[];
  /** how many words per cell: Infinity = all synonyms */
  maxSynonyms?: number;
  /** keep only rows where EVERY chosen language has a word (clean table) */
  onlyComplete?: boolean;
  /** rows to skip (e.g. already known) */
  skip?: ReadonlySet<string>;
  /** window into the ordered rows */
  offset?: number;
  limit?: number;
};

/** Native language first, targets after; duplicates (and native repeated in targets) removed. */
export function columnOrder(native: string, targets: string[]): string[] {
  const out: string[] = [];
  for (const c of [native, ...targets]) if (c && !out.includes(c)) out.push(c);
  return out;
}

export function buildRows(
  concepts: Concept[],
  langs: Record<string, LexiconLanguage>,
  opts: TableOptions,
): Row[] {
  const cols = columnOrder(opts.native, opts.targets).filter((c) => langs[c]);
  const max = opts.maxSynonyms ?? Infinity;
  const ordered = [...concepts].sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));

  const rows: Row[] = [];
  for (const concept of ordered) {
    if (opts.skip?.has(concept.id)) continue;
    const cells: Cell[] = cols.map((code) => {
      const lang = langs[code];
      const terms = (lang.entries[concept.id] ?? []).slice(0, max);
      return {
        langCode: code,
        empty: terms.length === 0,
        forms: terms.map((t) => ({ ...formFor(t, lang.script, opts.readable), tag: t.tag, term: t })),
      };
    });
    if (opts.onlyComplete && cells.some((c) => c.empty)) continue;
    // a row where the native cell is empty teaches nothing to anchor on, but still shows targets
    if (cells.every((c) => c.empty)) continue;
    rows.push({ concept, cells });
  }
  const start = opts.offset ?? 0;
  return rows.slice(start, opts.limit === undefined ? undefined : start + opts.limit);
}

/** "পানি, বারি, জল" — a cell as one printable string. */
export function cellText(cell: Cell, sep = ", "): string {
  return cell.forms.map((f) => f.text).join(sep);
}

/** Row → "(a, b), c, (d, e)" style used in the planning notes: groups of 2+ get parentheses. */
export function rowText(row: Row): string {
  return row.cells
    .map((c) => (c.forms.length > 1 ? `(${cellText(c)})` : cellText(c)))
    .join(" / ");
}

/**
 * Split many languages into printable pages: the native column is repeated on every page so each
 * sheet stands alone (20 languages become 5 pages of 4 columns, not one unreadable strip).
 */
export function pageGroups(columns: string[], perPage: number): string[][] {
  const [native, ...rest] = columns;
  if (!native) return [];
  const size = Math.max(1, perPage - 1);
  if (rest.length === 0) return [[native]];
  const pages: string[][] = [];
  for (let i = 0; i < rest.length; i += size) pages.push([native, ...rest.slice(i, i + size)]);
  return pages;
}

/** Rows per day to finish `rows` in `days` days. */
export function perDayFor(totalRows: number, days: number): number {
  return Math.max(1, Math.ceil(totalRows / Math.max(1, days)));
}

// ---------- lexicon source format (TSV) ----------
//
//   <concept id> TAB <terms>
//   terms  = term ; term ; term            (most used first)
//   term   = text | roman | tag | script=spelling | script=spelling
//   e.g.   পানি|pani ; বারি|bari|poetic ; জল|jol|formal
//   Latin-script languages need only the text:   water ; liquid
//
// Lines starting with # are comments. The first non-comment line may be a header "concept<TAB>terms".

const SCRIPT_KEYS = new Set<string>(Object.keys(SCRIPT_LABEL));

export function parseTerm(raw: string): Term | null {
  const parts = raw.split("|").map((p) => p.trim());
  const text = parts[0];
  if (!text) return null;
  const term: Term = { text };
  const plain: string[] = [];
  for (const p of parts.slice(1)) {
    const eq = p.indexOf("=");
    if (eq > 0 && SCRIPT_KEYS.has(p.slice(0, eq).trim())) {
      term.alt = { ...term.alt, [p.slice(0, eq).trim() as ScriptId]: p.slice(eq + 1).trim() };
    } else if (p) plain.push(p);
  }
  if (plain[0]) term.roman = plain[0];
  if (plain[1]) term.tag = plain[1];
  return term;
}

export function parseCell(cell: string): Term[] {
  return cell.split(";").map(parseTerm).filter((t): t is Term => t !== null);
}

export type LexiconMeta = Pick<LexiconLanguage, "code" | "name" | "nativeName" | "script"> & { rtl?: boolean };

export function parseLexiconTsv(meta: LexiconMeta, tsv: string): { lang: LexiconLanguage; problems: string[] } {
  const entries: Record<string, Term[]> = {};
  const problems: string[] = [];
  const lines = tsv.replace(/^\uFEFF/, "").split(/\r?\n/);
  // The downloadable template has a middle "meaning" column to help the translator
  // (concept<TAB>meaning<TAB>words); the shipped files use concept<TAB>words.
  let threeColumns = false;
  lines.forEach((line, n) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const parts = line.split("\t");
    const [id] = parts;
    if (id.trim().toLowerCase() === "concept") { // header
      threeColumns = (parts[1] ?? "").trim().toLowerCase() === "meaning";
      return;
    }
    const cell = threeColumns ? (parts[2] ?? "") : parts.slice(1).join("\t");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id.trim())) {
      problems.push(`line ${n + 1}: concept id "${id}" must be lowercase letters, digits or dashes`);
      return;
    }
    const terms = parseCell(cell);
    if (terms.length === 0) return; // blank = not translated yet; fine
    entries[id.trim()] = terms;
  });
  return { lang: { ...meta, entries }, problems };
}

export function parseConceptsTsv(tsv: string): { concepts: Concept[]; problems: string[] } {
  const concepts: Concept[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  tsv.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line, n) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const [rank, id, pos, gloss] = line.split("\t").map((x) => x?.trim());
    if (rank?.toLowerCase() === "rank") return;
    const r = Number(rank);
    if (!Number.isFinite(r) || !id) {
      problems.push(`line ${n + 1}: expected "rank<TAB>id<TAB>pos<TAB>gloss"`);
      return;
    }
    if (seen.has(id)) {
      problems.push(`line ${n + 1}: duplicate concept "${id}"`);
      return;
    }
    seen.add(id);
    concepts.push({ id, rank: r, pos: pos || undefined, gloss: gloss || id });
  });
  return { concepts, problems };
}

/** Every concept a language has not translated yet — handy "what's missing" list for contributors. */
export function missingConcepts(concepts: Concept[], lang: LexiconLanguage): Concept[] {
  return concepts.filter((c) => !(lang.entries[c.id]?.length));
}

/** TSV (spreadsheet-friendly) export of the rows exactly as shown. */
export function rowsToTsv(rows: Row[], langNames: Record<string, string>): string {
  if (rows.length === 0) return "";
  const head = ["#", "meaning", ...rows[0].cells.map((c) => langNames[c.langCode] ?? c.langCode)];
  const body = rows.map((r, i) => [String(i + 1), r.concept.gloss, ...r.cells.map((c) => cellText(c, " ; "))]);
  return [head, ...body].map((cols) => cols.map((c) => c.replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** CSV (opens cleanly in Excel / Google Sheets / Anki import). Prefix with a BOM when saving. */
export function rowsToCsv(rows: Row[], langNames: Record<string, string>): string {
  if (rows.length === 0) return "";
  const head = ["#", "meaning", ...rows[0].cells.map((c) => langNames[c.langCode] ?? c.langCode)];
  const body = rows.map((r, i) => [String(i + 1), r.concept.gloss, ...r.cells.map((c) => cellText(c, " ; "))]);
  return [head, ...body].map((cols) => cols.map(csvCell).join(",")).join("\r\n");
}

/**
 * A blank worksheet for adding ANY language: one line per meaning, with the English word as a hint.
 * Fill the last column, save as .tsv, and use "Add a language" (or open a pull request).
 */
export function templateTsv(concepts: Concept[], hints?: LexiconLanguage): string {
  const head = [
    "# Fill the WORDS column in YOUR language. Most used word first; separate words with ' ; '",
    "# word format:  text|romanisation|note   e.g.  জল|jol|formal   (romanisation lets learners who can't read your script read the word)",
    "# Leave a line empty if you don't know it — someone else can add it. Do not change the first column.",
    "concept\tmeaning\twords",
  ];
  const lines = [...concepts].sort((a, b) => a.rank - b.rank).map((c) => {
    const hint = hints?.entries[c.id]?.[0]?.text;
    return `${c.id}\t${hint ? `${c.gloss} (${hint})` : c.gloss}\t`;
  });
  return [...head, ...lines].join("\n") + "\n";
}
