import { describe, expect, it } from 'vitest'
import type { FurnitureType } from '../../types/puzzle'
import { clueText, type ClueTextContext } from './clueText'

const FURNITURE_TYPES: FurnitureType[] = [
  'plant',
  'rug',
  'chair',
  'piano',
  'sofa',
  'bed',
  'chest',
  'lamp',
  'table',
  'statue',
  'globe',
  'vase',
  'screen',
]

const ctx: ClueTextContext = {
  suspectName: (id) => id,
  roomDisplay: () => ({ name: 'Sala', article: 'la' }),
}

/**
 * Guardrail: `on-furniture` means the suspect stands on the furniture's own cell — the
 * single strongest clue in the game. Its text must never borrow the wording of the
 * weaker proximity clues ("junto a" for people, "pegado a" for furniture), or a player
 * reading it literally would widen a 1-cell fact into a whole neighbourhood.
 */
describe('on-furniture clue text', () => {
  const PROXIMITY_WORDING = /junto a|pegad[oa] a|al lado|cerca de|a un paso/i

  it.each(FURNITURE_TYPES)('does not read as mere proximity for %s', (furniture) => {
    for (const gender of ['f', 'm'] as const) {
      const text = clueText({ type: 'on-furniture', suspect: 's', furniture }, gender, ctx)
      expect(text).not.toMatch(PROXIMITY_WORDING)
    }
  })

  it.each(FURNITURE_TYPES)('is distinct from the near-furniture wording for %s', (furniture) => {
    const on = clueText({ type: 'on-furniture', suspect: 's', furniture }, 'm', ctx)
    const near = clueText({ type: 'near-furniture', suspect: 's', furniture }, 'm', ctx)
    expect(on).not.toBe(near)
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
