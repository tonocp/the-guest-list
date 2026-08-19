import { puzzles } from '../src/data/puzzles'
import type { Puzzle } from '../src/types/puzzle'
import { countSolutions } from '../src/lib/solver'

function verify(puzzle: Puzzle) {
  const result = countSolutions(
    { size: puzzle.size, suspectIds: puzzle.suspects.map((s) => s.id), cells: puzzle.cells, rules: puzzle.rules },
    2,
  )

  const matchesAuthored =
    result.count === 1 &&
    puzzle.suspects.every((s) => {
      const solved = result.solutions[0][s.id]
      const authored = puzzle.solution[s.id]
      return solved.row === authored.row && solved.col === authored.col
    })

  const status = result.truncated
    ? 'INCONCLUSIVE (node budget exhausted) ✘'
    : result.count === 1 && matchesAuthored
      ? 'UNIQUE ✔'
      : 'AMBIGUOUS/INVALID ✘'

  console.log(`\n${puzzle.title} (${puzzle.id}, ${puzzle.size}x${puzzle.size})`)
  console.log(`  solutions found (capped at 2): ${result.count}`)
  console.log(`  matches authored solution: ${matchesAuthored}`)
  console.log(`  status: ${status}`)

  if (status !== 'UNIQUE ✔') {
    console.log('  solutions:', JSON.stringify(result.solutions, null, 2))
  }
}

for (const puzzle of puzzles) {
  verify(puzzle)
}
