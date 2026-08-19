/** Deterministic [0, 1) generator. Every random decision in the generator pipeline
 * must draw from one of these, never `Math.random()`, so a `seed` is reproducible. */
export type RNG = () => number

/** mulberry32 — small, fast, good-enough distribution for puzzle generation (not crypto). */
export function createRng(seed: number): RNG {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random integer in [0, max). */
export function randInt(rng: RNG, max: number): number {
  return Math.floor(rng() * max)
}

/** Fisher-Yates, using the given RNG. Does not mutate the input. */
export function shuffle<T>(rng: RNG, items: readonly T[]): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Pick one element at random. */
export function pick<T>(rng: RNG, items: readonly T[]): T {
  return items[randInt(rng, items.length)]
}
