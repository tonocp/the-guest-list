import type { Cell, ClueRule, FurnitureType, Position } from '../../types/puzzle'
import { isBesideFurniture } from '../gridLogic'

/** A true fact about the solution, tagged with which suspect's card it would appear
 * on (the rule's `suspect` / `subject` / `a`, depending on type). */
export interface CandidateFact {
  owner: string
  rule: ClueRule
}

/**
 * Enumerates every true fact derivable from a fixed (solution, rooms, furniture) for
 * each non-victim suspect. The true solution trivially satisfies any subset of these,
 * so generation never needs to check "does this match the intended solution" the way
 * hand-authoring does — only whether the *chosen subset* pins it uniquely.
 *
 * `adjacent` facts involving the victim are deliberately never generated: since the
 * murderer is defined as whoever shares the victim's room, an "X was next to the
 * victim" clue would hand the player the answer directly.
 */
export function enumerateFacts(
  cells: Cell[],
  solution: Record<string, Position>,
  suspectIds: string[],
  victimId: string,
): CandidateFact[] {
  const facts: CandidateFact[] = []
  const cellAt = (pos: Position) => cells.find((c) => c.row === pos.row && c.col === pos.col)!
  const roomOf = (id: string) => cellAt(solution[id]).roomId

  const furnitureCellsByType = new Map<FurnitureType, Cell[]>()
  for (const c of cells) {
    if (!c.furniture) continue
    if (!furnitureCellsByType.has(c.furniture)) furnitureCellsByType.set(c.furniture, [])
    furnitureCellsByType.get(c.furniture)!.push(c)
  }

  const nonVictimIds = suspectIds.filter((id) => id !== victimId)

  for (const id of nonVictimIds) {
    const pos = solution[id]
    const cell = cellAt(pos)

    facts.push({ owner: id, rule: { type: 'room', suspect: id, roomId: cell.roomId } })

    if (cell.furniture) {
      facts.push({ owner: id, rule: { type: 'on-furniture', suspect: id, furniture: cell.furniture } })
    }

    for (const [furnitureType, furnitureCells] of furnitureCellsByType) {
      const near = furnitureCells.some((fc) => isBesideFurniture(cell, fc))
      facts.push({
        owner: id,
        rule: { type: 'near-furniture', suspect: id, furniture: furnitureType, negate: !near },
      })
    }

    for (const otherId of suspectIds) {
      if (otherId === id) continue
      const otherPos = solution[otherId]

      if (pos.row !== otherPos.row) {
        facts.push({
          owner: id,
          rule: { type: 'direction', subject: id, dir: pos.row > otherPos.row ? 'S' : 'N', reference: otherId },
        })
      }
      if (pos.col !== otherPos.col) {
        facts.push({
          owner: id,
          rule: { type: 'direction', subject: id, dir: pos.col > otherPos.col ? 'E' : 'W', reference: otherId },
        })
      }

      if (otherId !== victimId && roomOf(id) === roomOf(otherId)) {
        facts.push({ owner: id, rule: { type: 'adjacent', a: id, b: otherId } })
      }
    }
  }

  return facts
}
