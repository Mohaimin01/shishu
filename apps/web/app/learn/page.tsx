"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  listForPack, bridgeCards, resolveBundled,
  type ActivityType, type Lane,
} from "@/lib/activities";
import { downloadedPacks } from "@/lib/online-packs";
import { LANGS } from "@/lib/packs";
import { fontClassFor, fontClassForText } from "@/lib/script";
import { useSettings } from "@/store";
import { useGamify, levelOf } from "@/lib/gamify";
import { stageForAge, type Stage } from "@shishu/core";

const SECTIONS: { type: ActivityType; title: string }[] = [
  { type: "color-letter", title: "Color the letters" },
  { type: "trace-letter", title: "Trace the letters" },
  { type: "color-number", title: "Color the numbers" },
  { type: "tap-sound", title: "Listen and tap" },
  { type: "match-picture-word", title: "Words with pictures" },
  { type: "sentence-strip", title: "Build the sentence" },
  { type: "listen-repeat", title: "Say it together" },
  { type: "concept-table-review", title: "One word, many homes" },
];

const STAGE_LABEL: Record<Stage, string> = {
  toddler: "Ages 2–3",
  preschool: "Ages 3–4",
  prek: "Ages 4–5",
  k1: "Ages 5–7",
  junior: "Ages 7–9",
  tween: "Ages 9–12",
};

const TOGETHER = "together";

function LearnInner() {
  const params = useSearchParams();
  const settings = useSettings();
  const stageParam = params.get("stage") as Stage | null;
  const stage = stageParam ?? stageForAge(settings.age);
  const laneParam = params.get("lane");

  // downloaded (community) packs join bundled packs as full lanes
  const [dl, setDl] = useState<Record<string, import("@shishu/content-schema").LanguagePack>>({});
  useEffect(() => {
    let alive = true;
    downloadedPacks().then((rows) => {
      if (alive) setDl(Object.fromEntries(rows.map((r) => [r.code, r])));
    });
    return () => { alive = false; };
  }, []);

  const lanes = useMemo<Lane[]>(() => {
    return settings.activeLangs
      .map((code) => {
        const bundled = resolveBundled(code);
        const pack = bundled ?? dl[code];
        if (!pack) return null;
        const name = settings.laneNames[code] ?? pack.nativeName;
        return { code, pack, name, bundled: Boolean(bundled) };
      })
      .filter((l): l is Lane => l !== null);
  }, [settings.activeLangs, settings.laneNames, dl]);

  const bridges = useMemo(() => (lanes.length >= 2 ? bridgeCards(lanes) : []), [lanes]);

  const activeCode = laneParam ?? lanes[0]?.code;
  const activeLane = lanes.find((l) => l.code === activeCode);
  const isTogether = activeCode === TOGETHER && lanes.length >= 2;

  // garden stats — celebration, never pressure
  const g = useGamify();
  const lv = levelOf(g.xp);

  // one-tap language picker: every bundled language + downloaded packs not already lanes
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerItems = [
    ...LANGS.map((l) => ({ code: l.code, name: l.nativeName })),
    ...Object.keys(dl)
      .filter((c) => !LANGS.some((l) => l.code === c))
      .map((c) => ({ code: c, name: dl[c].nativeName })),
  ];
  const addLane = (code: string) => {
    if (!settings.activeLangs.includes(code)) {
      useSettings.getState().set({ activeLangs: [...settings.activeLangs, code] });
    }
  };

  return (
    <main className="min-h-screen px-5 pb-12">
      <header className="flex items-center justify-between pt-4 pb-3">
        <Link
          href="/"
          className="w-12 h-12 rounded-2xl bg-surface shadow-sm flex items-center justify-center text-xl text-text active:scale-95 transition duration-gentle"
          aria-label="back home"
        >
          ←
        </Link>
        <div className="text-center">
          <h1 className={`text-xl font-bold ${fontClassForText(isTogether ? "Together" : activeLane?.name ?? "")}`}>
            {isTogether ? "Together" : activeLane?.name ?? "Shishu"}
          </h1>
          <p className="text-xs text-muted">{STAGE_LABEL[stage]} · gentle play</p>
        </div>
        <div className="w-12" aria-hidden />
      </header>

      {/* garden stats — gentle celebration, no guilt numbers */}
      <div className="flex items-center justify-center gap-2 pb-4 flex-wrap" aria-label="garden progress">
        <span className="px-3 py-1.5 min-h-[36px] rounded-2xl bg-surface shadow-sm text-sm font-semibold flex items-center" aria-label={`${g.xp} seeds`}>
          <span aria-hidden>🌱</span>&nbsp;{g.xp}
        </span>
        {g.streak > 0 && (
          <span className="px-3 py-1.5 min-h-[36px] rounded-2xl bg-surface shadow-sm text-sm font-semibold flex items-center" aria-label={`${g.streak} day streak`}>
            <span aria-hidden>🔥</span>&nbsp;{g.streak}d
          </span>
        )}
        <span
          className="px-3 py-1.5 min-h-[36px] rounded-2xl bg-surface shadow-sm text-sm font-semibold flex items-center"
          aria-label={`level: ${lv.level.name}`}
          title={lv.next ? `${lv.next.emoji} ${lv.next.name} at ${lv.next.at} seeds` : undefined}
        >
          <span aria-hidden>{lv.level.emoji}</span>&nbsp;{lv.level.name}
        </span>
      </div>

      {/* language lanes — a grown-up switch, calm chips */}
      <div className="flex justify-center gap-2 pb-5 flex-wrap">
        {lanes.map((l) => (
          <Link
            key={l.code}
            href={`/learn?lane=${l.code}&stage=${stage}`}
            className={`px-4 min-h-[48px] flex items-center rounded-2xl transition duration-gentle active:scale-95 ${
              activeCode === l.code ? "bg-primary text-white" : "bg-surface text-text shadow-sm"
            }`}
            aria-current={activeCode === l.code ? "true" : undefined}
          >
            <span className={fontClassForText(l.name)}>{l.name}</span>
          </Link>
        ))}
        {lanes.length >= 2 && (
          <Link
            href={`/learn?lane=${TOGETHER}&stage=${stage}`}
            className={`px-4 min-h-[48px] flex items-center rounded-2xl transition duration-gentle active:scale-95 ${
              isTogether ? "bg-primary text-white" : "bg-surface text-text shadow-sm"
            }`}
            aria-current={isTogether ? "true" : undefined}
          >
            Together
          </Link>
        )}
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className={`px-4 min-h-[48px] flex items-center rounded-2xl font-semibold transition duration-gentle active:scale-95 ${
            pickerOpen ? "bg-primary text-white" : "bg-surface text-primary shadow-sm ring-1 ring-primary/30"
          }`}
          aria-expanded={pickerOpen}
          aria-controls="language-picker"
        >
          + Language
        </button>
      </div>

      {/* one-tap language picker — every bundled language, no digging into settings */}
      {pickerOpen && (
        <section
          id="language-picker"
          className="max-w-[560px] mx-auto bg-surface rounded-3xl shadow-sm p-4 mb-6"
          aria-label="choose languages"
        >
          <p className="text-xs text-muted mb-2">
            Tap to add a lane — a language is someone&apos;s voice. The first lane is the home language.
            Remove any time in Grown-ups.
          </p>
          <div className="flex flex-wrap gap-2">
            {pickerItems.map((l) => {
              const on = settings.activeLangs.includes(l.code);
              return (
                <button
                  key={l.code}
                  onClick={() => addLane(l.code)}
                  disabled={on}
                  className={`px-3 min-h-[44px] rounded-2xl text-sm transition duration-gentle active:scale-95 ${
                    on ? "bg-primary text-white" : "bg-bg text-text ring-1 ring-text/10"
                  } ${fontClassForText(l.name)}`}
                  aria-pressed={on}
                >
                  {l.name}{on ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted mt-2">All {LANGS.length} languages are bundled &amp; work offline.</p>
        </section>
      )}

      {isTogether ? (
        <nav className="flex flex-col gap-6 max-w-[560px] mx-auto" aria-label="Together activities">
          <section aria-label="One idea, many languages">
            <div className="flex items-center justify-between px-2 py-1">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">One idea, many languages</h2>
              <span className="text-xs text-muted">{bridges.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {bridges.map((b) => (
                <Link
                  key={b.conceptId}
                  href={`/play?lang=${lanes[0].code}&stage=${stage}&type=concept-bridge&item=${b.conceptId}`}
                  className="card text-center py-6 active:scale-95 transition duration-gentle hover:shadow"
                  aria-label={`concept ${b.conceptId}`}
                >
                  <span className="block text-4xl" aria-hidden>{b.emoji}</span>
                  <span className="text-[11px] text-muted mt-1 block">{b.langs.map((x) => x.label).join(" · ")}</span>
                </Link>
              ))}
            </div>
          </section>
        </nav>
      ) : (
        activeLane && (
          <nav className="flex flex-col gap-6 max-w-[560px] mx-auto">
            {SECTIONS.map(({ type, title }) => {
              const items = listForPack(activeLane.pack, stage).filter((c) => c.type === type);
              if (items.length === 0) return null;
              return (
                <section key={type} aria-label={title}>
                  <div className="flex items-center justify-between px-2 py-1">
                    <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{title}</h2>
                    <span className="text-xs text-muted">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {items.map((c) => (
                      <Link
                        key={c.key}
                        href={`/play?lang=${activeLane.code}&stage=${stage}&type=${c.type}&item=${c.itemId}`}
                        className="card text-center py-6 active:scale-95 transition duration-gentle hover:shadow"
                        aria-label={`${title}: ${c.glyph}`}
                      >
                        <span
                          className={`block text-4xl font-bold text-text ${fontClassFor(c.glyphScript)}`}
                        >
                          {c.glyph}
                        </span>
                        <span className="text-[11px] text-muted mt-1 block">{c.label}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </nav>
        )
      )}

      <footer className="mt-10 text-center text-xs text-muted">
        <Link href="/parent" className="underline underline-offset-4">Grown-ups</Link>
        <span aria-hidden> · </span>
        <span>{settings.activeLangs.length} language{settings.activeLangs.length > 1 ? "s" : ""} active</span>
      </footer>
    </main>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <LearnInner />
    </Suspense>
  );
}
