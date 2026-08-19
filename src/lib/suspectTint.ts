// Hue-rotate offsets (deg) applied to the neutral blue-violet token sprite.
// The ~100-140 range is skipped: rotating that far lands on red, which is
// reserved for the "conflict" indicator on the board.
const HUE_OFFSETS = [0, 40, 80, 160, 200, 240, 280, 320, 20, 60, 300, 220]

export function hueOffsetForSuspect(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return HUE_OFFSETS[hash % HUE_OFFSETS.length]
}
