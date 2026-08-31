import type { Cell, FurnitureType, Position, Puzzle } from '../types/puzzle'

export function cellKey(row: number, col: number): string {
  return `${row}-${col}`
}

/** A CSS `grid-column`/`grid-row` value (1-indexed lines) for a single 0-indexed
 * row/col, or spanning from `start` to `end` inclusive. */
export function gridLine(start: number, end: number = start): string {
  return `${start + 1} / ${end + 2}`
}

export function getCell(puzzle: Pick<Puzzle, 'cells'>, row: number, col: number): Cell | undefined {
  return puzzle.cells.find((c) => c.row === row && c.col === col)
}

/** Two positions are "junto a" (next to) each other: orthogonally adjacent, or sharing a room. */
export function isNextTo(puzzle: Pick<Puzzle, 'cells'>, a: Position, b: Position): boolean {
  const orthogonal =
    (a.row === b.row && Math.abs(a.col - b.col) === 1) ||
    (a.col === b.col && Math.abs(a.row - b.row) === 1)
  if (orthogonal) return true

  const cellA = getCell(puzzle, a.row, a.col)
  const cellB = getCell(puzzle, b.row, b.col)
  return !!cellA && !!cellB && cellA.roomId === cellB.roomId
}

export type Placements = Record<string, Position | null>

export interface Conflict {
  suspectId: string
  reason: 'row' | 'col'
}

/**
 * Live feedback: which placed suspects currently break the one-per-row/one-per-col rule.
 * Rooms are NOT exclusive — several suspects may share a room, so sharing one is never a conflict.
 */
export function getConflicts(_puzzle: Puzzle, placements: Placements): Conflict[] {
  const conflicts: Conflict[] = []
  const entries = Object.entries(placements).filter(
    (e): e is [string, Position] => e[1] !== null,
  )

  for (const [id, pos] of entries) {
    const sameRow = entries.some(([otherId, otherPos]) => otherId !== id && otherPos.row === pos.row)
    const sameCol = entries.some(([otherId, otherPos]) => otherId !== id && otherPos.col === pos.col)

    if (sameRow) conflicts.push({ suspectId: id, reason: 'row' })
    if (sameCol) conflicts.push({ suspectId: id, reason: 'col' })
  }

  return conflicts
}

export function isComplete(puzzle: Puzzle, placements: Placements): boolean {
  return puzzle.suspects.every((s) => placements[s.id] != null)
}

export function matchesSolution(puzzle: Puzzle, placements: Placements): boolean {
  return puzzle.suspects.every((s) => {
    const placed = placements[s.id]
    const solved = puzzle.solution[s.id]
    return !!placed && placed.row === solved.row && placed.col === solved.col
  })
}

export interface FurniturePiece {
  type: FurnitureType
  cells: Position[]
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
  /** Only set for an L-shaped 3-cell piece (the sofa — see `generator/furniture.ts`
   * `growSofa`), whose footprint spans a 2x2 bounding box with one corner empty. A
   * straight 3-cell piece (the screen — see `growScreen`) is 3 cells in a single row/
   * column instead, so it never gets a `missingCorner`. */
  missingCorner?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}

/** Groups the puzzle's furnished cells into pieces by type — each `FurnitureType`
 * appears at most once per puzzle (see `generator/furniture.ts`), so cells sharing a
 * type are guaranteed to be the same piece, with no extra footprint metadata needed on
 * `Cell`/`Puzzle`. A single-cell type (or a rug/sofa that only grew to 1 cell) comes
 * back as a 1-cell piece — BoardGrid.vue renders those with the plain per-cell icon and
 * only builds a spanning overlay for pieces with more than 1 cell. */
export function furniturePieces(puzzle: Pick<Puzzle, 'cells'>): FurniturePiece[] {
  const byType = new Map<FurnitureType, Position[]>()
  for (const cell of puzzle.cells) {
    if (!cell.furniture) continue
    const list = byType.get(cell.furniture) ?? []
    list.push({ row: cell.row, col: cell.col })
    byType.set(cell.furniture, list)
  }

  const pieces: FurniturePiece[] = []
  for (const [type, cells] of byType) {
    const minRow = Math.min(...cells.map((c) => c.row))
    const maxRow = Math.max(...cells.map((c) => c.row))
    const minCol = Math.min(...cells.map((c) => c.col))
    const maxCol = Math.max(...cells.map((c) => c.col))

    // Only a genuine L (2x2 bounding box, one corner empty) gets a missingCorner — a
    // straight 3-cell piece (the screen) has minRow===maxRow or minCol===maxCol, so
    // there's no 2x2 box to find a missing corner of.
    let missingCorner: FurniturePiece['missingCorner']
    if (cells.length === 3 && minRow !== maxRow && minCol !== maxCol) {
      const has = (row: number, col: number) => cells.some((c) => c.row === row && c.col === col)
      if (!has(minRow, minCol)) missingCorner = 'topLeft'
      else if (!has(minRow, maxCol)) missingCorner = 'topRight'
      else if (!has(maxRow, minCol)) missingCorner = 'bottomLeft'
      else missingCorner = 'bottomRight'
    }

    pieces.push({ type, cells, minRow, maxRow, minCol, maxCol, missingCorner })
  }
  return pieces
}

export type PieceShape = 'single' | 'h2' | 'v2' | 'h3' | 'v3' | 'L'

/** Which sprite shape renders a piece from `furniturePieces()`. Every shape (including
 * each of the 4 possible L orientations) has its own dedicated pre-baked sprite file —
 * see `furnitureIcons.ts` — so there's no rotation left to compute here; picking the
 * right file for an 'L' piece just needs `piece.missingCorner` directly. A 3-cell piece
 * is 'L' only if it's genuinely L-shaped (spans both rows and cols — the sofa); a
 * straight 3-in-a-row/column piece (the screen) is 'h3'/'v3' instead, same convention
 * as 'h2'/'v2'. */
export function pieceShape(piece: FurniturePiece): PieceShape {
  if (piece.cells.length === 1) return 'single'
  const horizontal = piece.minRow === piece.maxRow
  const straight = horizontal || piece.minCol === piece.maxCol
  if (piece.cells.length === 3) return straight ? (horizontal ? 'h3' : 'v3') : 'L'
  return horizontal ? 'h2' : 'v2'
}

export interface MultiCellFurniturePlacement {
  type: FurnitureType
  cells: Position[]
  shape: PieceShape
  missingCorner?: FurniturePiece['missingCorner']
  /** CSS grid-column/grid-row values (1-indexed lines) spanning the piece's bounding
   * box, for `BoardGrid.vue` to place one overlay image across all of its cells. */
  gridColumn: string
  gridRow: string
}

/** Grid placement for every furniture piece spanning more than 1 cell (a 1-cell piece
 * renders as a normal per-cell icon instead — see `furniturePieces()`). Deliberately
 * takes only `puzzle`, not `Placements`: a multi-cell piece must always render in full,
 * regardless of whether a suspect is currently standing on one of its cells. An earlier
 * version hid the whole piece whenever any of its cells was occupied, which made a
 * 2-3 cell rug/sofa vanish entirely just because the player was trying a guess on one
 * of its cells — see `gridLogic.test.ts` for the regression test and
 * docs/visual-design.md for the longer story. `BoardGrid.vue` draws the placed-suspect
 * layer on top of these overlays, so a suspect face is never hidden by one either. */
export function multiCellFurniturePlacements(puzzle: Pick<Puzzle, 'cells'>): MultiCellFurniturePlacement[] {
  return furniturePieces(puzzle)
    .filter((piece) => piece.cells.length > 1)
    .map((piece) => ({
      type: piece.type,
      cells: piece.cells,
      shape: pieceShape(piece),
      missingCorner: piece.missingCorner,
      gridColumn: gridLine(piece.minCol, piece.maxCol),
      gridRow: gridLine(piece.minRow, piece.maxRow),
    }))
}

/** The suspect adjacent to the victim in the true solution is the murderer. */
export function getMurderer(puzzle: Puzzle): string | undefined {
  const victim = puzzle.suspects.find((s) => s.isVictim)
  if (!victim) return undefined
  const victimPos = puzzle.solution[victim.id]

  return puzzle.suspects.find((s) => {
    if (s.id === victim.id) return false
    const pos = puzzle.solution[s.id]
    return isNextTo(puzzle, victimPos, pos)
  })?.id
}
