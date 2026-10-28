export type Stage =
  | "toddler"    // 2-3
  | "preschool"  // 3-4
  | "prek"       // 4-5
  | "k1"         // 5-7
  | "junior"     // 7-9
  | "tween";     // 9-12

export const STAGE_ORDER: Stage[] = [
  "toddler", "preschool", "prek", "k1", "junior", "tween",
];

export const STAGE_AGES: Record<Stage, [number, number]> = {
  toddler: [2, 3],
  preschool: [3, 4],
  prek: [4, 5],
  k1: [5, 7],
  junior: [7, 9],
  tween: [9, 12],
};

export function stageForAge(age: number): Stage {
  if (age < 3) return "toddler";
  if (age < 4) return "preschool";
  if (age < 5) return "prek";
  if (age < 7) return "k1";
  if (age < 9) return "junior";
  return "tween";
}

export function nextStage(s: Stage): Stage | null {
  const i = STAGE_ORDER.indexOf(s);
  return i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}
