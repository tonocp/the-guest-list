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
- **Fichas de sospechoso**: un único sprite base tintado por CSS
  `filter: hue-rotate(...)` según el sospechoso (`src/lib/suspectTint.ts`). La víctima
  usa un sprite propio, para que sea visualmente inconfundible.
- **Salas**: color plano (paleta de pastel cíclica) más textura de dither, sin sprite
  propio. Los bordes entre salas distintas se dibujan más gruesos que los internos,
  para que la forma irregular de cada sala se lea con claridad.
