"use client";

import type { Skill } from "@shishu/core";
import { masteryThreshold } from "@shishu/core";
import { db, entryId } from "./db";

/** Grades a tap/match activity (correct or not) and updates mastery. */
export async function recordGraded(
  childId: string, lang: string, skill: Skill, itemId: string, correct: boolean,
) {
  const id = entryId(childId, lang, skill, itemId);
  const prev = await db.progress.get(id);
  const next = {
    id,
    childId, lang, skill, itemId,
    correct: prev?.correct ?? 0,
    attempts: (prev?.attempts ?? 0) + 1,
    exposed: prev?.exposed ?? 0,
    mastered: false,
    updatedAt: Date.now(),
  };
  if (correct) next.correct += 1;
  next.mastered = masteryThreshold(next.attempts, next.correct, next.exposed);
  await db.progress.put(next);
}

/** Records a color/trace/listen exposure (creative activity has no wrong answers). */
export async function recordExposure(
  childId: string, lang: string, skill: Skill, itemId: string,
) {
  const id = entryId(childId, lang, skill, itemId);
  const prev = await db.progress.get(id);
  const next = {
    id,
    childId, lang, skill, itemId,
    correct: prev?.correct ?? 0,
    attempts: prev?.attempts ?? 0,
    exposed: (prev?.exposed ?? 0) + 1,
    mastered: false,
    updatedAt: Date.now(),
  };
  next.mastered = masteryThreshold(next.attempts, next.correct, next.exposed);
  await db.progress.put(next);
}

export async function langProgress(childId: string, lang: string) {
  const rows = await db.progress.where("childId").equals(childId).toArray();
  const mine = rows.filter((r) => r.lang === lang);
  const mastered = mine.filter((r) => r.mastered).length;
  const touched = new Set(mine.map((r) => `${r.skill}:${r.itemId}`)).size;
  const graded = mine.filter((r) => r.attempts > 0);
  const accuracy = graded.reduce((s, r) => s + r.correct, 0) / Math.max(1, graded.reduce((s, r) => s + r.attempts, 0));
  return { touched, mastered, accuracy, total: mine.length };
}
