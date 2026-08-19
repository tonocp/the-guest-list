import type { FurnitureType } from '../../types/puzzle'
import { type RNG, shuffle } from '../rng'

const FURNITURE_TYPES: FurnitureType[] = [
  'plant',
  'rug',
  'chair',
  'bookshelf',
  'sofa',
  'window',
  'painting',
  'lamp',
  'table',
  'mirror',
  'clock',
  'vase',
]

/** Gives up to one unique furniture item per non-victim suspect, at their own solution
 * cell. 12 types exist — enough to cover every non-victim suspect even at "experto"
 * (12x12, 11 non-victim suspects); the margin exists because a `room` fact alone was
 * measured to be unreliable at fully pinning the couple of suspects furniture doesn't
 * reach (see the generator design notes on why unary facts are preferred over chains
 * of `direction`/`adjacent`). */
export function assignFurniture(nonVictimSuspectIds: string[], rng: RNG): Map<string, FurnitureType> {
  const count = Math.min(FURNITURE_TYPES.length, nonVictimSuspectIds.length)
  const chosenSuspects = shuffle(rng, nonVictimSuspectIds).slice(0, count)
  const chosenTypes = shuffle(rng, FURNITURE_TYPES).slice(0, count)

  const map = new Map<string, FurnitureType>()
  chosenSuspects.forEach((id, i) => map.set(id, chosenTypes[i]))
  return map
}
