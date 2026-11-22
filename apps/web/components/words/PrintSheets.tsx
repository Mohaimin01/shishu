"use client";

import { pageGroups, type Row, type ScriptId } from "@shishu/core";
import type { LangMeta } from "@/lib/lexicon";
import WordTable from "./WordTable";

/**
 * Print-ready sheets. With many languages the columns are split across sheets and the learner's
 * own language is repeated on every sheet, so each page stands on its own.
 */
export default function PrintSheets({ rows, columns, metas, readable, showRoman, perSheet, rowsPerSheet, firstRank }: {
  rows: Row[];
  columns: string[];
  metas: Record<string, LangMeta>;
  readable: ScriptId[];
  showRoman: boolean;
  perSheet: number;
  rowsPerSheet: number;
  firstRank: number;
}) {
  const groups = pageGroups(columns, perSheet);
  const chunks: Row[][] = [];
  for (let i = 0; i < rows.length; i += rowsPerSheet) chunks.push(rows.slice(i, i + rowsPerSheet));
  const sheets = chunks.flatMap((chunk, ci) => groups.map((g, gi) => ({ chunk, ci, g, gi })));
  const total = sheets.length;
  const name = (c: string) => metas[c]?.name ?? c;

  return (
    <div>
      {sheets.map(({ chunk, ci, g, gi }, n) => {
        const start = firstRank + ci * rowsPerSheet;
        const sub = chunk.map((r) => ({ ...r, cells: r.cells.filter((c) => g.includes(c.langCode)) }));
        return (
          <section
            key={`${ci}-${gi}`}
            className="print-sheet bg-surface rounded-3xl shadow-sm p-5 mb-6 print:shadow-none print:rounded-none print:p-0 print:mb-0"
            aria-label={`sheet ${n + 1} of ${total}`}
          >
            <header className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold">Word Rows · {g.map(name).join(" · ")}</h2>
              <p className="text-xs text-muted">rows {start}–{start + chunk.length - 1} · sheet {n + 1}/{total}</p>
            </header>
            <WordTable rows={sub} metas={metas} readable={readable} showRoman={showRoman} startRank={start} interactive={false} />
            <footer className="mt-3 text-[10px] text-muted flex justify-between">
              <span>Say each row out loud · most used meanings first · words in a box share one meaning</span>
              <span>shishu — free &amp; open source · mohaimin01.github.io/shishu</span>
            </footer>
          </section>
        );
      })}
    </div>
  );
}
