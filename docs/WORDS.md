# Word Rows — adding words & languages

Word Rows shows **one meaning per row** in many languages side by side, most used meanings first.
Each cell lists every word a language has for that meaning, most used first (e.g. Bengali *water*: পানি, বারি, জল).

You do **not** need to code. Everything is plain text files in `content-packs/lexicon/`.

## Add a whole new language (any language!)

1. In the app open **Word Rows → Add any language → Download blank worksheet**
   (or copy the file of a language you know, e.g. `content-packs/lexicon/es.tsv`).
2. Fill the last column. One line per meaning:

   ```
   water   water   maji|maji ; uji|uji|porridge
   ```
   - Separate synonyms with ` ; ` — **most used first**.
   - After the word you may add `|romanisation|note`. **Romanisation is required if your script isn't Latin**
     (so learners who can't read it can still read the word).
   - Leave lines empty if you don't know them. Someone else can add them later.
3. Try it on your device: paste it into **Add any language**. It is saved privately on your phone/computer.
4. Share it with everyone: on GitHub press **Add file → Create new file**, name it
   `content-packs/lexicon/<code>.tsv`, paste, and open a pull request. Add one entry to
   `content-packs/lexicon/languages.json`:
   `{ "code": "sw", "name": "Swahili", "nativeName": "Kiswahili", "script": "latin" }`.
   Scripts: `latin bengali devanagari arabic cyrillic han kana hangul tamil telugu gurmukhi gujarati thai greek hebrew`.
5. CI checks your file and tells you in plain words what to fix (`npm run validate:lexicon` does the same locally).

## Improve an existing language
Edit its `.tsv`: fix a word, add a synonym, reorder by how common it is, add `|region` notes such as `বারি|bari|Sylhet`.

## Help readers of other scripts
Add a spelling in another script with `script=spelling`, e.g. English for Bengali readers:
`water|bengali=ওয়াটার`. Hindi ⇄ Bengali letters are converted automatically.

## Add a new meaning (row)
Add a line to `concepts.tsv` (`rank  id  part-of-speech  English hint`). Rank = how commonly the meaning is used
(1 = most common). Then add the word to as many language files as you can.

## Rules
- Content is licensed **CC BY-SA 4.0**. Only add words you may share. No personal data.
- Don't police dialects: list them with a note (`|Sylhet`, `|formal`).
- The seed lists were written by an AI assistant and **need native-speaker review** — corrections are very welcome.
