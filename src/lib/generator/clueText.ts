import type { ClueRule, FurnitureType } from '../../types/puzzle'
import type { ThemeRoom } from './roomThemes'

const FURNITURE_PHRASE: Record<FurnitureType, string> = {
  plant: 'una planta',
  rug: 'una alfombra',
  chair: 'una silla',
  bookshelf: 'una estantería',
  sofa: 'el sofá',
  window: 'la ventana',
  painting: 'un cuadro',
  lamp: 'una lámpara',
  table: 'una mesa',
  mirror: 'un espejo',
  clock: 'un reloj',
  vase: 'un jarrón',
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
    case 'bookshelf':
      return 'Estaba justo al lado de la estantería.'
    case 'plant':
      return 'Estaba junto a una planta.'
    case 'window':
      return 'Estaba junto a la ventana.'
    case 'painting':
      return 'Estaba contemplando un cuadro.'
    case 'lamp':
      return 'Tenía una lámpara justo a su lado.'
    case 'table':
      return 'Estaba de pie junto a una mesa.'
    case 'mirror':
      return 'Estaba frente a un espejo.'
    case 'clock':
      return 'Estaba justo debajo de un reloj.'
    case 'vase':
      return 'Estaba junto a un jarrón.'
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
