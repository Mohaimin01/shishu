"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  listForPack, bridgeCards, resolveBundled,
  type ActivityType, type Lane,
} from "@/lib/activities";
import { downloadedPacks } from "@/lib/online-packs";
import { useSettings } from "@/store";
import { stageForAge, type Stage } from "@shishu/core";

const SECTIONS: { type: ActivityType; title: string }[] = [
  { type: "color-letter", title: "Color the letters" },
  { type: "trace-letter", title: "Trace the letters" },
  { type: "color-number", title: "Color the numbers" },
  { type: "tap-sound", title: "Listen and tap" },
  { type: "match-picture-word", title: "Words with pictures" },
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
  const [refresh] = useState(0);
  useEffect(() => {
    let alive = true;
    downloadedPacks().then((rows) => {
      if (alive) setDl(Object.fromEntries(rows.map((r) => [r.code, r])));
    });
    return () => { alive = false; };
  }, [refresh]);

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
          <h1 className="text-xl font-bold">
            {isTogether ? "Together" : activeLane?.name ?? "Shishu"}
          </h1>
          <p className="text-xs text-muted">{STAGE_LABEL[stage]} · gentle play</p>
        </div>
        <div className="w-12" aria-hidden />
      </header>

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
            {l.name}
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
      </div>

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
              const items = listForPack(activeLane.pack).filter((c) => c.type === type);
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
                          className={`block text-4xl font-bold text-text ${c.glyphScript === "bengali" ? "font-bengali" : ""}`}
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
