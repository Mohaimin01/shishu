"use client";

import {
  parseConceptsTsv, parseLexiconTsv,
  type Concept, type LexiconLanguage, type ScriptId,
} from "@shishu/core";
import { assetPath } from "./paths";
import { db } from "./db";

export type LangMeta = {
  code: string;
  name: string;
  nativeName: string;
  script: ScriptId;
  rtl?: boolean;
  /** added on this device (not part of the app) */
  custom?: boolean;
};

async function getText(path: string): Promise<string> {
  const res = await fetch(assetPath(path));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}

let catalogue: Promise<{ metas: LangMeta[]; concepts: Concept[] }> | null = null;
const loaded = new Map<string, Promise<LexiconLanguage>>();

/** Languages + the ordered list of meanings. Cached for the session. */
export function loadCatalogue() {
  if (!catalogue) {
    catalogue = (async () => {
      const [metaRaw, conceptsTsv] = await Promise.all([
        getText("/lexicon/languages.json"),
        getText("/lexicon/concepts.tsv"),
      ]);
      const metas = JSON.parse(metaRaw) as LangMeta[];
      const { concepts } = parseConceptsTsv(conceptsTsv);
      // languages this person added on their own device
      let custom: LexiconLanguage[] = [];
      try { custom = await db.lexicons.toArray(); } catch { /* private mode: no local languages */ }
      for (const c of custom) {
        if (!metas.some((m) => m.code === c.code)) {
          metas.push({ code: c.code, name: c.name, nativeName: c.nativeName, script: c.script, rtl: c.rtl, custom: true });
        }
        loaded.set(c.code, Promise.resolve(c));
      }
      return { metas, concepts };
    })();
    catalogue.catch(() => { catalogue = null; });
  }
  return catalogue;
}

/** Forget cached catalogue (after adding/removing a custom language). */
export function resetCatalogue() {
  catalogue = null;
  for (const [code, p] of [...loaded]) void p.then((l) => { if (!l) loaded.delete(code); });
}

export async function loadLanguage(meta: LangMeta): Promise<LexiconLanguage> {
  const hit = loaded.get(meta.code);
  if (hit) return hit;
  const p = (async () => {
    const tsv = await getText(`/lexicon/${meta.code}.tsv`);
    const { lang } = parseLexiconTsv(meta, tsv);
    return lang;
  })();
  loaded.set(meta.code, p);
  p.catch(() => loaded.delete(meta.code));
  return p;
}

export async function saveCustomLanguage(lang: LexiconLanguage): Promise<void> {
  await db.lexicons.put(lang);
  loaded.set(lang.code, Promise.resolve(lang));
  catalogue = null;
}

export async function removeCustomLanguage(code: string): Promise<void> {
  await db.lexicons.delete(code);
  loaded.delete(code);
  catalogue = null;
}
