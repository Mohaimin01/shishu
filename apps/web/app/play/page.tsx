"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ColorCanvas from "@/components/ColorCanvas";
import TapSound from "@/components/activities/TapSound";
import MatchPictureWord from "@/components/activities/MatchPictureWord";
import ConceptBridge from "@/components/activities/ConceptBridge";
import SentenceStrip from "@/components/activities/SentenceStrip";
import ListenRepeat from "@/components/activities/ListenRepeat";
import ConceptTable from "@/components/activities/ConceptTable";
import {
  bridgeCards, findCard, listForStage, nextAfter, TYPE_TITLE,
  type ActivityCard,
} from "@/lib/activities";
import { BUNDLED_CODES, getPack, hasPack, loadDownloadedPacks } from "@/lib/packs";
import { useGamify } from "@/lib/gamify";
import { fontClassForText } from "@/lib/script";
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
        script={p.script}
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
        script={p.script}
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
  if (card.type === "sentence-strip") {
    return <SentenceStrip lang={lang} itemId={card.itemId} onAnswer={() => onDone()} />;
  }
  if (card.type === "listen-repeat") {
    return <ListenRepeat lang={lang} itemId={card.itemId} onDone={() => onDone()} />;
  }
  if (card.type === "concept-table-review") {
    return <ConceptTable lang={lang} itemId={card.itemId} onDone={() => onDone()} />;
  }
  if (card.type === "concept-bridge") {
    // hasPack/getPack read the packs map, which already holds downloaded community packs
    // at this point (loadDownloadedPacks ran before packsReady turned true) — so bridges
    // shown on the Learn screen stay playable here too, not only bundled ones.
    const lanes = useSettings.getState().activeLangs
      .filter(hasPack)
      .map((code) => {
        const pack = getPack(code);
        return { code, pack, name: pack.nativeName, bundled: BUNDLED_CODES.includes(code) };
      });
    const bridge = bridgeCards(lanes).find((b) => b.conceptId === card.itemId);
    if (bridge) return <ConceptBridge card={bridge} onDone={onDone} />;
  }
  return <p className="text-muted">Coming soon</p>;
}

function RunnerInner() {
  const params = useSearchParams();
  const router = useRouter();
  const settings = useSettings();
  const lang = params.get("lang") ?? settings.activeLangs[0] ?? settings.lang;
  const stage = (params.get("stage") ?? settings.stage) as Stage;
  const type = params.get("type");
  const item = params.get("item");

  // downloaded community packs must be registered before any activity reads them
  const [packsReady, setPacksReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void loadDownloadedPacks().then(() => { if (alive) setPacksReady(true); });
    return () => { alive = false; };
  }, []);

  const card = useMemo<ActivityCard | undefined>(() => {
    if (!packsReady) return undefined;
    if (type === "concept-bridge" && item) return { key: `concept-bridge:${item}`, type: "concept-bridge", itemId: item, label: "together", glyph: "◑" };
    if (type && item) return findCard(lang, type, item);
    return listForStage(lang, stage)[0];
  }, [type, item, lang, stage, packsReady]);

  const [complete, setComplete] = useState(false);
  const [earned, setEarned] = useState<number | null>(null);
  const [windDown, setWindDown] = useState(false);
  const mountedRef = useRef(Date.now());
  const completeRef = useRef(false);

  // one-tap Continue memory (board verdict #8): home recalls this later
  useEffect(() => {
    if (card) {
      useSettings.getState().set({
        lastActivity: { lang, stage, type: card.type, itemId: card.itemId },
      });
    }
    completeRef.current = false;
    setComplete(false);
    setEarned(null);
  }, [lang, stage, card]);

  const flushMinutes = async () => {
    const mins = (Date.now() - mountedRef.current) / 60000;
    mountedRef.current = Date.now();
    if (mins > 0.2) await addMinutes(mins, lang);
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
    if (completeRef.current) return; // some canvases can fire twice — award once
    completeRef.current = true;
    setComplete(true);
    if (card) setEarned(useGamify.getState().award(card.type));
    void checkCap();
  };

  const next = () => {
    if (card?.type === "concept-bridge") {
      // "Next" in Together means the NEXT word, not back to the word grid —
      // walk the bridges in the same order the lane shows them; the grid is the wrap point.
      const lanes = useSettings.getState().activeLangs.filter(hasPack).map((code) => {
        const pack = getPack(code);
        return { code, pack, name: pack.nativeName, bundled: BUNDLED_CODES.includes(code) };
      });
      const bridges = bridgeCards(lanes);
      const i = bridges.findIndex((b) => b.conceptId === card.itemId);
      const n = i >= 0 ? bridges[i + 1] : undefined;
      if (n) {
        router.push(`/play?lang=${lang}&stage=${stage}&type=concept-bridge&item=${n.conceptId}`);
        return;
      }
      router.push(`/learn?lane=together&stage=${stage}`);
      return;
    }
    const n = card ? nextAfter(lang, card, stage) : undefined;
    if (n) router.push(`/play?lang=${lang}&stage=${stage}&type=${n.type}&item=${n.itemId}`);
    else router.push(`/learn?lane=${lang}&stage=${stage}`);
  };

  // Duolingo-style flow: finishing an activity advances on its own (a beat to enjoy it first).
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (!complete || windDown) return;
    const t = setTimeout(() => nextRef.current(), 1600);
    return () => clearTimeout(t);
  }, [complete, windDown, card]);

  const laneName = settings.laneNames[lang] ?? (packsReady ? getPack(lang).nativeName : "");
  const seeds = useGamify((s) => s.xp);

  return (
    <main className="min-h-screen flex flex-col px-5 pb-10">
      <header className="flex items-center justify-between pt-4 pb-2">
        <Link
          href={`/learn?lane=${card?.type === "concept-bridge" ? "together" : lang}&stage=${stage}`}
          className="w-12 h-12 rounded-2xl bg-surface shadow-sm flex items-center justify-center text-xl text-text active:scale-95 transition duration-gentle"
          aria-label="back to activities"
        >
          ←
        </Link>
        <div className="text-center">
          <p className={`text-sm text-muted ${fontClassForText(laneName)}`}>{laneName}</p>
          <h1 className="text-lg font-bold text-text">
            {card ? TYPE_TITLE[card.type] : "Shishu"}
          </h1>
        </div>
        <div
          className="w-12 h-12 rounded-2xl bg-surface shadow-sm flex flex-col items-center justify-center text-[11px] font-bold text-text leading-none"
          aria-label={`${seeds} seeds`}
        >
          <span aria-hidden className="text-base">🌱</span>
          <span>{seeds}</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        {/* key = fresh state for every activity (stale state carried between cards was a bug) */}
        {card && <ActivityBody key={`${lang}:${card.key}`} card={card} lang={lang} onDone={onDone} />}
      </div>

      {complete && !windDown && earned !== null && (
        <div
          aria-hidden
          className="xp-float fixed bottom-24 left-1/2 z-40 text-2xl font-bold text-primary bg-surface rounded-full px-5 py-2 shadow-md"
        >
          🌱 +{earned}
        </div>
      )}
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
