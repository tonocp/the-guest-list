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

/** Structured predicates behind the clues — consumed by the solver, not rendered. */
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
  /** Ground truth for win-checking and hints. */
  solution: Record<string, Position>
  rules: ClueRule[]
}
