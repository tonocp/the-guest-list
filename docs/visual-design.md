# Diseño visual: sprites pixel-art generados por código

Todo el arte es original y generado por código (`scripts/gen-sprites.mjs`), no un pack
de terceros: sin dudas de licencia en una PWA offline y control total del estilo.

## Cómo funciona

Cada sprite se construye como una cuadrícula de píxeles, se pasa a buffer RGBA y `sharp`
lo escala con interpolación `nearest` (bordes duros) a PNG en `public/sprites/`. En la
app, cada `<img>` lleva `image-rendering: pixelated`.

Lienzo base 16×16 por celda (múltiplos de 16 para piezas multi-celda), escala ×8
(`SCALE`). Sombreado plano: `bevel()` (luz desde arriba-izquierda en **todas** las
piezas) y `clipCorners()` (recorte diagonal de 1px). Se probó el doble de resolución
(32×32, esquinas redondeadas, dithering, sombra proyectada) y se revirtió — retomarlo
sería una decisión nueva, no una continuación.

## Mobiliario (13 tipos)

`FurnitureType` en `src/types/puzzle.ts`. Cada tipo tiene función generadora en
`gen-sprites.mjs`, entrada en `furnitureIcons.ts` y frase de pista en `clueText.ts`.

- **Los 13 son objetos que se leen bien en cenital.** Regla dura: se descartaron
  `window`/`painting`/`mirror`/`clock`/`bookshelf`/`coatrack` porque su cara
  reconocible es vertical (invisible desde arriba) o no tienen huella en el suelo.
  Cambiar la perspectiva de una sola pieza rompe la consistencia; cambiarla en todo el
  juego era un rediseño mayor que el problema. Al añadir un tipo, verifica que su
  silueta cenital por sí sola lo identifica.
- **Todo mueble se renderiza al 100% de su celda** en `BoardGrid.vue` (`w-full
  h-full`), de una o varias celdas. El margen al borde lo aporta el propio sprite:
  cada función deja `FURNITURE_MARGIN` px de hueco en su lienzo. No hay mecanismo que
  lo fuerce — al añadir un tipo, deja ese margen a mano.
- Los 13 iconos de 1 celda pasan por `center()` antes de `outline()` (centra el
  bounding box real dibujado). No se aplica a piezas multi-celda ni a la L: ahí el
  contenido debe llenar/conectar todo el footprint.

## Mobiliario multi-celda (`rug`, `bed`, `piano`, `sofa`, `screen`)

Cómo crece el footprint: [`procedural-generator.md`](./procedural-generator.md).

- **Cada pieza (salvo `screen`) es un único bitmap** que abarca varias celdas vía
  `gridColumn`/`gridRow`, no un icono por celda. Se intentó lo segundo (tiles rotados
  por CSS) y falla por dos motivos irreparables: (1) el borde de cada celda del grid
  corta visualmente la pieza aunque el sprite sea continuo; (2) un diseño con un lado
  privilegiado se rompe al rotar 180°, que también voltea arriba↔abajo. Los bitmaps
  rectos se dibujan en `rugMotif`/`bedMotif`/`pianoMotif`/`sofaMotif`; la L del sofá
  en `sofaLMotif()`.
- **Las 4 orientaciones de la L son 4 bitmaps**, no rotación CSS: `sofaLMotif()` dibuja
  la canónica con respaldo asimétrico (lo que rompía con `rotate`), y `rotate90CW()`
  genera las otras 3 como datos de píxel. `pieceShape()` + `FurniturePiece.missingCorner`
  eligen el fichero. `piano` usa la misma técnica para sus variantes.
- **`screen` puede llegar a 3 celdas en línea recta, no en L**: `PieceShape` incluye
  `'h3'`/`'v3'`; `furniturePieces()` solo calcula `missingCorner` si el bounding box
  es 2×2.
- **`screen` es la única multi-celda que NO es un bitmap continuo**: un biombo real son
  paneles separados por bisagras, así que el hueco visible es fiel. Cada panel es un
  trazo diagonal grueso (`thickLine()`) que alterna dirección para formar un zigzag
  continuo; punto `SCREEN_ACCENT` en cada bisagra.
- **`bed`/`piano` nunca caen a 1 celda** (sí lo hacen `rug`/`sofa`/`screen`): a 1 celda
  no se leen como tales, así que se descartan del caso. `bed-solo.png`/`piano-solo.png`
  existen solo por completitud de `FurnitureType`. Ver `assignMustGrow` y
  [`for-agents.md`](./for-agents.md) "Trampas conocidas" (incluye la regresión ya
  sufrida al pasar de un tipo must-grow a dos).

## Trampas de render (si tocas `BoardGrid.vue`)

- **CSS Grid**: como las piezas multi-celda usan `gridColumn`/`gridRow` explícitos,
  las N² casillas normales *también* necesitan posición explícita. En auto-flow, Grid
  reserva primero las celdas explícitas y empuja algunas casillas a una fila implícita
  → los clics dejan de registrar en las celdas desplazadas.
- **Una pieza multi-celda nunca se oculta** por un sospechoso encima:
  `multiCellFurniturePlacements()` ni recibe `Placements`. La capa de sospechosos se
  dibuja *encima* con `pointer-events: none`.

## Fichas de sospechoso

Cara pixel-art propia, no token de color. `gen-sprites.mjs` genera 4 tonos de piel × 5
colores de pelo × corto/largo (40 sprites). `suspectFace.ts` elige tono y color por
hash determinista de `suspectId` (dos hashes con sal distinta), estilo de pelo según
`gender`. No atado al nombre — el mismo nombre puede salir con otra cara en otro caso.
La víctima usa una cara fija (`face-victim.png`), reconocible sin hash. En el tablero,
insignia con la inicial superpuesta como refuerzo a tamaño pequeño.

## Salas y suelo

Salas: color plano (paleta pastel cíclica) + textura de dither, sin sprite. Bordes
entre salas distintas más gruesos que los internos.

## `/furni`

Ruta de depuración (`router/index.ts`, no enlazada desde la UI): muestra cada sprite
de mobiliario y cara que un caso generado puede producir, al tamaño real de
`BoardGrid.vue`. Borrar junto con su ruta cuando el arte esté asentado.
