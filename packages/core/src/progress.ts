export type Skill = "letter" | "number" | "word" | "concept" | "phrase" | "stem";

export type ProgressEntry = {
  id: string;
  childId: string;
  lang: string;
  skill: Skill;
  itemId: string;
  correct: number;
  attempts: number;   // graded attempts (tap/match)
  exposed: number;    // ungraded exposures (color/trace/listen)
  mastered: boolean;
  updatedAt: number;
};

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  motherTongue: string;
  targetLangs: string[];
  createdAt: number;
};

/**
 * Mastery rule (M1):
 *  - at least 3 graded attempts with >=80% accuracy, or
 *  - at least 4 exposures if the child mostly colors/traces,
 *  - and at least 3 total encounters (graded + exposed).
 */
export function masteryThreshold(attempts: number, correct: number, exposed = 0): boolean {
  if (attempts + exposed < 3) return false;
  if (attempts >= 3) return correct / attempts >= 0.8;
  return exposed >= 4;
}
