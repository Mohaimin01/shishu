"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chime, pop, speakOrPlay } from "@/lib/audio";
import { recordGraded } from "@/lib/progress";
import { useSettings } from "@/store";
import { packs } from "@/lib/packs";
import type { Phrase } from "@shishu/content-schema";

/**
 * Build the sentence — tap word tiles into order.
 * Board verdict: sentences, not just words. 2 words at 3, 3 at 4, 4 at 5.
 * Two-strike rule here too: wrong tap → hear the sentence again (no shame),
 * second miss → the right next tile glows gently.
 */
export default function SentenceStrip({ lang, itemId, onAnswer }: {
  lang: string;
  itemId: string;
  onAnswer: (correct: boolean) => void;
}) {
  const p = packs[lang] ?? packs.en;
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

  // stable shuffle, re-dealt per activity
  const tiles = useMemo(
    () => tokens.map((token, i) => ({ token, i })).sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phrase.id],
  );

  const [placed, setPlaced] = useState(0);
  const [hidden, setHidden] = useState<number[]>([]);
  const wrongCountRef = useRef(0);
  const wrongLoggedRef = useRef(false);
  const [glowToken, setGlowToken] = useState<string | null>(null);

  const play = () => {
    if (sound) speakOrPlay(phrase.text, lang, phrase.audioUrl);
  };

  useEffect(() => {
    const t = setTimeout(play, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrase.id]);

  const done = placed >= tokens.length;

  useEffect(() => {
    if (!done) return;
    if (sound) chime(true);
    void recordGraded(childId || "anon", lang, "phrase", phrase.id, true);
    const t = setTimeout(() => { play(); onAnswer(true); }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const tap = (tileIdx: number) => {
    if (done) return;
    const expected = tokens[placed];
    const tile = tiles[tileIdx];
    if (tile.token === expected) {
      if (sound) pop();
      // spend the first unspent tile of this token
      const idx = tiles.findIndex((t, i) => t.token === expected && !hidden.includes(i));
      setHidden((h) => [...h, idx >= 0 ? idx : tileIdx]);
      setPlaced((n) => n + 1);
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

  const bnText = (s: string) => /[\u0980-\u09FF]/.test(s);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[440px]">
      <span aria-hidden className="text-7xl">{phrase.emoji ?? "🧩"}</span>

      {/* the sentence to build — visible for the grown-up reading along */}
      <p
        data-testid="sentence-text"
        className={`text-xl text-text text-center font-semibold ${bnText(phrase.text) ? "font-bengali" : ""}`}
        aria-label={`build the sentence ${phrase.text}`}
      >
        {phrase.text}
      </p>

      {/* the strip being built */}
      <div
        className="min-h-[64px] w-full rounded-3xl bg-surface ring-1 ring-text/10 flex items-center justify-center gap-2 px-3 py-2 flex-wrap"
        aria-label="sentence strip"
      >
        {tokens.map((t, i) => (
          <span
            key={i}
            className={`px-3 py-1.5 rounded-2xl text-lg font-bold transition duration-gentle ${
              i < placed
                ? `bg-primary text-white ${bnText(t) ? "font-bengali" : ""}`
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
            key={`${tile.token}-${tile.i}`}
            onClick={() => tap(idx)}
            disabled={done}
            className={`card px-5 py-4 text-xl font-bold text-text active:scale-95 transition duration-gentle ${
              glowToken === tile.token ? "ring-4 ring-primary/40" : ""
            } ${hidden.includes(idx) ? "opacity-0 pointer-events-none" : ""}`}
            aria-label={`word tile ${tile.token}`}
          >
            <span className={bnText(tile.token) ? "font-bengali" : ""}>{tile.token}</span>
          </button>
        ))}
      </div>

      <button
        onClick={play}
        className="min-h-[48px] px-6 text-base text-text bg-surface rounded-2xl shadow-sm active:scale-95 transition duration-gentle"
        aria-label="hear the sentence again"
      >
        🔊 hear again
      </button>
    </div>
  );
}
