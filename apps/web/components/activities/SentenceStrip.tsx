"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chime, pop, speakOrPlay } from "@/lib/audio";
import { recordGraded } from "@/lib/progress";
import { useSettings } from "@/store";
import { getPack } from "@/lib/packs";
import { fontClassForText } from "@/lib/script";
import { shuffleUnsolved } from "@/lib/shuffle";
import type { Phrase } from "@shishu/content-schema";

/**
 * Build the sentence — tap word tiles into order.
 * Board verdict: sentences, not just words. 2 words at 3, 3 at 4, 4 at 5.
 * Two-strike rule here too: wrong tap → hear the sentence again (no shame),
 * second miss → the right next tile glows gently.
 * Every placement can be undone ("↩ back"), and the whole sentence can be restarted.
 * All state is keyed to the sentence, so the next sentence always starts clean.
 */
export default function SentenceStrip({ lang, itemId, onAnswer }: {
  lang: string;
  itemId: string;
  onAnswer: (correct: boolean) => void;
}) {
  const p = getPack(lang);
  const sound = useSettings((s) => s.sound);
  const childId = useSettings((s) => s.childId);

  const phrase: Phrase = useMemo(
    () => p.phrases.find((x) => x.id === itemId) ?? p.phrases.find((x) => x.tokens) ?? p.phrases[0],
    [p, itemId],
  );

  const tokens = useMemo(
    () => (phrase.tokens && phrase.tokens.length > 0 ? phrase.tokens : phrase.text.split(/\s+/).filter(Boolean)),
    [phrase],
  );

  // fair shuffle, re-dealt per sentence (never already in the solved order)
  const tiles = useMemo(
    () => shuffleUnsolved(tokens.map((token, i) => ({ token, i })), (a, b) => a.token === b.token),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phrase.id],
  );

  // indices into `tiles`, in the order the child placed them
  const [placedTiles, setPlacedTiles] = useState<number[]>([]);
  const wrongCountRef = useRef(0);
  const wrongLoggedRef = useRef(false);
  const [glowToken, setGlowToken] = useState<string | null>(null);
  const placed = placedTiles.length;

  // a different sentence ALWAYS starts from zero (this was the "second sentence is already
  // half done and stuck" bug: state used to survive navigation between sentences)
  useEffect(() => {
    setPlacedTiles([]);
    setGlowToken(null);
    wrongCountRef.current = 0;
    wrongLoggedRef.current = false;
  }, [phrase.id]);

  const play = () => {
    if (sound) speakOrPlay(phrase.text, lang, phrase.audioUrl);
  };

  useEffect(() => {
    const t = setTimeout(play, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrase.id]);

  const done = tokens.length > 0 && placed >= tokens.length;

  useEffect(() => {
    if (!done) return;
    if (sound) chime(true);
    void recordGraded(childId || "anon", lang, "phrase", phrase.id, true);
    const t = setTimeout(() => { play(); onAnswer(true); }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const tap = (tileIdx: number) => {
    if (done || placedTiles.includes(tileIdx)) return;
    const expected = tokens[placed];
    const tile = tiles[tileIdx];
    if (tile.token === expected) {
      if (sound) pop();
      setPlacedTiles((list) => [...list, tileIdx]);
      return;
    }
    // wrong tap — gentle, never punitive
    if (sound) chime(false);
    if (!wrongLoggedRef.current) {
      wrongLoggedRef.current = true;
      void recordGraded(childId || "anon", lang, "phrase", phrase.id, false);
    }
    wrongCountRef.current += 1;
    play(); // hear the whole sentence again
    if (wrongCountRef.current >= 2) {
      setGlowToken(expected);
      setTimeout(() => setGlowToken(null), 1000);
    }
  };

  const undo = () => setPlacedTiles((list) => list.slice(0, -1));
  const restart = () => setPlacedTiles([]);

  const textClass = (s: string) => fontClassForText(s);
  const rtl = p.direction === "rtl";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[440px]">
      <span aria-hidden className="text-7xl">{phrase.emoji ?? "🧩"}</span>

      {/* the sentence to build — visible for the grown-up reading along */}
      <p
        data-testid="sentence-text"
        dir={rtl ? "rtl" : undefined}
        className={`text-xl text-text text-center font-semibold ${textClass(phrase.text)}`}
        aria-label={`build the sentence ${phrase.text}`}
      >
        {phrase.text}
      </p>

      {/* the strip being built */}
      <div
        dir={rtl ? "rtl" : undefined}
        className="min-h-[64px] w-full rounded-3xl bg-surface ring-1 ring-text/10 flex items-center justify-center gap-2 px-3 py-2 flex-wrap"
        aria-label="sentence strip"
      >
        {tokens.map((t, i) => (
          <span
            key={i}
            className={`px-3 py-1.5 rounded-2xl text-lg font-bold transition duration-gentle ${
              i < placed
                ? `bg-primary text-white ${textClass(t)}`
                : i === placed
                  ? "ring-2 ring-primary/50 bg-bg text-text/40"
                  : "bg-bg text-text/25"
            }`}
            aria-hidden={i >= placed}
          >
            {i < placed ? t : "▢"}
          </span>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap justify-center" aria-label="word tiles">
        {tiles.map((tile, idx) => (
          <button
            key={`${phrase.id}-${tile.token}-${tile.i}`}
            onClick={() => tap(idx)}
            disabled={done}
            className={`card px-5 py-4 text-xl font-bold text-text active:scale-95 transition duration-gentle ${
              glowToken === tile.token ? "ring-4 ring-primary/40" : ""
            } ${placedTiles.includes(idx) ? "opacity-0 pointer-events-none" : ""}`}
            tabIndex={placedTiles.includes(idx) ? -1 : 0}
            aria-hidden={placedTiles.includes(idx)}
            aria-label={`word tile ${tile.token}`}
          >
            <span className={textClass(tile.token)}>{tile.token}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={undo}
          disabled={placed === 0 || done}
          className="min-h-[48px] px-6 text-base text-text bg-surface rounded-2xl shadow-sm active:scale-95 transition duration-gentle disabled:opacity-40"
          aria-label="undo the last word"
        >
          ↩ back
        </button>
        <button
          onClick={restart}
          disabled={placed === 0 || done}
          className="min-h-[48px] px-6 text-base text-text bg-surface rounded-2xl shadow-sm active:scale-95 transition duration-gentle disabled:opacity-40"
          aria-label="start the sentence over"
        >
          ⟲ start over
        </button>
        <button
          onClick={play}
          className="min-h-[48px] px-6 text-base text-text bg-surface rounded-2xl shadow-sm active:scale-95 transition duration-gentle"
          aria-label="hear the sentence again"
        >
          🔊 hear again
        </button>
      </div>
    </div>
  );
}
