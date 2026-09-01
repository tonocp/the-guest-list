import type { Difficulty, Puzzle } from '../src/types/puzzle'
import { countSolutions } from '../src/lib/solver'
import { generatePuzzle } from '../src/lib/generator/generatePuzzle'

/**
 * Deterministic gate: for a handful of fixed seeds per difficulty, generate the puzzle
 * and confirm the shipped solver agrees — exactly one solution, not truncated, and
 * identical to the solution the generator committed to. Complements
 * `stress-generate.ts` (which only measures generator success rate and timing, never
 * re-checks the solver against the generator's own answer).
 */
const SEEDS_BY_DIFFICULTY: Record<Difficulty, number[]> = {
  'muy-facil': [1, 2, 3, 4, 5],
  facil: [1, 2, 3, 4, 5],
  medio: [1, 2, 3, 4, 5],
  dificil: [1, 2, 3, 4, 5],
  experto: [1, 2, 3, 4, 5],
}

function verify(puzzle: Puzzle): boolean {
  const result = countSolutions(
    { size: puzzle.size, suspectIds: puzzle.suspects.map((s) => s.id), cells: puzzle.cells, rules: puzzle.rules },
    2,
  )

  const matchesGenerator =
    result.count === 1 &&
    puzzle.suspects.every((s) => {
      const solved = result.solutions[0][s.id]
      const authored = puzzle.solution[s.id]
      return solved.row === authored.row && solved.col === authored.col
    })

  const status = result.truncated
    ? 'INCONCLUSIVE (node budget exhausted) ✘'
    : matchesGenerator
      ? 'UNIQUE ✔'
      : 'AMBIGUOUS/INVALID ✘'

  console.log(`  ${puzzle.id.padEnd(28)} ${puzzle.size}x${puzzle.size}  ${status}`)
  if (status !== 'UNIQUE ✔') {
    console.log('    solutions:', JSON.stringify(result.solutions))
  }
  return status === 'UNIQUE ✔'
}

let allOk = true
for (const [difficulty, seeds] of Object.entries(SEEDS_BY_DIFFICULTY) as [Difficulty, number[]][]) {
  console.log(`\n${difficulty}`)
  for (const seed of seeds) {
    const puzzle = generatePuzzle({ difficulty, seed, id: `${difficulty}-seed-${seed}` })
    if (!verify(puzzle)) allOk = false
  }
}

if (!allOk) {
  console.log('\nSome puzzles did not verify as UNIQUE ✔')
  process.exit(1)
}
console.log('\nAll fixed-seed puzzles verified UNIQUE ✔')
