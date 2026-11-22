"use client";

import { useEffect, useMemo, useState } from "react";
import { perDayFor, type Row, type ScriptId } from "@shishu/core";
import type { LangMeta } from "@/lib/lexicon";
import WordCell from "./WordCell";
import { fontClassForText } from "@/lib/script";
import { useGamify } from "@/lib/gamify";


/**
 * Study cards — memorise whole ROWS (one meaning in all your languages at once).
 * Your own language first; tap to reveal the rest; hear every word.
 */
export default function StudyMode({ rows, metas, readable, showRoman, known, rowsPerDay, onPerDay, onKnown }: {
  rows: Row[];
  metas: Record<string, LangMeta>;
  readable: ScriptId[];
  showRoman: boolean;
  known: ReadonlySet<string>;
  rowsPerDay: number;
  onPerDay: (n: number) => void;
  onKnown: (id: string) => void;
}) {
  const todo = useMemo(() => rows.filter((r) => !known.has(r.concept.id)), [rows, known]);
  const [session, setSession] = useState(0);
  const [queue, setQueue] = useState<string[]>(() => todo.slice(0, rowsPerDay).map((r) => r.concept.id));
  const [revealed, setRevealed] = useState(false);
  const [total, setTotal] = useState(queue.length);
  const [finished, setFinished] = useState(0);

  const byId = useMemo(() => new Map(rows.map((r) => [r.concept.id, r])), [rows]);
  const row = queue.length ? byId.get(queue[0]) : undefined;

  // BUG FIX: when the learner changes languages/filters, the old queue keeps ids that no longer
  // exist in the row set and the screen says "learned!" while nothing is shown. Re-seed the queue
  // from the current rows instead. `rows` is rebuilt by the parent only when the language set or
  // filters change, so this does not fire on every "I know it".
  useEffect(() => {
    const stillHere = queue.filter((id) => byId.has(id));
    if (stillHere.length === queue.length) return;
    const fresh = todo.filter((r) => !stillHere.includes(r.concept.id)).slice(0, rowsPerDay).map((r) => r.concept.id);
    const next = [...stillHere, ...fresh];
    setQueue(next);
    setTotal(next.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const restart = (n = rowsPerDay) => {
    const next = todo.filter((r) => !queue.includes(r.concept.id)).slice(0, n).map((r) => r.concept.id);
    setQueue(next);
    setTotal(next.length);
    setFinished(0);
    setRevealed(false);
    setSession((s) => s + 1);
  };

  const gotIt = () => {
    if (!row) return;
    onKnown(row.concept.id);
    useGamify.getState().awardRaw(1); // every learned row is a seed in the garden
    setQueue((q) => q.slice(1));
    setFinished((n) => n + 1);
    setRevealed(false);
  };
  const again = () => {
    setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q));
    setRevealed(false);
  };

  const monthRate = perDayFor(todo.length, 30);
  const label = (c: string) => metas[c]?.nativeName ?? c;

  return (
    <div className="grid gap-4 max-w-[560px] mx-auto" key={session}>
      <div className="bg-surface rounded-3xl shadow-sm p-4 grid gap-2">
        <label className="text-sm text-muted flex flex-wrap items-center gap-2">
          Rows per day
          <select
            value={rowsPerDay}
            onChange={(e) => { onPerDay(Number(e.target.value)); }}
            className="min-h-[40px] rounded-xl bg-bg px-3 ring-1 ring-text/10 text-text"
          >
            {[3, 5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={() => { onPerDay(monthRate); restart(monthRate); }} className="min-h-[40px] px-3 rounded-xl bg-bg ring-1 ring-text/10 text-text">
            finish everything in 30 days → {monthRate}/day
          </button>
        </label>
        <p className="text-xs text-muted">
          {todo.length} rows still to learn · at {rowsPerDay} a day that&apos;s about {Math.ceil(todo.length / Math.max(1, rowsPerDay))} days.
          Then watch a film or listen to a speaker of the language — the words you met here will start to click.
        </p>
      </div>

      {row ? (
        <>
          <div className="h-1.5 rounded-full bg-text/10 overflow-hidden" aria-label="today's progress">
            <div className="h-full bg-primary transition-all duration-gentle" style={{ width: `${total ? (finished / total) * 100 : 0}%` }} />
          </div>
          <div className="bg-surface rounded-3xl shadow-sm p-6 grid gap-5">
            <div>
              <p className={`text-xs text-muted mb-1 ${fontClassForText(label(row.cells[0].langCode))}`}>{label(row.cells[0].langCode)}</p>
              <div className="text-2xl"><WordCell cell={row.cells[0]} meta={metas[row.cells[0].langCode]} showRoman={showRoman} readable={readable} /></div>
            </div>
            {revealed ? (
              <div className="grid gap-4 border-t border-text/10 pt-4">
                {row.cells.slice(1).map((c) => (
                  <div key={c.langCode}>
                    <p className={`text-xs text-muted mb-1 ${fontClassForText(label(c.langCode))}`}>{label(c.langCode)}</p>
                    <WordCell cell={c} meta={metas[c.langCode]} showRoman={showRoman} readable={readable} />
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => setRevealed(true)} className="btn-primary min-h-[56px]">Show the other languages</button>
            )}
          </div>
          {revealed && (
            <div className="flex gap-3">
              <button onClick={again} className="flex-1 min-h-[56px] rounded-2xl bg-surface shadow-sm text-lg">↻ again later</button>
              <button onClick={gotIt} className="flex-1 btn-primary min-h-[56px]">I know it ✓</button>
            </div>
          )}
          <p className="text-center text-xs text-muted">{finished} of {total} done today</p>
        </>
      ) : (
        <div className="bg-surface rounded-3xl shadow-sm p-8 text-center grid gap-3">
          <div aria-hidden className="text-5xl">🌱</div>
          <p className="text-xl font-bold">{total > 0 ? "Today's rows are done!" : "Everything here is learned!"}</p>
          <p className="text-muted text-sm">Come back tomorrow — a little every day beats a lot once. <span aria-hidden>🌱</span> {useGamify.getState().xp} seeds so far.</p>
          {todo.length > 0 && <button onClick={() => restart()} className="btn-primary min-h-[52px]">Do {Math.min(rowsPerDay, todo.length)} more now</button>}
        </div>
      )}
    </div>
  );
}
