"use client";

// The garden map — learned meanings clustered by theme, so the garden grows visible
// corners instead of an endless list. Only what the learner has learned appears here;
// an empty theme is a corner waiting to be planted, never a failure.

import { useMemo } from "react";
import { THEMES, themeById, type Concept, type LexiconLanguage } from "@shishu/core";
import { fontClassForText } from "@/lib/script";

export default function ThemeMap({ concepts, known, native, langs, showRoman }: {
  concepts: Concept[];
  known: ReadonlySet<string>;
  /** the learner's own language (first column) — the word shown on each chip */
  native: string;
  langs: Record<string, LexiconLanguage>;
  showRoman: boolean;
}) {
  const byTheme = useMemo(() => {
    const groups = new Map<string, Concept[]>();
    for (const c of concepts) {
      if (!known.has(c.id)) continue;
      const t = c.theme ?? "world"; // pre-theme content still lands somewhere friendly
      const list = groups.get(t) ?? [];
      list.push(c);
      groups.set(t, list);
    }
    for (const list of groups.values()) list.sort((a, b) => a.rank - b.rank);
    return groups;
  }, [concepts, known]);

  const nativeLang = langs[native];

  if (known.size === 0) {
    return (
      <div className="bg-surface rounded-3xl shadow-sm p-8 text-center grid gap-2 max-w-[560px] mx-auto">
        <div aria-hidden className="text-5xl">🗺️</div>
        <p className="text-xl font-bold">Your garden map is waiting</p>
        <p className="text-muted text-sm">
          Learn rows in the Table or Study tab and they will gather here by theme — food in one
          corner, kind words in another, numbers along the path.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {THEMES.filter((t) => byTheme.has(t.id)).map((t) => {
        const list = byTheme.get(t.id)!;
        return (
          <section key={t.id} className="bg-surface rounded-3xl shadow-sm p-4">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
              <span aria-hidden className="text-lg">{t.emoji}</span>
              {t.name}
              <span className="text-muted font-normal">· {list.length}</span>
            </h2>
            <ul className="flex flex-wrap gap-2">
              {list.map((c) => {
                const term = nativeLang?.entries[c.id]?.[0];
                const label = term?.text ?? c.gloss;
                return (
                  <li key={c.id}>
                    <span
                      className={`inline-flex items-baseline gap-1.5 rounded-2xl bg-bg ring-1 ring-text/10 px-3 py-2 ${fontClassForText(label)}`}
                      title={c.gloss}
                    >
                      <span className="font-bold text-lg">{label}</span>
                      {showRoman && term?.roman && (
                        <span className="text-[11px] text-muted">{term.roman}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {THEMES.some((t) => !byTheme.has(t.id)) && (
        <p className="text-xs text-muted text-center">
          still empty: {THEMES.filter((t) => !byTheme.has(t.id)).map((t) => `${t.emoji} ${themeById(t.id)?.name ?? t.id}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
