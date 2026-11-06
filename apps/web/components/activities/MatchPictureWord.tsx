"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chime, speak } from "@/lib/audio";
import { recordGraded } from "@/lib/progress";
import { useSettings } from "@/store";
import { packs } from "@/lib/packs";
import { TYPE_TITLE } from "@/lib/activities";

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

  const wrongLoggedRef = useRef(false);
  const [pressed, setPressed] = useState<string | null>(null);

  const play = () => {
    if (sound) speak(target.label, lang);
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
    } else {
      if (sound) chime(false);
      if (!wrongLoggedRef.current) {
        wrongLoggedRef.current = true;
        void recordGraded(childId || "anon", lang, "word", target.id, false);
      }
      setPressed(target.id);
      setTimeout(() => setPressed(null), 900);
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
        {target.label} 🔊
      </button>

      <div className="grid grid-cols-3 gap-3 w-full">
        {options.map((w) => (
          <button
            key={w.id}
            onClick={() => choose(w.id)}
            className={`card text-center text-6xl py-8 active:scale-95 transition duration-gentle ${
              pressed === w.id ? "ring-4 ring-primary/40" : ""
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
