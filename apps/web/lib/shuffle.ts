/** Unbiased Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle, but never hand back the already-solved order (when a different order exists). */
export function shuffleUnsolved<T>(items: readonly T[], same: (a: T, b: T) => boolean, rand: () => number = Math.random): T[] {
  if (items.length < 2) return items.slice();
  const allSame = items.every((x) => same(x, items[0]));
  let out = shuffle(items, rand);
  for (let tries = 0; tries < 8 && !allSame && out.every((x, i) => same(x, items[i])); tries++) {
    out = shuffle(items, rand);
  }
  return out;
}
