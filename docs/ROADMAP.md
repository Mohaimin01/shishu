# Roadmap & positions

Where Shishu is going, and the decisions behind it.

## Progress tracking: local-first, forever

**Today:** everything (learning progress, minutes, Word Rows knowledge, garden seeds/streaks, family
voice recordings, downloaded packs) lives on this device. Nothing is uploaded; there is no server.
Moving devices works through **Grown-ups → Backup & restore** — one file you control.

**Why:** children's apps should not need accounts. A 4-year-old cannot consent to data collection,
and a server is a liability (costs, breaches, jurisdiction). We stay simple on purpose.

### The third-party sign-in question (Google Play Games / Game Center)

Requested and understood — "let people opt in to a user id through Google Play Games or Game Center,
so *their* platform holds the profile and our server still tracks nothing."

- **Android (Play Games Services):** feasible without our own server. The Capacitor shell
  (`apps/web/android`) can add the `@codetrix-studio/capacitor-google-play-games` plugin; sign-in
  returns a stable player id + server-side auth code. Progress sync would then use
  **Play Games Saved Games** (1–3 MB snapshot — enough for our JSON snapshot) stored on Google's
  infrastructure, not ours. Requirements before this can ship: a Play Console listing, the app's
  SHA-1 fingerprint registered, and the games SDK metadata. Roughly a focused week of native work.
- **iOS (Game Center):** similar via the native GameKit plugin (Capacitor or a wrapper app).
- **Web:** a real Google sign-in **needs a server** (the OAuth token exchange cannot be done in a
  static site). We will not add a server for this. Web users get the backup file instead.
- **Default stays local.** Sign-in would be strictly opt-in, in the grown-ups area, and never gates
  any content. A child without an account loses nothing.

Until then: the backup file is the honest, zero-infrastructure answer, and it works on every platform.

## Learning 20 languages

The Word Rows method scales to as many languages as a learner chooses (columns split across printed
sheets; study shows one row across all chosen languages). A "20 languages in a month" pace means
~3 rows/day per language family cluster — see the board review for the honest dose plan. The app
supports the ambition; the review documents what realistic expectations look like.

## Content growth

- More bundled languages: every one is one JSON pack + one lexicon TSV (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
- Dakuten kana, Tamil/Hangul alphabets, and more scripts in the tracing/colouring set.
- Recorded native audio per letter and word (`audioUrl` fields are ready and waiting for files).

## Engineering backlog (P0)

- Dose engine v2 (family-clustering aware), World Walk scene, multilingual passport — from the
  board review, in priority order.
