import type { ClueRule, FurnitureType } from '../../types/puzzle'
import type { ThemeRoom } from './roomThemes'

/** For the `near-furniture` clue only. All indefinite so "pegado a {phrase}" never
 * needs the "a el" → "al" contraction. */
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

/** Phrasing must read as *on* the cell (guarded by clueText.test.ts), and hold for any
 * cell of a multi-cell piece. */
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

/** `ownerGender` is the gender of the suspect the clue is shown on — needed for
 * "sentado"/"sentada". */
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
