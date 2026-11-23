"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildRows, columnOrder, rowsToCsv, rowsToAnkiCsv, type Concept, type LexiconLanguage, type Row,
} from "@shishu/core";
import { loadCatalogue, loadLanguage, type LangMeta } from "@/lib/lexicon";
import { useWords } from "@/lib/wordsStore";
import { useGamify, levelOf } from "@/lib/gamify";
import { useReview, summarize } from "@/lib/review";
import { useBadges, computeBadgeStats } from "@/lib/badgesStore";
import { loadReadings } from "@/lib/readings";
import type { Reading } from "@shishu/core";
import SetupPanel from "@/components/words/SetupPanel";
import WordTable from "@/components/words/WordTable";
import StudyMode from "@/components/words/StudyMode";
import PrintSheets from "@/components/words/PrintSheets";
import AddLanguage from "@/components/words/AddLanguage";
import WordsStats from "@/components/words/WordsStats";
import ReviewQueue from "@/components/words/ReviewQueue";
import StoryRows from "@/components/words/StoryRows";
import ThemeMap from "@/components/words/ThemeMap";
import BadgeLine from "@/components/words/BadgeLine";

type Mode = "table" | "study" | "review" | "read" | "map" | "print";

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([`\uFEFF${body}`], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function WordsPage() {
  const w = useWords();
  const g = useGamify();
  const lv = levelOf(g.xp);
  const reviewCards = useReview((s) => s.cards);
  const dueCount = useMemo(() => summarize(reviewCards).due, [reviewCards]);
  const [metas, setMetas] = useState<LangMeta[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [langs, setLangs] = useState<Record<string, LexiconLanguage>>({});
  const [readings, setReadings] = useState<Reading[]>([]);
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

  // story files are static and tiny — load once
  useEffect(() => {
    let alive = true;
    loadReadings()
      .then((rs) => { if (alive) setReadings(rs); })
      .catch(() => { /* stories stay hidden offline; nothing breaks */ });
    return () => { alive = false; };
  }, []);

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
  const rowsById = useMemo(() => new Map(allRows.map((r) => [r.concept.id, r])), [allRows]);
  const shown = useMemo(() => (w.hideKnown ? allRows.filter((r) => !known.has(r.concept.id)) : allRows), [allRows, known, w.hideKnown]);

  const size = w.pageSize || shown.length || 1;
  const pages = Math.max(1, Math.ceil(shown.length / size));
  const page = Math.min(w.page, pages - 1);
  const pageRows = shown.slice(page * size, page * size + size);

  const names = Object.fromEntries(metas.map((m) => [m.code, m.nativeName]));

  // badges: evaluate on every meaningful change; the store only keeps the new visitors
  const syncBadges = useCallback(() => {
    const st = useWords.getState();
    const gm = useGamify.getState();
    const stats = computeBadgeStats({
      known: st.known, concepts, langs, columns, bestStreak: gm.bestStreak, gapDays: gm.gapDays,
    });
    useBadges.getState().sync(stats);
  }, [concepts, langs, columns]);
  useEffect(() => { if (ready) syncBadges(); }, [ready, syncBadges]);

  /** Marks a row learned (or unlearns it). Learning puts every non-empty cell in the review queue. */
  const learnRow = useCallback((conceptId: string) => {
    const st = useWords.getState();
    const wasKnown = st.known.includes(conceptId);
    st.toggleKnown(conceptId);
    if (wasKnown) return; // unlearning: nothing expires, the queue keeps its schedule
    const row = rowsById.get(conceptId);
    if (row) {
      useReview.getState().enqueueRow(row.cells.map((c) => ({
        conceptId: row.concept.id, langCode: c.langCode, empty: c.empty,
      })));
    }
    useGamify.getState().awardRaw(1);
    syncBadges();
  }, [rowsById, syncBadges]);

  /** A finished story feeds the words the learner just read (the story's language) to the queue. */
  const feedStory = useCallback((conceptIds: string[], lang: string) => {
    const review = useReview.getState();
    for (const id of conceptIds) {
      const row = rowsById.get(id);
      if (!row) continue;
      const cell = row.cells.find((c) => c.langCode === lang);
      if (cell && !cell.empty) {
        review.enqueueRow([{ conceptId: id, langCode: cell.langCode, empty: cell.empty }]);
      }
    }
    useGamify.getState().awardRaw(conceptIds.length);
    syncBadges();
  }, [rowsById, syncBadges]);

  const exportCsv = () => download("shishu-word-rows.csv", rowsToCsv(shown, names), "text/csv;charset=utf-8");
  const exportAnki = () => download("shishu-anki.csv", rowsToAnkiCsv(shown, w.native, names), "text/csv;charset=utf-8");

  const tabs: { id: Mode; label: string }[] = [
    { id: "table", label: "Table" },
    { id: "study", label: "Study" },
    { id: "review", label: "Review" },
    { id: "read", label: "Read" },
    { id: "map", label: "Map" },
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

      <div className="flex justify-center -mt-1 mb-2 print:hidden">
        <BadgeLine />
      </div>

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
              {t.id === "review" && dueCount > 0 && (
                <span className="ml-1.5 text-xs rounded-full bg-white/25 px-1.5 py-0.5">{dueCount}</span>
              )}
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

        {ready && mode !== "print" && mode !== "read" && (
          <WordsStats columns={columns} langNames={names} knownCount={w.known.length} totalRows={allRows.length} />
        )}
      </div>

      <div className="mt-4">
        {!ready && !error && <p className="text-center text-muted py-10 print:hidden">Loading words…</p>}

        {ready && mode === "table" && (
          <>
            <WordTable
              rows={pageRows} metas={byCode} readable={w.readable} showRoman={w.showRoman}
              known={known} onToggleKnown={learnRow}
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
            onKnown={learnRow}
          />
        )}

        {ready && mode === "review" && (
          <ReviewQueue
            rowsById={rowsById} metas={byCode} readable={w.readable} showRoman={w.showRoman}
            onGraded={syncBadges}
          />
        )}

        {ready && mode === "read" && (
          <StoryRows
            readings={readings.filter((r) => columns.includes(r.lang))}
            langs={langs} metas={byCode} readable={w.readable} showRoman={w.showRoman}
            rowsById={rowsById} onRead={feedStory}
          />
        )}

        {ready && mode === "map" && (
          <ThemeMap
            concepts={concepts} known={known} native={w.native} langs={langs} showRoman={w.showRoman}
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
              <button onClick={exportAnki} className="min-h-[48px] px-5 rounded-2xl bg-bg ring-1 ring-text/10" title="Front: your language · Back: the other languages — import into Anki as a Basic deck">🃏 Anki deck (CSV)</button>
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
