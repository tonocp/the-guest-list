// Counts must match SKIN_TONES/HAIR_COLORS in scripts/gen-sprites.mjs — same
// hand-mirrored convention as furnitureIcons.ts mirroring the furniture sprite list.
const SKIN_COUNT = 4
const HAIR_COUNT = 5

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

/** Deterministically picks a face sprite for a suspect from their id: skin tone and
 * hair color are two independent hash draws (salted differently so they don't move
 * together), hair style follows gender. Not tied to the character's pool name — like
 * the old hue-tint it replaces, the same named character can look different across
 * separately generated puzzles, which is fine since each puzzle is a fresh scenario. */
export function facePathForSuspect(id: string, gender: 'f' | 'm'): string {
  const skinIdx = hash(id) % SKIN_COUNT
  const hairIdx = hash(`${id}-hair`) % HAIR_COUNT
  const style = gender === 'f' ? 'long' : 'short'
  return `/sprites/face-${skinIdx}-${hairIdx}-${style}.png`
}

export const VICTIM_FACE = '/sprites/face-victim.png'
