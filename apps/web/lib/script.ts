"use client";

import { detectScript, type ScriptId } from "@shishu/core";

/**
 * The scripts that letter cards (trace / colour) can be drawn in.
 * Widen this (plus fonts/ + layout.tsx + tailwind.config) to teach more scripts.
 */
export type GlyphScript =
  | "latin" | "bengali" | "devanagari" | "arabic" | "cyrillic" | "han" | "kana";

const GLYPH_SCRIPTS: readonly GlyphScript[] = [
  "latin", "bengali", "devanagari", "arabic", "cyrillic", "han", "kana",
];

/** Normalises a pack's declared script into one our fonts can draw. */
export function glyphScriptOf(script: string | undefined): GlyphScript {
  return (GLYPH_SCRIPTS as readonly string[]).includes(script ?? "")
    ? (script as GlyphScript)
    : "latin";
}

const FONT_CLASS: Record<GlyphScript, string> = {
  latin: "",
  bengali: "font-bengali",
  devanagari: "font-devanagari",
  arabic: "font-arabic",
  cyrillic: "font-cyrillic",
  han: "font-han",
  kana: "font-kana",
};

/** Tailwind class for a known script ("latin" → none, falls back to Nunito). */
export function fontClassFor(script: GlyphScript | undefined): string {
  return script ? FONT_CLASS[script] : "";
}

/** Tailwind class for arbitrary text (word labels, lane names…), auto-detected. */
export function fontClassForText(text: string): string {
  const s = detectScript(text) as string;
  return (GLYPH_SCRIPTS as readonly string[]).includes(s)
    ? FONT_CLASS[s as GlyphScript]
    : "";
}
