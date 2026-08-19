import type { Puzzle } from '../../types/puzzle'
import { fiestaDisfraces } from './fiestaDisfraces'
import { estudioYoga } from './estudioYoga'

export const puzzles: Puzzle[] = [fiestaDisfraces, estudioYoga]

/** Procedurally generated puzzles aren't part of the static registry above — they're
 * registered here transiently (lost on reload) right before navigating to play one. */
const generatedPuzzles = new Map<string, Puzzle>()

export function registerGeneratedPuzzle(puzzle: Puzzle) {
  generatedPuzzles.set(puzzle.id, puzzle)
}

export function getPuzzle(id: string): Puzzle | undefined {
  return puzzles.find((p) => p.id === id) ?? generatedPuzzles.get(id)
}
