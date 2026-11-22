"use client";

import { useRef, useState } from "react";
import {
  SCRIPT_LABEL, detectScript, parseLexiconTsv, templateTsv,
  type Concept, type LexiconLanguage, type ScriptId,
} from "@shishu/core";
import { removeCustomLanguage, saveCustomLanguage, type LangMeta } from "@/lib/lexicon";

const REPO = "https://github.com/Mohaimin01/shishu";

function download(name: string, text: string, type = "text/tab-separated-values") {
  const url = URL.createObjectURL(new Blob([`\uFEFF${text}`], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Any language in the world: download a worksheet, fill the last column, paste it back. */
export default function AddLanguage({ concepts, metas, english, onAdded, onRemoved }: {
  concepts: Concept[];
  metas: LangMeta[];
  english?: LexiconLanguage;
  onAdded: (code: string) => void;
  onRemoved: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nativeName, setNativeName] = useState("");
  const [script, setScript] = useState<ScriptId>("latin");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const custom = metas.filter((m) => m.custom);

  const save = async () => {
    setMsg(null);
    const c = code.trim().toLowerCase();
    if (!/^[a-z]{2,8}(-[a-z0-9]{2,8})?$/.test(c)) return setMsg({ ok: false, text: "Language code: 2–8 letters, e.g. \"sw\" or \"syl\"." });
    if (metas.some((m) => m.code === c && !m.custom)) return setMsg({ ok: false, text: `"${c}" is already built in — pick another code (e.g. "${c}-2").` });
    if (!name.trim() || !nativeName.trim()) return setMsg({ ok: false, text: "Please fill both names." });
    const { lang, problems } = parseLexiconTsv(
      { code: c, name: name.trim(), nativeName: nativeName.trim(), script, rtl: script === "arabic" || script === "hebrew" },
      text,
    );
    const known = new Set(concepts.map((x) => x.id));
    const stray = Object.keys(lang.entries).filter((id) => !known.has(id));
    for (const id of stray) delete lang.entries[id];
    const n = Object.keys(lang.entries).length;
    if (n === 0) return setMsg({ ok: false, text: problems[0] ?? "No words found — fill the last column of the worksheet first." });
    // sanity check: the declared script should match what was typed
    const sample = Object.values(lang.entries)[0]?.[0]?.text ?? "";
    const seen = detectScript(sample);
    if (script !== "other" && seen !== script) {
      return setMsg({ ok: false, text: `The words look like ${SCRIPT_LABEL[seen]} but you chose ${SCRIPT_LABEL[script]}. Please check the script.` });
    }
    await saveCustomLanguage(lang);
    setMsg({
      ok: true,
      text: `${lang.nativeName}: ${n} of ${concepts.length} meanings saved on this device.${problems.length ? ` (${problems.length} lines skipped)` : ""}`,
    });
    setText("");
    onAdded(c);
  };

  return (
    <div className="grid gap-4 text-sm">
      <p className="text-muted">
        Add <strong>any language</strong> — yours, your grandmother&apos;s, a dialect. Download the worksheet, fill in the
        last column (most used word first, <code>;</code> between synonyms, and <code>|romanisation</code> so learners can read it),
        then paste it here. It stays on your device.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="min-h-[44px] px-4 rounded-2xl bg-bg ring-1 ring-text/10"
          onClick={() => download("shishu-words-template.tsv", templateTsv(concepts, english))}
        >
          ⬇ Download blank worksheet
        </button>
        <a className="min-h-[44px] px-4 rounded-2xl bg-bg ring-1 ring-text/10 flex items-center" href={`${REPO}/blob/main/docs/WORDS.md`} target="_blank" rel="noreferrer">
          How to share it with everyone →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="code (sw, syl…)" className="min-h-[44px] rounded-xl bg-bg px-3 ring-1 ring-text/10" aria-label="language code" />
        <select value={script} onChange={(e) => setScript(e.target.value as ScriptId)} className="min-h-[44px] rounded-xl bg-bg px-3 ring-1 ring-text/10" aria-label="script">
          {(Object.keys(SCRIPT_LABEL) as ScriptId[]).map((s) => <option key={s} value={s}>{SCRIPT_LABEL[s]}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="English name (Swahili)" className="min-h-[44px] rounded-xl bg-bg px-3 ring-1 ring-text/10" aria-label="English name" />
        <input value={nativeName} onChange={(e) => setNativeName(e.target.value)} placeholder="Its own name (Kiswahili)" className="min-h-[44px] rounded-xl bg-bg px-3 ring-1 ring-text/10" aria-label="native name" />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"concept\tmeaning\twords\nwater\twater\tmaji|maji\n…"}
        className="rounded-2xl bg-bg p-3 ring-1 ring-text/10 font-mono text-xs"
        aria-label="filled worksheet"
      />
      <div className="flex flex-wrap gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept=".tsv,.txt,text/tab-separated-values,text/plain"
          className="hidden"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = ""; }}
        />
        <button className="min-h-[44px] px-4 rounded-2xl bg-bg ring-1 ring-text/10" onClick={() => fileRef.current?.click()}>📄 Choose file…</button>
        <button className="btn-primary min-h-[44px] px-5 text-base" onClick={save}>Save language</button>
      </div>
      {msg && <p role="status" className={msg.ok ? "text-success" : "text-red-700"}>{msg.text}</p>}

      {custom.length > 0 && (
        <ul className="grid gap-1">
          {custom.map((m) => (
            <li key={m.code} className="flex items-center justify-between bg-bg rounded-xl px-3 py-2">
              <span>{m.nativeName} <span className="text-muted">({m.code}) · on this device</span></span>
              <button className="text-muted underline" onClick={async () => { await removeCustomLanguage(m.code); onRemoved(m.code); }}>remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
