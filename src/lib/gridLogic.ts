import type { Cell, Position, Puzzle } from '../types/puzzle'

export function cellKey(row: number, col: number): string {
  return `${row}-${col}`
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
