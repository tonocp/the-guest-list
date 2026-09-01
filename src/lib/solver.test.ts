import { describe, expect, it } from 'vitest'
import type { Cell, ClueRule } from '../types/puzzle'
import { countSolutions, hasUniqueSolution, type SolverInput } from './solver'

describe('a full-size puzzle fixture (regression)', () => {
  const roomGrid = [
    ['A', 'A', 'A', 'B', 'B'],
    ['A', 'A', 'B', 'B', 'B'],
    ['C', 'C', 'C', 'D', 'D'],
    ['C', 'C', 'D', 'D', 'D'],
    ['E', 'E', 'E', 'E', 'E'],
  ]
  const furniture: Record<string, Cell['furniture']> = {
    '0-0': 'sofa',
    '2-2': 'rug',
    '3-3': 'chair',
    '0-3': 'plant',
    '1-4': 'statue',
  }
  const cells: Cell[] = roomGrid.flatMap((row, r) =>
    row.map((roomId, c) => ({ row: r, col: c, roomId, furniture: furniture[`${r}-${c}`] })),
  )
  const suspectIds = ['nora', 'delia', 'priya', 'marcus', 'teo']
  const solution = {
    nora: { row: 0, col: 0 },
    delia: { row: 1, col: 1 },
    priya: { row: 2, col: 2 },
    marcus: { row: 3, col: 3 },
    teo: { row: 4, col: 4 },
  }
  const rules: ClueRule[] = [
    { type: 'on-furniture', suspect: 'nora', furniture: 'sofa' },
    { type: 'room', suspect: 'delia', roomId: 'A' },
    { type: 'on-furniture', suspect: 'priya', furniture: 'rug' },
    { type: 'on-furniture', suspect: 'marcus', furniture: 'chair' },
    { type: 'direction', subject: 'teo', dir: 'S', reference: 'marcus' },
  ]
  const inputWith = (rs: ClueRule[]): SolverInput => ({ size: 5, suspectIds, cells, rules: rs })

  it('has a unique solution matching the authored solution', () => {
    const result = countSolutions(inputWith(rules), 2)
    expect(result.count).toBe(1)
    expect(result.solutions[0]).toEqual(solution)
  })

  it('reports non-unique for a deliberately under-constrained rule set', () => {
    const underConstrained = inputWith(rules.slice(0, 1))
    expect(hasUniqueSolution(underConstrained)).toBe(false)
    expect(countSolutions(underConstrained, 2).count).toBe(2)
  })

  it('reports zero solutions for a contradictory rule set', () => {
    const contradictory: ClueRule[] = [...rules, { type: 'room', suspect: 'nora', roomId: 'C' }]
    expect(countSolutions(inputWith(contradictory), 2).count).toBe(0)
  })
})

describe('rule-type correctness on a small hand-verified 3x3 fixture', () => {
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
