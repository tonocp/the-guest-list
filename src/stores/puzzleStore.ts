import { defineStore } from 'pinia'
import type { Puzzle, Position } from '../types/puzzle'
import { getConflicts, isComplete, matchesSolution, getMurderer, type Placements } from '../lib/gridLogic'
import { resolvePuzzle } from '../data/resolvePuzzle'
import { gameRepository, type SavedGame } from '../lib/persistence'

interface HistoryEntry {
  suspectId: string
  previous: Position | null
}

export const usePuzzleStore = defineStore('puzzle', {
  state: () => ({
    puzzle: null as Puzzle | null,
    placements: {} as Placements,
    selectedSuspectId: null as string | null,
    history: [] as HistoryEntry[],
    hintsUsed: 0,
    won: false,
    startedAt: 0,
    elapsedMs: 0,
    /** Only known for procedurally generated puzzles (via the saved record). `null`
     * means this puzzle has nothing to autosave against (e.g. a static fixture). */
    savedSeed: null as number | null,
    completedAt: null as number | null,
  }),

  getters: {
    conflicts: (state) => (state.puzzle ? getConflicts(state.puzzle, state.placements) : []),
    isBoardFull: (state) => (state.puzzle ? isComplete(state.puzzle, state.placements) : false),
    murdererId: (state) => (state.puzzle ? getMurderer(state.puzzle) : undefined),
  },

  actions: {
    /** Rebuilds the puzzle from its saved `{ seed, difficulty }` and restores any saved
     * progress. Returns false if no such saved game exists. */
    async load(id: string): Promise<boolean> {
      const puzzle = await resolvePuzzle(id)
      if (!puzzle) return false

      const saved = await gameRepository.get(id)

      this.puzzle = puzzle
      this.savedSeed = saved?.seed ?? null
      this.completedAt = saved?.completedAt ?? null

      if (saved) {
        this.placements = saved.placements
        this.hintsUsed = saved.hintsUsed
        this.won = saved.won
        this.elapsedMs = saved.elapsedMs
        this.startedAt = Date.now() - saved.elapsedMs
      } else {
        this.placements = Object.fromEntries(puzzle.suspects.map((s) => [s.id, null]))
        this.hintsUsed = 0
        this.won = false
        this.elapsedMs = 0
        this.startedAt = Date.now()
      }
      this.selectedSuspectId = puzzle.suspects.find((s) => !this.placements[s.id])?.id ?? null
      this.history = []

      return true
    },

    selectSuspect(id: string) {
      this.selectedSuspectId = id
    },

    placeAt(row: number, col: number) {
      if (!this.puzzle) return

      const occupant = Object.entries(this.placements).find(
        ([, pos]) => pos?.row === row && pos?.col === col,
      )
      if (occupant) {
        this.history.push({ suspectId: occupant[0], previous: this.placements[occupant[0]] })
        this.placements[occupant[0]] = null
        this.persist()
        return
      }

      if (!this.selectedSuspectId) return
      const id = this.selectedSuspectId
      this.history.push({ suspectId: id, previous: this.placements[id] })
      this.placements[id] = { row, col }

      const nextUnplaced = this.puzzle.suspects.find((s) => !this.placements[s.id])
      this.selectedSuspectId = nextUnplaced?.id ?? null

      this.checkWin()
      this.persist()
    },

    removeSuspect(id: string) {
      if (!this.placements[id]) return
      this.history.push({ suspectId: id, previous: this.placements[id] })
      this.placements[id] = null
      this.selectedSuspectId = id
      this.persist()
    },

    undo() {
      const entry = this.history.pop()
      if (!entry) return
      this.placements[entry.suspectId] = entry.previous
      this.selectedSuspectId = entry.suspectId
      this.persist()
    },

    clearAll() {
      if (!this.puzzle) return
      for (const s of this.puzzle.suspects) this.placements[s.id] = null
      this.history = []
      this.selectedSuspectId = this.puzzle.suspects[0].id
      this.won = false
      this.persist()
    },

    hint() {
      if (!this.puzzle) return
      const unsolved = this.puzzle.suspects.find((s) => {
        const p = this.placements[s.id]
        const sol = this.puzzle!.solution[s.id]
        return !p || p.row !== sol.row || p.col !== sol.col
      })
      if (!unsolved) return
      this.history.push({ suspectId: unsolved.id, previous: this.placements[unsolved.id] })
      this.placements[unsolved.id] = { ...this.puzzle.solution[unsolved.id] }
      this.hintsUsed++
      this.checkWin()
      this.persist()
    },

    checkWin() {
      if (!this.puzzle) return
      if (isComplete(this.puzzle, this.placements) && matchesSolution(this.puzzle, this.placements)) {
        this.won = true
        this.elapsedMs = Date.now() - this.startedAt
        this.completedAt = this.completedAt ?? Date.now()
      }
    },

    /** Fire-and-forget autosave, called after every mutating action. No-op for
     * puzzles with no known seed (static fixtures) — nothing to regenerate against. */
    persist() {
      if (!this.puzzle || this.savedSeed === null) return
      const now = Date.now()
      const game: SavedGame = {
        id: this.puzzle.id,
        difficulty: this.puzzle.difficulty,
        seed: this.savedSeed,
        title: this.puzzle.title,
        size: this.puzzle.size,
        suspectsCount: this.puzzle.suspects.length,
        placements: this.placements,
        hintsUsed: this.hintsUsed,
        won: this.won,
        elapsedMs: this.won ? this.elapsedMs : now - this.startedAt,
        updatedAt: now,
        completedAt: this.completedAt ?? undefined,
      }
      void gameRepository.save(game)
    },
  },
})
