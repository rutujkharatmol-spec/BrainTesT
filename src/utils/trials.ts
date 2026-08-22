/**
 * Helpers for building trial sequences and summarising reaction times.
 *
 * Two problems these exist to fix:
 *
 * 1. Condition assignment used to be an independent coin flip per trial
 *    (`Math.random() > 0.5`). Over 20-40 trials that produces badly unbalanced
 *    designs — a Stroop run could come out 4 congruent / 16 incongruent — which
 *    undermines every difference score computed from it.
 *
 * 2. Mean RT used to fall back to `0` for an empty condition, so the difference
 *    score silently became the other condition's raw RT (e.g. an 800ms "Stroop
 *    effect" instead of ~80ms) and was stored as if it were a real measurement.
 *    These helpers return `null` instead, which the schema already permits.
 */

/** Fisher-Yates, unbiased (unlike `sort(() => Math.random() - 0.5)`). */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A shuffled array of exactly `total` booleans, of which `Math.round(total *
 * ratio)` are true. Use for congruent/target assignment so each condition gets
 * a predictable number of trials.
 */
export function balancedFlags(total: number, ratio = 0.5): boolean[] {
  const trueCount = Math.round(total * ratio);
  const flags = Array.from({ length: total }, (_, i) => i < trueCount);
  return shuffle(flags);
}

/**
 * Mean of `values`, or `null` when there is nothing to average.
 *
 * Returning null rather than 0 is the point: a missing condition must be
 * recorded as missing, never as a real measurement of zero.
 */
export function meanOrNull(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Rounded mean, preserving null. */
export function roundedMeanOrNull(values: readonly number[]): number | null {
  const m = meanOrNull(values);
  return m === null ? null : Math.round(m);
}

/** Difference of two possibly-null means; null if either side is missing. */
export function differenceOrNull(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Math.round(a - b);
}

/**
 * Samples `count` items without replacement, cycling through a reshuffled copy
 * when more items are needed than the pool holds. Avoids the heavy repetition
 * priming caused by sampling a 10-word list with replacement across 40 trials.
 */
export function sampleWithoutReplacement<T>(pool: readonly T[], count: number): T[] {
  if (pool.length === 0) return [];
  const out: T[] = [];
  let bag: T[] = [];
  for (let i = 0; i < count; i++) {
    if (bag.length === 0) bag = shuffle(pool);
    out.push(bag.pop() as T);
  }
  return out;
}
