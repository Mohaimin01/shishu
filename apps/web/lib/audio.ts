"use client";

// Gentle audio helpers. Volume-conscious: soft chimes, low speak rate.
// Native recorded audio replaces speech synthesis as packs gain audioUrl entries.

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Soft two-note rise for success. Never loud (0.12 gain). */
export function chime(success: boolean) {
  const c = audioCtx();
  if (!c) return;
  const notes = success ? [523.25, 783.99] : [392, 311];
  notes.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(c.destination);
    const t = c.currentTime + i * 0.14;
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.start(t);
    o.stop(t + 0.55);
  });
}

/** Tiny tap/pop feedback for correct touches during coloring etc. */
export function pop() {
  const c = audioCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.value = 660;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(c.destination);
  const t = c.currentTime;
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.start(t);
  o.stop(t + 0.2);
}

const SPEECH_LANG: Record<string, string> = {
  en: "en-US",
  bn: "bn-IN",
  es: "es-ES",
  ar: "ar-SA",
};

/** Speaks using device speech synthesis; returns false when no voice exists for the language. */
export function speak(text: string, langCode: string, rate = 0.8): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const target = SPEECH_LANG[langCode] ?? langCode;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith(target.split("-")[0]));
  if (voices.length === 0 && langCode !== "en") return false;
  const u = new SpeechSynthesisUtterance(text);
  if (voices.length > 0) u.voice = voices[0];
  u.lang = target;
  u.rate = rate;
  u.volume = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

/** Resolves a CSS font family stack for canvas rendering (canvas can't read CSS vars). */
export function canvasFontFamily(): string {
  if (typeof document === "undefined") return "sans-serif";
  const probe = document.createElement("span");
  probe.style.fontFamily = "var(--font-noto-bengali), var(--font-nunito), sans-serif";
  probe.style.display = "none";
  document.body.appendChild(probe);
  const fam = getComputedStyle(probe).fontFamily || "sans-serif";
  probe.remove();
  return fam;
}

/** Ensures webfonts needed by canvas glyphs are ready. */
export async function fontsReady(): Promise<void> {
  if (typeof document !== "undefined" && "fonts" in document) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }
}
