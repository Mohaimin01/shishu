"use client";

// Story Rows — graded mini-stories whose every word opens a real Word Rows row.
// Tap a highlighted word → the whole row appears beneath the story. Finish a story
// ("I read it ✓") and its words join the review queue. Stories are CI-checked: every
// word is either a table word, a closed function word, or a listed form — nothing else.

import { useMemo, useState } from "react";
import { linkTokens, type Reading, type LexiconLanguage, type Row, type ScriptId } from "@shishu/core";
import type { LangMeta } from "@/lib/lexicon";
import WordTable from "./WordTable";
import { fontClassForText } from "@/lib/script";

export default function StoryRows({ readings, langs, metas, readable, showRoman, rowsById, onRead }: {
  readings: Reading[];
  /** full language data (needed to link words) for every chosen language */
  langs: Record<string, LexiconLanguage>;
  metas: Record<string, LangMeta>;
  readable: ScriptId[];
  showRoman: boolean;
  rowsById: Map<string, Row>;
  /** the learner finished a story — feed its words to the review queue */
  onRead: (conceptIds: string[], lang: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null); // concept id of the tapped word
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const order = useMemo(() => {
    const rank = new Map(readings.map((r) => [r.id, r]));
    return [...rank.values()].sort((a, b) =>
      a.lang.localeCompare(b.lang) || a.level - b.level || a.title.localeCompare(b.title),
    );
  }, [readings]);

  // link every story's words up front (stories are short; the lexicon is cached)
  const tokensByReading = useMemo(
    () => new Map(order.filter((r) => langs[r.lang]).map((r) => [r.id, linkTokens(r.text, langs[r.lang])])),
    [order, langs],
  );

  if (order.length === 0) {
    return (
      <div className="bg-surface rounded-3xl shadow-sm p-8 text-center grid gap-2 max-w-[560px] mx-auto">
        <div aria-hidden className="text-5xl">📖</div>
        <p className="text-xl font-bold">No stories for these languages yet</p>
        <p className="text-muted text-sm">
          Story Rows begin in English, Bengali and Spanish — more languages follow. Every word in a
          story opens a row you can learn, so nothing is a stranger.
        </p>
      </div>
    );
  }

  const openRow = open ? rowsById.get(open) : undefined;

  return (
    <div className="grid gap-4">
      {order.map((r) => {
        const tokens = tokensByReading.get(r.id) ?? [];
        const meta = metas[r.lang];
        const isDone = doneIds.includes(r.id);
        return (
          <article key={r.id} className="bg-surface rounded-3xl shadow-sm p-5 grid gap-3">
            <header className="flex items-baseline justify-between gap-3">
              <h2 className={`text-xl font-bold ${fontClassForText(r.title)}`}>{r.title}</h2>
              <span className="text-[11px] text-muted whitespace-nowrap">
                {meta?.nativeName ?? r.lang} · level {r.level}
              </span>
            </header>
            <p className={`text-lg leading-relaxed ${fontClassForText(r.text)}`} lang={r.lang}>
              {tokens.map((t, i) => {
                if (!t.word) return <span key={i}>{t.text} </span>;
                if (t.function) return <span key={i}>{t.text} </span>;
                if (!t.conceptId) {
                  return (
                    <span key={i} className="text-muted" title="not linked yet">
                      {t.text}{" "}
                    </span>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpen(t.conceptId ?? null)}
                    aria-label={`open the row for ${t.word}`}
                    className={`underline decoration-primary/40 decoration-2 underline-offset-4 hover:bg-primary/10 rounded px-0.5 font-semibold active:scale-95 transition duration-gentle ${
                      open === t.conceptId ? "bg-primary/15" : ""
                    }`}
                    title={t.gloss ? `${t.gloss}${t.roman ? ` · ${t.roman}` : ""}` : undefined}
                  >
                    {t.text}{" "}
                  </button>
                );
              })}
            </p>
            <footer className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">
                every underlined word opens the full row · {r.concepts.length} meanings in this story
              </span>
              <button
                onClick={() => {
                  onRead(r.concepts, r.lang);
                  if (!isDone) setDoneIds((ids) => [...ids, r.id]);
                }}
                className={`min-h-[48px] px-4 rounded-2xl text-sm font-semibold active:scale-95 transition duration-gentle ${
                  isDone ? "bg-surface text-muted shadow-sm" : "bg-primary text-white"
                }`}
              >
                {isDone ? "✓ read again" : "I read it ✓"}
              </button>
            </footer>
          </article>
        );
      })}

      {openRow && (
        <section className="bg-surface rounded-3xl shadow-sm p-4 grid gap-3" aria-live="polite">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">
              “{openRow.concept.gloss}” — the whole row
            </h3>
            <button onClick={() => setOpen(null)} className="min-h-[40px] px-3 rounded-xl bg-bg ring-1 ring-text/10 text-sm">
              close
            </button>
          </div>
          <WordTable
            rows={[openRow]}
            metas={metas}
            readable={readable}
            showRoman={showRoman}
            startRank={openRow.concept.rank}
          />
        </section>
      )}
    </div>
  );
}
