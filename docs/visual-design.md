# Diseño visual: sprites pixel-art generados por código

## Por qué no un pack de assets de terceros

Se consideró usar un pack gratuito de sprites top-down (p.ej. Kenney.nl, CC0) en vez
de generar arte propio. Se decidió generar arte original por código en su lugar:

- Evita cualquier duda de licencia al empaquetar assets dentro de una PWA offline.
- Evita el paso de "descargar un archivo de una fuente externa", que bajo las reglas
  de este asistente requiere permiso explícito del usuario cada vez.
- Da control total sobre el estilo exacto y el set de mobiliario, que cambia según
  las necesidades del generador procedural (ver `procedural-generator.md` — el set
  de mobiliario creció de 8 a 12 tipos a mitad de desarrollo, por necesidad del
  generador, no por estética).

## Cómo funciona

`scripts/gen-sprites.mjs` construye cada sprite como una cuadrícula de píxeles 16×16
(un array de arrays, con helpers `rect`, `circle`, `outline` para dibujar formas
simples con un contorno oscuro de 1px), lo convierte a un buffer de píxeles RGBA
crudo, y usa `sharp` para escalarlo x8 (a 128×128) con interpolación `nearest`
(mantiene los bordes duros, sin difuminado) antes de guardarlo como PNG en
`public/sprites/`.

En la app, cada `<img>` de sprite lleva `image-rendering: pixelated` en CSS para que
el navegador tampoco difumine al escalar al tamaño final de celda.

## Paleta y piezas

- **Mobiliario** (12 tipos, ver `src/types/puzzle.ts` → `FurnitureType`): plant, rug,
  chair, bookshelf, sofa, window, painting, lamp, table, mirror, clock, vase. Cada uno
  tiene su propia función generadora en `gen-sprites.mjs` y su propia entrada en
  `src/lib/furnitureIcons.ts` (mapa tipo → ruta) y en
  `src/lib/generator/clueText.ts` (frase + plantilla de pista en español).
- **Suelo**: textura de dither sutil (`floor-dither.png`, 8×8, puntos oscuros a ~10%
  de opacidad) superpuesta sobre el color plano de cada sala — da textura sin tapar
  la legibilidad del color de sala (importante para jugar).
- **Fichas de sospechoso**: un único sprite base (`token.png`) en azul-violeta
  saturado, tintado por CSS `filter: hue-rotate(...)` según el sospechoso — ver
  `src/lib/suspectTint.ts` para el hash determinista id→matiz. La víctima usa un
  sprite distinto (`token-victim.png`, tonos pálidos + una marca roja) en vez de
  tinte, para que sea visualmente inconfundible.

## Salas: color plano, no sprite

A diferencia del mobiliario, las salas no tienen sprite propio — son un color plano
(paleta fija de ~6 colores pastel, repetida cíclicamente si hay más salas que
colores) más la textura de dither. Los bordes entre salas distintas se dibujan más
gruesos (color "muro", `#3d3428`) que los bordes internos de una misma sala, para que
la forma irregular de cada sala se lea con claridad.

## Bug de layout ya corregido (por si reaparece)

El tablero usaba `aspect-square` en cada celda individualmente, con filas implícitas
de CSS Grid — esto causaba costuras/huecos visibles entre celdas, porque cada celda
calculaba su propio alto a partir de su propio ancho, y el redondeo de subpíxeles no
coincidía entre celdas vecinas. La corrección (`BoardGrid.vue`) fue mover
`aspect-ratio: 1` al **contenedor** del grid, con `grid-template-rows` explícito —
así todas las filas se reparten exactamente iguales, sin redondeo independiente por
celda. Si alguna vez vuelve a aparecer un hueco entre celdas, empezar por ahí.
