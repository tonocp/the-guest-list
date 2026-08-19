import type { Puzzle } from '../../types/puzzle'

const rooms = [
  { id: 'A', name: 'Recepción' },
  { id: 'B', name: 'Sala Principal' },
  { id: 'C', name: 'Vestuarios' },
  { id: 'D', name: 'Sala de Meditación' },
  { id: 'E', name: 'Almacén' },
  { id: 'F', name: 'Terraza Trasera' },
]

// 6x6 room layout: three bands of two rows, each split into two 2x3 blocks
const roomGrid = [
  ['A', 'A', 'A', 'B', 'B', 'B'],
  ['A', 'A', 'A', 'B', 'B', 'B'],
  ['C', 'C', 'C', 'D', 'D', 'D'],
  ['C', 'C', 'C', 'D', 'D', 'D'],
  ['E', 'E', 'E', 'F', 'F', 'F'],
  ['E', 'E', 'E', 'F', 'F', 'F'],
]

const furniture: Record<string, 'sofa' | 'chair' | 'rug' | 'lamp' | 'window'> = {
  '0-0': 'sofa',
  '1-3': 'chair',
  '2-4': 'rug',
  '3-5': 'lamp',
  '5-2': 'window',
}

const cells = roomGrid.flatMap((row, r) =>
  row.map((roomId, c) => ({
    row: r,
    col: c,
    roomId,
    furniture: furniture[`${r}-${c}`],
  })),
)

export const estudioYoga: Puzzle = {
  id: 'estudio-yoga',
  title: 'El Estudio de Yoga',
  size: 6,
  difficulty: 'facil',
  rooms,
  cells,
  suspects: [
    {
      id: 'astrid',
      name: 'Astrid',
      gender: 'f',
      clue: 'Estaba sentada en el sofá.',
    },
    {
      id: 'bruno',
      name: 'Bruno',
      gender: 'm',
      clue: 'Estaba sentado en una silla.',
    },
    {
      id: 'celia',
      name: 'Celia',
      gender: 'f',
      clue: 'Estaba sobre una esterilla de yoga.',
    },
    {
      id: 'dario',
      name: 'Darío',
      gender: 'm',
      clue: 'Tenía una lámpara junto a él.',
    },
    {
      id: 'elena',
      name: 'Elena',
      gender: 'f',
      clue: 'La víctima. Estaba a solas con el asesino.',
      isVictim: true,
    },
    {
      id: 'fabio',
      name: 'Fabio',
      gender: 'm',
      clue: 'Estaba junto a la ventana.',
    },
  ],
  solution: {
    astrid: { row: 0, col: 0 },
    bruno: { row: 1, col: 3 },
    celia: { row: 2, col: 4 },
    dario: { row: 3, col: 5 },
    elena: { row: 4, col: 1 },
    fabio: { row: 5, col: 2 },
  },
  rules: [
    { type: 'on-furniture', suspect: 'astrid', furniture: 'sofa' },
    { type: 'on-furniture', suspect: 'bruno', furniture: 'chair' },
    { type: 'on-furniture', suspect: 'celia', furniture: 'rug' },
    { type: 'on-furniture', suspect: 'dario', furniture: 'lamp' },
    { type: 'on-furniture', suspect: 'fabio', furniture: 'window' },
  ],
}
