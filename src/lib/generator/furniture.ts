import type { FurnitureType, Position } from '../../types/puzzle'
import { cellKey } from '../gridLogic'
import { type RNG, shuffle } from '../rng'

const FURNITURE_TYPES: FurnitureType[] = [
  'plant',
  'rug',
  'chair',
  'piano',
  'sofa',
  'bed',
  'chest',
  'lamp',
  'table',
  'statue',
  'globe',
  'vase',
  'screen',
]

export interface FurniturePlacement {
  suspectId: string
  type: FurnitureType
  /** Anchor cell first (the suspect's own solution cell), then any footprint cells. */
  cells: Position[]
}

interface GrowthCtx {
  roomIdAt: (p: Position) => string
  inBounds: (p: Position) => boolean
  /** Every suspect's own solution cell — a footprint may never claim one of these. */
  protectedCells: Set<string>
  /** Cells claimed by an earlier piece in this same attempt. */
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

/** Straight 2-cell footprint; falls back to the anchor alone. */
export function growRug(anchor: Position, ctx: GrowthCtx, rng: RNG): Position[] {
  for (const dir of shuffle(rng, RUG_DIRECTIONS)) {
    const extra = { row: anchor.row + dir.row, col: anchor.col + dir.col }
    if (isValidExtra(extra, anchor, ctx)) return [anchor, extra]
  }
  return [anchor]
}

const SOFA_L_TEMPLATES: Position[][] = [
  [{ row: 0, col: 1 }, { row: 1, col: 0 }],
  [{ row: 0, col: -1 }, { row: 1, col: 0 }],
  [{ row: 0, col: 1 }, { row: -1, col: 0 }],
  [{ row: 0, col: -1 }, { row: -1, col: 0 }],
]

/** L-shaped 3-cell footprint; falls back to a rug shape, then the anchor alone. */
export function growSofa(anchor: Position, ctx: GrowthCtx, rng: RNG): Position[] {
  for (const [d1, d2] of shuffle(rng, SOFA_L_TEMPLATES)) {
    const arm1 = { row: anchor.row + d1.row, col: anchor.col + d1.col }
    const arm2 = { row: anchor.row + d2.row, col: anchor.col + d2.col }
    if (isValidExtra(arm1, anchor, ctx) && isValidExtra(arm2, anchor, ctx)) return [anchor, arm1, arm2]
  }
  return growRug(anchor, ctx, rng)
}

/** Straight 3-cell footprint; falls back to a 2-cell run, then the anchor alone. */
export function growScreen(anchor: Position, ctx: GrowthCtx, rng: RNG): Position[] {
  for (const dir of shuffle(rng, RUG_DIRECTIONS)) {
    const mid = { row: anchor.row + dir.row, col: anchor.col + dir.col }
    const far = { row: anchor.row + dir.row * 2, col: anchor.col + dir.col * 2 }
    if (isValidExtra(mid, anchor, ctx) && isValidExtra(far, anchor, ctx)) return [anchor, mid, far]
  }
  return growRug(anchor, ctx, rng)
}

function growFootprint(type: FurnitureType, anchor: Position, ctx: GrowthCtx, rng: RNG): Position[] {
  if (type === 'rug') return growRug(anchor, ctx, rng)
  if (type === 'sofa') return growSofa(anchor, ctx, rng)
  if (type === 'screen') return growScreen(anchor, ctx, rng)
  return [anchor]
}

/** `bed`/`piano` must always end up 2 cells — a 1-cell bed or piano doesn't read as
 * one. Tries each remaining suspect until one has room for a straight 2-cell footprint;
 * that suspect is removed from the pool for good. If nobody has room the type is not
 * placed (already dropped from `remainingTypes` by the caller). See for-agents.md for
 * the regression this ordering fixed. */
function assignMustGrow(
  type: FurnitureType,
  remainingSuspects: string[],
  solution: Record<string, Position>,
  ctx: GrowthCtx,
  rng: RNG,
): FurniturePlacement | null {
  for (let i = 0; i < remainingSuspects.length; i++) {
    const suspectId = remainingSuspects[i]
    const cells = growRug(solution[suspectId], ctx, rng)
    if (cells.length !== 2) continue
    for (const p of cells) ctx.usedCells.add(cellKey(p.row, p.col))
    remainingSuspects.splice(i, 1)
    return { suspectId, type, cells }
  }
  return null
}

export const MUST_GROW_TYPES: FurnitureType[] = ['bed', 'piano']

/** Up to one unique furniture item per non-victim suspect, anchored at their own
 * solution cell. `rug`/`sofa`/`screen` grow within the room; `bed`/`piano` grow via
 * `assignMustGrow` or are dropped; the rest stay 1 cell. A suspect ending up with no
 * furniture is an accepted outcome, not a broken invariant. */
export function assignFurniture(
  nonVictimSuspectIds: string[],
  solution: Record<string, Position>,
  roomIdByCell: string[][],
  size: number,
  rng: RNG,
): FurniturePlacement[] {
  const count = Math.min(FURNITURE_TYPES.length, nonVictimSuspectIds.length)
  const remainingSuspects = shuffle(rng, nonVictimSuspectIds).slice(0, count)
  const remainingTypes = shuffle(rng, FURNITURE_TYPES).slice(0, count)

  const ctx: GrowthCtx = {
    roomIdAt: (p) => roomIdByCell[p.row][p.col],
    inBounds: (p) => p.row >= 0 && p.row < size && p.col >= 0 && p.col < size,
    protectedCells: new Set(Object.values(solution).map((p) => cellKey(p.row, p.col))),
    usedCells: new Set<string>(),
  }

  const placements: FurniturePlacement[] = []
  for (const type of MUST_GROW_TYPES) {
    const typeIndex = remainingTypes.indexOf(type)
    if (typeIndex === -1) continue
    remainingTypes.splice(typeIndex, 1)
    const placement = assignMustGrow(type, remainingSuspects, solution, ctx, rng)
    if (placement) placements.push(placement)
  }

  for (let i = 0; i < Math.min(remainingSuspects.length, remainingTypes.length); i++) {
    const suspectId = remainingSuspects[i]
    const type = remainingTypes[i]
    const anchor = solution[suspectId]
    const cells = growFootprint(type, anchor, ctx, rng)
    for (const p of cells) ctx.usedCells.add(cellKey(p.row, p.col))
    placements.push({ suspectId, type, cells })
  }
  return placements
}
