import { describe, expect, it } from 'vitest'
import type { FurnitureType } from '../../types/puzzle'
import { clueText, FURNITURE_PHRASE, type ClueTextContext } from './clueText'

const FURNITURE_TYPES = Object.keys(FURNITURE_PHRASE) as FurnitureType[]

const ctx: ClueTextContext = {
  suspectName: (id) => id,
  roomDisplay: () => ({ name: 'Sala', article: 'la' }),
}

/** Guardrail: `on-furniture` text must never read as proximity ("junto a"/"pegado a"). */
describe('on-furniture clue text', () => {
  const PROXIMITY_WORDING = /junto a|pegad[oa] a|al lado|cerca de|a un paso/i

  it.each(FURNITURE_TYPES)('does not read as mere proximity for %s', (furniture) => {
    for (const gender of ['f', 'm'] as const) {
      const text = clueText({ type: 'on-furniture', suspect: 's', furniture }, gender, ctx)
      expect(text).not.toMatch(PROXIMITY_WORDING)
    }
  })
})

describe('near-furniture clue text', () => {
  it.each(FURNITURE_TYPES)('uses "pegado a" and negates cleanly for %s', (furniture) => {
    const positive = clueText({ type: 'near-furniture', suspect: 's', furniture }, 'm', ctx)
    const negative = clueText({ type: 'near-furniture', suspect: 's', furniture, negate: true }, 'm', ctx)
    expect(positive).toMatch(/^Estaba pegado a /)
    expect(negative).toMatch(/^No estaba pegado a /)
  })

  it('agrees the owner gender', () => {
    expect(clueText({ type: 'near-furniture', suspect: 's', furniture: 'vase' }, 'f', ctx)).toBe(
      'Estaba pegada a un jarrón.',
    )
  })
})
