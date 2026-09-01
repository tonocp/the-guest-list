/** Must match SKIN_TONES/HAIR_COLORS in scripts/gen-sprites.mjs. */
export const SKIN_COUNT = 4
export const HAIR_COUNT = 5

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

/** Deterministic face sprite from the suspect id: skin and hair are independent hash
 * draws, hair style follows gender. */
export function facePathForSuspect(id: string, gender: 'f' | 'm'): string {
  const skinIdx = hash(id) % SKIN_COUNT
  const hairIdx = hash(`${id}-hair`) % HAIR_COUNT
  const style = gender === 'f' ? 'long' : 'short'
  return `/sprites/face-${skinIdx}-${hairIdx}-${style}.png`
}

export const VICTIM_FACE = '/sprites/face-victim.png'
