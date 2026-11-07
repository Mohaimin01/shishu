"use client";

import { db } from "./db";
import { speakOrPlay } from "./audio";

/**
 * The word-audio chain, in order of warmth:
 *   1. a family member's own recording (IndexedDB, local only)
 *   2. the pack's native recording (audioUrl)
 *   3. the device voice (TTS bridge)
 */
export async function playWordAudio(
  childId: string,
  lang: string,
  itemId: string,
  label: string,
  audioUrl?: string,
): Promise<boolean> {
  try {
    if (childId) {
      const key = `${childId}:${lang}:${itemId}`;
      const rec = await db.familyaudio.get(key);
      if (rec?.blob) {
        const url = URL.createObjectURL(rec.blob);
        const a = new Audio(url);
        a.volume = 0.9;
        a.onended = () => URL.revokeObjectURL(url);
        a.onerror = () => URL.revokeObjectURL(url);
        void a.play().catch(() => {});
        return true;
      }
    }
  } catch {
    // family audio is a bonus — never block the word
  }
  return speakOrPlay(label, lang, audioUrl);
}

export function familyKey(childId: string, lang: string, itemId: string): string {
  return `${childId}:${lang}:${itemId}`;
}
