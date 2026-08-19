import { generatePuzzle } from '../src/lib/generator/generatePuzzle'
import type { Difficulty } from '../src/types/puzzle'

const DIFFICULTIES: Difficulty[] = ['muy-facil', 'facil', 'medio', 'dificil', 'experto']

for (const difficulty of DIFFICULTIES) {
  let maxMs = 0
  let totalMs = 0
  const N = 30
  for (let seed = 0; seed < N; seed++) {
    const start = performance.now()
    generatePuzzle({ difficulty, seed })
    const elapsed = performance.now() - start
    maxMs = Math.max(maxMs, elapsed)
    totalMs += elapsed
  }
  console.log(`${difficulty}: ${N}/${N} succeeded, avg=${(totalMs / N).toFixed(1)}ms max=${maxMs.toFixed(1)}ms`)
}
