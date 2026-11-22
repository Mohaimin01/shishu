/**
 * Pure coverage maths for the letter canvas (no DOM, unit-tested).
 *
 * A letter counts as "done" only when the child has actually painted over the
 * letter's own ink AND has reached every part of it (a 3x3 zone check), so a
 * single touch on the apex of an "A" can never finish the letter.
 */

export type CoverageResult = {
  /** share of the letter's ink the child's paint covers (0..1) */
  ratio: number;
  /** every substantial part of the letter has been reached */
  zonesOk: boolean;
  /** weakest substantial zone (0..1) — drives the gentle progress bar */
  weakestZone: number;
};

export const ZONES = 3;
/** a zone only has to be covered if it holds at least this share of the letter's ink */
export const MIN_ZONE_SHARE = 0.05;
/** share of a zone's ink that must be covered */
export const ZONE_TARGET = 0.5;

export function measureCoverage(mask: Uint8Array, ink: Uint8Array, g: number): CoverageResult {
  let minX = g, minY = g, maxX = -1, maxY = -1, total = 0;
  for (let y = 0; y < g; y++) {
    for (let x = 0; x < g; x++) {
      if (mask[y * g + x]) {
        total++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (total === 0) return { ratio: 0, zonesOk: false, weakestZone: 0 };

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const zoneTotal = new Array<number>(ZONES * ZONES).fill(0);
  const zoneHit = new Array<number>(ZONES * ZONES).fill(0);
  let hit = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const i = y * g + x;
      if (!mask[i]) continue;
      const zx = Math.min(ZONES - 1, Math.floor(((x - minX) / w) * ZONES));
      const zy = Math.min(ZONES - 1, Math.floor(((y - minY) / h) * ZONES));
      const z = zy * ZONES + zx;
      zoneTotal[z]++;
      if (ink[i]) { zoneHit[z]++; hit++; }
    }
  }

  let zonesOk = true;
  let weakest = 1;
  for (let z = 0; z < zoneTotal.length; z++) {
    if (zoneTotal[z] / total < MIN_ZONE_SHARE) continue; // tiny sliver: don't demand it
    const share = zoneHit[z] / zoneTotal[z];
    if (share < weakest) weakest = share;
    if (share < ZONE_TARGET) zonesOk = false;
  }
  return { ratio: hit / total, zonesOk, weakestZone: weakest };
}

/** Child must have drawn a real path, not tapped once. */
export const MIN_PATH_PX = 140;

export function isLetterComplete(
  c: CoverageResult, pathPx: number, target: number,
): boolean {
  return c.ratio >= target && c.zonesOk && pathPx >= MIN_PATH_PX;
}

/** 0..1 for the calm progress bar: only moves when the child really covers the letter. */
export function progressOf(c: CoverageResult, target: number): number {
  const byRatio = Math.min(1, c.ratio / target);
  const byZones = Math.min(1, c.weakestZone / ZONE_TARGET);
  return Math.min(byRatio, 0.35 + 0.65 * byZones);
}
