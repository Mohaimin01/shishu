# Shishu — Expert Board Review 1 (2026-11-06)

Board: Prof. Anisur Rahman (Education Specialist) · Dr. Farhana Karim (Child Psychologist) · Rahim Uddin (Marketing) · Sultana Begum (Parenting Expert)
Scope of review: shipped M1 kit (color/trace/tap-sound/match, Dexie progress, session cap, parent dashboard), tracing-completion fix, EN+BN packs, pagination-free PWA on GitHub Pages, APK-on-tag release flow, donation model.

> Round 4 (multi-language-at-once, online pack downloads, "best teacher", words & sentences) is being deliberated — verdicts will be appended when the agenda settles.

## Verdicts agreed in Round 3

| # | Topic | Dispute | Result |
|---|-------|---------|--------|
| 1 | Letter audio | sounds vs names; TTS vs recordings | Keep device TTS now (bridge). M2: real phoneme recordings per pack + "family voice recorder" feature. Task design carries the mapping either way. |
| 2 | Wrong-answer hint | reveal or not | **Two-strike rule:** wrong #1 → silent re-listen (no visual hint); wrong #2 → gentle glow on correct card. No shame states, no streak penalties. |
| 3 | Emoji visuals | photo vs emoji | Keep emoji v1 as placeholders only; schema gains `image` field so illustration PRs drop in without code changes. No emoji used as rewards. |
| 4 | Mastery wording | exposure ≠ mastery; drill pressure | DB keeps honest mastery math; parent dashboard shows qualitative tiers (শেখা শুরু → ভালো ভালো → পারা হয়েছে) instead of "mastered %". Accuracy shown only for graded activities and only from ~age 4. |
| 5 | Session cap | relevance and framing | Keep 15-min default + gentle wind-down. Rename to "learning minutes"; add hide-number toggle for households where visible minutes invite judgement. |
| 6 | Distribution | Play Store vs side-load | Play listing ($25 one-time, no ad SDK) + illustrated Bengali side-load guide + 60s demo video. PWA remains flagship. |
| 7 | Concept tables | default dialect vs variants | M2: first-run family word picker (identity = default); variants shown respectfully ("এটাকে আরেক বাড়িতে বলে…") only after mastery threshold — never as correction. |
| 8 | Toddler UX | autonomy | M1.1 hotfix: one-tap "▶ Continue" on home resumes last activity. |
| 9 | Monetization | purity vs revenue | Donation model unchanged. School/NGO co-branding lane allowed (attribution only, still ad-free). No AdSense ever. |
| 10 | Tracing fix | — | Approved by all four. Keep shape-following (28px tolerance, ~70% similarity). Do not re-tighten. |

## Build backlog (from the board, ordered)

- 🔴 P0 — One-tap "Continue" on home (psychologist)
- 🔴 P0 — Two-strike wrong-answer rule (psych + education)
- 🟠 P1 — Parent dashboard language redesign: qualitative tiers, hideable minutes, full-Bangla strings for guardians
- 🟠 P1 — Audio path: phoneme text for TTS in packs; `audioUrl` slots populated by native recordings; family-voice recorder (M2)
- 🟠 P1 — First-run family-word picker for concept items + respectful variant display (M2)
- 🟡 P2 — Play Store listing + side-load guide with screenshots + demo video (marketing)
- 🟡 P2 — `image` field + illustration contribution guide (marketing hook)
- 🟡 P2 — Bengali UI strings complete in Parent dashboard

## Logged risks (monitored, not fixed)

- Cheap Androids without a Bengali TTS voice → tap-sound silently degraded in bn (currently degrades gracefully; surface a parent-facing hint in M2).
- Play-Protect warning kills most side-load installs among non-technical guardians until the guide/listing exists.
- "Shishu" name collision in store search → listing title should be "Shishu — Bengali Kids Learning".
- 3-language simultaneous use thins exposure minutes per language per day → dose framing must be honest (app seeds vocabulary/phonology; environment grows it).
