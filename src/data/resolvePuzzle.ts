import type { Puzzle } from '../types/puzzle'
import { gameRepository } from '../lib/persistence'
import { generatePuzzle } from '../lib/generator/generatePuzzle'

/**
 * Resolves a playable puzzle by id. Every puzzle is procedurally generated — the app
 * never stores the full `Puzzle`, only its `{ seed, difficulty }` — and the generator
 * is deterministic, so this rebuilds the exact same puzzle from the saved game record.
 */
export async function resolvePuzzle(id: string): Promise<Puzzle | undefined> {
  const saved = await gameRepository.get(id)
  if (!saved) return undefined

  return generatePuzzle({ difficulty: saved.difficulty, seed: saved.seed, id: saved.id, title: saved.title })
}
