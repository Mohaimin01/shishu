"use client";

import { useEffect, useRef, useState } from "react";
import { chime } from "@/lib/audio";
import { playWordAudio } from "@/lib/wordaudio";
import { recordExposure } from "@/lib/progress";
import { useSettings } from "@/store";
import { packs } from "@/lib/packs";

/**
 * One word, many homes — the concept-table, shown the board's way:
 * every variant spoken with its region named softly, never corrected.
 * পানি (standard) · জল (formal) · বারি (Sylhet) — all of them ARE water.
 */
export default function ConceptTable({ lang, itemId, onDone }: {
  lang: string;
  itemId: string;
  onDone?: () => void;
}) {
  const p = packs[lang] ?? packs.en;
  const sound = useSettings((s) => s.sound);
  const childId = useSettings((s) => s.childId);

  const table = p.conceptTables.find((t) => t.conceptId === itemId);
  const word = p.words.find((w) => w.conceptId === itemId);
  const variants = (table?.variants ?? []).slice(0, 6);

  const [idx, setIdx] = useState(0);
  const [round, setRound] = useState(0);
  const timersRef = useRef<number[]>([]);
  const exposedRef = useRef(false);

  const clearTimers = () => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  };

  useEffect(() => {
    clearTimers();
    exposedRef.current = false;
    setIdx(0);
    if (sound) {
      variants.forEach((v, i) => {
        const t = window.setTimeout(() => {
          setIdx(i);
          void playWordAudio(childId || "anon", v.lang, table?.conceptId ?? itemId, v.label, v.audioUrl);
        }, 450 + i * 1900);
        timersRef.current.push(t);
      });
    }
    const done = window.setTimeout(() => {
      if (!exposedRef.current) {
        exposedRef.current = true;
        void recordExposure(childId || "anon", lang, "concept", table?.conceptId ?? itemId);
        onDone?.();
      }
    }, 600 + variants.length * 1900);
    timersRef.current.push(done);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, itemId, lang]);

  const hearAgain = () => {
    exposedRef.current = false;
    setRound((r) => r + 1);
  };

  const bnText = (s: string) => /[\u0980-\u09FF]/.test(s);
  const active = variants[Math.min(idx, variants.length - 1)];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[440px]">
      <span aria-hidden className="text-8xl">{word?.emoji ?? "🪞"}</span>

      {active && (
        <div className="card text-center px-8 py-5 min-w-[240px]">
          <p className="text-xs text-muted mb-1">{active.region ?? active.lang}</p>
          <p
            className={`text-4xl font-bold text-text ${bnText(active.label) ? "font-bengali" : ""}`}
            aria-live="polite"
          >
            {active.label}
          </p>
        </div>
      )}

      {/* the gentle mirror list — all spoken, none corrected */}
      <div className="flex flex-col gap-2 items-center" aria-label="all the words people use">
        {variants.map((v, i) => (
          <button
            key={i}
            onClick={() => {
              void playWordAudio(childId || "anon", v.lang, table?.conceptId ?? itemId, v.label, v.audioUrl);
            }}
            className={`px-4 min-h-[44px] rounded-2xl transition duration-gentle ${
              i === idx ? "bg-primary text-white" : "bg-surface text-text shadow-sm"
            }`}
            aria-label={`hear ${v.region ?? v.lang}: ${v.label}`}
          >
            <span className={`${bnText(v.label) ? "font-bengali" : ""} ${i === idx ? "" : "text-base"}`}>{v.label}</span>
            {v.region && <span className="ml-2 text-xs opacity-70">{v.region}</span>}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted text-center">
        They all mean the same thing.
        <span className="font-bengali"> সবগুলোই সেই এক কথা।</span>
      </p>

      <button onClick={hearAgain} className="btn-primary min-h-[52px] px-8" aria-label="hear every word again">
        🔊 hear again
      </button>
    </div>
  );
}
