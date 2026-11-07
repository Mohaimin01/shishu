"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSettings, weeklyTargetFor } from "@/store";
import { packs } from "@/lib/packs";
import { langProgress } from "@/lib/progress";
import { db, laneMinutesLast7, todayMinutes } from "@/lib/db";
import { downloadedPacks, fetchAndStashPack, removePack } from "@/lib/online-packs";
import { playWordAudio, familyKey } from "@/lib/wordaudio";
import { speakOrPlay } from "@/lib/audio";
import { resolveBundled } from "@/lib/activities";
import { STAGE_ORDER, STAGE_AGES, type Stage } from "@shishu/core";
import type { LanguagePack, WordItem } from "@shishu/content-schema";

const CO_PLAY = [
  "Say the letter sound together out loud, then clap once. (আওয়াজ মিলিয়ে বল, তারপর একবার হাততালি।)",
  "Ask 'what color next?' and let them choose from the palette.",
  "After coloring a letter, write it with a finger in the air too.",
  "Find the real thing at home — a glass of water, an apple — and say the word twice.",
  "Count stairs or toes while counting numbers on screen.",
];

function dayMinutes(m: number): string {
  return `${Math.round(m)} min`;
}

export default function ParentPage() {
  const s = useSettings();
  const [ready, setReady] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [tip, setTip] = useState(0);
  const [laneRows, setLaneRows] = useState<{ code: string; name: string; tried: number; solid: number; wk: number; target: number }[]>([]);
  const [dlPacks, setDlPacks] = useState<LanguagePack[]>([]);
  const [packUrl, setPackUrl] = useState("");
  const [packMsg, setPackMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const activeCodes = s.activeLangs;

  // "Use it today" — one word to bring into family life (stable per day)
  const useToday = useMemo(() => {
    const primary = packets()[activeCodes[0]] ?? packs.en;
    if (primary.words.length === 0) return null;
    const d = new Date();
    const dayIdx = d.getFullYear() * 1000 + (d.getMonth() + 1) * 40 + d.getDate();
    const w = primary.words[dayIdx % primary.words.length];
    const mirrors = activeCodes
      .filter((c) => c !== activeCodes[0])
      .map((c) => (packets()[c] ?? dlPacks.find((p) => p.code === c))?.words.find((x) => x.conceptId === w.conceptId)?.label)
      .filter(Boolean) as string[];
    // a daily phrase to carry the word into real family talk
    const shortPhrases = primary.phrases.filter((ph) => (ph.tokens ?? ph.text.split(/\s+/)).length <= 3);
    const ph = shortPhrases.length > 0 ? shortPhrases[dayIdx % shortPhrases.length] : null;
    return {
      id: w.conceptId || w.id,
      label: w.label,
      audioUrl: w.audioUrl,
      emoji: w.emoji ?? "🌱",
      mirrors,
      phrase: ph ? { id: ph.id, text: ph.text, audioUrl: ph.audioUrl } : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function packets() {
    return packs as unknown as Record<string, LanguagePack>;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const childId = useSettings.getState().childId || "anon";
      const rows = await Promise.all(
        activeCodes.map(async (code, i) => {
          const p = packets()[code] ?? dlPacks.find((x) => x.code === code);
          const st = await langProgress(childId, code);
          const wk = await laneMinutesLast7(code);
          return {
            code,
            name: s.laneNames[code] ?? p?.nativeName ?? code,
            tried: st.touched,
            solid: st.mastered,
            wk,
            target: weeklyTargetFor(i),
          };
        }),
      );
      const [min] = await Promise.all([todayMinutes()]);
      const dl = await downloadedPacks();
      if (!alive) return;
      setLaneRows(rows);
      setMinutes(min);
      setDlPacks(dl);
      setReady(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.activeLangs.join(","), s.childId]);

  const rotateTip = () => setTip((t) => (t + 1) % CO_PLAY.length);

  const addLane = (code: string) => {
    if (activeCodes.includes(code)) return;
    useSettings.getState().set({ activeLangs: [...activeCodes, code] });
  };

  const dropPack = async (code: string) => {
    await removePack(code);
    const dl = await downloadedPacks();
    setDlPacks(dl);
    useSettings.getState().set({ activeLangs: activeCodes.filter((c) => c !== code) });
  };

const downloadPack = async () => {
    setPackMsg(null);
    try {
      const pack = await fetchAndStashPack(packUrl);
      setPackUrl("");
      setPackMsg({ ok: true, text: `${pack.nativeName} pack verified & saved offline ✓` });
      setDlPacks(await downloadedPacks());
    } catch (e) {
      setPackMsg({ ok: false, text: `Could not load that pack: ${e instanceof Error ? e.message : String(e)}` });
    }
  };

  // ---------- Family voices (local-only recordings) ----------
  const childIdNow = s.childId || "anon";
  const [voiceLane, setVoiceLane] = useState<string>(activeCodes[0] ?? "en");
  const [recItem, setRecItem] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingRef = useRef<{ id: string; item: WordItem } | null>(null);

  const lanePack = (code: string): LanguagePack | undefined =>
    resolveBundled(code) ?? dlPacks.find((x) => x.code === code);

  const loadRecorded = async () => {
    try {
      const rows = await db.familyaudio.toArray();
      setRecorded(new Set(rows.map((r) => r.key)));
    } catch { /* fresh db */ }
  };

  useEffect(() => { void loadRecorded(); }, []);

  const startVoiceRec = async (item: WordItem) => {
    if (voiceMsg) setVoiceMsg(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceMsg("Voice recording is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      pendingRef.current = { id: item.conceptId || item.id, item };
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => { void saveVoiceTake(rec); };
      mediaRef.current = rec;
      rec.start();
      setRecItem(item.conceptId || item.id);
      setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 5000);
    } catch {
      setVoiceMsg("Microphone unavailable — allow mic access in the browser first.");
    }
  };

  const saveVoiceTake = async (rec: MediaRecorder) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
    const pend = pendingRef.current;
    setRecItem(null);
    if (!pend || blob.size === 0) return;
    const key = familyKey(childIdNow, voiceLane, pend.id);
    try {
      await db.familyaudio.put({ key, blob, updatedAt: Date.now() });
      setRecorded((prev) => new Set(prev).add(key));
      // instant playback so the grown-up hears the take
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.onended = () => URL.revokeObjectURL(url);
      a.onerror = () => URL.revokeObjectURL(url);
      void a.play().catch(() => URL.revokeObjectURL(url));
      setVoiceMsg(`✓ "${pend.item.label}" saved — it now plays in every activity`);
      loadRecorded();
    } catch {
      setVoiceMsg("Could not save the recording (storage full?).");
    }
  };

  const stopVoiceRec = () => {
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
  };

  const previewVoice = (item: WordItem) => {
    void playWordAudio(childIdNow, voiceLane, item.conceptId || item.id, item.label, item.audioUrl);
  };

  const deleteVoice = async (item: WordItem) => {
    await db.familyaudio.delete(familyKey(childIdNow, voiceLane, item.conceptId || item.id));
    loadRecorded();
    setVoiceMsg(`Removed your voice for ${item.label} — device voice takes over`);
  };

  const clearData = async () => {
    const msg = "সব শেখার প্রগ্রেস মুছে ফেলবেন?\nClear all learning progress on this device?";
    if (typeof window !== "undefined" && !window.confirm(msg)) return;
    await db.progress.clear();
    await db.sessions.clear();
    await db.lanelog.clear();
    await db.familyaudio.clear();
    window.location.reload();
  };

  const bn = (str: string) => /[\u0980-\u09FF]/.test(str);

  const phrase = useToday?.phrase ?? null;

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
        {/* Per-language progress — qualitative tiers, no guilt numbers */}
        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-3">
            Progress <span className="font-bengali font-normal">· অগ্রগতি</span>
          </h2>
          {ready ? (
            <ul className="flex flex-col gap-3">
              {laneRows.map((r) => (
                <li key={r.code} className="flex items-center justify-between gap-3">
                  <span className={`font-semibold ${bn(r.name) ? "font-bengali" : ""}`}>{r.name}</span>
                  <span className="flex items-center gap-4 text-sm">
                    <span><span className="font-bold">{r.tried}</span> <span className="text-muted">tried · চেষ্টা</span></span>
                    <span><span className="font-bold">{r.solid}</span> <span className="text-muted">solid · পারা হয়েছে</span></span>
                    {s.showMinutes && (
                      <span className={`text-xs ${r.wk >= r.target ? "text-success" : "text-muted"}`}>
                        {dayMinutes(r.wk)}/{r.target}w
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )}
          {ready && (
            <p className="text-xs text-muted mt-3">
              Dose guide: home language daily, others lighter — the app plants seeds, your home waters them.
              <span className="font-bengali"> অ্যাপটি শুধু বীজ; ঘরের ভাষা হলো মাটি।</span>
            </p>
          )}
        </section>

        {s.showMinutes && (
          <section className="card" aria-label="learning minutes today">
            <p className="text-sm text-muted">Learning minutes so far today</p>
            <p className="text-2xl font-bold">{Math.round(minutes)}</p>
          </section>
        )}

        {/* Use it today — the bridge card that carries learning into family life */}
        {ready && useToday && (
          <section className="card">
            <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">
              Use it today <span className="font-bengali font-normal">· আজ বলুন</span>
            </h2>
            <p className="text-2xl font-bold">
              <span aria-hidden className="align-middle">{useToday.emoji }</span>{" "}
              <span className="font-bengali">{useToday.label}</span>{" "}
              <button
                onClick={() => void playWordAudio(childIdNow, activeCodes[0], useToday.id, useToday.label, useToday.audioUrl)}
                className="align-middle text-xl text-primary ml-1"
                aria-label={`speak ${useToday.label}`}
              >
                🔊
              </button>
            </p>
            {useToday.mirrors.length > 0 && (
              <p className="text-sm text-muted mt-1">
                <span className="font-bengali">এটাকে আরেক বাড়িতে বলে: </span>{useToday.mirrors.join(" · ")}
              </p>
            )}
            {phrase && (
              <p className="text-base mt-2 flex items-center gap-2">
                <span className="text-muted text-xs uppercase tracking-wide">In a sentence</span>
                <span className={`font-semibold ${bn(phrase.text) ? "font-bengali" : ""}`}>{phrase.text}</span>
                <button
                  onClick={() => speakOrPlay(phrase.text, activeCodes[0], phrase.audioUrl)}
                  className="text-primary"
                  aria-label={`speak the sentence ${phrase.text}`}
                >
                  🔊
                </button>
              </p>
            )}
            <p className="text-xs text-muted mt-2">Bring it into a meal or bath time — twice, warmly.</p>
          </section>
        )}

        {/* Settings */}
        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-3">Play nicely <span className="font-bengali font-normal">· সেটিংস</span></h2>

          <div className="flex items-center justify-between py-2">
            <span id="lbl-sound" className="text-base">Sounds <span className="font-bengali text-muted">· শব্দ</span></span>
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

          <div className="flex items-center justify-between py-2">
            <span id="lbl-min" className="text-base">Show learning minutes <span className="font-bengali text-muted">· সময় দেখান</span></span>
            <button
              role="switch"
              aria-checked={s.showMinutes}
              aria-labelledby="lbl-min"
              onClick={() => s.set({ showMinutes: !s.showMinutes })}
              className={`w-14 h-9 rounded-full transition duration-gentle ${s.showMinutes ? "bg-primary" : "bg-text/20"} relative`}
            >
              <span className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all duration-gentle ${s.showMinutes ? "left-6" : "left-1"}`} />
            </button>
          </div>

          <div className="py-2">
            <span className="text-base block mb-2">Child age <span className="font-bengali text-muted">· সন্তানের বয়স</span></span>
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
            <p className="text-xs text-muted mt-1">Stage suggests — nothing is locked. <span className="font-bengali">কোনো কিছু বন্ধ হয় না।</span></p>
          </div>

          <div className="py-2">
            <label htmlFor="cap" className="text-base block">Daily gentle limit <span className="font-bengali text-muted">· দৈনিক সীমা</span></label>
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

          {/* Language lanes (languages as people — rename family lanes) */}
          <div className="py-2">
            <span className="text-base block mb-2">Language lanes <span className="font-bengali text-muted">· ভাষা</span></span>
            <div className="flex flex-col gap-2">
              {activeCodes.map((code, i) => {
                const p = packets()[code] ?? dlPacks.find((x) => x.code === code);
                return (
                  <div key={code} className="flex items-center gap-2">
                    <span className="text-xs text-muted w-16">{i === 0 ? "home" : `#${i + 1}`}</span>
                    <input
                      className="flex-1 min-h-[48px] px-3 rounded-2xl bg-bg ring-1 ring-text/10 text-base"
                      value={s.laneNames[code] ?? p?.nativeName ?? code}
                      onChange={(e) => s.set({ laneNames: { ...s.laneNames, [code]: e.target.value } })}
                      aria-label={`name for ${code} lane`}
                      maxLength={24}
                    />
                    {!packs[code] && <button onClick={() => dropPack(code)} className="text-danger text-sm px-2" aria-label={`remove ${code}`}>✕</button>}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted mt-1">Try মা&apos;s ভাষা, Baba&apos;s — a language belongs to a person. First lane is the home language.</p>
          </div>

          <button onClick={clearData} className="text-sm text-danger underline underline-offset-4 py-3">
            Erase progress on this device <span className="font-bengali">· সব মুছুন</span>
          </button>
        </section>

        {/* Family voices — মা's own voice beats any device voice */}
        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">
            Family voices <span className="font-bengali font-normal">· কণ্ঠ</span>
          </h2>
          <p className="text-xs text-muted mb-3">
            Record the words in your family&apos;s voice. They play in every activity before the device voice —
            and stay on this device only. <span className="font-bengali">মা&apos;s কণ্ঠ সবচেয়ে ভালো।</span>
          </p>

          <div className="flex gap-2 pb-3 flex-wrap">
            {activeCodes.map((code) => {
              const label = s.laneNames[code] ?? lanePack(code)?.nativeName ?? code;
              return (
                <button
                  key={code}
                  onClick={() => setVoiceLane(code)}
                  className={`px-3 min-h-[44px] rounded-2xl text-sm transition duration-gentle ${bn(label) ? "font-bengali" : ""} ${
                    voiceLane === code ? "bg-primary text-white" : "bg-bg text-text ring-1 ring-text/10"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(lanePack(voiceLane)?.words ?? []).map((w) => {
              const id = w.conceptId || w.id;
              const key = familyKey(childIdNow, voiceLane, id);
              const isRec = recItem === id;
              return (
                <div key={w.id} className="flex items-center justify-between gap-1 bg-bg rounded-2xl px-2 py-1.5">
                  <span className="text-sm truncate">
                    <span aria-hidden>{w.emoji}</span>{" "}
                    <span className={bn(w.label) ? "font-bengali" : ""}>{w.label}</span>
                    {recorded.has(key) && <span aria-label="has family voice"> ✓</span>}
                  </span>
                  <span className="flex items-center">
                    <button
                      onClick={() => (isRec ? stopVoiceRec() : startVoiceRec(w))}
                      className={`w-9 h-9 rounded-full text-sm ${isRec ? "bg-danger text-white animate-pulse" : "bg-surface text-text shadow-sm"}`}
                      aria-label={isRec ? `stop recording ${w.label}` : `record ${w.label} in your voice`}
                    >
                      {isRec ? "■" : "●"}
                    </button>
                    <button onClick={() => previewVoice(w)} className="w-9 h-9 rounded-full text-sm" aria-label={`play ${w.label}`}>
                      ▶
                    </button>
                    {recorded.has(key) && (
                      <button onClick={() => deleteVoice(w)} className="w-7 h-9 text-danger text-xs" aria-label={`delete family voice for ${w.label}`}>
                        ✕
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {recItem !== null && (
            <p role="status" className="text-sm text-primary mt-2">◉ recording… tap ■ when done (max 5 s)</p>
          )}
          {voiceMsg && (
            <p role="status" className={`text-sm mt-2 ${voiceMsg.startsWith("✓") ? "text-success" : "text-muted"}`}>{voiceMsg}</p>
          )}
        </section>

        {/* Community packs — parent-gated downloads, offline after save */}
        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-3">Community language packs</h2>
          <p className="text-xs text-muted mb-2">
            Paste a pack URL (https://…pack.json). It&apos;s checked, saved on this device, and works offline after. No accounts, nothing uploaded.
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 min-h-[48px] px-3 rounded-2xl bg-bg ring-1 ring-text/10 text-sm"
              placeholder="https://example.com/shishu/pack.json"
              value={packUrl}
              onChange={(e) => setPackUrl(e.target.value)}
              aria-label="pack URL"
              inputMode="url"
            />
            <button onClick={downloadPack} className="bg-primary text-white px-4 rounded-2xl min-h-[48px] active:scale-95 transition duration-gentle">
              Add
            </button>
          </div>
          {packMsg && (
            <p role="status" className={`text-sm mt-2 ${packMsg.ok ? "text-success" : "text-danger"}`}>{packMsg.text}</p>
          )}
          {dlPacks.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {dlPacks.map((p) => (
                <li key={p.code} className="flex items-center justify-between gap-2 bg-bg rounded-2xl px-3 py-2">
                  <span className="font-bengali">{p.nativeName}</span>
                  {activeCodes.includes(p.code) ? (
                    <span className="text-xs text-muted">in your lanes ✓</span>
                  ) : (
                    <button onClick={() => addLane(p.code)} className="text-primary text-sm underline underline-offset-4">add as lane</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">Play together <span className="font-bengali font-normal">· একসাথে</span></h2>
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
          <p className="mt-2">Want to add your language? Read <span className="font-mono">docs/PACKS.md</span> in the repo — one JSON file per language.</p>
        </section>
      </div>
    </main>
  );
}
