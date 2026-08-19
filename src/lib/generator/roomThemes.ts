export interface ThemeRoom {
  name: string
  article: 'el' | 'la'
}

export interface RoomTheme {
  id: string
  /** Short phrase used to build the puzzle title, e.g. "Caso en la fiesta". */
  label: string
  rooms: ThemeRoom[]
}

/** Each theme has enough room names to cover the biggest puzzle (12x12, "experto"). */
export const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'fiesta',
    label: 'la fiesta',
    rooms: [
      { name: 'Sala de Disfraces', article: 'la' },
      { name: 'Bar de Cócteles', article: 'el' },
      { name: 'Terraza', article: 'la' },
      { name: 'Pista de Baile', article: 'la' },
      { name: 'Guardarropa', article: 'el' },
      { name: 'Photobooth', article: 'el' },
      { name: 'Buffet', article: 'el' },
      { name: 'Jardín', article: 'el' },
      { name: 'Recepción', article: 'la' },
      { name: 'Balcón', article: 'el' },
      { name: 'Sala de Juegos', article: 'la' },
      { name: 'Cocina', article: 'la' },
    ],
  },
  {
    id: 'oficina',
    label: 'la oficina',
    rooms: [
      { name: 'Sala de Reuniones', article: 'la' },
      { name: 'Recepción', article: 'la' },
      { name: 'Sala de Descanso', article: 'la' },
      { name: 'Archivo', article: 'el' },
      { name: 'Despacho del Jefe', article: 'el' },
      { name: 'Almacén', article: 'el' },
      { name: 'Cocina', article: 'la' },
      { name: 'Sala de Servidores', article: 'la' },
      { name: 'Terraza', article: 'la' },
      { name: 'Vestíbulo', article: 'el' },
      { name: 'Sala de Fotocopias', article: 'la' },
      { name: 'Aparcamiento', article: 'el' },
    ],
  },
  {
    id: 'boda',
    label: 'la boda',
    rooms: [
      { name: 'Altar', article: 'el' },
      { name: 'Salón de Banquetes', article: 'el' },
      { name: 'Jardín de Ceremonias', article: 'el' },
      { name: 'Barra Libre', article: 'la' },
      { name: 'Pista de Baile', article: 'la' },
      { name: 'Guardarropa', article: 'el' },
      { name: 'Cocina', article: 'la' },
      { name: 'Capilla', article: 'la' },
      { name: 'Terraza', article: 'la' },
      { name: 'Sala de Regalos', article: 'la' },
      { name: 'Photobooth', article: 'el' },
      { name: 'Aparcamiento', article: 'el' },
    ],
  },
  {
    id: 'museo',
    label: 'el museo',
    rooms: [
      { name: 'Sala Egipcia', article: 'la' },
      { name: 'Sala de Arte Moderno', article: 'la' },
      { name: 'Vestíbulo', article: 'el' },
      { name: 'Cafetería', article: 'la' },
      { name: 'Tienda de Regalos', article: 'la' },
      { name: 'Sala de Restauración', article: 'la' },
      { name: 'Biblioteca', article: 'la' },
      { name: 'Auditorio', article: 'el' },
      { name: 'Jardín de Esculturas', article: 'el' },
      { name: 'Almacén', article: 'el' },
      { name: 'Oficina de Seguridad', article: 'la' },
      { name: 'Terraza', article: 'la' },
    ],
  },
]
