import type { Puzzle } from '../types/puzzle'
import { gameRepository } from '../lib/persistence'
import { generatePuzzle } from '../lib/generator/generatePuzzle'

/** Rebuilds the playable `Puzzle` from the saved game's `{ seed, difficulty }`. */
export async function resolvePuzzle(id: string): Promise<Puzzle | undefined> {
  const saved = await gameRepository.get(id)
  if (!saved) return undefined

  return generatePuzzle({ difficulty: saved.difficulty, seed: saved.seed, id: saved.id, title: saved.title })
}
