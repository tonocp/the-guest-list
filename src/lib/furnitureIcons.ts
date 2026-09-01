import type { FurnitureType } from '../types/puzzle'

/** Single-cell icon per type. `bed`/`piano` entries exist only for `Record`
 * completeness — the generator never places them at 1 cell. */
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

/** Pre-assembled multi-cell bitmaps by shape. `BoardGrid.vue` picks the shape from
 * `pieceShape()`, plus `missingCorner` for the L. See docs/visual-design.md. */
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
