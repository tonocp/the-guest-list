import type { Difficulty, Position } from '../../types/puzzle'

/**
 * A saved game never stores the full `Puzzle` — since the generator is deterministic
 * by seed, `{ id, seed, difficulty }` is enough to reconstruct it exactly via
 * `generatePuzzle()`. Only the player's progress needs persisting.
 */
export interface SavedGame {
  id: string
  difficulty: Difficulty
  seed: number
  /** Cached for list rendering without regenerating the puzzle. */
  title: string
  size: number
  suspectsCount: number
  placements: Record<string, Position | null>
  hintsUsed: number
  won: boolean
  /** Active play time in ms — does not accrue while the app is closed. */
  elapsedMs: number
  updatedAt: number
  completedAt?: number
}

export interface GameRepository {
  list(): Promise<SavedGame[]>
  get(id: string): Promise<SavedGame | undefined>
  save(game: SavedGame): Promise<void>
  remove(id: string): Promise<void>
}
