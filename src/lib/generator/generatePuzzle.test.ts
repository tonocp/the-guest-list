import { describe, expect, it } from 'vitest'
import type { Difficulty } from '../../types/puzzle'
import { getConflicts, getMurderer } from '../gridLogic'
import { countSolutions } from '../solver'
import { generatePuzzle } from './generatePuzzle'

const DIFFICULTY_SIZE: Record<Difficulty, number> = {
  'muy-facil': 6,
  facil: 9,
  medio: 9,
  dificil: 9,
  experto: 12,
}

const DIFFICULTIES: Difficulty[] = ['muy-facil', 'facil', 'medio', 'dificil', 'experto']
const SEEDS = [1, 2, 3]

describe('generatePuzzle', () => {
  for (const difficulty of DIFFICULTIES) {
    for (const seed of SEEDS) {
      it(`difficulty=${difficulty} seed=${seed}: produces a valid, uniquely-solvable puzzle`, () => {
        const puzzle = generatePuzzle({ difficulty, seed })

        const expectedSize = DIFFICULTY_SIZE[difficulty]
        expect(puzzle.size).toBe(expectedSize)
        expect(puzzle.suspects.length).toBe(expectedSize)
        expect(puzzle.cells.length).toBe(expectedSize * expectedSize)
        expect(puzzle.rooms.length).toBe(expectedSize)

        // exactly one victim
        const victims = puzzle.suspects.filter((s) => s.isVictim)
        expect(victims.length).toBe(1)

        // solution is a valid permutation: every suspect placed, rows and cols each used once
        const positions = puzzle.suspects.map((s) => puzzle.solution[s.id])
        expect(positions.every(Boolean)).toBe(true)
        expect(new Set(positions.map((p) => p.row)).size).toBe(expectedSize)
        expect(new Set(positions.map((p) => p.col)).size).toBe(expectedSize)

        // every cell has a roomId that exists in `rooms`, and rooms partition all cells
        const roomIds = new Set(puzzle.rooms.map((r) => r.id))
        for (const cell of puzzle.cells) expect(roomIds.has(cell.roomId)).toBe(true)

        // no conflicts in the authored solution itself (sanity check on gridLogic reuse)
        const placements = Object.fromEntries(puzzle.suspects.map((s) => [s.id, puzzle.solution[s.id]]))
        expect(getConflicts(puzzle, placements)).toEqual([])

        // furniture footprints: rug/bed/piano up to 2 cells, sofa/screen up to 3, everything else exactly 1
        const furnitureCounts = new Map<string, number>()
        for (const cell of puzzle.cells) {
          if (!cell.furniture) continue
          furnitureCounts.set(cell.furniture, (furnitureCounts.get(cell.furniture) ?? 0) + 1)
        }
        const MAX_FOOTPRINT: Partial<Record<string, number>> = { rug: 2, bed: 2, piano: 2, sofa: 3, screen: 3 }
        for (const [type, count] of furnitureCounts) {
          expect(count).toBeGreaterThanOrEqual(1)
          expect(count).toBeLessThanOrEqual(MAX_FOOTPRINT[type] ?? 1)
        }
        // bed/piano never fall back to 1 cell like rug/sofa/screen can — they're dropped
        // instead (see assignMustGrow)
        expect(furnitureCounts.get('bed') ?? 2).toBe(2)
        expect(furnitureCounts.get('piano') ?? 2).toBe(2)

        // every furniture footprint stays within a single room
        const roomIdsByFurnitureType = new Map<string, Set<string>>()
        for (const cell of puzzle.cells) {
          if (!cell.furniture) continue
          if (!roomIdsByFurnitureType.has(cell.furniture)) roomIdsByFurnitureType.set(cell.furniture, new Set())
          roomIdsByFurnitureType.get(cell.furniture)!.add(cell.roomId)
        }
        for (const [, roomIds] of roomIdsByFurnitureType) expect(roomIds.size).toBe(1)

        // at most one cell per furniture type may be a suspect's own solution cell (the anchor)
        const solutionCellKeys = new Set(
          puzzle.suspects.map((s) => `${puzzle.solution[s.id].row}-${puzzle.solution[s.id].col}`),
        )
        for (const [type] of furnitureCounts) {
          const sameTypeCells = puzzle.cells.filter((c) => c.furniture === type)
          const onSuspectCells = sameTypeCells.filter((c) => solutionCellKeys.has(`${c.row}-${c.col}`))
          expect(onSuspectCells.length).toBe(1)
        }

        // the solver independently confirms uniqueness and agrees with the stored solution
        const solverInput = {
          size: puzzle.size,
          suspectIds: puzzle.suspects.map((s) => s.id),
          cells: puzzle.cells,
          rules: puzzle.rules,
        }
        const solved = countSolutions(solverInput, 2)
        expect(solved.truncated).toBe(false)
        expect(solved.count).toBe(1)
        expect(solved.solutions[0]).toEqual(puzzle.solution)

        // the victim's room has exactly one other occupant, so the murderer is well-defined
        expect(getMurderer(puzzle)).toBeDefined()
      })
    }
  }

  it('is deterministic for a given (difficulty, seed)', () => {
    const a = generatePuzzle({ difficulty: 'facil', seed: 99 })
    const b = generatePuzzle({ difficulty: 'facil', seed: 99 })
    expect(a).toEqual(b)
  })

  it('varies across seeds', () => {
    const a = generatePuzzle({ difficulty: 'facil', seed: 1 })
    const b = generatePuzzle({ difficulty: 'facil', seed: 2 })
    expect(a.suspects.map((s) => s.name)).not.toEqual(b.suspects.map((s) => s.name))
  })
})
