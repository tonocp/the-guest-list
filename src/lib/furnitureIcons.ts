import type { FurnitureType } from '../types/puzzle'

/** Icon for a single-cell furniture piece — used for every type that never grows past
 * 1 cell, and for `rug`/`sofa`/`screen` on the rare occasion their footprint didn't grow
 * (see `generator/furniture.ts` `growRug`/`growSofa`/`growScreen` fallbacks). `bed`/
 * `piano` never actually reach this in practice — `assignMustGrow` drops them instead
 * of placing them at 1 cell — but the entry still has to exist for `Record<FurnitureType,
 * string>` completeness, and as a safety net for a possible future hand-authored
 * puzzle. See `CONNECTABLE_FURNITURE_SPRITES` for the multi-cell pieces. */
export const FURNITURE_SPRITES: Record<FurnitureType, string> = {
  plant: '/sprites/plant.png',
  rug: '/sprites/rug-solo.png',
  chair: '/sprites/chair.png',
  piano: '/sprites/piano-solo.png',
  sofa: '/sprites/sofa-solo.png',
  bed: '/sprites/bed-solo.png',
  chest: '/sprites/chest.png',
  lamp: '/sprites/lamp.png',
  table: '/sprites/table.png',
  statue: '/sprites/statue.png',
  globe: '/sprites/globe.png',
  vase: '/sprites/vase.png',
  screen: '/sprites/screen-solo.png',
}

/** `rug`/`bed`/`piano` (straight, up to 2 cells), `sofa` (straight or L-shaped, up to 3
 * cells), and `screen` (straight, up to 3 cells) are the only types that ever span more
 * than 1 cell — see `generator/furniture.ts`. Each shape is one single pre-assembled
 * bitmap (no seam to keep aligned across cells, and — for the L — no rotation applied
 * at render time, so its backrest can be a genuinely asymmetric design instead of one
 * that has to survive being rotated; see `scripts/gen-sprites.mjs` `sofaLVariants` and
 * docs/visual-design.md). `BoardGrid.vue` picks the shape from `pieceShape()` in
 * `gridLogic.ts`, and for `L` also needs `missingCorner` to pick which of the 4 baked
 * orientations to use. `screen` is the only type that reaches 3 cells in a straight
 * line (`h3`/`v3`) instead of an L — a folding screen doesn't have a "corner"
 * orientation the way a sectional sofa does. */
export const CONNECTABLE_FURNITURE_SPRITES: Partial<
  Record<
    FurnitureType,
    {
      h2: string
      v2: string
      h3?: string
      v3?: string
      L?: Record<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight', string>
    }
  >
> = {
  rug: { h2: '/sprites/rug-pair-h.png', v2: '/sprites/rug-pair-v.png' },
  bed: { h2: '/sprites/bed-pair-h.png', v2: '/sprites/bed-pair-v.png' },
  piano: { h2: '/sprites/piano-pair-h.png', v2: '/sprites/piano-pair-v.png' },
  screen: {
    h2: '/sprites/screen-pair-h.png',
    v2: '/sprites/screen-pair-v.png',
    h3: '/sprites/screen-triple-h.png',
    v3: '/sprites/screen-triple-v.png',
  },
  sofa: {
    h2: '/sprites/sofa-pair-h.png',
    v2: '/sprites/sofa-pair-v.png',
    L: {
      topLeft: '/sprites/sofa-l-topLeft.png',
      topRight: '/sprites/sofa-l-topRight.png',
      bottomLeft: '/sprites/sofa-l-bottomLeft.png',
      bottomRight: '/sprites/sofa-l-bottomRight.png',
    },
  },
}
