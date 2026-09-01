import type { Cell, ClueRule } from '../../types/puzzle'
import { hasUniqueSolution } from '../solver'
import { type RNG, pick, shuffle } from '../rng'
import type { CandidateFact } from './clueFacts'

/** Higher is stronger. `direction`/`adjacent` are excluded (−1, never selected) — see
 * procedural-generator.md. */
function strength(fact: CandidateFact): number {
  switch (fact.rule.type) {
    case 'on-furniture':
      return 4
    case 'room':
      return 3
    case 'near-furniture':
      return fact.rule.negate ? 1 : 2
    default:
      return -1
  }
}

/** Gives every suspect their strongest available fact, confirms the set is unique, then
 * minimizes it. Returns null if the maximal set isn't unique — the caller should retry
 * with a fresh draw. */
export function selectClues(
  size: number,
  suspectIds: string[],
  cells: Cell[],
  facts: CandidateFact[],
  rng: RNG,
): ClueRule[] | null {
  const factsByOwner = new Map<string, CandidateFact[]>()
  for (const fact of facts) {
    if (strength(fact) < 0) continue
    if (!factsByOwner.has(fact.owner)) factsByOwner.set(fact.owner, [])
    factsByOwner.get(fact.owner)!.push(fact)
  }

  const selected: ClueRule[] = []
  for (const owner of shuffle(rng, [...factsByOwner.keys()])) {
    const candidates = factsByOwner.get(owner)!
    const maxStrength = Math.max(...candidates.map(strength))
    const best = pick(
      rng,
      candidates.filter((f) => strength(f) === maxStrength),
    )
    selected.push(best.rule)
  }

  const buildInput = (rules: ClueRule[]) => ({ size, suspectIds, cells, rules })
  if (!hasUniqueSolution(buildInput(selected))) return null

  let changed = true
  while (changed) {
    changed = false
    for (const rule of shuffle(rng, selected)) {
      const withoutIt = selected.filter((r) => r !== rule)
      if (hasUniqueSolution(buildInput(withoutIt))) {
        selected.splice(selected.indexOf(rule), 1)
        changed = true
      }
    }
  }

  return selected
}
