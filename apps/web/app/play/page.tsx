"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ColorCanvas from "@/components/ColorCanvas";
import TapSound from "@/components/activities/TapSound";
import MatchPictureWord from "@/components/activities/MatchPictureWord";
import { findCard, listForStage, nextAfter, TYPE_TITLE, type ActivityCard } from "@/lib/activities";
import { getPack } from "@/lib/packs";
import { addMinutes, todayMinutes } from "@/lib/db";
import { useSettings } from "@/store";
import type { Stage } from "@shishu/core";

function WindDown({ onHome }: { onHome: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-bg/95 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div aria-hidden className="text-6xl">🌱</div>
      <h2 className="text-2xl font-bold">You did so much today!</h2>
      <p className="text-muted">Time to rest. See you tomorrow.</p>
      <button onClick={onHome} className="btn-primary min-h-[56px]">Done for now</button>
    </div>
  );
}

function ActivityBody({ card, lang, onDone }: { card: ActivityCard; lang: string; onDone: () => void }) {
  const p = getPack(lang);

  if (card.type === "color-letter" || card.type === "trace-letter") {
    const letter = p.letters.find((l) => l.id === card.itemId) ?? p.letters[0];
    return (
      <ColorCanvas
        lang={lang}
        skill="letter"
        itemId={letter.id}
        glyph={letter.char}
        script={p.script === "bengali" ? "bengali" : "latin"}
        mode={card.type === "trace-letter" ? "trace" : "paint"}
        stage={card.type}
        onDone={onDone}
      />
    );
  }
  if (card.type === "color-number") {
    const n = Number(card.itemId);
    const num = p.numbers.find((x) => x.value === n) ?? p.numbers[0];
    return (
      <ColorCanvas
        lang={lang}
        skill="number"
        itemId={String(num.value)}
        glyph={num.char ?? String(num.value)}
        script={p.script === "bengali" ? "bengali" : "latin"}
        mode="paint"
        stage={card.type}
        onDone={onDone}
      />
    );
  }
  if (card.type === "tap-sound") {
    return <TapSound lang={lang} itemId={card.itemId} onAnswer={() => onDone()} />;
  }
  if (card.type === "match-picture-word") {
    return <MatchPictureWord lang={lang} itemId={card.itemId} onAnswer={() => onDone()} />;
  }
  return <p className="text-muted">Coming soon</p>;
}

function RunnerInner() {
  const params = useSearchParams();
  const router = useRouter();
  const lang = params.get("lang") ?? useSettings.getState().lang;
  const stage = params.get("stage") ?? useSettings.getState().stage;
  const type = params.get("type");
  const item = params.get("item");

  const card = useMemo<ActivityCard | undefined>(() => {
    if (type && item) return findCard(lang, type, item);
    return listForStage(lang)[0];
  }, [type, item, lang]);

  const [complete, setComplete] = useState(false);
  const [windDown, setWindDown] = useState(false);
  const mountedRef = useRef(Date.now());

  useEffect(() => {
    setComplete(false);
  }, [type, item]);

  const flushMinutes = async () => {
    const mins = (Date.now() - mountedRef.current) / 60000;
    mountedRef.current = Date.now();
    if (mins > 0.2) await addMinutes(mins);
  };

  useEffect(() => {
    const onSave = () => { void flushMinutes(); };
    window.addEventListener("pagehide", onSave);
    return () => {
      window.removeEventListener("pagehide", onSave);
      void flushMinutes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCap = async () => {
    await flushMinutes();
    const cap = useSettings.getState().capMin;
    if (cap > 0) {
      const today = await todayMinutes();
      if (today >= cap) setWindDown(true);
    }
  };

  const onDone = () => {
    setComplete(true);
    void checkCap();
  };

  const next = () => {
    const n = card ? nextAfter(lang, card) : undefined;
    if (n) router.push(`/play?lang=${lang}&stage=${stage}&type=${n.type}&item=${n.itemId}`);
    else router.push(`/learn?lang=${lang}&stage=${stage}`);
  };

  const p = getPack(lang);

  return (
    <main className="min-h-screen flex flex-col px-5 pb-10">
      <header className="flex items-center justify-between pt-4 pb-2">
        <Link
          href={`/learn?lang=${lang}&stage=${stage}`}
          className="w-12 h-12 rounded-2xl bg-surface shadow-sm flex items-center justify-center text-xl text-text active:scale-95 transition duration-gentle"
          aria-label="back to activities"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="text-sm text-muted">{p.nativeName}</p>
          <h1 className="text-lg font-bold text-text">
            {card ? TYPE_TITLE[card.type] : "Shishu"}
          </h1>
        </div>
        <div className="w-12" aria-hidden />
      </header>

      <div className="flex-1 flex items-center justify-center">
        {card && <ActivityBody card={card} lang={lang} onDone={onDone} />}
      </div>

      {complete && !windDown && (
        <div className="fixed inset-x-0 bottom-6 flex justify-center px-6">
          <button onClick={next} className="btn-primary min-h-[56px] px-10 text-xl">
            Next →
          </button>
        </div>
      )}
      {windDown && <WindDown onHome={() => router.push("/")} />}
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <RunnerInner />
    </Suspense>
  );
}
