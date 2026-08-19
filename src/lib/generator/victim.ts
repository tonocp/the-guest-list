import type { Position } from '../../types/puzzle'
import { type RNG, pick, shuffle } from '../rng'

export interface VictimSelection {
  solution: Record<string, Position>
  victimId: string
  murdererId: string
}

function randomSolution(size: number, suspectIds: string[], rng: RNG): Record<string, Position> {
  const rowOrder = shuffle(rng, suspectIds)
  const cols = shuffle(
    rng,
    Array.from({ length: size }, (_, i) => i),
  )
  const solution: Record<string, Position> = {}
  rowOrder.forEach((id, row) => {
    solution[id] = { row, col: cols[row] }
  })
  return solution
}

/**
 * Tries random solution permutations (cheap — no solver call) against the given room
 * partition until it finds one where some room ends up with *exactly* two occupants.
 * That's a hard requirement, not just nice-to-have: `getMurderer` in gridLogic.ts
 * picks the victim's roommate via `.find()`, so a room with 3+ occupants would make
 * "who's the murderer" arbitrary rather than well-defined.
 */
export function selectVictim(
  size: number,
  suspectIds: string[],
  roomIdByCell: string[][],
  rng: RNG,
  maxAttempts = 100,
): VictimSelection | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = randomSolution(size, suspectIds, rng)

    const occupantsByRoom = new Map<string, string[]>()
    for (const id of suspectIds) {
      const pos = solution[id]
      const roomId = roomIdByCell[pos.row][pos.col]
      if (!occupantsByRoom.has(roomId)) occupantsByRoom.set(roomId, [])
      occupantsByRoom.get(roomId)!.push(id)
    }

    const pairRooms = [...occupantsByRoom.values()].filter((occupants) => occupants.length === 2)
    if (pairRooms.length === 0) continue

    const [a, b] = pick(rng, pairRooms)
    const victimId = pick(rng, [a, b])
    const murdererId = victimId === a ? b : a
    return { solution, victimId, murdererId }
  }

  return null
}
