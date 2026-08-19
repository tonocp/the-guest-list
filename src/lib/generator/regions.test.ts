import { describe, expect, it } from 'vitest'
import type { Position } from '../../types/puzzle'
import { createRng } from '../rng'
import { generateRegions } from './regions'

function cellsByRoom(roomIdByCell: string[][], size: number): Map<string, Position[]> {
  const map = new Map<string, Position[]>()
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = roomIdByCell[row][col]
      if (!map.has(id)) map.set(id, [])
      map.get(id)!.push({ row, col })
    }
  }
  return map
}

function isConnected(cells: Position[]): boolean {
  const set = new Set(cells.map((p) => `${p.row}-${p.col}`))
  const seen = new Set<string>()
  const stack = [cells[0]]
  seen.add(`${cells[0].row}-${cells[0].col}`)
  while (stack.length > 0) {
    const cur = stack.pop()!
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const k = `${cur.row + dr}-${cur.col + dc}`
      if (!set.has(k) || seen.has(k)) continue
      seen.add(k)
      stack.push({ row: cur.row + dr, col: cur.col + dc })
    }
  }
  return seen.size === cells.length
}

function isAxisAlignedRectangle(cells: Position[]): boolean {
  const rows = cells.map((c) => c.row)
  const cols = cells.map((c) => c.col)
  const width = Math.max(...cols) - Math.min(...cols) + 1
  const height = Math.max(...rows) - Math.min(...rows) + 1
  return width * height === cells.length
}

describe('generateRegions', () => {
  const sizes = [6, 9, 12]
  const seeds = [1, 2, 3, 4, 5]

  for (const size of sizes) {
    for (const seed of seeds) {
      it(`size=${size} seed=${seed}: full coverage, N regions of N connected cells`, () => {
        const { roomIdByCell } = generateRegions({ size, rng: createRng(seed) })

        expect(roomIdByCell.length).toBe(size)
        for (const row of roomIdByCell) expect(row.length).toBe(size)

        const byRoom = cellsByRoom(roomIdByCell, size)
        expect(byRoom.size).toBe(size)

        let totalCells = 0
        for (const [, cells] of byRoom) {
          expect(cells.length).toBe(size)
          expect(isConnected(cells)).toBe(true)
          totalCells += cells.length
        }
        expect(totalCells).toBe(size * size)
      })
    }
  }

  it('is deterministic for a given (size, seed)', () => {
    const a = generateRegions({ size: 9, rng: createRng(42) })
    const b = generateRegions({ size: 9, rng: createRng(42) })
    expect(a.roomIdByCell).toEqual(b.roomIdByCell)
  })

  it('produces varied, non-rectangular room shapes across seeds', () => {
    const size = 9
    let anyNonRectangle = false
    for (let seed = 0; seed < 20; seed++) {
      const { roomIdByCell } = generateRegions({ size, rng: createRng(seed) })
      const byRoom = cellsByRoom(roomIdByCell, size)
      for (const [, cells] of byRoom) {
        if (!isAxisAlignedRectangle(cells)) anyNonRectangle = true
      }
    }
    expect(anyNonRectangle).toBe(true)
  })
})
