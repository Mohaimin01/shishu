"use client";

import { useEffect, useRef, useState } from "react";
import { chime } from "@/lib/audio";
import { playWordAudio } from "@/lib/wordaudio";
import { recordExposure } from "@/lib/progress";
import { useSettings } from "@/store";
import { packs } from "@/lib/packs";

/**
 * Say it together — hear the word, then the child's own voice.
 * The echo recorder is opt-in (mic permission is the parent gate),
 * 4.5 s max, lives only in RAM: nothing is stored, nothing is uploaded.
 * No mic? The "we said it" path keeps the moment fully offline-play.
 */
export default function ListenRepeat({ lang, itemId, onDone }: {
  lang: string;
  itemId: string;
  onDone?: () => void;
}) {
  const p = packs[lang] ?? packs.en;
  const sound = useSettings((s) => s.sound);
  const childId = useSettings((s) => s.childId);
  const word = p.words.find((w) => w.id === itemId) ?? p.words[0];

  const [phase, setPhase] = useState<"idle" | "recording" | "recorded" | "denied">("idle");
  const [hasAudio, setHasAudio] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const echoedRef = useRef(false);

  useEffect(() => () => { // stop everything on unmount
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const markEcho = () => {
    if (echoedRef.current) return;
    echoedRef.current = true;
    void recordExposure(childId || "anon", lang, "word", word.conceptId || word.id);
    onDone?.();
  };

  const hearWord = () => {
    if (!sound) return;
    void playWordAudio(childId || "anon", lang, word.conceptId || word.id, word.label, word.audioUrl);
  };

  const startRec = async () => {
    try {
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; blobRef.current = null; setHasAudio(false); }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        blobRef.current = blob;
        urlRef.current = URL.createObjectURL(blob);
        setHasAudio(true);
        setPhase("recorded");
        // gentle instant echo so the child hears themselves right away
        const a = new Audio(urlRef.current);
        a.onended = () => markEcho();
        void a.play().catch(() => {});
      };
      recRef.current = rec;
      rec.start();
      setPhase("recording");
      setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 4500);
    } catch {
      setPhase("denied");
    }
  };

  const stopRec = () => {
    if (recRef.current?.state === "recording") recRef.current.stop();
  };

  const hearSelf = () => {
    if (urlRef.current) {
      const a = new Audio(urlRef.current);
      a.onended = () => markEcho();
      void a.play().catch(() => {});
    }
  };

  const saidIt = () => {
    if (sound) chime(true);
    markEcho();
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px]">
      <span aria-hidden className="text-8xl">{word.emoji ?? "🗣"}</span>

      <button
        onClick={hearWord}
        className="text-4xl font-bold text-text px-8 py-4 card"
        aria-label={`hear ${word.label}`}
      >
        <span className={/[\u0980-\u09FF]/.test(word.label) ? "font-bengali" : ""}>{word.label}</span>
        <span aria-hidden className="ml-2">🔊</span>
      </button>

      {phase === "idle" && (
        <>
          <button
            onClick={startRec}
            className="btn-primary min-h-[56px] px-8 text-lg"
            aria-label="your turn, record your voice"
          >
            🎙️ Your turn
          </button>
          <button onClick={saidIt} className="text-sm text-muted underline underline-offset-4">
            we said it together ✓
          </button>
        </>
      )}

      {phase === "recording" && (
        <div className="flex flex-col items-center gap-3" aria-live="polite">
          <span aria-hidden className="text-4xl animate-pulse">🎙️</span>
          <button
            onClick={stopRec}
            className="bg-primary text-white rounded-3xl px-8 min-h-[56px] text-lg active:scale-95 transition duration-gentle"
            aria-label="done talking"
          >
            ■ done
          </button>
        </div>
      )}

      {phase === "recorded" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted">You did it! Hear both voices:</p>
          <div className="flex gap-3">
            <button
              onClick={hearSelf}
              className="bg-primary text-white rounded-2xl min-h-[56px] px-6 text-lg active:scale-95 transition duration-gentle"
              aria-label="hear your own voice"
            >
              ▶ my voice
            </button>
            <button
              onClick={hearWord}
              className="bg-surface text-text rounded-2xl min-h-[56px] px-6 text-lg shadow-sm active:scale-95 transition duration-gentle"
              aria-label="hear the word again"
            >
              🔊 again
            </button>
          </div>
          <button onClick={startRec} className="text-sm text-primary underline underline-offset-4">
            🎙️ once more
          </button>
        </div>
      )}

      {phase === "denied" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted text-center">
            Microphone is off — that&apos;s okay.<br />
            Say the word out loud together!
          </p>
          <button
            onClick={saidIt}
            className="bg-primary text-white rounded-3xl px-8 min-h-[56px] text-lg active:scale-95 transition duration-gentle"
            aria-label="we said it"
          >
            ✓ We said it
          </button>
        </div>
      )}

      <p className="sr-only">
        Voice practice stays on this device. No recording is saved or uploaded.
      </p>
    </div>
  );
}
