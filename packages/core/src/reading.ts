/**
 * Story Rows — graded mini-stories built ONLY from the Word Rows lexicon.
 *
 * A reading is one short story in one language. Every word in its text must be either
 *   1. a word from that language's Word Rows cells (linked to its row), or
 *   2. one of a small closed set of FUNCTION_WORDS (articles, copulas, connectors — no link), or
 *   3. a form listed in FORMS, a closed inflection table (e.g. Bengali "খায়" → the row "eat").
 * Anything else is rejected by CI — the promise to the learner is honesty: every tappable word
 * opens a real row. Level caps: 1→30, 2→60, 3→120, 4→200, 5→300.
 *
 * Pure functions only (no DOM, no I/O).
 */

import type { Concept, LexiconLanguage } from "./words";

export type ReadingLevel = 1 | 2 | 3 | 4 | 5;

/** Highest concept rank a story of this level may use (level 1 is the gentlest). */
export const LEVEL_RANK_CAP: Record<ReadingLevel, number> = { 1: 30, 2: 60, 3: 120, 4: 200, 5: 300 };

export type Reading = {
  id: string;
  lang: string;
  level: ReadingLevel;
  title: string;
  /** the story as plain text — what the learner reads */
  text: string;
  /** the concept ids the story is built from (validated to match the text exactly) */
  concepts: string[];
};

/**
 * Closed function-word lists per language: the tiny glue words a sentence needs (articles,
 * copulas, connectors) that are NOT meanings in the table. The list is closed on purpose —
 * adding a word here is a pull request, so the "every word opens a row" promise stays honest.
 */
export const FUNCTION_WORDS: Record<string, ReadonlySet<string>> = {
  en: new Set([
    "the", "a", "an", "is", "are", "am", "was", "were", "be", "been", "do", "does", "did",
    "has", "have", "had", "to", "of", "and", "or", "but", "if", "in", "on", "at", "from",
    "with", "for", "by", "my", "your", "his", "her", "its", "our", "their", "me", "him",
    "us", "them", "it", "not", "so", "then", "now", "today", "tonight", "here", "there",
    "very", "too", "also", "oh", "wow", "can", "will", "let", "every", "all", "some",
  ]),
  bn: new Set([
    "এবং", "আর", "ও", "তাই", "কিন্তু", "আমার", "তোমার", "তার", "আমাকে", "তোমাকে", "তাকে",
    "আমাদের", "তোমাদের", "তাদের", "এখানে", "সেখানে", "এখন", "আজ", "খুব", "একটা", "একটি",
    "টা", "টি", "তুমিকে", "আছে", "নেই", "হয়", "হচ্ছে", "থেকে", "জন্য", "সাথে", "যে",
    "তারপর", "দিয়ে", "ভেতরে", "নিয়ে",
  ]),
  es: new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "pero", "de", "del",
    "en", "con", "por", "para", "a", "al", "es", "son", "soy", "eres", "está", "estás",
    "están", "estoy", "hay", "mi", "mis", "tu", "tus", "su", "sus", "me", "te", "nos",
    "le", "les", "lo", "aquí", "allí", "ahí", "hoy", "ahora", "muy", "también", "qué",
    "después", "tiene", "se", "él", "ella",
  ]),
};

/**
 * Closed inflection table per language: surface form → concept id. Bengali verbs conjugate
 * ("খাওয়া" → খাই / খায় / খাও), Spanish verbs and gendered forms vary ("querer" → quiero /
 * quiere). Stories may only use forms listed here, so the linking stays honest. A multi-word
 * form (e.g. "পান করি" → drink) is allowed and matches as a phrase.
 */
export const FORMS: Record<string, Readonly<Record<string, string>>> = {
  en: {
    gives: "give", gave: "give", giving: "give", goes: "go", went: "go", going: "go",
    comes: "come", came: "come", coming: "come", wants: "want", wanting: "want",
    knows: "know", knew: "know", sees: "see", saw: "see", says: "say", said: "say",
    saying: "say", speaks: "say", tells: "say", told: "say",
    takes: "take", took: "take", taking: "take", eats: "eat", ate: "eat", eating: "eat",
    drinks: "drink", drank: "drink", drinking: "drink", looks: "see", looking: "see",
    sleeps: "sleep", sleeping: "sleep", reads: "read", reading: "read",
    writes: "write", wrote: "write", writing: "write", learns: "learn", learning: "learn",
    plays: "play", playing: "play", friends: "friend", children: "child", kids: "child",
    mothers: "mother", fathers: "father", homes: "home", houses: "home", days: "day",
    nights: "night", books: "book", trees: "tree", names: "name", bigger: "big",
    smaller: "small", helps: "help", helping: "help", buys: "buy", works: "work",
    // level 3–5 story forms
    sits: "sit", sat: "sit", sitting: "sit", stands: "stand", stood: "stand", standing: "stand",
    runs: "run", ran: "run", running: "run", jumps: "jump", jumped: "jump", jumping: "jump",
    sings: "sing", sang: "sing", singing: "sing", laughs: "laugh", laughed: "laugh", laughing: "laugh",
    cries: "cry", cried: "cry", crying: "cry", dances: "dance", danced: "dance", dancing: "dance",
    washes: "wash", washed: "wash", washing: "wash", cooks: "cook", cooked: "cook", cooking: "cook",
    opens: "open", opened: "open", opening: "open", closes: "close", closed: "close", closing: "close",
    walks: "walk", walked: "walk", walking: "walk", swims: "swim", swam: "swim", swimming: "swim",
    flies: "fly", flew: "fly", flying: "fly", rides: "ride", rode: "ride", riding: "ride",
    carries: "carry", carried: "carry", carrying: "carry", meets: "meet", met: "meet", meeting: "meet",
    asks: "ask", asked: "ask", answers: "answer", answered: "answer", shows: "show", showed: "show",
    teaches: "teach", taught: "teach", counts: "count", counted: "count", draws: "draw", drew: "draw",
    thinks: "think", thought: "think", waits: "wait", waited: "wait", listens: "listen", listened: "listen",
    touches: "touch", touched: "touch", smells: "smell", tasted: "taste", tastes: "taste", threw: "throw",
    throws: "throw", pushes: "push", pulls: "pull", smiles: "smile", smiled: "smile", hugs: "hug",
    hugged: "hug", kisses: "kiss", cuts: "cut", shares: "share", wakes: "wake", woke: "wake",
    rests: "rest", rested: "rest", lives: "live", lived: "live",
    babies: "baby", sisters: "sister", brothers: "brother", grandmothers: "grandmother",
    grandfathers: "grandfather", eyes: "eye", ears: "ear", noses: "nose", mouths: "mouth",
    hands: "hand", feet: "foot", heads: "head", hairs: "hair", faces: "face", teeth: "tooth",
    apples: "apple", bananas: "banana", mangoes: "mango", cups: "cup", plates: "plate", spoons: "spoon",
    eggs: "egg",
    doors: "door", windows: "window", beds: "bed", tables: "table", chairs: "chair", rooms: "room",
    kitchens: "kitchen", lamps: "lamp", boxes: "box", bags: "bag", pens: "pen", pencils: "pencil",
    papers: "paper", pictures: "picture", letters: "letter", words: "word", songs: "song", stories: "story",
    cats: "cat", dogs: "dog", birds: "bird", hens: "hen", cows: "cow", goats: "goat", ducks: "duck",
    horses: "horse", monkeys: "monkey", elephants: "elephant", flowers: "flower", leaves: "leaf",
    skies: "sky", clouds: "cloud", rains: "rain", winds: "wind", stars: "star", rivers: "river",
    seas: "sea", mountains: "mountain", roads: "road", villages: "village", cities: "city",
    shirts: "shirt", shoes: "shoe", socks: "sock", caps: "cap", towels: "towel", soaps: "soap",
    combs: "comb", mirrors: "mirror", teachers: "teacher", doctors: "doctor", farmers: "farmer",
    markets: "market", shops: "shop", gardens: "garden", fields: "field", boats: "boat", buses: "bus",
    cars: "car", bicycles: "bicycle", trains: "train", keys: "key", clocks: "clock",
    umbrellas: "umbrella", balls: "ball", dolls: "doll", toys: "toy", kites: "kite", drums: "drum",
    phones: "phone", mornings: "morning", afternoons: "afternoon", evenings: "evening", weeks: "week",
    months: "month", years: "year", summers: "summer", winters: "winter", snows: "snow",
  },
  bn: {
    চাই: "want", চাও: "want", চায়: "want", দাও: "give", দেয়: "give", দিই: "give",
    নাও: "take", নেয়: "take", নিই: "take", খাই: "eat", খাও: "eat",
    খায়: "eat", যাই: "go", যাও: "go", যায়: "go", আসি: "come", আসো: "come", আসে: "come",
    দেখি: "see", দেখো: "see", দেখে: "see", বলি: "say", বলো: "say", বলে: "say",
    জানি: "know", জানো: "know", জানে: "know", ঘুমাই: "sleep", ঘুমাও: "sleep",
    ঘুমায়: "sleep", পড়ি: "read", পড়ো: "read", পড়ে: "read", লেখি: "write", লেখো: "write",
    লেখে: "write", শিখি: "learn", শেখ: "learn", শেখে: "learn", খেলি: "play", খেলো: "play",
    খেলে: "play", বুঝি: "understand", বোঝে: "understand", কিনি: "buy", কেনে: "buy",
    "পান করি": "drink", "পান করে": "drink", স্কুলে: "school", বাড়িতে: "home",
    ভালোবাসি: "love", ভালোবাসে: "love", কাজ: "work", সাহায্য: "help",
    // level 3–5 story forms
    হাসে: "laugh", হাসি: "laugh", দৌড়ায়: "run", দৌড়াই: "run", দৌড়াও: "run",
    লাফায়: "jump", লাফাই: "jump", নাচে: "dance", নাচি: "dance", কাঁদে: "cry", কাঁদি: "cry",
    "গান করি": "sing", "গান করে": "sing", বসে: "sit", বসি: "sit", দাঁড়ায়: "stand", দাঁড়াই: "stand",
    ধুই: "wash", ধোয়: "wash", "রান্না করে": "cook", "রান্না করি": "cook",
    খোলে: "open", খুলি: "open", "বন্ধ করে": "close", "বন্ধ করি": "close",
    ওড়ে: "fly", ওড়ি: "fly", ওড়ায়: "fly", হাঁটে: "walk", হাঁটি: "walk",
    জাগে: "wake", জাগি: "wake", দেখায়: "show", দেখাই: "show",
    শুনি: "listen", শোন: "listen", ছোঁয়: "touch", আঁকি: "draw", আঁকে: "draw",
    গোনে: "count", গুনি: "count", ভাবি: "think", ভাবে: "think",
    রান্নাঘরে: "kitchen", গ্রামে: "village", সকালে: "morning", আকাশে: "sky", আয়নায়: "mirror",
    গাছে: "tree", এসো: "come",
    "জড়িয়ে ধরে": "hug",
  },
  es: {
    quiero: "want", quieres: "want", quiere: "want", queremos: "want",
    como: "eat", comes: "eat", come: "eat", comemos: "eat", comen: "eat", bebo: "drink",
    bebes: "drink", bebe: "drink", bebemos: "drink", beben: "drink", voy: "go",
    vas: "go", va: "go", vamos: "go", van: "go", vengo: "come", vienes: "come",
    viene: "come", venimos: "come", doy: "give", das: "give", da: "give", damos: "give",
    dan: "give", dame: "give", veo: "see", ves: "see", ve: "see", vemos: "see",
    mira: "see", miras: "see", digo: "say", dices: "say", dice: "say",
    decimos: "say", dicen: "say", sé: "know", sabes: "know", sabe: "know", toma: "take",
    tomo: "take", esta: "this", estas: "this", buena: "good", buen: "good",
    buenas: "good", amiga: "friend", amigos: "friend", amigas: "friend",
    juego: "play", juega: "play", jugamos: "play", leo: "read", lees: "read",
    lee: "read", leemos: "read", escribo: "write", escribes: "write", escribe: "write",
    escribimos: "write", aprendo: "learn", aprende: "learn", aprendemos: "learn",
    duermo: "sleep", duerme: "sleep", dormimos: "sleep", días: "day", noches: "night",
    ayudo: "help", ayudas: "help", ayuda: "help", compramos: "buy", compro: "buy",
    compras: "buy", nueva: "new", nuevas: "new", pequeña: "small", pequeñas: "small",
    trabaja: "work", trabajo: "work",
    // level 3–5 story forms
    ríe: "laugh", río: "laugh", reímos: "laugh", corre: "run", corro: "run", corremos: "run",
    salta: "jump", saltan: "jump", cantamos: "sing", canta: "sing",
    baila: "dance", bailo: "dance", bailamos: "dance", llora: "cry", lloro: "cry",
    cocinamos: "cook", lavo: "wash", lava: "wash", lavamos: "wash", manos: "hand",
    vuela: "fly", vuelan: "fly", sienta: "sit", camina: "walk", caminamos: "walk",
    despierta: "wake", abro: "open", abre: "open", cierra: "close", cierro: "close",
    ven: "come", fría: "cold", roja: "red", amarilla: "yellow", vieja: "old",
    alta: "tall", limpia: "clean", zapatos: "shoe", compra: "buy", toca: "touch",
    sonríe: "smile", abraza: "hug", enferma: "sick", enfermo: "sick",
    bonita: "beautiful", hermosa: "beautiful", doctora: "doctor",
    felices: "happy", nuevos: "new",
    pájaros: "bird", flores: "flower", gatos: "cat", perros: "dog", abuelas: "grandmother",
  },
};

// ---------- parsing ----------

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

/** TSV: id <TAB> lang <TAB> level <TAB> title <TAB> concepts(comma-separated) <TAB> text */
export function parseReadingsTsv(tsv: string): { readings: Reading[]; problems: string[] } {
  const readings: Reading[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  tsv.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line, n) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const [id, lang, level, title, concepts, text] = line.split("\t").map((x) => x?.trim());
    if (id?.toLowerCase() === "id") return; // header
    if (!id || !ID_RE.test(id)) { problems.push(`line ${n + 1}: bad id "${id ?? ""}"`); return; }
    if (seen.has(id)) { problems.push(`line ${n + 1}: duplicate reading "${id}"`); return; }
    seen.add(id); // from here on the id counts, even if the rest of the row has problems
    if (!lang || !ID_RE.test(lang)) { problems.push(`line ${n + 1}: bad language code "${lang ?? ""}"`); return; }
    if (!["1", "2", "3", "4", "5"].includes(level ?? "")) { problems.push(`line ${n + 1}: level must be 1, 2, 3, 4 or 5`); return; }
    if (!title || !text) { problems.push(`line ${n + 1}: missing title or text`); return; }
    const conceptList = (concepts ?? "").split(",").map((c) => c.trim()).filter(Boolean);
    if (conceptList.length === 0) { problems.push(`line ${n + 1}: concepts column is empty`); return; }
    for (const c of conceptList) {
      if (!ID_RE.test(c)) { problems.push(`line ${n + 1}: bad concept id "${c}"`); return; }
    }
    readings.push({ id, lang, level: Number(level) as ReadingLevel, title, text, concepts: conceptList });
  });
  return { readings, problems };
}

// ---------- linking ----------

export type LinkedToken = {
  /** the chunk exactly as written (punctuation included) — what the UI shows */
  text: string;
  /** the word without punctuation, lower-cased for Latin scripts — what the matcher sees */
  word: string;
  /** punctuation before / after the word (re-attached by the UI) */
  before: string;
  after: string;
  /** set when the word opens a row */
  conceptId?: string;
  /** romanisation of the matched word (for languages not written in Latin letters) */
  roman?: string;
  /** English meaning of the matched row */
  gloss?: string;
  /** a glue word from the closed FUNCTION_WORDS list (no link, never unknown) */
  function?: boolean;
  /** how many space-separated words this token spans (multi-word term) */
  span?: number;
};

type WordIndex = {
  /** surface word → concept id (first language term that has it) */
  byWord: Map<string, { conceptId: string; roman?: string }>;
  /** multi-word surface phrase → concept id */
  byPhrase: Map<string, { conceptId: string; roman?: string; words: number }>;
  functionWords: ReadonlySet<string>;
  forms: Readonly<Record<string, string>>;
};

const stripPunct = (s: string): { before: string; word: string; after: string } => {
  // \p{M} keeps combining vowel signs (Bengali ি, Urdu marks…) inside the word — they are letters' clothes, not punctuation
  const m = s.match(/^([^\p{L}\p{N}\p{M}]*)(.*?)([^\p{L}\p{N}\p{M}]*)$/u);
  if (!m) return { before: "", word: s, after: "" };
  return { before: m[1] ?? "", word: m[2] ?? "", after: m[3] ?? "" };
};

/** Latin-script words fold to lower case; scripts without case (Bengali…) come back unchanged. */
const norm = (w: string): string => w.toLowerCase();

/** Index a language's cells: term text (and roman) → concept id, multi-word terms as phrases. */
export function buildWordIndex(lang: LexiconLanguage): WordIndex {
  const byWord = new Map<string, { conceptId: string; roman?: string }>();
  const byPhrase = new Map<string, { conceptId: string; roman?: string; words: number }>();
  for (const [conceptId, terms] of Object.entries(lang.entries)) {
    for (const t of terms) {
      const words = norm(t.text).split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        const key = words.join(" ");
        if (!byPhrase.has(key)) byPhrase.set(key, { conceptId, roman: t.roman, words: words.length });
      } else if (t.text.trim()) {
        const key = norm(t.text);
        if (!byWord.has(key)) byWord.set(key, { conceptId, roman: t.roman });
      }
      if (t.roman) {
        const rWords = norm(t.roman).split(/\s+/).filter(Boolean);
        if (rWords.length > 1) {
          const key = rWords.join(" ");
          if (!byPhrase.has(key)) byPhrase.set(key, { conceptId, roman: t.roman, words: rWords.length });
        } else if (!byWord.has(norm(t.roman))) byWord.set(norm(t.roman), { conceptId, roman: t.roman });
      }
    }
  }
  // multi-word inflection forms ("রান্না করে" → cook) match as phrases, like the docstring promises
  for (const [form, conceptId] of Object.entries(FORMS[lang.code] ?? {})) {
    const words = norm(form).split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const key = words.join(" ");
      if (!byPhrase.has(key)) byPhrase.set(key, { conceptId, words: words.length });
    }
  }
  return {
    byWord,
    byPhrase,
    functionWords: FUNCTION_WORDS[lang.code] ?? new Set<string>(),
    forms: FORMS[lang.code] ?? {},
  };
}

const MAX_PHRASE_WORDS = 3;

/**
 * Split a story into tokens and link every word that the lexicon knows. Words from the closed
 * function list get `function: true`. Unknown words stay unlinked — `validateReading` rejects them.
 */
export function linkTokens(text: string, lang: LexiconLanguage, concepts?: Concept[]): LinkedToken[] {
  const idx = buildWordIndex(lang);
  const glossOf = concepts ? new Map(concepts.map((c) => [c.id, c.gloss])) : undefined;
  const chunks = text.split(/\s+/).filter((c) => c.length > 0);
  const stripped = chunks.map((c) => stripPunct(c));

  const out: LinkedToken[] = [];
  for (let i = 0; i < stripped.length; ) {
    // greedy multi-word match (longest first) across the next few words
    let matched: LinkedToken | null = null;
    for (let size = MAX_PHRASE_WORDS; size >= 2; size--) {
      if (i + size > stripped.length) continue;
      const key = stripped.slice(i, i + size).map((s) => norm(s.word)).join(" ");
      const hit = idx.byPhrase.get(key);
      if (hit) {
        matched = {
          text: chunks.slice(i, i + size).join(" "),
          word: key,
          before: stripped[i].before,
          after: stripped[i + size - 1].after,
          conceptId: hit.conceptId,
          roman: hit.roman,
          gloss: glossOf?.get(hit.conceptId),
          span: size,
        };
        break;
      }
    }
    if (matched) { out.push(matched); i += matched.span ?? 1; continue; }

    const s = stripped[i];
    const w = norm(s.word);
    const direct = w ? idx.byWord.get(w) : undefined;
    const formId = w ? idx.forms[w] : undefined;
    if (direct || formId) {
      const conceptId = direct?.conceptId ?? formId!;
      out.push({
        text: chunks[i], word: w, before: s.before, after: s.after,
        conceptId, roman: direct?.roman,
        gloss: glossOf?.get(conceptId),
      });
    } else if (w && idx.functionWords.has(w)) {
      out.push({ text: chunks[i], word: w, before: s.before, after: s.after, function: true });
    } else {
      out.push({ text: chunks[i], word: w, before: s.before, after: s.after });
    }
    i += 1;
  }
  return out;
}

// ---------- validation (CI) ----------

export type ReadingProblem = { reading: string; problem: string };

/** Checks one reading against its language and the concept list. Returns [] when honest. */
export function validateReading(
  r: Reading,
  concepts: Concept[],
  lang: LexiconLanguage,
): ReadingProblem[] {
  const problems: ReadingProblem[] = [];
  const add = (problem: string) => problems.push({ reading: r.id, problem });
  const rankOf = new Map(concepts.map((c) => [c.id, c.rank]));
  const cap = LEVEL_RANK_CAP[r.level];

  for (const c of r.concepts) {
    if (!rankOf.has(c)) add(`declares unknown concept "${c}"`);
    else if (rankOf.get(c)! > cap) add(`declares concept "${c}" (rank ${rankOf.get(c)}) above the level-${r.level} cap of ${cap}`);
  }

  const checkPart = (label: string, text: string) => {
    const tokens = linkTokens(text, lang, concepts);
    for (const t of tokens) {
      if (!t.word) continue; // pure punctuation
      if (!t.conceptId && !t.function) add(`${label}: unknown word "${t.word}"`);
      if (t.conceptId) {
        const rank = rankOf.get(t.conceptId);
        if (rank !== undefined && rank > cap) {
          add(`${label}: word "${t.word}" opens concept "${t.conceptId}" (rank ${rank}) above the level-${r.level} cap of ${cap}`);
        }
      }
    }
    return tokens;
  };
  const bodyTokens = checkPart("text", r.text);
  const titleTokens = checkPart("title", r.title);

  // honesty: the declared list must be exactly the concepts the story (title + text) opens
  const used = new Set([...bodyTokens, ...titleTokens].flatMap((t) => (t.conceptId ? [t.conceptId] : [])));
  for (const c of r.concepts) if (!used.has(c)) add(`declares concept "${c}" but the story never uses it`);
  for (const c of used) if (!r.concepts.includes(c)) add(`uses concept "${c}" but does not declare it`);
  return problems;
}

/** All readings at once — also checks that FORMS only point at real concepts. */
export function validateReadings(
  readings: Reading[],
  concepts: Concept[],
  langs: Record<string, LexiconLanguage>,
): ReadingProblem[] {
  const problems: ReadingProblem[] = [];
  const ids = new Set(concepts.map((c) => c.id));
  for (const [code, forms] of Object.entries(FORMS)) {
    if (!(code in langs)) continue; // a language pack may not be loaded — its stories are checked when it is
    for (const [form, cid] of Object.entries(forms)) {
      if (!ids.has(cid)) problems.push({ reading: `(forms:${code})`, problem: `form "${form}" points at unknown concept "${cid}"` });
    }
  }
  for (const r of readings) {
    const lang = langs[r.lang];
    if (!lang) { problems.push({ reading: r.id, problem: `language "${r.lang}" is not in the lexicon` }); continue; }
    problems.push(...validateReading(r, concepts, lang));
  }
  return problems;
}
