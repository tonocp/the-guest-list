/** Deterministic [0, 1) generator. Every random decision in the generator must draw
 * from one of these, never `Math.random()`, so a `seed` stays reproducible. */
export type RNG = () => number

/** mulberry32 — small, fast, not crypto. */
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

export function randInt(rng: RNG, max: number): number {
  return Math.floor(rng() * max)
}

export function shuffle<T>(rng: RNG, items: readonly T[]): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function pick<T>(rng: RNG, items: readonly T[]): T {
  return items[randInt(rng, items.length)]
}
