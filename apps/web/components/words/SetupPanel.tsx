"use client";

import { SCRIPT_LABEL, type ScriptId } from "@shishu/core";
import type { LangMeta } from "@/lib/lexicon";
import { useWords } from "@/lib/wordsStore";

/** "I speak … / I'm learning … / I can read …" — everything that shapes the table. */
export default function SetupPanel({ metas, order }: { metas: LangMeta[]; order: string[] }) {
  const w = useWords();
  const byCode = Object.fromEntries(metas.map((m) => [m.code, m]));
  const available = metas.filter((m) => m.code !== w.native && !w.targets.includes(m.code));

  // scripts worth offering: Latin + every script used by a chosen language
  const scripts = new Set<ScriptId>(["latin"]);
  for (const c of order) if (byCode[c]) scripts.add(byCode[c].script);
  for (const s of w.readable) scripts.add(s);

  const move = (i: number, d: number) => {
    const t = [...w.targets];
    const j = i + d;
    if (j < 0 || j >= t.length) return;
    [t[i], t[j]] = [t[j], t[i]];
    w.set({ targets: t, page: 0 });
  };
  const toggleScript = (s: ScriptId) =>
    w.set({ readable: w.readable.includes(s) ? w.readable.filter((x) => x !== s) : [...w.readable, s] });

  const label = (c: string) => (byCode[c] ? `${byCode[c].nativeName}` : c);

  return (
    <div className="grid gap-5">
      <section aria-label="my language">
        <h3 className="text-sm font-semibold text-muted mb-1">1 · I speak (first column)</h3>
        <select
          value={w.native}
          onChange={(e) => w.set({ native: e.target.value, targets: w.targets.filter((t) => t !== e.target.value), page: 0 })}
          className="w-full min-h-[48px] rounded-2xl bg-bg px-4 text-lg ring-1 ring-text/10"
          aria-label="my language"
        >
          {metas.map((m) => (
            <option key={m.code} value={m.code}>{m.nativeName} — {m.name}</option>
          ))}
        </select>
      </section>

      <section aria-label="languages I am learning">
        <h3 className="text-sm font-semibold text-muted mb-1">
          2 · I want to learn ({w.targets.length}) — as many as you like
        </h3>
        <ol className="grid gap-2">
          {w.targets.map((c, i) => (
            <li key={c} className="flex items-center gap-2 bg-bg rounded-2xl px-3 py-1.5 ring-1 ring-text/10">
              <span className="text-xs text-muted w-5">{i + 1}</span>
              <span className="flex-1 text-base font-semibold">{label(c)} <span className="text-xs font-normal text-muted">{byCode[c]?.name}</span></span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="w-10 h-10 rounded-xl disabled:opacity-30" aria-label={`move ${label(c)} earlier`}>↑</button>
              <button onClick={() => move(i, 1)} disabled={i === w.targets.length - 1} className="w-10 h-10 rounded-xl disabled:opacity-30" aria-label={`move ${label(c)} later`}>↓</button>
              <button onClick={() => w.set({ targets: w.targets.filter((x) => x !== c), page: 0 })} className="w-10 h-10 rounded-xl text-muted" aria-label={`remove ${label(c)}`}>✕</button>
            </li>
          ))}
        </ol>
        {available.length > 0 && (
          <select
            value=""
            onChange={(e) => e.target.value && w.set({ targets: [...w.targets, e.target.value], page: 0 })}
            className="mt-2 w-full min-h-[48px] rounded-2xl bg-bg px-4 ring-1 ring-text/10"
            aria-label="add a language to learn"
          >
            <option value="">＋ add a language…</option>
            {available.map((m) => (
              <option key={m.code} value={m.code}>{m.nativeName} — {m.name}</option>
            ))}
          </select>
        )}
      </section>

      <section aria-label="letters I can read">
        <h3 className="text-sm font-semibold text-muted mb-1">3 · Letters I can read (tap in order of preference)</h3>
        <div className="flex flex-wrap gap-2">
          {[...scripts].map((s) => {
            const idx = w.readable.indexOf(s);
            const on = idx >= 0;
            return (
              <button
                key={s}
                onClick={() => toggleScript(s)}
                aria-pressed={on}
                className={`px-4 min-h-[44px] rounded-2xl text-sm transition duration-gentle active:scale-95 ${
                  on ? "bg-primary text-white" : "bg-bg text-text ring-1 ring-text/10"
                }`}
              >
                {on && <span className="mr-1.5 opacity-80">{idx + 1}.</span>}
                {SCRIPT_LABEL[s]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-2">
          Words written in letters you can&apos;t read are shown in your first-choice letters instead
          (for example Hindi in Bengali letters, or in English letters like <em>paani</em>).
        </p>
      </section>
    </div>
  );
}
