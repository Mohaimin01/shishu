# Installing Shishu on a phone (side-load guide)

Shishu is a web app first — **install the PWA**, that's all most families need.

## Android (phone or tablet)

### Option A — Install as an app (recommended, no files needed)

1. Open **https://mohaimin01.github.io/shishu/** in Chrome.
2. Tap the **⋮ menu** → **Add to Home screen** (or "Install app").
3. Confirm. The Shishu icon appears on your home screen like a normal app.
4. Open it once while online — after that it works fully **offline** ([bengali: ইন্টারনেট ছাড়াও চলবে]).

### Option B — Install the APK (for phones without Play, or Play-Protected devices)

The APK is built automatically on every release tag.

1. Open **github.com/Mohaimin01/shishu/releases** in your phone browser.
2. Download **shishu-debug.apk** from the latest release.
3. Tap the downloaded file. Android will warn: *"Play Protect can't verify this app."*
   - Tap **More details** (or **Settings**) → **Install anyway / Still install**.
   - You may be asked to allow *"Install unknown apps"* for your browser — allow it once.
4. Open Shishu from your app drawer.

> Why two options? The APK is a wrapper around the same offline web app for families
> whose phones family-share only installed apps. Both are free, both carry zero ads,
> and neither asks for accounts, contacts, or storage permissions (microphone is only
> used if *you* start recording a family voice, and recordings never leave the phone).

### Language packs

New community languages are added in the app itself:
**Grown-ups → Community language packs → paste a pack URL**.
See `docs/PACKS.md` to contribute a language.

## iOS / iPadOS

Open the site in Safari → **Share** → **Add to Home Screen**. Offline works after the first visit. (There is no TestFlight/Signed build yet — planned in the Play listing milestone.)

## Desktop / laptop

The site just works in any browser. For Chrome, the ⋮ menu offers **Install** too.
