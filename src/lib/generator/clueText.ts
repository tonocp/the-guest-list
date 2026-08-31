import type { ClueRule, FurnitureType } from '../../types/puzzle'
import type { ThemeRoom } from './roomThemes'

const FURNITURE_PHRASE: Record<FurnitureType, string> = {
  plant: 'una planta',
  rug: 'una alfombra',
  chair: 'una silla',
  piano: 'un piano de cola',
  sofa: 'el sofá',
  bed: 'la cama',
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

function onFurnitureText(furniture: FurnitureType, gender: 'f' | 'm'): string {
  const sentado = gender === 'f' ? 'sentada' : 'sentado'
  switch (furniture) {
    case 'chair':
      return `Estaba ${sentado} en una silla.`
    case 'sofa':
      return `Estaba ${sentado} en el sofá.`
    case 'rug':
      return 'Estaba de pie sobre una alfombra.'
    case 'piano':
      return 'Estaba de pie junto a un piano de cola.'
    case 'plant':
      return 'Estaba junto a una planta.'
    case 'bed':
      return `Estaba ${gender === 'f' ? 'tumbada' : 'tumbado'} en la cama.`
    case 'chest':
      return `Estaba ${sentado} sobre un baúl.`
    case 'lamp':
      return 'Tenía una lámpara justo a su lado.'
    case 'table':
      return 'Estaba de pie junto a una mesa.'
    case 'statue':
      return 'Estaba contemplando una estatua.'
    case 'globe':
      return 'Estaba observando un globo terráqueo.'
    case 'vase':
      return 'Estaba junto a un jarrón.'
    case 'screen':
      return 'Estaba justo al lado de un biombo.'
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
      return rule.negate ? `No estaba junto a ${phrase}.` : `Estaba junto a ${phrase}.`
    }
    case 'direction':
      return `Estaba al ${DIRECTION_LABEL[rule.dir]} de ${ctx.suspectName(rule.reference)}.`
    case 'adjacent':
      return `Estaba junto a ${ctx.suspectName(rule.b)}.`
  }
}
