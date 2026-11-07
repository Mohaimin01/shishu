"use client";

import { useEffect, useRef, useState } from "react";
import { chime, pop, speakOrPlay } from "@/lib/audio";
import { recordExposure } from "@/lib/progress";
import { useSettings } from "@/store";
import { packs } from "@/lib/packs";
import type { BridgeCard } from "@/lib/activities";

/**
 * "One idea, many languages" — the bridge lane.
 * Shows the SAME concept through each active language's home word,
 * spoken one after another. Never corrective, always additive:
 * জল sounds different in Thakuma's house — and they all mean this.
 */
export default function ConceptBridge({ card, onDone }: {
  card: BridgeCard;
  onDone?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [round, setRound] = useState(0);
  const sound = useSettings((s) => s.sound);
  const childId = useSettings((s) => s.childId);
  const recordedRef = useRef(false);
  const LANG_PAIR: Record<string, string> = { en: "en", bn: "bn" };

  const step = card.langs[Math.min(idx, card.langs.length - 1)];

  useEffect(() => {
    if (idx >= card.langs.length) {
      // full round complete: gentle chime + exposure recorded per language
      if (!recordedRef.current) {
        recordedRef.current = true;
        for (const l of card.langs) {
          void recordExposure(childId || "anon", l.code, "concept", card.conceptId);
        }
        onDone?.();
      }
      if (sound) chime(true);
      return;
    }
    if (sound) {
      const t = setTimeout(() => {
        speakOrPlay(step.label, LANG_PAIR[step.code] ?? step.code, step.audioUrl);
      }, idx === 0 ? 450 : 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, round]);

  const replay = () => {
    recordedRef.current = false;
    setIdx(0);
    setRound((r) => r + 1);
  };

  const nativeName = (code: string) => packs[code]?.nativeName ?? code;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px]">
      <span aria-hidden className="text-8xl">{card.emoji}</span>

      <div
        aria-live="polite"
        className="card text-center px-8 py-6 min-w-[240px]"
      >
        <p className="text-xs text-muted mb-1">{nativeName(step.code)}</p>
        <p className={`text-4xl font-bold text-text ${step.code === "bn" ? "font-bengali" : ""}`}>
          {step.label}
        </p>
      </div>

      {/* soft progress pearls, one per language */}
      <div className="flex gap-2" aria-hidden>
        {card.langs.map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full transition duration-gentle ${i < idx ? "bg-primary" : "bg-text/15"}`}
          />
        ))}
      </div>

      <p className="sr-only">
        The same idea has a word in every language you learn. Keep playing gently.
      </p>

      <button
        onClick={replay}
        className="btn-primary min-h-[56px] px-8 text-lg"
        aria-label="hear every language again"
      >
        Hear again 🔊
      </button>
    </div>
  );
}
