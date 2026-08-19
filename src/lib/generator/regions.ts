import type { Position } from '../../types/puzzle'
import { type RNG, pick, randInt, shuffle } from '../rng'

export interface RegionGenOptions {
  size: number
  rng: RNG
  /** Attempts at simultaneous-growth before falling back to straight-row regions. */
  maxAttempts?: number
  /** Target number of *accepted* boundary swaps in the shape-variety pass. */
  jaggleSwaps?: number
}

export interface RegionAssignment {
  /** `roomIdByCell[row][col]` — internal ids like "room-0", not display names. */
  roomIdByCell: string[][]
}

function key(row: number, col: number): string {
  return `${row}-${col}`
}

function chebyshev(a: Position, b: Position): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

function allPositions(size: number): Position[] {
  const positions: Position[] = []
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) positions.push({ row, col })
  return positions
}

function neighbors(pos: Position, size: number): Position[] {
  const candidates = [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
    { row: pos.row, col: pos.col + 1 },
  ]
  return candidates.filter((p) => p.row >= 0 && p.row < size && p.col >= 0 && p.col < size)
}

/** Farthest-point-ish sampling: spreads seeds out, with enough randomness (via a
 * sampled candidate pool) that the same size produces varied layouts across seeds. */
function pickSeeds(size: number, rng: RNG): Position[] {
  const all = allPositions(size)
  const seeds: Position[] = [pick(rng, all)]

  while (seeds.length < size) {
    const pool = shuffle(rng, all).slice(0, Math.min(all.length, size * 4))
    let best: Position | null = null
    let bestDist = -1
    for (const candidate of pool) {
      const dist = Math.min(...seeds.map((s) => chebyshev(candidate, s)))
      if (dist > bestDist) {
        bestDist = dist
        best = candidate
      }
    }
    seeds.push(best!)
  }

  return seeds
}

interface Region {
  id: string
  cells: Position[]
}

/** One simultaneous-growth attempt. Returns null if a region gets walled in before
 * reaching `size` cells (frontier goes empty while still short). */
function tryGrow(size: number, rng: RNG): string[][] | null {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  const seeds = pickSeeds(size, rng)
  const regions: Region[] = seeds.map((seed, i) => ({ id: `room-${i}`, cells: [seed] }))
  regions.forEach((r) => {
    grid[r.cells[0].row][r.cells[0].col] = r.id
  })

  while (regions.some((r) => r.cells.length < size)) {
    // Frontier per still-growing region: unclaimed cells adjacent to one of its cells.
    const frontiers = new Map<string, Position[]>()
    for (const region of regions) {
      if (region.cells.length >= size) continue
      const seen = new Set<string>()
      const frontier: Position[] = []
      for (const cell of region.cells) {
        for (const n of neighbors(cell, size)) {
          if (grid[n.row][n.col] !== null) continue
          const k = key(n.row, n.col)
          if (seen.has(k)) continue
          seen.add(k)
          frontier.push(n)
        }
      }
      frontiers.set(region.id, frontier)
    }

    let growing = regions.filter((r) => r.cells.length < size)
    if (growing.some((r) => frontiers.get(r.id)!.length === 0)) return null // walled in

    // Most-constrained-first: grow the smallest frontier first.
    growing = growing.sort((a, b) => frontiers.get(a.id)!.length - frontiers.get(b.id)!.length)
    const region = growing[0]
    const frontier = frontiers.get(region.id)!

    // Prefer a frontier cell fewer *other* growing regions are also contesting.
    const contestCount = (pos: Position) =>
      growing.filter((r) => r.id !== region.id && frontiers.get(r.id)!.some((p) => p.row === pos.row && p.col === pos.col))
        .length
    const minContest = Math.min(...frontier.map(contestCount))
    const leastContested = frontier.filter((p) => contestCount(p) === minContest)
    const chosen = pick(rng, leastContested)

    grid[chosen.row][chosen.col] = region.id
    region.cells.push(chosen)
  }

  return grid.map((row) => row.map((id) => id!))
}

/** Always-valid fallback: N straight rows of N cells. Only reached if growth keeps
 * failing, which most-constrained-first growth should make rare. */
function rowStripFallback(size: number): string[][] {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, () => `room-${row}`))
}

function regionCells(grid: string[][], size: number): Map<string, Position[]> {
  const byRoom = new Map<string, Position[]>()
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = grid[row][col]
      if (!byRoom.has(id)) byRoom.set(id, [])
      byRoom.get(id)!.push({ row, col })
    }
  }
  return byRoom
}

/** Unbounded 4-directional offsets — bounds don't matter here since membership is
 * checked against `set`, not against the grid. */
function orthogonalOffsets(pos: Position): Position[] {
  return [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
    { row: pos.row, col: pos.col + 1 },
  ]
}

function isConnected(cells: Position[]): boolean {
  if (cells.length === 0) return true
  const set = new Set(cells.map((p) => key(p.row, p.col)))
  const seen = new Set<string>()
  const stack = [cells[0]]
  seen.add(key(cells[0].row, cells[0].col))

  while (stack.length > 0) {
    const cur = stack.pop()!
    for (const n of orthogonalOffsets(cur)) {
      const k = key(n.row, n.col)
      if (!set.has(k) || seen.has(k)) continue
      seen.add(k)
      stack.push(n)
    }
  }

  return seen.size === cells.length
}

/** Random local swaps across region boundaries (kept only if both sides stay
 * connected) so rooms come out as staircase/L shapes, not just clean rectangles. */
function jaggle(grid: string[][], size: number, rng: RNG, targetSwaps: number): string[][] {
  const next = grid.map((row) => row.slice())
  let accepted = 0
  const maxAttempts = targetSwaps * 20

  for (let attempt = 0; attempt < maxAttempts && accepted < targetSwaps; attempt++) {
    const row = randInt(rng, size)
    const col = randInt(rng, size)
    const cellNeighbors = neighbors({ row, col }, size)
    if (cellNeighbors.length === 0) continue
    const other = pick(rng, cellNeighbors)

    const roomA = next[row][col]
    const roomB = next[other.row][other.col]
    if (roomA === roomB) continue

    next[row][col] = roomB
    next[other.row][other.col] = roomA

    const cellsByRoom = regionCells(next, size)
    const stillConnected = isConnected(cellsByRoom.get(roomA)!) && isConnected(cellsByRoom.get(roomB)!)

    if (stillConnected) {
      accepted++
    } else {
      next[row][col] = roomA
      next[other.row][other.col] = roomB
    }
  }

  return next
}

export function generateRegions(options: RegionGenOptions): RegionAssignment {
  const { size, rng, maxAttempts = 200, jaggleSwaps = size * 2 } = options

  let grid: string[][] | null = null
  for (let attempt = 0; attempt < maxAttempts && grid === null; attempt++) {
    grid = tryGrow(size, rng)
  }
  if (grid === null) grid = rowStripFallback(size)

  return { roomIdByCell: jaggle(grid, size, rng, jaggleSwaps) }
}
