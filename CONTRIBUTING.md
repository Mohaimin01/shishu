# Contributing to Shishu

Thank you for helping children learn gently. 🌱

## Adding a language pack

1. Create `content-packs/{code}/` (ISO 639-1 code, e.g. `es`).
2. Add `pack.json` following the schema in `packages/content-schema/src/pack.ts`.
3. Add audio files under `content-packs/{code}/audio/` (native speakers preferred).
4. Run `pnpm validate:content`.
5. Open a PR. A native-speaker maintainer will review.

## Content guidelines

- Use real human voices, not TTS, for early learners.
- Keep prompts short and concrete.
- Prefer high-frequency, concrete nouns first (water, eat, mother, sun).
- For concept tables, include regional variants and synonyms with region tags.
- All images must be open-licensed (OpenMoji, Twemoji, or original).

## Code contributions

- `pnpm lint && pnpm typecheck && pnpm test` must pass.
- Follow the low-stimulation design rules (muted palette, slow motion, no flashing).
- Add tests for new logic in `packages/`.

## Code of Conduct

Be kind. This project serves children and families worldwide.
