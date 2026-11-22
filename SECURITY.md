# Security Policy

Shishu is built for children, so trust is the product. We take reports seriously and respond quickly.

## Supported versions

Only the latest release (the deployed PWA on GitHub Pages and the newest APK tagged in Releases) is supported. The app is a static, client-side export — there is no server and no database to secure.

## Reporting a vulnerability

Please do **not** open a public issue for anything exploitable.

- Use GitHub's **private security advisory** for this repository: Security → Report a vulnerability.
- If you cannot use advisories, email the maintainer via the contact on the GitHub profile.

Include the page/URL, what you did, what you expected, and a screenshot or log if possible. You will get a first reply within 7 days and a fix or a mitigation plan within 30 days for confirmed issues. We credit reporters by name in the release notes unless you ask to stay anonymous.

## What we promise about privacy (by design)

- **No accounts, no sign-up, no analytics, no ads, no third-party trackers.** There is no server that could leak data, because none exists.
- All progress, family voice recordings, and downloaded language packs live in the browser's IndexedDB **on the device only**. Nothing is uploaded.
- The microphone is used only in opt-in features ("Say it together", family voice recorder); recordings stay in RAM or IndexedDB and are never transmitted.
- "Erase progress on this device" (Grown-ups screen) wipes all local data; uninstalling the PWA/APK also clears it.

## In scope

- Cross-site scripting or logic injection through downloaded `pack.json` content or lexicon paste input (packs are zod-validated, but if you can bypass the schema, that is a real bug).
- Service-worker or cache issues that would serve a child content from a source other than what the family installed.
- The Capacitor WebView bridge on Android (IPC, intent handling, mixed content).
- Anything that lets a child reach external content without a grown-up (external links, downloaded pack URLs are parent-gated).

## Out of scope

- Compromised devices or browsers (rooted phones, malicious extensions).
- Traffic analysis by whoever controls the network — the app loads from GitHub Pages and optionally from pack URLs the grown-up pastes.
- Missing rate limits or "user enumeration" — there are no users.

## Data safety summary for app-store review

No data collected. No data shared. No data required. Optional user content (voice recordings, added languages, downloaded packs) is stored locally and deletable in-app.
