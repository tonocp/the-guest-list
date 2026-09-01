import type { ClueRule, FurnitureType } from '../../types/puzzle'
import type { ThemeRoom } from './roomThemes'

// All indefinite ("un"/"una") so "pegado a {phrase}" never needs the "a el" → "al"
// contraction. Only used by the `near-furniture` clue (which `selectClues` never picks
// for generated puzzles today — a `room` fact always outranks it — but the rule type is
// fully plumbed for the room-variety follow-up; see procedural-generator.md).
// `on-furniture` has its own wording per type in `onFurnitureText`.
export const FURNITURE_PHRASE: Record<FurnitureType, string> = {
  plant: 'una planta',
  rug: 'una alfombra',
  chair: 'una silla',
  piano: 'un piano de cola',
  sofa: 'un sofá',
  bed: 'una cama',
  chest: 'un baúl',
  lamp: 'una lámpara',
  table: 'una mesa',
  statue: 'una estatua',
  globe: 'un globo terráqueo',
  vase: 'un jarrón',
  screen: 'un biombo',
}

const DIRECTION_LABEL: Record<'N' | 'S' | 'E' | 'W', string> = {
  N: 'norte',
  S: 'sur',
  E: 'este',
  W: 'oeste',
}

/**
 * Every phrasing must place the suspect *on the furniture's own cell* — never merely
 * beside it, so it can't be misread as `near-furniture` ("pegado a"). For the types
 * that can span more than one cell (`rug`/`sofa`/`bed`/`piano`/`screen`) the phrasing
 * also has to hold for *any* cell of the piece, so nothing implies a specific end
 * (e.g. the piano is "apoyado en", not "tocando", which would mean the keyboard cell).
 */
function onFurnitureText(furniture: FurnitureType, gender: 'f' | 'm'): string {
  const g = (m: string, f: string) => (gender === 'f' ? f : m)
  const sentado = g('sentado', 'sentada')
  switch (furniture) {
    case 'chair':
      return `Estaba ${sentado} en una silla.`
    case 'sofa':
      return `Estaba ${sentado} en el sofá.`
    case 'chest':
      return `Estaba ${sentado} sobre un baúl.`
    case 'table':
      return `Estaba ${sentado} a una mesa.`
    case 'bed':
      return `Estaba ${g('tumbado', 'tumbada')} en la cama.`
    case 'rug':
      return 'Estaba de pie sobre una alfombra.'
    case 'lamp':
      return 'Estaba de pie bajo una lámpara.'
    case 'piano':
      return `Estaba ${g('apoyado', 'apoyada')} en un piano de cola.`
    case 'plant':
      return `Estaba ${g('escondido', 'escondida')} tras una planta.`
    case 'screen':
      return `Estaba ${g('oculto', 'oculta')} tras un biombo.`
    case 'statue':
      return 'Tenía la mano sobre una estatua.'
    case 'globe':
      return 'Estaba haciendo girar un globo terráqueo.'
    case 'vase':
      return 'Sostenía un jarrón entre las manos.'
  }
}

export interface ClueTextContext {
  suspectName: (id: string) => string
  roomDisplay: (roomId: string) => ThemeRoom
}

/** `ownerGender` is the gender of the suspect this clue is displayed on (the rule's
 * `suspect` / `subject` / `a`, depending on type) — needed for "sentado"/"sentada". */
export function clueText(rule: ClueRule, ownerGender: 'f' | 'm', ctx: ClueTextContext): string {
  switch (rule.type) {
    case 'room': {
      const room = ctx.roomDisplay(rule.roomId)
      return `Estaba en ${room.article} ${room.name}.`
    }
    case 'on-furniture':
      return onFurnitureText(rule.furniture, ownerGender)
    case 'near-furniture': {
      const phrase = FURNITURE_PHRASE[rule.furniture]
      const pegado = ownerGender === 'f' ? 'pegada' : 'pegado'
      return rule.negate ? `No estaba ${pegado} a ${phrase}.` : `Estaba ${pegado} a ${phrase}.`
    }
    case 'direction':
      return `Estaba al ${DIRECTION_LABEL[rule.dir]} de ${ctx.suspectName(rule.reference)}.`
    case 'adjacent':
      return `Estaba junto a ${ctx.suspectName(rule.b)}.`
  }
}
