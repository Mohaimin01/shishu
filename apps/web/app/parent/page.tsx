"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSettings } from "@/store";
import { getPack, LANGS } from "@/lib/packs";
import { langProgress } from "@/lib/progress";
import { db, todayMinutes } from "@/lib/db";
import { STAGE_ORDER, STAGE_AGES, type Stage } from "@shishu/core";

const CO_PLAY = [
  "Say the letter sound together out loud, then clap once.",
  "Ask 'what color next?' and let them choose from the palette.",
  "After coloring a letter, print it with a finger in the air too.",
  "For words, find the real thing at home (a glass of water, an apple) and say the word twice.",
  "Count stairs or toes while counting numbers on screen.",
];

function fmtDayMinutes(m: number): string {
  const r = Math.round(m);
  return `${r} min today`;
}

export default function ParentPage() {
  const s = useSettings();
  const p = getPack(s.lang);
  const [stats, setStats] = useState<{ touched: number; mastered: number; accuracy: number } | null>(null);
  const [minutes, setMinutes] = useState(0);
  const [tip, setTip] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const childId = useSettings.getState().childId || "anon";
      const [st, min] = await Promise.all([langProgress(childId, s.lang), todayMinutes()]);
      setStats(st);
      setMinutes(min);
      setReady(true);
    })();
  }, [s.lang, s.childId]);

  const rotateTip = () => setTip((t) => (t + 1) % CO_PLAY.length);

  const clearData = async () => {
    if (typeof window !== "undefined" && !window.confirm("Clear all learning progress for this device?")) return;
    await db.progress.clear();
    await db.sessions.clear();
    window.location.reload();
  };

  return (
    <main className="min-h-screen px-5 pb-16">
      <header className="flex items-center justify-between pt-4 pb-3">
        <Link
          href="/"
          className="w-12 h-12 rounded-2xl bg-surface shadow-sm flex items-center justify-center text-xl text-text active:scale-95 transition duration-gentle"
          aria-label="back home"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold">Grown-ups</h1>
        <div className="w-12" aria-hidden />
      </header>

      <div className="max-w-[560px] mx-auto flex flex-col gap-5">
        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-3">This device · {p.nativeName}</h2>
          {ready && stats ? (
            <ul className="flex justify-around gap-2 text-center" aria-live="polite">
              <li><span className="text-2xl font-bold">{stats.touched}</span><span className="block text-xs text-muted">things tried</span></li>
              <li><span className="text-2xl font-bold">{stats.mastered}</span><span className="block text-xs text-muted">mastered</span></li>
              <li><span className="text-2xl font-bold">{Math.round(stats.accuracy * 100)}%</span><span className="block text-xs text-muted">listening taps</span></li>
              <li><span className="text-2xl font-bold">{fmtDayMinutes(minutes)}</span><span className="block text-xs text-muted">screen time</span></li>
            </ul>
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )}
        </section>

        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-3">Play nicely (settings)</h2>

          <div className="flex items-center justify-between py-2">
            <span id="lbl-sound" className="text-base">Sounds</span>
            <button
              role="switch"
              aria-checked={s.sound}
              aria-labelledby="lbl-sound"
              onClick={() => s.set({ sound: !s.sound })}
              className={`w-14 h-9 rounded-full transition duration-gentle ${s.sound ? "bg-primary" : "bg-text/20"} relative`}
            >
              <span className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all duration-gentle ${s.sound ? "left-6" : "left-1"}`} />
            </button>
          </div>

          <div className="py-2">
            <span className="text-base block mb-2">Child age</span>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4, 5, 6, 8, 10].map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    const st: Stage = STAGE_ORDER.find((st) => a >= STAGE_AGES[st][0] && a <= STAGE_AGES[st][1]) ?? "tween";
                    s.set({ age: a, stage: st });
                  }}
                  className={`px-4 min-h-[48px] rounded-2xl transition duration-gentle ${
                    s.age === a ? "bg-primary text-white" : "bg-bg text-text ring-1 ring-text/10"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-1">Stage from age. Nothing is locked — children can choose anything.</p>
          </div>

          <div className="py-2">
            <label htmlFor="cap" className="text-base block">Daily gentle limit</label>
            <input
              id="cap"
              type="range"
              min={0}
              max={45}
              step={5}
              value={s.capMin}
              onChange={(e) => s.set({ capMin: Number(e.target.value) })}
              className="w-full accent-primary"
              aria-describedby="cap-help"
            />
            <p id="cap-help" className="text-xs text-muted">
              {s.capMin === 0 ? "No limit (not recommended)" : `${s.capMin} minutes, then a gentle stop screen`}
            </p>
          </div>

          <div className="py-2">
            <span className="text-base block mb-2">Language</span>
            <div className="flex gap-2 flex-wrap">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => s.set({ lang: l.code })}
                  className={`px-4 min-h-[48px] rounded-2xl transition duration-gentle ${
                    s.lang === l.code ? "bg-primary text-white" : "bg-bg text-text ring-1 ring-text/10"
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>

          <button onClick={clearData} className="text-sm text-danger underline underline-offset-4 py-3">
            Erase progress on this device
          </button>
        </section>

        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">Play together</h2>
          <p className="text-base">{CO_PLAY[tip]}</p>
          <button onClick={rotateTip} className="mt-3 text-sm text-primary underline underline-offset-4">
            another idea
          </button>
        </section>

        <section className="text-xs text-muted leading-relaxed">
          <p className="mb-1 font-semibold text-text">Why no ads?</p>
          <p>
            Shishu is free, open source, and funded by donations. No AdSense, no auto ads. Sponsor messages
            (only if someone contacts us directly) show after a level ends — never on top of play.
          </p>
          <p className="mt-2">Progress stays on this device unless you choose to sync. No accounts required.</p>
        </section>
      </div>
    </main>
  );
}
