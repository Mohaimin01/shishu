"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chime, speak } from "@/lib/audio";
import { recordGraded } from "@/lib/progress";
import { useSettings } from "@/store";
import { packs } from "@/lib/packs";
import type { Letter } from "@shishu/content-schema";

// Letter name-audio via device TTS for M1; pack audioUrl replaces it as recordings arrive.

export default function TapSound({ lang, itemId, onAnswer }: {
  lang: string;
  itemId: string;
  onAnswer: (correct: boolean) => void;
}) {
  const p = packs[lang] ?? packs.en;
  const sound = useSettings((s) => s.sound);
  const childId = useSettings((s) => s.childId);

  const { target, options } = useMemo(() => {
    const t = p.letters.find((l) => l.id === itemId) ?? p.letters[0];
    const others: Letter[] = [];
    for (const l of p.letters) {
      if (l.id !== t.id && others.length < 2) others.push(l);
    }
    return { target: t, options: [t, ...others].sort(() => Math.random() - 0.5) };
  }, [p, itemId]);

  const [pressed, setPressed] = useState<string | null>(null);
  const wrongLoggedRef = useRef(false);

  const play = () => {
    if (sound) speak(target.char || target.name, "en");
  };

  useEffect(() => {
    // small delay so the screen settles before audio
    const t = setTimeout(play, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const choose = (id: string) => {
    if (id === target.id) {
      if (sound) chime(true);
      void recordGraded(childId || "anon", lang, "letter", target.id, true);
      onAnswer(true);
    } else {
      if (sound) chime(false);
      if (!wrongLoggedRef.current) {
        wrongLoggedRef.current = true;
        void recordGraded(childId || "anon", lang, "letter", target.id, false);
      }
      setPressed(target.id); // show a gentle pulse on the right card to nudge re-listen
      setTimeout(() => setPressed(null), 900);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px]">
      <button
        onClick={play}
        className="w-20 h-20 rounded-full bg-primary text-white text-2xl items-center justify-center flex shadow-sm active:scale-95 transition duration-gentle"
        aria-label="play the sound again"
      >
        🔊
      </button>

      <div className="grid grid-cols-3 gap-3 w-full">
        {options.map((l) => (
          <button
            key={l.id}
            onClick={() => choose(l.id)}
            className={`card text-center text-5xl font-bold text-text py-8 active:scale-95 transition duration-gentle ${
              pressed === l.id ? "ring-4 ring-primary/40" : ""
            }`}
            aria-label={`letter ${l.name}`}
          >
            {l.char}
          </button>
        ))}
      </div>
    </div>
  );
}
