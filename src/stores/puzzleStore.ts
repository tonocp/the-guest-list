import { defineStore } from 'pinia'
import type { Puzzle, Position } from '../types/puzzle'
import { getConflicts, isComplete, matchesSolution, getMurderer, type Placements } from '../lib/gridLogic'

const COMPLETED_KEY = 'murdoku:completed'

function loadCompleted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveCompleted(ids: string[]) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(ids))
}

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
    completed: loadCompleted() as string[],
  }),

  getters: {
    conflicts: (state) => (state.puzzle ? getConflicts(state.puzzle, state.placements) : []),
    isBoardFull: (state) => (state.puzzle ? isComplete(state.puzzle, state.placements) : false),
    murdererId: (state) => (state.puzzle ? getMurderer(state.puzzle) : undefined),
    isPuzzleCompleted: (state) => (id: string) => state.completed.includes(id),
  },

  actions: {
    load(puzzle: Puzzle) {
      this.puzzle = puzzle
      this.placements = Object.fromEntries(puzzle.suspects.map((s) => [s.id, null]))
      this.selectedSuspectId = puzzle.suspects.find((s) => !s.isVictim)?.id ?? puzzle.suspects[0].id
      this.history = []
      this.hintsUsed = 0
      this.won = false
      this.startedAt = Date.now()
      this.elapsedMs = 0
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
        return
      }

      if (!this.selectedSuspectId) return
      const id = this.selectedSuspectId
      this.history.push({ suspectId: id, previous: this.placements[id] })
      this.placements[id] = { row, col }

      const nextUnplaced = this.puzzle.suspects.find((s) => !this.placements[s.id])
      this.selectedSuspectId = nextUnplaced?.id ?? null

      this.checkWin()
    },

    removeSuspect(id: string) {
      if (!this.placements[id]) return
      this.history.push({ suspectId: id, previous: this.placements[id] })
      this.placements[id] = null
      this.selectedSuspectId = id
    },

    undo() {
      const entry = this.history.pop()
      if (!entry) return
      this.placements[entry.suspectId] = entry.previous
      this.selectedSuspectId = entry.suspectId
    },

    clearAll() {
      if (!this.puzzle) return
      for (const s of this.puzzle.suspects) this.placements[s.id] = null
      this.history = []
      this.selectedSuspectId = this.puzzle.suspects[0].id
      this.won = false
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
    },

    checkWin() {
      if (!this.puzzle) return
      if (isComplete(this.puzzle, this.placements) && matchesSolution(this.puzzle, this.placements)) {
        this.won = true
        this.elapsedMs = Date.now() - this.startedAt
        if (!this.completed.includes(this.puzzle.id)) {
          this.completed.push(this.puzzle.id)
          saveCompleted(this.completed)
        }
      }
    },
  },
})
