export type FurnitureType =
  | 'plant'
  | 'rug'
  | 'chair'
  | 'piano'
  | 'sofa'
  | 'bed'
  | 'chest'
  | 'lamp'
  | 'table'
  | 'statue'
  | 'globe'
  | 'vase'
  | 'screen'

export type Difficulty = 'muy-facil' | 'facil' | 'medio' | 'dificil' | 'experto'

export interface Position {
  row: number
  col: number
}

export interface Cell {
  row: number
  col: number
  roomId: string
  furniture?: FurnitureType
}

export interface Room {
  id: string
  name: string
}

export interface Suspect {
  id: string
  name: string
  gender: 'f' | 'm'
  clue: string
  isVictim?: boolean
}

/** Structured predicates used only to author/verify a puzzle's unique solution. Not shipped to the runtime UI. */
export type ClueRule =
  | { type: 'room'; suspect: string; roomId: string }
  | { type: 'direction'; subject: string; dir: 'N' | 'S' | 'E' | 'W'; reference: string }
  | { type: 'adjacent'; a: string; b: string }
  | { type: 'on-furniture'; suspect: string; furniture: FurnitureType }
  | { type: 'near-furniture'; suspect: string; furniture: FurnitureType; negate?: boolean }

export interface Puzzle {
  id: string
  title: string
  size: number
  difficulty: Difficulty
  rooms: Room[]
  cells: Cell[]
  suspects: Suspect[]
  /** Ground truth used for win-checking and hints. */
  solution: Record<string, Position>
  /** Design-time-only rules kept alongside the puzzle for verification via scripts/verify-puzzle.ts */
  rules: ClueRule[]
}
