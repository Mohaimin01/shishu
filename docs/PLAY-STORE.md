# Google Play launch checklist (P2)

Path chosen by the board: ship the **web app + side-load APK** first, submit to Play
when the demo recording and listing assets exist. Note Play's account quota: once the
Play Console fee ($25, one-time) is paid, an org/person **without a Play-linked app
history** may be required to run a 20-tester × 14-day closed test before production —
budget ~3 weeks for that lane, or start the closed test early.

## 1. Assets

- [ ] App icon 512×512 (existing generative 192/512 already cover favicon/PWA)
- [ ] Feature graphic 1024×500 (calm, no text spam: 🌱 + app name + "Learn gently")
- [ ] 4–8 phone screenshots (color canvas, tracing, bridge lane, parent dashboard)
- [ ] 30–60s demo video (screen-record the tracing fix + bridge lane + two-strike glow)
- [ ] Short description ≤80 chars: *"Gentle multilingual first-words play — offline, no ads, made for ages 2–6."*
- [ ] Full description (lead with: your language belongs to your family; community packs; board-guided design)

## 2. Policies (must be answered exactly)

- [ ] **Data safety form:** "No data collected, no data shared" — true today (all data IndexedDB/localStorage on device; no accounts, no analytics, no ads SDK)
- [ ] **Ads declaration:** "No ads" (no AdSense now/ever; sponsor slots are post-level and only after direct contact)
- [ ] **Content rating questionnaire:** expect Everyone/IARC generic (education)
- [ ] **Families policy / target age:** audience includes under-13 → fill **Families** section, declare no behavioral ads, no in-app purchases other than donation links outside the app (donation buttons should NOT be in the child UI; keep them on the parent screen only)
- [ ] **Privacy policy URL:** host `docs/privacy.md` on the site (plain words: nothing leaves your device)
- [ ] **Accounts:** none required — no removed-features-if-not-signed-in disclosures needed
- [ ] **App signing:** debug-signed APK is *not* uploadable to Play; release on tag must produce `bundletool`/`flutter`-style signed AAB (Capacitor: `ionic capacitor build android && ./gradlew bundleRelease` with a keystore generated and stored safely by the owner)

## 3. Technical

- [ ] `applicationId` final (`com.mohaimin01.shishu` or similar)
- [ ] Version codes bump per tag; extend `release.yml` beyond `assembleDebug` to a signed `bundleRelease` (AAB)
- [ ] Target SDK = current Play requirement (API 34+ at writing)
- [ ] Test app cold-start offline (airplane mode) — PWA cache must hydrate the shell
- [ ] Family-voice recorder: verify mic **permission dialog** text reads app-scoped and Play-acceptable ("used to record your own voice; stays on device")

## 4. Release notes template

```
v0.x — <date>
• New: <sentence strips / listen & repeat / family voices / <lang> pack>
• Smoother tracing; gentle stop screens
• 0 ads · 0 trackers · works offline
বাংলা: নতুন ভাষা প্যাক যোগ করুন — Grown-ups → Community packs
```

## 5. Non-Play distribution (keep forever, zero cost)

- GitHub Releases APK (see `docs/INSTALL.md`) — for Play-Protected and global phones
- PWA install prompt — the primary install path
- F-Droid: consider metadata later (FOSSDiff tooling) — not urgent

## 6. Enabling cloud save (Play Games / Game Center)

The code side already ships: `apps/web/lib/cloudSync.ts` detects the plugins at runtime, snapshots
progress (a backup file **minus family voice recordings** — voices never leave the device), and the
Grown-ups screen shows sign-in / save / restore / sign-out when a provider exists. On web — and until
the plugins are bundled — it says so honestly and points at the backup file. To turn the buttons on:

1. **Version match first.** The existing plugins target older Capacitor majors:
   `@codetrix-studio/capacitor-google-auth`-line Google Play Games plugins are Capacitor 5/8-era;
   this repo's shell is Capacitor 6. Either pin a compatible fork or upgrade the shell in one
   dedicated PR — do **not** force-install mismatched plugins into `apps/web/android`, it breaks the
   release build in ways CI cannot catch locally.
2. **Android:** add `@codetrix-studio/capacitor-google-play-games` (or equivalent), register the app's
   SHA-1 fingerprint in Play Console, enable Play Games Services for the app, and wire the plugin's
   `signIn` / `save` / `load` / `signOut` to the calls `cloudSync.ts` already makes
   (plugin names: `GooglePlayGames`, `GameCenter`).
3. **iOS:** a GameKit wrapper plugin named `GameCenter` with the same four methods.
4. **Sync scope stays the snapshot:** everything except `familyaudio`. `validateCloudSnapshot`
   refuses any snapshot that carries recordings — keep that guarantee in the native layer too.
5. Then flip the data-safety note in §2 only if the platform's own storage changes the answers
   (Play Games Saved Games / iCloud hold the snapshot, not us — our server still tracks nothing).
