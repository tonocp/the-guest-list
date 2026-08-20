import type { Cell, ClueRule, Difficulty, Position, Puzzle, Room, Suspect } from '../../types/puzzle'
import { createRng, type RNG, pick, shuffle } from '../rng'
import { hasUniqueSolution } from '../solver'
import { generateRegions } from './regions'
import { selectVictim } from './victim'
import { assignFurniture } from './furniture'
import { enumerateFacts } from './clueFacts'
import { selectClues } from './selectClues'
import { clueText, type ClueTextContext } from './clueText'
import { SUSPECT_POOL } from './suspectPool'
import { ROOM_THEMES, type ThemeRoom } from './roomThemes'

export interface GeneratePuzzleOptions {
  difficulty: Difficulty
  seed?: number
  id?: string
  title?: string
}

const SIZE_BY_DIFFICULTY: Record<Difficulty, number> = {
  'muy-facil': 6,
  facil: 9,
  medio: 9,
  dificil: 9,
  experto: 12,
}

const FALLBACK_CLUE: Record<'f' | 'm', string> = {
  f: 'Nadie recuerda haberla visto esa noche.',
  m: 'Nadie recuerda haberlo visto esa noche.',
}

function ownerOf(rule: ClueRule): string {
  switch (rule.type) {
    case 'room':
    case 'on-furniture':
    case 'near-furniture':
      return rule.suspect
    case 'direction':
      return rule.subject
    case 'adjacent':
      return rule.a
  }
}

interface Attempt {
  title: string
  rooms: Room[]
  cells: Cell[]
  suspects: Suspect[]
  solution: Record<string, Position>
  rules: ClueRule[]
}

function tryGenerateOnce(size: number, rng: RNG): Attempt | null {
  const { roomIdByCell } = generateRegions({ size, rng })
  const roomIds = Array.from({ length: size }, (_, i) => `room-${i}`)

  const roster = shuffle(rng, SUSPECT_POOL).slice(0, size)
  const suspectIds = roster.map((_, i) => `s${i}`)

  const theme = pick(rng, ROOM_THEMES)
  const themeRooms = shuffle(rng, theme.rooms).slice(0, size)
  const roomDisplayById = new Map<string, ThemeRoom>(roomIds.map((id, i) => [id, themeRooms[i]]))
  const rooms: Room[] = roomIds.map((id) => ({ id, name: roomDisplayById.get(id)!.name }))

  const victimSelection = selectVictim(size, suspectIds, roomIdByCell, rng)
  if (!victimSelection) return null
  const { solution, victimId } = victimSelection

  const nonVictimIds = suspectIds.filter((id) => id !== victimId)
  const placements = assignFurniture(nonVictimIds, solution, roomIdByCell, size, rng)

  const cells: Cell[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) cells.push({ row, col, roomId: roomIdByCell[row][col] })
  }
  for (const placement of placements) {
    for (const pos of placement.cells) {
      const idx = pos.row * size + pos.col
      cells[idx] = { ...cells[idx], furniture: placement.type }
    }
  }

  const facts = enumerateFacts(cells, solution, suspectIds, victimId)
  const rules = selectClues(size, suspectIds, cells, facts, rng)
  if (!rules) return null

  // Belt-and-suspenders: one more solver call on the fully assembled puzzle before
  // trusting it, in case anything upstream slipped an inconsistency through.
  if (!hasUniqueSolution({ size, suspectIds, cells, rules })) return null

  const nameById = new Map(suspectIds.map((id, i) => [id, roster[i].name]))
  const ruleByOwner = new Map(rules.map((rule) => [ownerOf(rule), rule]))
  const ctx: ClueTextContext = {
    suspectName: (id) => nameById.get(id)!,
    roomDisplay: (roomId) => roomDisplayById.get(roomId)!,
  }

  const suspects: Suspect[] = suspectIds.map((id, i) => {
    const { name, gender } = roster[i]
    if (id === victimId) {
      return { id, name, gender, clue: 'La víctima. Estaba a solas con el asesino.', isVictim: true }
    }
    const rule = ruleByOwner.get(id)
    const clue = rule ? clueText(rule, gender, ctx) : FALLBACK_CLUE[gender]
    return { id, name, gender, clue }
  })

  return { title: `Caso en ${theme.label}`, rooms, cells, suspects, solution, rules }
}

/** Generates a fresh, randomly themed, provably-unique-solution puzzle for the given
 * difficulty. Retries the whole pipeline (fresh rooms, solution, furniture, clues) up
 * to `maxAttempts` times — each step inside one attempt is individually probabilistic
 * (room growth can dead-end, a solution might not yield a valid victim room, clue
 * selection might not reach uniqueness within the one-clue-per-suspect cap), so an
 * occasional retry is expected, not a bug. */
export function generatePuzzle(options: GeneratePuzzleOptions): Puzzle {
  const size = SIZE_BY_DIFFICULTY[options.difficulty]
  const masterRng = createRng(options.seed ?? Date.now())
  const maxAttempts = 20

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = Math.floor(masterRng() * 2 ** 31)
    const result = tryGenerateOnce(size, createRng(attemptSeed))
    if (!result) continue

    return {
      id: options.id ?? `generated-${attemptSeed}`,
      title: options.title ?? result.title,
      size,
      difficulty: options.difficulty,
      rooms: result.rooms,
      cells: result.cells,
      suspects: result.suspects,
      solution: result.solution,
      rules: result.rules,
    }
  }

  throw new Error(`generatePuzzle: exhausted ${maxAttempts} attempts for difficulty "${options.difficulty}"`)
}
