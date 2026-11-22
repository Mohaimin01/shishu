"use client";

import { speak } from "@/lib/audio";
import type { Cell, ScriptId } from "@shishu/core";
import type { LangMeta } from "@/lib/lexicon";
import { fontClassForText } from "@/lib/script";

const RTL_SCRIPTS: ScriptId[] = ["arabic", "hebrew"];

/** One language's words for one meaning: every synonym, most used first, each tappable to hear it. */
export default function WordCell({ cell, meta, showRoman, readable, interactive = true }: {
  cell: Cell;
  meta: LangMeta | undefined;
  showRoman: boolean;
  readable: ScriptId[];
  interactive?: boolean;
}) {
  if (cell.empty) {
    return <span className="text-muted/50" aria-label="not added yet">—</span>;
  }
  const readsLatin = readable.includes("latin");
  return (
    <ul className="flex flex-col gap-1">
      {cell.forms.map((f, i) => {
        const rtl = RTL_SCRIPTS.includes(f.script);
        // pronunciation hint: only when we show the real script and the learner reads Latin letters
        const roman =
          showRoman && readsLatin && f.kind === "native" && f.script !== "latin" ? f.term.roman : undefined;
        const word = (
          <span className="inline-flex flex-col items-start leading-tight">
            <span
              lang={f.script === "latin" ? undefined : meta?.code}
              dir={rtl ? "rtl" : undefined}
              className={`${i === 0 ? "text-lg font-bold" : "text-base font-semibold text-text/80"} ${
                fontClassForText(f.text)
              }`}
            >
              {f.text}
            </span>
            {roman && <span className="text-[11px] text-muted">{roman}</span>}
          </span>
        );
        const note = (
          <>
            {f.tag && <span className="ml-1.5 text-[10px] text-muted align-middle">{f.tag}</span>}
            {f.kind === "fallback" && (
              <span
                className="ml-1 text-[10px] text-muted align-middle"
                title="No spelling in letters you can read yet — shown in the closest letters we have"
              >
                ⓘ
              </span>
            )}
            {f.kind === "converted" && (
              <span className="ml-1 text-[10px] text-muted align-middle" title="Letters converted for you (approximate)">≈</span>
            )}
          </>
        );
        return (
          <li key={`${f.term.text}-${i}`} className="flex items-baseline">
            {interactive ? (
              <button
                type="button"
                onClick={() => speak(f.term.text, cell.langCode)}
                className="text-left rounded-lg px-1 -mx-1 hover:bg-primary/10 active:scale-95 transition duration-gentle"
                aria-label={`hear ${f.term.text}`}
              >
                {word}
              </button>
            ) : (
              word
            )}
            {note}
          </li>
        );
      })}
    </ul>
  );
}
