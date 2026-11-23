"use client";

// The quiet stats bar for Word Rows: what is due today, what is learned, what is mastered,
// how each language is coming along, and the last 14 days of showing up. No shame states —
// an empty strip is just a garden waiting to be planted.

import { dueCards } from "@shishu/core";
import { last14Days, perLang, summarize, useReview } from "@/lib/review";

export default function WordsStats({ columns, langNames, knownCount, totalRows }: {
  columns: string[];
  langNames: Record<string, string>;
  knownCount: number;
  totalRows: number;
}) {
  const cards = useReview((s) => s.cards);
  const log = useReview((s) => s.log);

  const sum = summarize(cards);
  const langs = perLang(cards, columns);
  const days = last14Days();
  const maxDay = Math.max(1, ...days.map((d) => log[d] ?? 0));
  const nextDue = dueCards(Object.values(cards)).length === 0
    ? Object.values(cards).map((c) => c.dueAt).sort((a, b) => a - b)[0]
    : undefined;

  return (
    <section className="bg-surface rounded-3xl shadow-sm p-4 grid gap-3 print:hidden" aria-label="review stats">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span><span aria-hidden>⏰</span> <strong>{sum.due}</strong> due now</span>
        <span><span aria-hidden>🌱</span> <strong>{knownCount}</strong> of {totalRows} rows learned</span>
        <span><span aria-hidden>🃏</span> <strong>{sum.learned}</strong> cards started</span>
        <span><span aria-hidden>🌳</span> <strong>{sum.mastered}</strong> mastered (3+ good reviews)</span>
      </div>

      {langs.some((l) => l.total > 0) && (
        <div className="grid gap-1.5" aria-label="progress per language">
          {langs.filter((l) => l.total > 0).map((l) => (
            <div key={l.lang} className="flex items-center gap-2 text-xs">
              <span className="w-24 truncate text-muted" lang={l.lang}>{langNames[l.lang] ?? l.lang}</span>
              <div
                className="flex-1 h-2.5 rounded-full bg-text/10 overflow-hidden"
                role="meter"
                aria-label={`${langNames[l.lang]}: ${l.learned} of ${l.total} cards started`}
                aria-valuenow={l.learned}
                aria-valuemin={0}
                aria-valuemax={l.total}
              >
                <div className="h-full bg-primary/80" style={{ width: `${(l.learned / l.total) * 100}%` }} />
              </div>
              <span className="text-muted tabular-nums">{l.learned}/{l.total}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted shrink-0">last 14 days:</span>
        <div className="flex gap-1" aria-label="14-day activity">
          {days.map((d) => {
            const n = log[d] ?? 0;
            return (
              <span
                key={d}
                title={`${d}: ${n} review${n === 1 ? "" : "s"}`}
                className={`w-3.5 h-3.5 rounded-[4px] ${n === 0 ? "bg-text/10" : "bg-primary"}`}
                style={n > 0 ? { opacity: 0.35 + 0.65 * (n / maxDay) } : undefined}
                aria-hidden
              />
            );
          })}
        </div>
        {sum.due === 0 && nextDue && (
          <span className="text-xs text-muted ml-auto">
            next cards return{" "}
            {new Date(nextDue).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </section>
  );
}
