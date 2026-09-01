import type { Cell, FurnitureType, Position, Puzzle } from '../types/puzzle'

export function cellKey(row: number, col: number): string {
  return `${row}-${col}`
}

export function gridLine(start: number, end: number = start): string {
  return `${start + 1} / ${end + 2}`
}

export function getCell(puzzle: Pick<Puzzle, 'cells'>, row: number, col: number): Cell | undefined {
  return puzzle.cells.find((c) => c.row === row && c.col === col)
}

/** "Junto a": orthogonally adjacent, or sharing a room. */
export function isNextTo(puzzle: Pick<Puzzle, 'cells'>, a: Position, b: Position): boolean {
  const orthogonal =
    (a.row === b.row && Math.abs(a.col - b.col) === 1) ||
    (a.col === b.col && Math.abs(a.row - b.row) === 1)
  if (orthogonal) return true

  const cellA = getCell(puzzle, a.row, a.col)
  const cellB = getCell(puzzle, b.row, b.col)
  return !!cellA && !!cellB && cellA.roomId === cellB.roomId
}

/** "Pegado a" un mueble: same room and at most one orthogonal step away (the cell
 * itself counts). Never reaches across a room boundary, unlike people's "junto a". */
export function isBesideFurniture(suspectCell: Cell, furnitureCell: Cell): boolean {
  return (
    suspectCell.roomId === furnitureCell.roomId &&
    Math.abs(suspectCell.row - furnitureCell.row) + Math.abs(suspectCell.col - furnitureCell.col) <= 1
  )
}

export type Placements = Record<string, Position | null>

export interface Conflict {
  suspectId: string
  reason: 'row' | 'col'
}

/** Placed suspects that currently break the one-per-row/one-per-col rule (rooms are
 * never a conflict). */
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
  /** Set only for an L-shaped 3-cell piece (the sofa): a 2x2 bounding box with one
   * corner empty. */
  missingCorner?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}

/** Groups furnished cells into pieces by type. Each `FurnitureType` appears at most
 * once per puzzle, so cells of one type are the same piece. */
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

/** Which pre-baked sprite shape renders a piece. 'L' is a genuine L (spans both rows
 * and cols); a straight 3-cell run is 'h3'/'v3'. */
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
  gridColumn: string
  gridRow: string
}

/** Grid placement for every furniture piece spanning more than 1 cell (1-cell pieces
 * render as a normal per-cell icon). Deliberately takes no `Placements`: a piece must
 * always render in full, never hidden by a suspect standing on one of its cells. */
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
