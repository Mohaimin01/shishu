# Contributing a language pack

One language = **one JSON file**. No app code, no builds, no permission needed.

## Quick start

1. Copy `content-packs/en/pack.json` as your starting point.
2. Translate the fields, keep ids stable, validate it (see below).
3. Host the file anywhere https gets it: a PR to this repo (`content-packs/<lang>/pack.json`), or your own URL. Either way it works in the app via **Grown-ups → Community language packs**.
4. Open a PR or an issue titled `pack: <language>` and we'll include it in the repo build so it ships bundled.

## Field guide

```jsonc
{
  "code": "bn",             // BCP-47-ish code, unique
  "name": "Bangla",
  "nativeName": "বাংলা",    // what speakers call it — shown on the lane chip
  "script": "bengali",      // "bengali" | "latin" (hint for glyph rendering)
  "direction": "ltr",
  "phonemes": [...],        // optional; future phonics detail
  "letters": [              // 4–12 to start; grow later
    { "id": "bn-a", "char": "অ", "name": "অ", "sound": "aw", "audioUrl": "/packs/bn/a.mp3?" }
    // audioUrl optional — device voice is the fallback; your recording wins
  ],
  "numbers": [
    { "value": 1, "char": "১", "word": "এক" }   // char = the digit glyph in YOUR script
  ],
  "words": [
    // conceptId is the shared idea across ALL languages — keep the canonical ids
    // so the "Together" lane can bridge them: water, apple, sun, mother, eat…
    // adding a brand-new concept? use a unique dash id: "kite", "well"
    { "id": "bn-w-water", "conceptId": "water", "label": "পানি", "emoji": "💧" }
  ],
  "conceptTables": [        // regional/family variants — shown respectfully, never corrective
    { "conceptId": "water", "variants": [
      { "lang": "bn", "label": "পানি" },
      { "lang": "bn", "label": "জল", "region": "West Bengal" },
      { "lang": "syl", "label": "বারি", "region": "Sylhet" }
    ]}
  ],
  "phrases": [
    { "id": "bn-p1", "text": "মা, পানি খাবে?", "translation": "Ma, want some water?" }
  ],
  "stages": {}              // curated sequence placeholders — fine to leave {}
}
```

## Rules of the board (please honor them)

- **Emoji standards:** single-subject, calm, instantly recognizable (Sultana's rule). 👩 💧 ☀️ 🍎 good; 👩‍🍼 🍜 mixed-subject avoid. **No emoji as rewards** — semantic pictures only.
- **Letters are sounds, not names, where possible** — set `sound` to something a native speaker would say; record `audioUrl` when you can. Device TTS is only the bridge.
- **Numbers:** include the digit glyph of your script (`char`), value in Western numerals for indexing.
- **Words:** 5–20 daily-life words/concepts to start. Concrete nouns + verbs people actually say at home.
- **Variants, not verdicts:** don't police dialects; list them with `region`.
- **Legal:** your contribution is licensed **CC-BY-SA 4.0** together with pack content (code stays MIT). No personal data, no external trackers, no executable anything — the schema rejects everything but content.

## Validation

```bash
npm ci --legacy-peer-deps --install-strategy=hoisted
npm run validate:content   # zod-checks every pack in content-packs/
```

Or paste your JSON into the app (Grown-ups → Community language packs) — it's the same validator.
