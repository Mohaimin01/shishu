# Fonts

All fonts are self-hosted so the app stays offline-certain (canvas letter tracing needs
the real font file locally — `document.fonts.load()` in `lib/audio.ts` forces the exact
family for each glyph before rasterizing).

| File | Script / language | Source |
| --- | --- | --- |
| `nunito-variable-latin.woff2` | Latin (all latin-script languages) | Google Fonts, Nunito |
| `noto-bengali-variable-bengali.woff2` | Bengali (bn) | Google Fonts, Noto Sans Bengali |
| `noto-devanagari-variable-devanagari.woff2` | Devanagari (hi) | Google Fonts, Noto Sans Devanagari |
| `noto-arabic-variable-arabic.woff2` | Arabic (ar, ur) | Google Fonts, Noto Sans Arabic |
| `noto-sans-variable-cyrillic.woff2` | Cyrillic (ru) | Google Fonts, Noto Sans (Cyrillic subset) |
| `noto-sans-sc-variable-han.woff2` | Han characters (zh) | Google Fonts, Noto Sans SC — subset to the pack + lexicon characters |
| `noto-sans-jp-variable-kana.woff2` | Kana + kanji (ja) | Google Fonts, Noto Sans JP — subset to the pack + lexicon characters |

Noto and Nunito are licensed under the SIL Open Font License — redistribution and
subsetting are permitted. <https://openfontlicense.org>
