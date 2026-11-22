# Shishu 🌱

**Gentle multilingual learning for children (ages 2–12).**

[![CI](https://github.com/Mohaimin01/shishu/actions/workflows/ci.yml/badge.svg)](https://github.com/Mohaimin01/shishu/actions/workflows/ci.yml)
[![Deploy to Pages](https://github.com/Mohaimin01/shishu/actions/workflows/deploy.yml/badge.svg)](https://github.com/Mohaimin01/shishu/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-6B9080.svg)](./LICENSE)
[![Content: CC BY-SA 4.0](https://img.shields.io/badge/content-CC_BY--SA_4.0-lightgrey.svg)](./docs/PACKS.md)

Shishu ("child" in Bengali/Sanskrit) is a calm, low-stimulation learning app that grows with your child — from coloring letters at age 2 to conversational phrases and gentle science at age 12. It supports any mother tongue plus additional languages, and includes a unique **concept-table** method for learning regional variants and synonyms together.

- 🆓 Free & open source (MIT code, CC BY-SA 4.0 content)
- 📴 Works offline (PWA)
- 📱 Android APK available
- 🚫 No ads by default; no tracking; no accounts required
- 🎨 Low-stimulation design (muted colors, slow motion, session caps)
- 🌍 Multilingual: English, Bangla, and growing

## Live (free GitHub Pages)

**https://mohaimin01.github.io/shishu/**

Deploys automatically on every push to `main` (static export, no server, no cost).
Android APK: push a tag like `v0.1.0` and GitHub Actions publishes an installable APK to Releases.

## Word Rows — for older children and adults 🌍

**/words** shows one meaning per row in many languages side by side — your own language first, most used
meanings first, every synonym grouped in its cell (Bengali *water*: পানি, বারি, জল). Choose any number of
languages, choose which letters you can read (Bengali, English, Hindi… words are shown in letters you
understand), study a few rows a day, and **print** the tables (many languages are split across sheets).
Add any language with a spreadsheet-style worksheet — see [docs/WORDS.md](./docs/WORDS.md).

## Quick start

Requires Node.js 20+. The package manager is npm (CI and `package-lock.json` are npm-based):

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # run all tests
npm run build      # static export to apps/web/out
```

Content checks: `npm run validate:content` (pack schema) and `npm run validate:lexicon` (word lists).

## Project structure

- `apps/web` — the Next.js PWA (App Router, static export, Capacitor shell for Android)
- `packages/core` — stages, spaced repetition, words logic
- `packages/content-schema` — zod schema + validation for language packs
- `content-packs/` — bundled language packs and the Word Rows lexicon
- `docs/` — guides and expert-board reviews
- `scripts/` — lexicon copy/validation helpers

## Contributing

We welcome language packs! See [docs/PACKS.md](./docs/PACKS.md). Adding a language = a JSON file (+ optional audio) + a PR — or paste a hosted `pack.json` URL right in the app (Grown-ups → Community language packs).

## Guides

- Install on a phone: [docs/INSTALL.md](./docs/INSTALL.md) — PWA or side-load APK
- Google Play launch checklist: [docs/PLAY-STORE.md](./docs/PLAY-STORE.md)

## Monetization

Free and ad-free by default. Optional donations via GitHub Sponsors.

**Ad policy:** No annoying ads, no AdSense auto-injection, no tracking. If a sponsor directly contacts us, a single harmless placement may appear after a level completes (never blocking the activity or screen). Default: no ads at all.

## License

Code: MIT. Content (language packs): CC BY-SA 4.0.
