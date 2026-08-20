import { describe, expect, it } from 'vitest'
import type { Position } from '../../types/puzzle'
import { cellKey } from '../gridLogic'
import { createRng } from '../rng'
import { assignFurniture, growRug, growSofa } from './furniture'

/** A 6x6 board, single room covering everything, no suspects nearby — plenty of room
 * for any footprint to grow. */
function openCtx(protectedCells: Position[] = []) {
  return {
    roomIdAt: () => 'room-0',
    inBounds: (p: Position) => p.row >= 0 && p.row < 6 && p.col >= 0 && p.col < 6,
    protectedCells: new Set(protectedCells.map((p) => cellKey(p.row, p.col))),
    usedCells: new Set<string>(),
  }
}

describe('growRug', () => {
  it('grows a straight 2-cell footprint when the room is open', () => {
    const anchor = { row: 3, col: 3 }
    const cells = growRug(anchor, openCtx(), createRng(1))

    expect(cells.length).toBe(2)
    expect(cells[0]).toEqual(anchor)
    const [a, b] = cells
    const orthogonal =
      (a.row === b.row && Math.abs(a.col - b.col) === 1) || (a.col === b.col && Math.abs(a.row - b.row) === 1)
    expect(orthogonal).toBe(true)
  })

  it('falls back to the anchor alone when surrounded on all 4 sides', () => {
    const anchor = { row: 3, col: 3 }
    const surrounding = [
      { row: 2, col: 3 },
      { row: 4, col: 3 },
      { row: 3, col: 2 },
      { row: 3, col: 4 },
    ]
    const cells = growRug(anchor, openCtx(surrounding), createRng(1))
    expect(cells).toEqual([anchor])
  })
})

describe('growSofa', () => {
  it('grows an L-shaped 3-cell footprint when the room is open', () => {
    const anchor = { row: 3, col: 3 }
    const cells = growSofa(anchor, openCtx(), createRng(1))

    expect(cells.length).toBe(3)
    expect(cells[0]).toEqual(anchor)
    const [a, arm1, arm2] = cells

    const isAdjacent = (p: Position, q: Position) =>
      (p.row === q.row && Math.abs(p.col - q.col) === 1) || (p.col === q.col && Math.abs(p.row - q.row) === 1)
    expect(isAdjacent(a, arm1)).toBe(true)
    expect(isAdjacent(a, arm2)).toBe(true)
    // a right angle, not a straight line through the anchor
    expect(arm1.row === arm2.row && arm1.col === arm2.col).toBe(false)
    expect(arm1.row + arm2.row === 2 * a.row && arm1.col + arm2.col === 2 * a.col).toBe(false)
  })

  it('falls back to a straight 2-cell footprint, then the anchor alone, when no corner fits', () => {
    const anchor = { row: 0, col: 0 }
    // corner of a 6x6 board with a suspect on the only remaining free neighbor
    const cells = growSofa(anchor, openCtx([{ row: 0, col: 1 }]), createRng(1))
    expect(cells).toEqual([anchor, { row: 1, col: 0 }])

    const fullyBoxedIn = growSofa(
      anchor,
      openCtx([{ row: 0, col: 1 }, { row: 1, col: 0 }]),
      createRng(1),
    )
    expect(fullyBoxedIn).toEqual([anchor])
  })
})

describe('assignFurniture', () => {
  const size = 6
  const roomIdByCell: string[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, () => (row < 3 ? 'room-a' : 'room-b')),
  )

  function solutionFor(ids: string[]): Record<string, Position> {
    // one suspect per row/col, spread out so footprints have room to grow
    const solution: Record<string, Position> = {}
    ids.forEach((id, i) => {
      solution[id] = { row: i, col: i }
    })
    return solution
  }

  it('keeps every footprint within a single room', () => {
    const ids = ['s0', 's1', 's2', 's3', 's4']
    const solution = solutionFor(ids)
    const placements = assignFurniture(ids, solution, roomIdByCell, size, createRng(7))

    for (const placement of placements) {
      const roomIds = new Set(placement.cells.map((p) => roomIdByCell[p.row][p.col]))
      expect(roomIds.size).toBe(1)
    }
  })

  it('never lets two placements claim the same cell', () => {
    const ids = ['s0', 's1', 's2', 's3', 's4']
    const solution = solutionFor(ids)
    const placements = assignFurniture(ids, solution, roomIdByCell, size, createRng(7))

    const allCells = placements.flatMap((p) => p.cells.map((c) => cellKey(c.row, c.col)))
    expect(new Set(allCells).size).toBe(allCells.length)
  })

  it('never lets a footprint touch another suspect\'s own solution cell', () => {
    const ids = ['s0', 's1', 's2', 's3', 's4']
    const solution = solutionFor(ids)
    const protectedKeys = new Set(Object.values(solution).map((p) => cellKey(p.row, p.col)))
    const placements = assignFurniture(ids, solution, roomIdByCell, size, createRng(7))

    for (const placement of placements) {
      const anchorKey = cellKey(placement.cells[0].row, placement.cells[0].col)
      for (const cell of placement.cells) {
        const key = cellKey(cell.row, cell.col)
        if (key === anchorKey) continue
        expect(protectedKeys.has(key)).toBe(false)
      }
    }
  })

  it('always gives non-rug/sofa types exactly 1 cell', () => {
    const ids = ['s0', 's1', 's2', 's3', 's4']
    const solution = solutionFor(ids)
    const placements = assignFurniture(ids, solution, roomIdByCell, size, createRng(7))

    for (const placement of placements) {
      if (placement.type !== 'rug' && placement.type !== 'sofa') {
        expect(placement.cells.length).toBe(1)
      }
    }
  })

  it('is deterministic for a given seed', () => {
    const ids = ['s0', 's1', 's2', 's3', 's4']
    const solution = solutionFor(ids)
    const a = assignFurniture(ids, solution, roomIdByCell, size, createRng(42))
    const b = assignFurniture(ids, solution, roomIdByCell, size, createRng(42))
    expect(a).toEqual(b)
  })

  it('falls back to single-cell footprints without throwing in a 1-cell room', () => {
    const ids = ['s0']
    const tinyRoomGrid: string[][] = Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => (row === 0 && col === 0 ? 'room-tiny' : 'room-rest')),
    )
    const solution = { s0: { row: 0, col: 0 } }

    expect(() => assignFurniture(ids, solution, tinyRoomGrid, size, createRng(3))).not.toThrow()
    const [placement] = assignFurniture(ids, solution, tinyRoomGrid, size, createRng(3))
    expect(placement.cells).toEqual([{ row: 0, col: 0 }])
  })
})
