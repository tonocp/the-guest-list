import { describe, expect, it } from 'vitest'
import type { Cell, ClueRule } from '../types/puzzle'
import { countSolutions, hasUniqueSolution, type SolverInput } from './solver'
import { fiestaDisfraces } from '../data/puzzles/fiestaDisfraces'
import { estudioYoga } from '../data/puzzles/estudioYoga'

function toSolverInput(puzzle: { size: number; suspects: { id: string }[]; cells: Cell[] }, rules: ClueRule[]): SolverInput {
  return {
    size: puzzle.size,
    suspectIds: puzzle.suspects.map((s) => s.id),
    cells: puzzle.cells,
    rules,
  }
}

describe('hand-authored puzzle fixtures (regression)', () => {
  it('fiestaDisfraces has a unique solution matching the authored solution', () => {
    const input = toSolverInput(fiestaDisfraces, fiestaDisfraces.rules)
    const result = countSolutions(input, 2)
    expect(result.count).toBe(1)
    expect(result.solutions[0]).toEqual(fiestaDisfraces.solution)
  })

  it('estudioYoga has a unique solution matching the authored solution', () => {
    const input = toSolverInput(estudioYoga, estudioYoga.rules)
    const result = countSolutions(input, 2)
    expect(result.count).toBe(1)
    expect(result.solutions[0]).toEqual(estudioYoga.solution)
  })

  it('reports non-unique for a deliberately under-constrained rule set', () => {
    const input = toSolverInput(fiestaDisfraces, fiestaDisfraces.rules.slice(0, 1))
    expect(hasUniqueSolution(input)).toBe(false)
    expect(countSolutions(input, 2).count).toBe(2)
  })

  it('reports zero solutions for a contradictory rule set', () => {
    // Nora is already pinned to (0,0) — room "A" — by the sofa clue. Forcing her
    // into room "C" too makes her domain empty.
    const contradictory: ClueRule[] = [...fiestaDisfraces.rules, { type: 'room', suspect: 'nora', roomId: 'C' }]
    const input = toSolverInput(fiestaDisfraces, contradictory)
    expect(countSolutions(input, 2).count).toBe(0)
  })
})

describe('rule-type correctness on a small hand-verified 3x3 fixture', () => {
  // Room layout:  A A B
  //               A B B
  //               C C C
  const roomGrid = [
    ['A', 'A', 'B'],
    ['A', 'B', 'B'],
    ['C', 'C', 'C'],
  ]

  function baseCells(furniture: Record<string, Cell['furniture']> = {}): Cell[] {
    return roomGrid.flatMap((row, r) =>
      row.map((roomId, c) => ({ row: r, col: c, roomId, furniture: furniture[`${r}-${c}`] })),
    )
  }

  it('direction + adjacent + on-furniture combine to a unique solution', () => {
    // X is pinned to (0,1) via a unique furniture item; the room layout makes X's
    // room "A" only reachable from row 1 via column 0, and the two direction chains
    // force the row order X < Y < Z — together this has exactly one solution.
    const cells = baseCells({ '0-1': 'plant' })
    const rules: ClueRule[] = [
      { type: 'on-furniture', suspect: 'x', furniture: 'plant' },
      { type: 'direction', subject: 'y', dir: 'S', reference: 'x' },
      { type: 'direction', subject: 'z', dir: 'S', reference: 'y' },
      { type: 'adjacent', a: 'x', b: 'y' },
    ]
    const input: SolverInput = { size: 3, suspectIds: ['x', 'y', 'z'], cells, rules }
    const result = countSolutions(input, 2)
    expect(result.count).toBe(1)
    expect(result.solutions[0]).toEqual({
      x: { row: 0, col: 1 },
      y: { row: 1, col: 0 },
      z: { row: 2, col: 2 },
    })
  })

  it('adjacent is only ever satisfiable via a shared room, never orthogonal touch', () => {
    // Z is always in room "C" (all of row 2); X (row 0) can only ever be room A/B.
    // adjacent(x, z) can therefore never be satisfied, regardless of columns.
    const cells = baseCells()
    const rules: ClueRule[] = [
      { type: 'direction', subject: 'y', dir: 'S', reference: 'x' },
      { type: 'direction', subject: 'z', dir: 'S', reference: 'y' },
      { type: 'adjacent', a: 'x', b: 'z' },
    ]
    const input: SolverInput = { size: 3, suspectIds: ['x', 'y', 'z'], cells, rules }
    expect(countSolutions(input, 2).count).toBe(0)
  })

  it('near-furniture (positive) is consistent with an elimination-forced placement', () => {
    // X and Z are pinned by unique furniture; Y is forced into the one remaining
    // row/col by elimination — (1,1), orthogonally adjacent to the bed at (1,2).
    const cells = baseCells({ '0-0': 'sofa', '2-2': 'chair', '1-2': 'bed' })
    const rules: ClueRule[] = [
      { type: 'on-furniture', suspect: 'x', furniture: 'sofa' },
      { type: 'on-furniture', suspect: 'z', furniture: 'chair' },
      { type: 'near-furniture', suspect: 'y', furniture: 'bed' },
    ]
    const input: SolverInput = { size: 3, suspectIds: ['x', 'y', 'z'], cells, rules }
    const result = countSolutions(input, 2)
    expect(result.count).toBe(1)
    expect(result.solutions[0].y).toEqual({ row: 1, col: 1 })
  })

  it('near-furniture negate contradicts the same elimination-forced placement', () => {
    const cells = baseCells({ '0-0': 'sofa', '2-2': 'chair', '1-2': 'bed' })
    const rules: ClueRule[] = [
      { type: 'on-furniture', suspect: 'x', furniture: 'sofa' },
      { type: 'on-furniture', suspect: 'z', furniture: 'chair' },
      { type: 'near-furniture', suspect: 'y', furniture: 'bed', negate: true },
    ]
    const input: SolverInput = { size: 3, suspectIds: ['x', 'y', 'z'], cells, rules }
    expect(countSolutions(input, 2).count).toBe(0)
  })
})

describe('performance smoke test — 12x12, realistically shaped', () => {
  // 8 suspects pinned to the diagonal by a unique furniture item each (mirrors the
  // generator's plan: one furniture type per suspect, ≤8 types exist), the remaining
  // 4 chained to each other via `direction` only — the part furniture can't reach.
  // This is the shape the real generator produces, NOT an adversarial worst case.
  function realisticTwelve(): SolverInput {
    const size = 12
    const suspectIds = Array.from({ length: size }, (_, i) => `s${i}`)
    const furnitureTypes = ['plant', 'rug', 'chair', 'piano', 'sofa', 'bed', 'chest', 'lamp'] as const
    const cells: Cell[] = []
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) cells.push({ row, col, roomId: 'R' })
    }

    const rules: ClueRule[] = []
    for (let i = 0; i < 8; i++) {
      cells[i * size + i] = { ...cells[i * size + i], furniture: furnitureTypes[i] }
      rules.push({ type: 'on-furniture', suspect: suspectIds[i], furniture: furnitureTypes[i] })
    }
    for (let i = 9; i < size; i++) {
      rules.push({ type: 'direction', subject: suspectIds[i], dir: 'S', reference: suspectIds[i - 1] })
      rules.push({ type: 'direction', subject: suspectIds[i], dir: 'E', reference: suspectIds[i - 1] })
    }

    return { size, suspectIds, cells, rules }
  }

  it('solves well within budget', () => {
    const input = realisticTwelve()

    const start = performance.now()
    const result = countSolutions(input, 2)
    const elapsedMs = performance.now() - start

    expect(result.truncated).toBe(false)
    expect(result.count).toBe(1)
    const expected = Object.fromEntries(
      input.suspectIds.map((id, i) => [id, { row: i, col: i }]),
    )
    expect(result.solutions[0]).toEqual(expected)

    console.log(`12x12 realistic solve: ${elapsedMs.toFixed(2)}ms`)
    expect(elapsedMs).toBeLessThan(500)
  })
})

describe('node budget circuit breaker', () => {
  it('bails out instead of hanging on a pathological all-direction chain, and reports "not unique"', () => {
    // Deliberately adversarial: a long `direction` chain with zero unary anchoring
    // anywhere. Measured separately: this genuinely blows up combinatorially (confirmed
    // exponential — exactly C(2N,N) backtracking nodes) even with MRV + forward
    // checking, which is exactly why the node budget exists. Real generator output
    // never looks like this (see the realistic case above) because clue selection is
    // biased to anchor suspects with room/furniture facts before relative ones.
    const size = 12
    const suspectIds = Array.from({ length: size }, (_, i) => `s${i}`)
    const cells: Cell[] = []
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) cells.push({ row, col, roomId: 'R' })
    }
    const rules: ClueRule[] = []
    for (let i = 1; i < size; i++) {
      rules.push({ type: 'direction', subject: suspectIds[i], dir: 'S', reference: suspectIds[i - 1] })
      rules.push({ type: 'direction', subject: suspectIds[i], dir: 'E', reference: suspectIds[i - 1] })
    }
    const input: SolverInput = { size, suspectIds, cells, rules }

    const start = performance.now()
    const result = countSolutions(input, 2, 5_000)
    const elapsedMs = performance.now() - start

    expect(result.truncated).toBe(true)
    expect(hasUniqueSolution(input, 5_000)).toBe(false)
    expect(elapsedMs).toBeLessThan(1_000)
  })
})
