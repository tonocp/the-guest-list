import type { FurnitureType } from '../types/puzzle'

/** Icon for a single-cell furniture piece — used for every type that never grows past
 * 1 cell, and for `rug`/`bed`/`sofa` on the rare occasion their footprint didn't grow
 * (see `generator/furniture.ts` `growRug`/`growSofa` fallbacks). See
 * `CONNECTABLE_FURNITURE_SPRITES` for the multi-cell pieces. */
export const FURNITURE_SPRITES: Record<FurnitureType, string> = {
  plant: '/sprites/plant.png',
  rug: '/sprites/rug-solo.png',
  chair: '/sprites/chair.png',
  bookshelf: '/sprites/bookshelf.png',
  sofa: '/sprites/sofa-solo.png',
  bed: '/sprites/bed-solo.png',
  chest: '/sprites/chest.png',
  lamp: '/sprites/lamp.png',
  table: '/sprites/table.png',
  statue: '/sprites/statue.png',
  globe: '/sprites/globe.png',
  vase: '/sprites/vase.png',
}

/** Only `rug`/`bed` (straight, up to 2 cells) and `sofa` (straight or L-shaped, up to 3
 * cells) ever span more than 1 cell — see `generator/furniture.ts`. Each shape is one
 * single pre-assembled bitmap (no seam to keep aligned across cells, and — for the
 * L — no rotation applied at render time, so its backrest can be a genuinely
 * asymmetric design instead of one that has to survive being rotated; see
 * `scripts/gen-sprites.mjs` `sofaLVariants` and docs/visual-design.md). `BoardGrid.vue`
 * picks the shape from `pieceShape()` in `gridLogic.ts`, and for `L` also needs
 * `missingCorner` to pick which of the 4 baked orientations to use. `rug`/`bed` never
 * grow to 3 cells, so neither has an `L` entry. */
export const CONNECTABLE_FURNITURE_SPRITES: Partial<
  Record<FurnitureType, { h2: string; v2: string; L?: Record<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight', string> }>
> = {
  rug: { h2: '/sprites/rug-pair-h.png', v2: '/sprites/rug-pair-v.png' },
  bed: { h2: '/sprites/bed-pair-h.png', v2: '/sprites/bed-pair-v.png' },
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
