import type { Puzzle } from '../../types/puzzle'

const rooms = [
  { id: 'A', name: 'Sala de Disfraces' },
  { id: 'B', name: 'Bar de Cócteles' },
  { id: 'C', name: 'Terraza' },
  { id: 'D', name: 'Pista de Baile' },
  { id: 'E', name: 'Guardarropa' },
]

// 5x5 room layout (two rows split A/B, two rows split C/D, last row all E)
const roomGrid = [
  ['A', 'A', 'A', 'B', 'B'],
  ['A', 'A', 'B', 'B', 'B'],
  ['C', 'C', 'C', 'D', 'D'],
  ['C', 'C', 'D', 'D', 'D'],
  ['E', 'E', 'E', 'E', 'E'],
]

const furniture: Record<string, 'sofa' | 'rug' | 'chair' | 'plant' | 'window'> = {
  '0-0': 'sofa',
  '2-2': 'rug',
  '3-3': 'chair',
  '0-3': 'plant',
  '1-4': 'window',
}

const cells = roomGrid.flatMap((row, r) =>
  row.map((roomId, c) => ({
    row: r,
    col: c,
    roomId,
    furniture: furniture[`${r}-${c}`],
  })),
)

export const fiestaDisfraces: Puzzle = {
  id: 'fiesta-disfraces',
  title: 'La Fiesta de Disfraces',
  size: 5,
  difficulty: 'muy-facil',
  rooms,
  cells,
  suspects: [
    {
      id: 'nora',
      name: 'Nora',
      gender: 'f',
      clue: 'Estaba sentada en el sofá.',
    },
    {
      id: 'delia',
      name: 'Delia',
      gender: 'f',
      clue: 'La víctima. Estaba en la Sala de Disfraces.',
      isVictim: true,
    },
    {
      id: 'priya',
      name: 'Priya',
      gender: 'f',
      clue: 'Estaba sobre una alfombra.',
    },
    {
      id: 'marcus',
      name: 'Marcus',
      gender: 'm',
      clue: 'Estaba sentado en una silla.',
    },
    {
      id: 'teo',
      name: 'Teo',
      gender: 'm',
      clue: 'Estaba al sur de Marcus.',
    },
  ],
  solution: {
    nora: { row: 0, col: 0 },
    delia: { row: 1, col: 1 },
    priya: { row: 2, col: 2 },
    marcus: { row: 3, col: 3 },
    teo: { row: 4, col: 4 },
  },
  rules: [
    { type: 'on-furniture', suspect: 'nora', furniture: 'sofa' },
    { type: 'room', suspect: 'delia', roomId: 'A' },
    { type: 'on-furniture', suspect: 'priya', furniture: 'rug' },
    { type: 'on-furniture', suspect: 'marcus', furniture: 'chair' },
    { type: 'direction', subject: 'teo', dir: 'S', reference: 'marcus' },
  ],
}
