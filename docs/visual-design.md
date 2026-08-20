# Diseño visual: sprites pixel-art generados por código

Todo el arte es original, generado por código en vez de usar un pack de assets de
terceros — evita dudas de licencia dentro de una PWA offline y da control total sobre
el estilo y el set de mobiliario.

## Cómo funciona

`scripts/gen-sprites.mjs` construye cada sprite como una cuadrícula de píxeles 16×16,
lo convierte a un buffer de píxeles RGBA crudo, y usa `sharp` para escalarlo x8 con
interpolación `nearest` (bordes duros, sin difuminado) antes de guardarlo como PNG en
`public/sprites/`. En la app, cada `<img>` de sprite lleva
`image-rendering: pixelated` en CSS.

## Paleta y piezas

- **Mobiliario** (12 tipos, ver `FurnitureType` en `src/types/puzzle.ts`): cada uno
  con su propia función generadora, entrada en `furnitureIcons.ts` y frase de pista en
  `clueText.ts`.
- **Suelo**: textura de dither sutil superpuesta sobre el color plano de cada sala.
- **Fichas de sospechoso**: cada sospechoso muestra una cara pixel-art propia, no un
  token de color liso. `gen-sprites.mjs` genera todas las combinaciones de 4 tonos de
  piel × 5 colores de pelo × pelo corto/largo (40 sprites, `face-{piel}-{pelo}-{estilo}.png`);
  `src/lib/suspectFace.ts` elige tono y color por hash determinista de `suspectId` (dos
  hashes con sal distinta, para que no varíen juntos) y el estilo de pelo según
  `Suspect.gender`. No está atado al nombre del personaje — el mismo nombre puede salir
  con una cara distinta en cada caso generado, igual que pasaba antes con el color.
  La víctima siempre usa la misma cara fija (`face-victim.png`: piel pálida, pelo gris,
  ojos cerrados), para que sea reconocible al instante sin depender del hash.
  En el tablero (`BoardGrid.vue`), la ficha lleva además una insignia con la inicial
  del nombre superpuesta — refuerzo de legibilidad a tamaño de celda pequeño (12×12 en
  móvil), no reemplaza a la cara.
- **Salas**: color plano (paleta de pastel cíclica) más textura de dither, sin sprite
  propio. Los bordes entre salas distintas se dibujan más gruesos que los internos,
  para que la forma irregular de cada sala se lea con claridad.
