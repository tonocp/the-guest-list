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

        const victims = puzzle.suspects.filter((s) => s.isVictim)
        expect(victims.length).toBe(1)

        const positions = puzzle.suspects.map((s) => puzzle.solution[s.id])
        expect(positions.every(Boolean)).toBe(true)
        expect(new Set(positions.map((p) => p.row)).size).toBe(expectedSize)
        expect(new Set(positions.map((p) => p.col)).size).toBe(expectedSize)

        const roomIds = new Set(puzzle.rooms.map((r) => r.id))
        for (const cell of puzzle.cells) expect(roomIds.has(cell.roomId)).toBe(true)

        const placements = Object.fromEntries(puzzle.suspects.map((s) => [s.id, puzzle.solution[s.id]]))
        expect(getConflicts(puzzle, placements)).toEqual([])

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
        expect(furnitureCounts.get('bed') ?? 2).toBe(2)
        expect(furnitureCounts.get('piano') ?? 2).toBe(2)

        const roomIdsByFurnitureType = new Map<string, Set<string>>()
        for (const cell of puzzle.cells) {
          if (!cell.furniture) continue
          if (!roomIdsByFurnitureType.has(cell.furniture)) roomIdsByFurnitureType.set(cell.furniture, new Set())
          roomIdsByFurnitureType.get(cell.furniture)!.add(cell.roomId)
        }
        for (const [, roomIds] of roomIdsByFurnitureType) expect(roomIds.size).toBe(1)

        const solutionCellKeys = new Set(
          puzzle.suspects.map((s) => `${puzzle.solution[s.id].row}-${puzzle.solution[s.id].col}`),
        )
        for (const [type] of furnitureCounts) {
          const sameTypeCells = puzzle.cells.filter((c) => c.furniture === type)
          const onSuspectCells = sameTypeCells.filter((c) => solutionCellKeys.has(`${c.row}-${c.col}`))
          expect(onSuspectCells.length).toBe(1)
        }

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
