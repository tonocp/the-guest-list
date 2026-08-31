import type { FurnitureType, Position } from '../../types/puzzle'
import { cellKey } from '../gridLogic'
import { type RNG, shuffle } from '../rng'

const FURNITURE_TYPES: FurnitureType[] = [
  'plant',
  'rug',
  'chair',
  'bookshelf',
  'sofa',
  'bed',
  'chest',
  'lamp',
  'table',
  'statue',
  'globe',
  'vase',
]

export interface FurniturePlacement {
  suspectId: string
  type: FurnitureType
  /** Anchor cell first (always the suspect's own solution cell), then any extra footprint cells. */
  cells: Position[]
}

interface GrowthCtx {
  roomIdAt: (p: Position) => string
  inBounds: (p: Position) => boolean
  /** Every suspect's own solution cell (victim included) — a footprint may never claim one of these. */
  protectedCells: Set<string>
  /** Cells already claimed by an earlier piece in this same generation attempt. */
  usedCells: Set<string>
}

function isValidExtra(p: Position, anchor: Position, ctx: GrowthCtx): boolean {
  if (!ctx.inBounds(p)) return false
  if (ctx.roomIdAt(p) !== ctx.roomIdAt(anchor)) return false
  const key = cellKey(p.row, p.col)
  return !ctx.protectedCells.has(key) && !ctx.usedCells.has(key)
}

const RUG_DIRECTIONS: Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

/** Straight 2-cell footprint (horizontal or vertical); falls back to the anchor alone
 * if no neighboring cell is free within the same room. */
export function growRug(anchor: Position, ctx: GrowthCtx, rng: RNG): Position[] {
  for (const dir of shuffle(rng, RUG_DIRECTIONS)) {
    const extra = { row: anchor.row + dir.row, col: anchor.col + dir.col }
    if (isValidExtra(extra, anchor, ctx)) return [anchor, extra]
  }
  return [anchor]
}

/** The 4 rotations of a corner (L-tromino), right angle at the anchor. */
const SOFA_L_TEMPLATES: Position[][] = [
  [{ row: 0, col: 1 }, { row: 1, col: 0 }],
  [{ row: 0, col: -1 }, { row: 1, col: 0 }],
  [{ row: 0, col: 1 }, { row: -1, col: 0 }],
  [{ row: 0, col: -1 }, { row: -1, col: 0 }],
]

/** L-shaped 3-cell footprint; falls back to a straight 2-cell rug shape, then to the
 * anchor alone, if no corner orientation fits within the room. */
export function growSofa(anchor: Position, ctx: GrowthCtx, rng: RNG): Position[] {
  for (const [d1, d2] of shuffle(rng, SOFA_L_TEMPLATES)) {
    const arm1 = { row: anchor.row + d1.row, col: anchor.col + d1.col }
    const arm2 = { row: anchor.row + d2.row, col: anchor.col + d2.col }
    if (isValidExtra(arm1, anchor, ctx) && isValidExtra(arm2, anchor, ctx)) return [anchor, arm1, arm2]
  }
  return growRug(anchor, ctx, rng)
}

function growFootprint(type: FurnitureType, anchor: Position, ctx: GrowthCtx, rng: RNG): Position[] {
  if (type === 'rug') return growRug(anchor, ctx, rng)
  if (type === 'sofa') return growSofa(anchor, ctx, rng)
  return [anchor]
}

/** Gives up to one unique furniture item per non-victim suspect, anchored at their own
 * solution cell. 12 types exist — enough to cover every non-victim suspect even at
 * "experto" (12x12, 11 non-victim suspects); the margin exists because a `room` fact
 * alone was measured to be unreliable at fully pinning the couple of suspects
 * furniture doesn't reach (see the generator design notes on why unary facts are
 * preferred over chains of `direction`/`adjacent`).
 *
 * `rug`/`sofa` grow beyond their anchor into 1-2 extra cells within the same room
 * (straight for rug, L-shaped/corner for sofa) — every other type stays 1 cell. */
export function assignFurniture(
  nonVictimSuspectIds: string[],
  solution: Record<string, Position>,
  roomIdByCell: string[][],
  size: number,
  rng: RNG,
): FurniturePlacement[] {
  const count = Math.min(FURNITURE_TYPES.length, nonVictimSuspectIds.length)
  const chosenSuspects = shuffle(rng, nonVictimSuspectIds).slice(0, count)
  const chosenTypes = shuffle(rng, FURNITURE_TYPES).slice(0, count)

  const ctx: GrowthCtx = {
    roomIdAt: (p) => roomIdByCell[p.row][p.col],
    inBounds: (p) => p.row >= 0 && p.row < size && p.col >= 0 && p.col < size,
    protectedCells: new Set(Object.values(solution).map((p) => cellKey(p.row, p.col))),
    usedCells: new Set<string>(),
  }

  const placements: FurniturePlacement[] = []
  for (let i = 0; i < chosenSuspects.length; i++) {
    const suspectId = chosenSuspects[i]
    const type = chosenTypes[i]
    const anchor = solution[suspectId]
    const cells = growFootprint(type, anchor, ctx, rng)
    for (const p of cells) ctx.usedCells.add(cellKey(p.row, p.col))
    placements.push({ suspectId, type, cells })
  }
  return placements
}
