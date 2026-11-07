"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chime } from "@/lib/audio";
import { playWordAudio } from "@/lib/wordaudio";
import { recordGraded } from "@/lib/progress";
import { useSettings } from "@/store";
import { packs } from "@/lib/packs";
import { TYPE_TITLE } from "@/lib/activities";

/**
 * Find the picture — matches a spoken word to its picture.
 * Two-strike rule (board verdict): wrong #1 → silent re-listen, no visual hint;
 * wrong #2 → gentle glow on the correct card.
 */
export default function MatchPictureWord({ lang, itemId, onAnswer }: {
  lang: string;
  itemId: string;
  onAnswer: (correct: boolean) => void;
}) {
  const p = packs[lang] ?? packs.en;
  const sound = useSettings((s) => s.sound);
  const childId = useSettings((s) => s.childId);

  const { target, options } = useMemo(() => {
    const t = p.words.find((w) => w.id === itemId) ?? p.words[0];
    const others: typeof t[] = [];
    for (const w of p.words) {
      if (w.id !== t.id && others.length < 2) others.push(w);
    }
    return { target: t, options: [t, ...others].sort(() => Math.random() - 0.5) };
  }, [p, itemId]);

  const wrongCountRef = useRef(0);
  const wrongLoggedRef = useRef(false);
  const [hintGlow, setHintGlow] = useState(false);

  const play = () => {
    if (sound) void playWordAudio(childId || "anon", lang, target.conceptId || target.id, target.label, target.audioUrl);
  };

  useEffect(() => {
    const t = setTimeout(play, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const choose = (id: string) => {
    if (id === target.id) {
      if (sound) chime(true);
      void recordGraded(childId || "anon", lang, "word", target.id, true);
      onAnswer(true);
      return;
    }
    if (sound) chime(false);
    if (!wrongLoggedRef.current) {
      wrongLoggedRef.current = true;
      void recordGraded(childId || "anon", lang, "word", target.id, false);
    }
    wrongCountRef.current += 1;
    play(); // hear it again
    if (wrongCountRef.current >= 2) {
      setHintGlow(true);
      setTimeout(() => setHintGlow(false), 900);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px]">
      <p className="text-lg text-center text-text font-semibold">{TYPE_TITLE["match-picture-word"]}</p>

      <button
        onClick={play}
        className="min-h-[48px] px-5 text-xl font-bold text-text bg-surface rounded-3xl shadow-sm active:scale-95 transition duration-gentle"
        aria-label={`say ${target.label} again`}
      >
        {target.emoji ?? ""} {target.label} 🔊
      </button>

      <div className="grid grid-cols-3 gap-3 w-full">
        {options.map((w) => (
          <button
            key={w.id}
            onClick={() => choose(w.id)}
            className={`card text-center text-6xl py-8 active:scale-95 transition duration-gentle ${
              hintGlow && w.id === target.id ? "ring-4 ring-primary/40" : ""
            }`}
            aria-label={`picture option ${w.label}`}
          >
            {w.emoji ?? "☑"}
          </button>
        ))}
      </div>
    </div>
  );
}
