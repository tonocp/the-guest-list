import type { GameRepository } from './gameRepository'
import { createIndexedDbGameRepository } from './indexedDbGameRepository'

export type { GameRepository, SavedGame } from './gameRepository'

export const gameRepository: GameRepository = createIndexedDbGameRepository()
