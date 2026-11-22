"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildRows, columnOrder, rowsToCsv, type Concept, type LexiconLanguage,
} from "@shishu/core";
import { loadCatalogue, loadLanguage, type LangMeta } from "@/lib/lexicon";
import { useWords } from "@/lib/wordsStore";
import { useGamify, levelOf } from "@/lib/gamify";
import SetupPanel from "@/components/words/SetupPanel";
import WordTable from "@/components/words/WordTable";
import StudyMode from "@/components/words/StudyMode";
import PrintSheets from "@/components/words/PrintSheets";
import AddLanguage from "@/components/words/AddLanguage";

type Mode = "table" | "study" | "print";

export default function WordsPage() {
  const w = useWords();
  const g = useGamify();
  const lv = levelOf(g.xp);
  const [metas, setMetas] = useState<LangMeta[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [langs, setLangs] = useState<Record<string, LexiconLanguage>>({});
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("table");
  const [printAll, setPrintAll] = useState(true);
  const [rowsPerSheet, setRowsPerSheet] = useState(20);

  const refresh = useCallback(async () => {
    try {
      const cat = await loadCatalogue();
      setMetas(cat.metas);
      setConcepts(cat.concepts);
      const st = useWords.getState();
      const codes = new Set(cat.metas.map((m) => m.code));
      const native = codes.has(st.native) ? st.native : cat.metas[0]?.code ?? "en";
      const targets = st.targets.filter((t) => codes.has(t) && t !== native);
      if (native !== st.native || targets.length !== st.targets.length) st.set({ native, targets });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const columns = useMemo(() => columnOrder(w.native, w.targets), [w.native, w.targets]);
  const byCode = useMemo(() => Object.fromEntries(metas.map((m) => [m.code, m])), [metas]);

  // load the word lists for the chosen languages
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const code of columns) {
        const meta = byCode[code];
        if (!meta || langs[code]) continue;
        try {
          const l = await loadLanguage(meta);
          if (alive) setLangs((cur) => ({ ...cur, [code]: l }));
        } catch (e) {
          if (alive) setError(`Could not load ${meta.name}: ${e instanceof Error ? e.message : e}`);
        }
      }
    })();
    return () => { alive = false; };
  }, [columns, byCode, langs]);

  const known = useMemo(() => new Set(w.known), [w.known]);
  const ready = columns.every((c) => langs[c]);

  const allRows = useMemo(
    () => (ready ? buildRows(concepts, langs, {
      native: w.native, targets: w.targets, readable: w.readable,
      maxSynonyms: w.maxSynonyms || Infinity,
    }) : []),
    [ready, concepts, langs, w.native, w.targets, w.readable, w.maxSynonyms],
  );
  const shown = useMemo(() => (w.hideKnown ? allRows.filter((r) => !known.has(r.concept.id)) : allRows), [allRows, known, w.hideKnown]);

  const size = w.pageSize || shown.length || 1;
  const pages = Math.max(1, Math.ceil(shown.length / size));
  const page = Math.min(w.page, pages - 1);
  const pageRows = shown.slice(page * size, page * size + size);

  const names = Object.fromEntries(metas.map((m) => [m.code, m.nativeName]));
  const exportCsv = () => {
    const csv = rowsToCsv(shown, names);
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shishu-word-rows.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const tabs: { id: Mode; label: string }[] = [
    { id: "table", label: "Table" },
    { id: "study", label: "Study" },
    { id: "print", label: "Print" },
  ];

  return (
    <main className="min-h-screen px-4 pb-16 max-w-[1100px] mx-auto">
      <header className="flex items-center justify-between pt-4 pb-3 print:hidden">
        <Link href="/" className="w-12 h-12 rounded-2xl bg-surface shadow-sm flex items-center justify-center text-xl" aria-label="back home">←</Link>
        <div className="text-center">
          <h1 className="text-xl font-bold">Word Rows</h1>
          <p className="text-xs text-muted">one meaning · many languages · side by side</p>
        </div>
        <div className="w-12 flex flex-col items-center justify-center" aria-label="garden progress">
          <span className="text-sm font-bold" aria-label={`${g.xp} seeds`}><span aria-hidden>🌱</span> {g.xp}</span>
          {g.streak > 0 && (
            <span className="text-[11px] font-semibold text-muted" aria-label={`${g.streak} day streak`}>
              <span aria-hidden>🔥</span> {g.streak}d
            </span>
          )}
        </div>
      </header>

      {error && <p role="alert" className="text-red-700 text-center py-3 print:hidden">{error}</p>}

      <div className="grid gap-4 print:hidden">
        <details open className="bg-surface rounded-3xl shadow-sm p-4">
          <summary className="font-bold cursor-pointer min-h-[40px] flex items-center">My languages & letters</summary>
          <div className="pt-3">
            {metas.length > 0 && <SetupPanel metas={metas} order={columns} />}
          </div>
        </details>

        <div className="flex flex-wrap gap-2 items-center" role="tablist" aria-label="view">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => setMode(t.id)}
              className={`px-5 min-h-[48px] rounded-2xl text-base font-semibold transition duration-gentle active:scale-95 ${
                mode === t.id ? "bg-primary text-white" : "bg-surface text-text shadow-sm"
              }`}
            >
              {t.label}
            </button>
          ))}
          <span className="text-xs text-muted ml-auto">
            {columns.length} languages · {allRows.length} rows · {w.known.length} learned
            <span title={`garden: ${lv.level.emoji} ${lv.level.name}`}> · <span aria-hidden>🌱</span> {g.xp}</span>
          </span>
        </div>

        {mode !== "study" && (
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <label className="flex items-center gap-2">Words per meaning
              <select value={w.maxSynonyms} onChange={(e) => w.set({ maxSynonyms: Number(e.target.value), page: 0 })} className="min-h-[40px] rounded-xl bg-surface px-2 ring-1 ring-text/10">
                <option value={0}>all synonyms</option><option value={1}>most used only</option><option value={2}>top 2</option>
              </select>
            </label>
            {mode === "table" && (
              <label className="flex items-center gap-2">Rows
                <select value={w.pageSize} onChange={(e) => w.set({ pageSize: Number(e.target.value), page: 0 })} className="min-h-[40px] rounded-xl bg-surface px-2 ring-1 ring-text/10">
                  <option value={10}>10</option><option value={20}>20</option><option value={40}>40</option><option value={0}>all</option>
                </select>
              </label>
            )}
            <label className="flex items-center gap-2"><input type="checkbox" checked={w.hideKnown} onChange={(e) => w.set({ hideKnown: e.target.checked, page: 0 })} className="w-5 h-5 accent-[#6B9080]" />hide learned</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={w.showRoman} onChange={(e) => w.set({ showRoman: e.target.checked })} className="w-5 h-5 accent-[#6B9080]" />show pronunciation</label>
          </div>
        )}
      </div>

      <div className="mt-4">
        {!ready && !error && <p className="text-center text-muted py-10 print:hidden">Loading words…</p>}

        {ready && mode === "table" && (
          <>
            <WordTable
              rows={pageRows} metas={byCode} readable={w.readable} showRoman={w.showRoman}
              known={known} onToggleKnown={w.toggleKnown}
              startRank={page * size + 1}
            />
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button disabled={page === 0} onClick={() => w.set({ page: page - 1 })} className="min-h-[48px] px-5 rounded-2xl bg-surface shadow-sm disabled:opacity-40">← earlier</button>
                <span className="text-sm text-muted">page {page + 1} / {pages}</span>
                <button disabled={page >= pages - 1} onClick={() => w.set({ page: page + 1 })} className="min-h-[48px] px-5 rounded-2xl bg-surface shadow-sm disabled:opacity-40">more →</button>
              </div>
            )}
          </>
        )}

        {ready && mode === "study" && (
          <StudyMode
            rows={allRows} metas={byCode} readable={w.readable} showRoman={w.showRoman}
            known={known} rowsPerDay={w.rowsPerDay}
            onPerDay={(n) => w.set({ rowsPerDay: n })}
            onKnown={(id) => { if (!known.has(id)) w.toggleKnown(id); }}
          />
        )}

        {ready && mode === "print" && (
          <>
            <div className="bg-surface rounded-3xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center text-sm print:hidden">
              <label className="flex items-center gap-2">Languages per sheet
                <select value={w.perSheet} onChange={(e) => w.set({ perSheet: Number(e.target.value) })} className="min-h-[40px] rounded-xl bg-bg px-2 ring-1 ring-text/10">
                  {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">Rows per sheet
                <select value={rowsPerSheet} onChange={(e) => setRowsPerSheet(Number(e.target.value))} className="min-h-[40px] rounded-xl bg-bg px-2 ring-1 ring-text/10">
                  {[10, 15, 20, 25, 30].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={printAll} onChange={(e) => setPrintAll(e.target.checked)} className="w-5 h-5 accent-[#6B9080]" />all rows (not just this page)</label>
              <button onClick={() => window.print()} className="btn-primary min-h-[48px] px-5 text-base">🖨 Print / save as PDF</button>
              <button onClick={exportCsv} className="min-h-[48px] px-5 rounded-2xl bg-bg ring-1 ring-text/10">⬇ Spreadsheet (CSV)</button>
              <p className="w-full text-xs text-muted">Tip: in the print window choose “Save as PDF”, landscape, and turn on “background graphics”. Your own language is repeated on every sheet.</p>
            </div>
            <PrintSheets
              rows={printAll ? shown : pageRows}
              columns={columns} metas={byCode} readable={w.readable} showRoman={w.showRoman}
              perSheet={w.perSheet} rowsPerSheet={rowsPerSheet}
              firstRank={printAll ? 1 : page * size + 1}
            />
          </>
        )}
      </div>

      <details className="bg-surface rounded-3xl shadow-sm p-4 mt-6 print:hidden">
        <summary className="font-bold cursor-pointer min-h-[40px] flex items-center">Add any language</summary>
        <div className="pt-3">
          <AddLanguage
            concepts={concepts}
            metas={metas}
            english={langs.en}
            onAdded={async (code) => {
              await refresh();
              const st = useWords.getState();
              if (code !== st.native && !st.targets.includes(code)) st.set({ targets: [...st.targets, code] });
              setLangs((cur) => { const n = { ...cur }; delete n[code]; return n; });
            }}
            onRemoved={async (code) => {
              await refresh();
              const st = useWords.getState();
              st.set({ targets: st.targets.filter((t) => t !== code) });
              setLangs((cur) => { const n = { ...cur }; delete n[code]; return n; });
            }}
          />
        </div>
      </details>

      <p className="text-center text-xs text-muted mt-8 print:hidden">
        Word lists are community-made (CC BY-SA 4.0) and may contain mistakes —{" "}
        <a className="underline" href="https://github.com/Mohaimin01/shishu/blob/main/docs/WORDS.md" target="_blank" rel="noreferrer">help improve them</a>.
      </p>
    </main>
  );
}
