"use client";

// The Review tab — spaced repetition over the cells of rows the learner already knows.
// Front: the meaning (gloss) + the word in the learner's own language.
// Back: the same meaning in the language being reviewed. Four gentle buttons schedule
// the next visit (again / hard / good / easy) — every rating earns a seed.

import { useMemo, useState } from "react";
import { dueCards, type Grade, type Row, type ScriptId } from "@shishu/core";
import type { LangMeta } from "@/lib/lexicon";
import { useReview } from "@/lib/review";
import { useGamify } from "@/lib/gamify";
import WordCell from "./WordCell";
import { fontClassForText } from "@/lib/script";

const GRADE_BUTTONS: { g: Grade; label: string; cls: string }[] = [
  { g: 0, label: "again", cls: "bg-surface shadow-sm" },
  { g: 1, label: "hard", cls: "bg-surface shadow-sm" },
  { g: 2, label: "good", cls: "bg-primary text-white" },
  { g: 3, label: "easy", cls: "bg-primary/80 text-white" },
];

export default function ReviewQueue({ rowsById, metas, readable, showRoman, onGraded }: {
  /** every built row, by concept id — the queue only stores ids */
  rowsById: Map<string, Row>;
  metas: Record<string, LangMeta>;
  readable: ScriptId[];
  showRoman: boolean;
  /** called after each rating so the parent can sync badges */
  onGraded?: () => void;
}) {
  const cards = useReview((s) => s.cards);
  const gradeCardInStore = useReview((s) => s.grade);
  const dropCard = useReview((s) => s.drop);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  const due = useMemo(() => dueCards(Object.values(cards)), [cards]);
  const card = due[0];

  if (!card) {
    const next = Object.values(cards).map((c) => c.dueAt).sort((a, b) => a - b)[0];
    return (
      <div className="bg-surface rounded-3xl shadow-sm p-8 text-center grid gap-3 max-w-[560px] mx-auto">
        <div aria-hidden className="text-5xl">🌳</div>
        <p className="text-xl font-bold">
          {done > 0 ? "That's every card for now!" : Object.keys(cards).length > 0 ? "Nothing to review right now" : "The review queue is empty"}
        </p>
        <p className="text-muted text-sm">
          {Object.keys(cards).length === 0
            ? "Learn a row in the Table or Study tab — every word you learn comes back here right when you are about to forget it."
            : next
              ? `Your next cards return ${new Date(next).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}. A little every day beats a lot once.`
              : "A little every day beats a lot once."}
        </p>
      </div>
    );
  }

  const row = rowsById.get(card.conceptId);
  if (!row) {
    // the row (or its language) is gone from the table — retire the card quietly
    dropCard(card.conceptId, card.variantLang);
    return <p className="text-center text-muted py-10">Cleaning up the queue…</p>;
  }

  const langName = (c: string) => metas[c]?.nativeName ?? c;
  const nativeCell = row.cells[0];
  const targetCell = row.cells.find((c) => c.langCode === card.variantLang);

  const rate = (g: Grade) => {
    if (!row) return;
    gradeCardInStore(card.conceptId, card.variantLang, g);
    useGamify.getState().awardRaw(1); // every honest rating is a seed
    setDone((n) => n + 1);
    setRevealed(false);
    onGraded?.();
  };

  return (
    <div className="grid gap-4 max-w-[560px] mx-auto">
      <div className="h-1.5 rounded-full bg-text/10 overflow-hidden" aria-label="review progress">
        <div className="h-full bg-primary transition-all duration-gentle" style={{ width: `${((done / (done + due.length)) * 100) || 0}%` }} />
      </div>

      <div className="bg-surface rounded-3xl shadow-sm p-6 grid gap-5">
        <div>
          <p className="text-xs text-muted mb-1">
            {langName(nativeCell.langCode)} · {row.concept.gloss}
          </p>
          <div className={`text-2xl ${fontClassForText(nativeCell.forms[0]?.text ?? "")}`}>
            <WordCell cell={nativeCell} meta={metas[nativeCell.langCode]} showRoman={showRoman} readable={readable} />
          </div>
        </div>

        {revealed && targetCell ? (
          <div className="border-t border-text/10 pt-4">
            <p className="text-xs text-muted mb-1">{langName(targetCell.langCode)}</p>
            <div className={`text-2xl ${fontClassForText(targetCell.forms[0]?.text ?? "")}`}>
              <WordCell cell={targetCell} meta={metas[targetCell.langCode]} showRoman={showRoman} readable={readable} />
            </div>
          </div>
        ) : (
          <button onClick={() => setRevealed(true)} className="btn-primary min-h-[56px]">
            Show me in {langName(card.variantLang)}
          </button>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-2 gap-3" aria-label="how well did you remember">
          {GRADE_BUTTONS.map(({ g, label, cls }) => (
            <button
              key={label}
              onClick={() => rate(g)}
              className={`min-h-[56px] rounded-2xl text-lg font-semibold active:scale-95 transition duration-gentle ${cls}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        {done} reviewed this visit · {due.length} left
      </p>
    </div>
  );
}
