import type { Cell, ClueRule } from '../../types/puzzle'
import { hasUniqueSolution } from '../solver'
import { type RNG, pick, shuffle } from '../rng'
import type { CandidateFact } from './clueFacts'

/**
 * Higher is stronger. `direction`/`adjacent` are deliberately excluded (strength -1,
 * never selected): every suspect always has a `room` fact available, which outranks
 * them here, so under a strict "give each suspect their single strongest fact" rule
 * they'd never get picked anyway. This is also what keeps the generator away from the
 * pathological unanchored-`direction`-chain case the solver's node budget exists for —
 * see the generator/solver design notes. Room-only variety (direction/adjacent clues
 * in generated puzzles) is a follow-up, not a v1 requirement.
 */
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

/**
 * Gives every suspect their single strongest available fact (at most one each, since
 * `Suspect.clue` is one string), confirms the *maximal* set is unique, then minimizes
 * by dropping anything redundant. Returns null if even the maximal set isn't unique —
 * the caller should retry with a fresh solution/rooms/furniture draw rather than fight
 * this specific combination further.
 */
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
