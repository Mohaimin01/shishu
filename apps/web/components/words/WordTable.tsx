"use client";

import type { Row, ScriptId } from "@shishu/core";
import type { LangMeta } from "@/lib/lexicon";
import WordCell from "./WordCell";

const BN = /[\u0980-\u09FF]/;

/** The side-by-side table. First column = the learner's own language. */
export default function WordTable({ rows, metas, readable, showRoman, known, onToggleKnown, startRank, interactive = true }: {
  rows: Row[];
  metas: Record<string, LangMeta>;
  readable: ScriptId[];
  showRoman: boolean;
  known?: ReadonlySet<string>;
  onToggleKnown?: (conceptId: string) => void;
  /** number shown for the first row (rows are numbered in learning order) */
  startRank?: number;
  interactive?: boolean;
}) {
  if (rows.length === 0) return <p className="text-muted text-center py-8">Nothing to show with these choices.</p>;
  const cols = rows[0].cells.map((c) => c.langCode);
  return (
    <div className="overflow-x-auto rounded-3xl bg-surface shadow-sm print:shadow-none print:rounded-none print:overflow-visible">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-text/10">
            <th scope="col" className="w-10 px-2 py-3 text-xs font-semibold text-muted text-center">#</th>
            {cols.map((code, i) => {
              const m = metas[code];
              const label = m?.nativeName ?? code;
              return (
                <th
                  key={code}
                  scope="col"
                  className={`px-3 py-3 text-sm font-bold align-bottom ${
                    i === 0 ? "bg-primary/10 text-text" : "text-text"
                  } ${BN.test(label) ? "font-bengali" : ""}`}
                >
                  {label}
                  {i === 0 && <span className="block text-[10px] font-normal text-muted">my language</span>}
                </th>
              );
            })}
            {onToggleKnown && <th scope="col" className="w-14 px-2 py-3 text-[10px] font-semibold text-muted text-center print:hidden">learned</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, n) => {
            const isKnown = known?.has(row.concept.id) ?? false;
            return (
              <tr
                key={row.concept.id}
                className={`border-b border-text/5 align-top break-inside-avoid ${isKnown ? "opacity-50" : ""}`}
              >
                <td className="px-2 py-3 text-xs text-muted text-center" title={row.concept.gloss}>
                  {(startRank ?? 1) + n}
                </td>
                {row.cells.map((cell, i) => (
                  <td key={cell.langCode} className={`px-3 py-3 ${i === 0 ? "bg-primary/5" : ""}`}>
                    <WordCell
                      cell={cell}
                      meta={metas[cell.langCode]}
                      showRoman={showRoman}
                      readable={readable}
                      interactive={interactive}
                    />
                  </td>
                ))}
                {onToggleKnown && (
                  <td className="px-2 py-3 text-center print:hidden">
                    <input
                      type="checkbox"
                      checked={isKnown}
                      onChange={() => onToggleKnown(row.concept.id)}
                      className="w-6 h-6 accent-[#6B9080]"
                      aria-label={`I have learned: ${row.concept.gloss}`}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
