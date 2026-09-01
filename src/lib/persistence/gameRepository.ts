import type { Difficulty, Position } from '../../types/puzzle'

/** Never stores the full `Puzzle` — `{ id, seed, difficulty }` reconstructs it. Only
 * player progress is persisted. */
export interface SavedGame {
  id: string
  difficulty: Difficulty
  seed: number
  /** Cached for list rendering without regenerating. */
  title: string
  size: number
  suspectsCount: number
  placements: Record<string, Position | null>
  hintsUsed: number
  won: boolean
  /** Active play time — does not accrue while the app is closed. */
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
