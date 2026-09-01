import type { Cell, ClueRule, Position } from '../types/puzzle'
import { getCell, isBesideFurniture, isNextTo } from './gridLogic'

export interface SolverInput {
  size: number
  suspectIds: string[]
  cells: Cell[]
  rules: ClueRule[]
}

export interface SolveResult {
  count: number
  solutions: Record<string, Position>[]
  /** True if the node budget was exhausted before the search could finish — `count`
   * may then be an undercount and must NOT be treated as authoritative. Pathological
   * clue sets (e.g. a long chain of `direction` rules with no unary anchor at all) can
   * blow up combinatorially even with MRV + forward checking; this is the circuit
   * breaker so a caller (the generator) can just discard that attempt and try another
   * clue combination instead of hanging. */
  truncated: boolean
}

function allPositions(size: number): Position[] {
  const positions: Position[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) positions.push({ row, col })
  }
  return positions
}

/** room / on-furniture / near-furniture depend on exactly one suspect's own cell. */
function isUnaryRuleFor(rule: ClueRule, suspectId: string): boolean {
  return (
    (rule.type === 'room' || rule.type === 'on-furniture' || rule.type === 'near-furniture') &&
    rule.suspect === suspectId
  )
}

function satisfiesUnary(rule: ClueRule, pos: Position, cells: Cell[]): boolean {
  const cell = getCell({ cells }, pos.row, pos.col)
  if (!cell) return false

  switch (rule.type) {
    case 'room':
      return cell.roomId === rule.roomId
    case 'on-furniture':
      return cell.furniture === rule.furniture
    case 'near-furniture': {
      const furnitureCells = cells.filter((c) => c.furniture === rule.furniture)
      const near = furnitureCells.some((fc) => isBesideFurniture(cell, fc))
      return rule.negate ? !near : near
    }
    default:
      return true
  }
}

/** direction / adjacent depend on two suspects' positions. Returns the other suspect's id, or null. */
function otherParty(rule: ClueRule, suspectId: string): string | null {
  if (rule.type === 'direction') {
    if (rule.subject === suspectId) return rule.reference
    if (rule.reference === suspectId) return rule.subject
    return null
  }
  if (rule.type === 'adjacent') {
    if (rule.a === suspectId) return rule.b
    if (rule.b === suspectId) return rule.a
    return null
  }
  return null
}

function satisfiesBinary(rule: ClueRule, positions: Map<string, Position>, cells: Cell[]): boolean {
  if (rule.type === 'direction') {
    const subj = positions.get(rule.subject)
    const ref = positions.get(rule.reference)
    if (!subj || !ref) return true // other side not placed yet; nothing to check
    switch (rule.dir) {
      case 'N':
        return subj.row < ref.row
      case 'S':
        return subj.row > ref.row
      case 'W':
        return subj.col < ref.col
      case 'E':
        return subj.col > ref.col
    }
  }
  if (rule.type === 'adjacent') {
    const a = positions.get(rule.a)
    const b = positions.get(rule.b)
    if (!a || !b) return true
    return isNextTo({ cells }, a, b)
  }
  return true
}

/**
 * Counts valid placements (one suspect per row/col, all rules satisfied), stopping as
 * soon as `cap` distinct solutions are found — we only ever need to know "is this
 * unique", never the full solution count. Backtracks suspect-by-suspect (not row-by-row)
 * using MRV: at each node it picks the unplaced suspect with the fewest live candidate
 * cells, which lets rules that pin a suspect to one cell (e.g. a unique on-furniture
 * item) cascade for free, the same way "naked singles" do in a sudoku solver.
 */
export function countSolutions(input: SolverInput, cap = 2, maxNodes = 50_000): SolveResult {
  const { size, suspectIds, cells, rules } = input

  const domain = new Map<string, Position[]>()
  for (const id of suspectIds) {
    const unaryRules = rules.filter((r) => isUnaryRuleFor(r, id))
    domain.set(
      id,
      allPositions(size).filter((pos) => unaryRules.every((r) => satisfiesUnary(r, pos, cells))),
    )
  }

  const binaryRulesFor = new Map<string, ClueRule[]>()
  for (const id of suspectIds) binaryRulesFor.set(id, [])
  for (const rule of rules) {
    if (rule.type !== 'direction' && rule.type !== 'adjacent') continue
    for (const id of suspectIds) {
      if (otherParty(rule, id) !== null) binaryRulesFor.get(id)!.push(rule)
    }
  }

  const solutions: Record<string, Position>[] = []
  const positions = new Map<string, Position>()
  const usedRows = new Set<number>()
  const usedCols = new Set<number>()
  const unassigned = new Set(suspectIds)

  /**
   * Candidates for `id` given the current partial assignment: row/col-used filtering,
   * plus forward-checking any binary rule whose *other* participant is already placed.
   * This is what makes MRV actually prefer suspects chained to already-placed ones —
   * without it, a suspect's estimated domain never shrinks until it's their own turn
   * to be checked, so variable order stops tracking the constraint graph and search
   * blows up on chains of `direction`/`adjacent` rules (measured: a 12x12 all-direction
   * chain went from hanging past two minutes to solving in a few milliseconds once this
   * was added).
   */
  function liveCandidates(id: string): Position[] {
    const base = domain.get(id)!.filter((p) => !usedRows.has(p.row) && !usedCols.has(p.col))
    const rulesToCheck = binaryRulesFor.get(id)!
    if (rulesToCheck.length === 0) return base

    return base.filter((pos) => {
      positions.set(id, pos)
      const ok = rulesToCheck.every((r) => satisfiesBinary(r, positions, cells))
      positions.delete(id)
      return ok
    })
  }

  let nodeCount = 0
  let truncated = false

  /** Returns true once `cap` solutions have been found (or the node budget runs out),
   * signalling every caller to stop. */
  function search(): boolean {
    nodeCount++
    if (nodeCount > maxNodes) {
      truncated = true
      return true
    }

    if (unassigned.size === 0) {
      solutions.push(Object.fromEntries(positions))
      return solutions.length >= cap
    }

    // MRV + forward checking: find the most-constrained unplaced suspect; bail
    // immediately if any unplaced suspect is already out of live candidates.
    let bestId: string | null = null
    let bestCandidates: Position[] | null = null
    for (const id of unassigned) {
      const candidates = liveCandidates(id)
      if (candidates.length === 0) return false
      if (bestCandidates === null || candidates.length < bestCandidates.length) {
        bestId = id
        bestCandidates = candidates
      }
    }

    const id = bestId!
    unassigned.delete(id)

    // bestCandidates already passed row/col + binary-rule forward checking above.
    for (const pos of bestCandidates!) {
      positions.set(id, pos)
      usedRows.add(pos.row)
      usedCols.add(pos.col)
      const stop = search()
      usedRows.delete(pos.row)
      usedCols.delete(pos.col)
      if (stop) {
        positions.delete(id)
        unassigned.add(id)
        return true
      }
      positions.delete(id)
    }

    unassigned.add(id)
    return false
  }

  search()
  return { count: solutions.length, solutions, truncated }
}

/** False both when there are 0 or 2+ solutions, and when the search had to be
 * abandoned (node budget exhausted) — an inconclusive result is never "unique". */
export function hasUniqueSolution(input: SolverInput, maxNodes?: number): boolean {
  const result = countSolutions(input, 2, maxNodes)
  return !result.truncated && result.count === 1
}
