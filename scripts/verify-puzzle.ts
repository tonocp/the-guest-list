import type { Difficulty, Puzzle } from '../src/types/puzzle'
import { countSolutions } from '../src/lib/solver'
import { generatePuzzle } from '../src/lib/generator/generatePuzzle'

/**
 * Deterministic gate: for a handful of fixed seeds per difficulty, generate the puzzle
 * and confirm `countSolutions` agrees with the answer the generator committed to —
 * exactly one solution, not truncated, and identical. Complements `stress-generate.ts`
 * (which only measures generator success rate and timing, never re-checks the solver
 * against the generator's own answer).
 */
const DIFFICULTIES: Difficulty[] = ['muy-facil', 'facil', 'medio', 'dificil', 'experto']
const SEEDS = [1, 2, 3, 4, 5]

function verify(puzzle: Puzzle): boolean {
  const result = countSolutions(
    { size: puzzle.size, suspectIds: puzzle.suspects.map((s) => s.id), cells: puzzle.cells, rules: puzzle.rules },
    2,
  )

  const ok =
    !result.truncated &&
    result.count === 1 &&
    puzzle.suspects.every((s) => {
      const solved = result.solutions[0][s.id]
      const expected = puzzle.solution[s.id]
      return solved.row === expected.row && solved.col === expected.col
    })

  const status = result.truncated
    ? 'INCONCLUSIVE (node budget exhausted) ✘'
    : ok
      ? 'UNIQUE ✔'
      : 'AMBIGUOUS/INVALID ✘'

  console.log(`  ${puzzle.id.padEnd(28)} ${puzzle.size}x${puzzle.size}  ${status}`)
  if (!ok) {
    console.log('    solutions:', JSON.stringify(result.solutions))
  }
  return ok
}

let allOk = true
for (const difficulty of DIFFICULTIES) {
  console.log(`\n${difficulty}`)
  for (const seed of SEEDS) {
    const puzzle = generatePuzzle({ difficulty, seed, id: `${difficulty}-seed-${seed}` })
    if (!verify(puzzle)) allOk = false
  }
}

if (!allOk) {
  console.log('\nSome puzzles did not verify as UNIQUE ✔')
  process.exit(1)
}
console.log('\nAll fixed-seed puzzles verified UNIQUE ✔')
