# Contributing to Shishu 🌱

Shishu is made by parents, teachers and speakers around the world. **You do not need to know how
to code.** Every language in this app arrived as plain text from someone like you.

## The three easiest ways to help

### 1 · Add your language to the children's section (ages 2–12)

One language = **one JSON file**. A starter pack can be tiny — a few letters and 5 words is
enough; everything else is optional and others will grow it later.

- Easiest (no install): press the ✏️ pencil on [`content-packs/en/pack.json`](./content-packs/en/pack.json),
  translate, and open a pull request.
- Or generate a starter locally: `npm run new:pack -- sw "Swahili" "Kiswahili" latin`
- Full field guide: **[docs/PACKS.md](./docs/PACKS.md)** — the validator explains every mistake in plain words.

Letters and numbers can be minimal: `{"id": "sw-a", "char": "a"}` is a valid letter (the app speaks
the name with the device voice). Add `sound`, `audioUrl` and recordings later when you can.

### 2 · Add words for older children and adults (Word Rows)

Fill a spreadsheet-style worksheet — one line per meaning, most-used word first, synonyms separated
by `;`, with `|romanisation` so learners who can't read your script can still read the word.

- In the app: **Word Rows → Add any language → ⬇ Download blank worksheet**, fill it, paste it back.
- To share with everyone: open a PR adding `content-packs/lexicon/<code>.tsv` — guide: **[docs/WORDS.md](./docs/WORDS.md)**.

You can also add `script=spelling` forms (e.g. `water|bengali=ওয়াটার`) so readers of other scripts
see your word in letters they know. Hindi ⇄ Bengali letters are converted automatically.

### 3 · Improve an existing language

See a wrong word, a missing synonym, a better ordering (more common word first)? Open the file and
edit it on GitHub's website — every file is plain text. Fixing one word is a real contribution.

## How to send your work

1. Fork or press the pencil, make your change.
2. Open a pull request (any title is fine — "add Sylheti words" works).
3. CI checks your file and comments in plain words if anything needs fixing. No approval needed from us for content — humans review kindly.

## Ground rules (the short version)

- Content is **CC BY-SA 4.0**; code is MIT.
- Most-used first, always. Children meet words in the order life uses them.
- Gentle by design: no ads, no shame states, no data collection. Nothing a contributor adds should
  change that (no tracking pixels, no remote images that phone home — emoji or self-hosted audio only).
- Every script is welcome. If your language has no agreed writing system, romanisation alone is a fine start.

## Developers

`npm install` → `npm run dev` · `npm test` · `npm run build` · `npm run validate:content` · `npm run validate:lexicon`.
Architecture notes live in [docs/PACKS.md](./docs/PACKS.md), [docs/WORDS.md](./docs/WORDS.md) and
[docs/ROADMAP.md](./docs/ROADMAP.md). Bug reports and small PRs are welcome — keep diffs focused.
