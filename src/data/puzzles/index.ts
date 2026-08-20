import type { Puzzle } from '../../types/puzzle'
import { fiestaDisfraces } from './fiestaDisfraces'
import { estudioYoga } from './estudioYoga'
import { gameRepository } from '../../lib/persistence'
import { generatePuzzle } from '../../lib/generator/generatePuzzle'

/** Hand-authored fixtures. Not shown on the puzzle list (see PuzzleListView.vue) —
 * kept for `solver.test.ts` and reachable by id via `resolvePuzzle` if ever needed. */
export const puzzles: Puzzle[] = [fiestaDisfraces, estudioYoga]

/**
 * Resolves any playable puzzle by id: a hand-authored fixture, or a procedurally
 * generated one reconstructed from its saved `{ seed, difficulty }` — the generator is
 * deterministic, so this reproduces the exact same `Puzzle` without storing it.
 */
export async function resolvePuzzle(id: string): Promise<Puzzle | undefined> {
  const staticPuzzle = puzzles.find((p) => p.id === id)
  if (staticPuzzle) return staticPuzzle

  const saved = await gameRepository.get(id)
  if (!saved) return undefined

  return generatePuzzle({ difficulty: saved.difficulty, seed: saved.seed, id: saved.id, title: saved.title })
}
