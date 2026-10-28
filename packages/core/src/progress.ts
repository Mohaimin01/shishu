export type Skill = "letter" | "number" | "word" | "concept" | "phrase" | "stem";

export type ProgressEntry = {
  childId: string;
  lang: string;
  skill: Skill;
  itemId: string;
  correct: number;
  attempts: number;
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

export function masteryThreshold(attempts: number, correct: number): boolean {
  // mastered after 3 correct in a row-ish: require >=3 attempts and >=80% accuracy
  if (attempts < 3) return false;
  return correct / attempts >= 0.8;
}
