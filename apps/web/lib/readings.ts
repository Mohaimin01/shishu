"use client";

// Loads Story Rows from /public/readings (copied from content-packs/readings by the
// build's copy-lexicon step). The manifest lists the language files, so a new story
// language only needs a .tsv — no code change.

import { parseReadingsTsv, type Reading } from "@shishu/core";
import { assetPath } from "./paths";

type Manifest = { files: string[] };

let cache: Promise<Reading[]> | null = null;

async function getText(path: string): Promise<string> {
  const res = await fetch(assetPath(path));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}

export function loadReadings(): Promise<Reading[]> {
  if (!cache) {
    cache = (async () => {
      let files: string[];
      try {
        const m = JSON.parse(await getText("/readings/manifest.json")) as Manifest;
        files = m.files.filter((f) => f.endsWith(".tsv"));
      } catch {
        files = ["en.tsv", "bn.tsv", "es.tsv"]; // honest fallback for an older cache
      }
      const readings: Reading[] = [];
      for (const f of files) {
        const { readings: rs, problems } = parseReadingsTsv(await getText(`/readings/${f}`));
        if (problems.length > 0) problems.forEach((p) => console.error(`readings/${f}: ${p}`));
        readings.push(...rs);
      }
      return readings;
    })();
    cache.catch(() => { cache = null; });
  }
  return cache;
}
