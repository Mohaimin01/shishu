"use client";

import { useMemo } from "react";
import { BADGES, badgeById, type BadgeId } from "@shishu/core";
import { useBadges } from "@/lib/badgesStore";

/**
 * The line of garden visitors (🦋 🐝 🐦 🌈 ✨) — quiet celebration, never pressure.
 * When a new visitor arrives it is gently highlighted until the learner taps it.
 */
export default function BadgeLine({ compact = false }: { compact?: boolean }) {
  const earned = useBadges((s) => s.earned);
  const seen = useBadges((s) => s.seen);
  const markSeen = useBadges((s) => s.markSeen);

  const badges = useMemo(
    () => earned.map((id) => badgeById(id as BadgeId)).filter(Boolean),
    [earned],
  );
  if (badges.length === 0) return null;

  const fresh = !seen;
  return (
    <button
      type="button"
      onClick={markSeen}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-surface shadow-sm print:hidden ${
        fresh ? "ring-2 ring-primary/60" : ""
      }`}
      aria-label={`garden badges: ${badges.map((b) => b.name).join(", ")}`}
      title={badges.map((b) => `${b.emoji} ${b.name} — ${b.description}`).join("\n")}
    >
      {badges.map((b) => (
        <span key={b.id} aria-hidden className="text-base leading-none">
          {b.emoji}
        </span>
      ))}
      {fresh && !compact && (
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">new visitor!</span>
      )}
    </button>
  );
}

/** All five badges as a friendly legend (used in the parent page so grown-ups know what exists). */
export function BadgeLegend() {
  return (
    <ul className="grid gap-1 text-xs text-muted mt-2">
      {BADGES.map((b) => (
        <li key={b.id} className="flex items-baseline gap-2">
          <span aria-hidden>{b.emoji}</span>
          <span>
            <strong className="text-text/80">{b.name}</strong> — {b.description}
          </span>
        </li>
      ))}
    </ul>
  );
}
