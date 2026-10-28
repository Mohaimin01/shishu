// Spaced repetition for concept-table (synonym/regional) review.
// Simple SM-2-lite: each card has an ease factor and interval (days).

export type ReviewCard = {
  conceptId: string;
  variantLang: string;
  ease: number;        // 1.3 - 2.5
  intervalDays: number;
  dueAt: number;       // epoch ms
  reps: number;
};

export type Grade = 0 | 1 | 2 | 3; // 0=forgot,1=hard,2=good,3=easy

export function newCard(conceptId: string, variantLang: string, now = Date.now()): ReviewCard {
  return { conceptId, variantLang, ease: 2.5, intervalDays: 0, dueAt: now, reps: 0 };
}

export function gradeCard(card: ReviewCard, grade: Grade, now = Date.now()): ReviewCard {
  let { ease, intervalDays, reps } = card;
  if (grade < 2) {
    // lapse: reset
    reps = 0;
    intervalDays = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease);
    ease = Math.min(2.5, ease + (grade === 3 ? 0.15 : 0));
  }
  const dueAt = now + intervalDays * 24 * 60 * 60 * 1000;
  return { ...card, ease, intervalDays, dueAt, reps };
}

export function dueCards(cards: ReviewCard[], now = Date.now()): ReviewCard[] {
  return cards.filter((c) => c.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}
