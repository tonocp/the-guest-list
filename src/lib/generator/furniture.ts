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

/** Straight 3-cell footprint (the folding screen's 3 panels in a row) — same 4
 * directions as `growRug`, just extended one more cell in the same direction; falls
 * back to a straight 2-cell run, then the anchor alone, if a full 3-run doesn't fit.
 * Unlike `bed`/`piano` (see `MUST_GROW_TYPES`), a screen degrades gracefully: even a
 * single panel is a real, recognizable object (a lone room-divider panel), not a
 * contradiction the way a 1-cell bed or piano is. */
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

/** `bed` and `piano` must always end up 2 cells — a real bed or grand piano is long,
 * never square (see gen-sprites.mjs `bedMotif`/`pianoMotif`) — unlike `rug`/`sofa`/
 * `screen`, which tolerate falling back to fewer cells because a 1-cell rug, sofa
 * armchair, or single screen panel is still a real, recognizable object on its own.
 * Tries every remaining suspect in turn until one has room for a straight 2-cell
 * footprint; that suspect is placed immediately and removed from `remainingSuspects`
 * for good (never reconsidered by a later call for a different must-grow type — an
 * earlier version swapped types between assignments in place instead of removing the
 * grower outright, which let the same suspect's already-used-up growth get attributed
 * to *two* types when a second must-grow call reused them, producing two same-type
 * placements built from unrelated anchors; see the regression test). If nobody has
 * room, the type is simply not placed — it was already dropped from `remainingTypes`
 * by the caller before this runs, so that's the end of it, no 1-cell fallback. Mutates
 * `remainingSuspects` and `ctx.usedCells` in place; returns the placement if one was
 * made. */
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

/** Gives up to one unique furniture item per non-victim suspect, anchored at their own
 * solution cell. 13 types exist — enough to cover every non-victim suspect even at
 * "experto" (12x12, 11 non-victim suspects); the margin exists because a `room` fact
 * alone was measured to be unreliable at fully pinning the couple of suspects
 * furniture doesn't reach (see the generator design notes on why unary facts are
 * preferred over chains of `direction`/`adjacent`).
 *
 * `rug`/`sofa`/`screen` grow beyond their anchor into extra cells within the same room
 * (straight for rug/screen, L-shaped/corner for sofa) — every other type stays 1 cell.
 * `bed`/`piano` are the exception: see `assignMustGrow`, which runs first for each and
 * may drop it from this puzzle entirely rather than ever placing it at 1 cell.
 *
 * The two pools below (`remainingSuspects`/`remainingTypes`) can end up different
 * lengths — a dropped must-grow type removes a type but not a suspect — so the final
 * pairing loop uses whichever is shorter and leaves any leftover suspect with no
 * furniture at all. That's not a bug to route around: "up to one item per suspect" was
 * already the contract (see above), so a suspect ending up with none is an accepted
 * outcome, not a broken invariant. */
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
