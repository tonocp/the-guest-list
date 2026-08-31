# Diseño visual: sprites pixel-art generados por código

Todo el arte es original, generado por código en vez de usar un pack de assets de
terceros — evita dudas de licencia dentro de una PWA offline y da control total sobre
el estilo y el set de mobiliario.

## Cómo funciona

`scripts/gen-sprites.mjs` construye cada sprite como una cuadrícula de píxeles, lo
convierte a un buffer de píxeles RGBA crudo, y usa `sharp` para escalarlo con
interpolación `nearest` (bordes duros, sin difuminado) antes de guardarlo como PNG en
`public/sprites/`. En la app, cada `<img>` de sprite lleva `image-rendering: pixelated`
en CSS.

Todo se dibuja en un lienzo de 16×16 por celda (múltiplos de 16 — 32×16, 16×32, 32×32 —
para piezas de mobiliario multi-celda) y se escala x8 (`SCALE`), sin difuminar. El
sombreado es deliberadamente plano y simple: `bevel()` (relleno + un seam claro
arriba/izquierda y oscuro abajo/derecha, luz desde la esquina superior izquierda en
todas las piezas) y `clipCorners()` (recorte de 1 píxel en diagonal en vez de esquinas
rectas). Se probó una pasada con el doble de resolución (32×32/`SCALE=4`, con esquinas
realmente redondeadas, degradados por dithering y sombra proyectada) y se revirtió — no
convenció como dirección visual — así que si se retoma en el futuro, es una decisión
nueva, no una continuación de aquel intento.

## Paleta y piezas

- **Mobiliario** (12 tipos, ver `FurnitureType` en `src/types/puzzle.ts`): cada uno
  con su propia función generadora, entrada en `furnitureIcons.ts` y frase de pista en
  `clueText.ts`. El sombreado sigue un modelo consistente en todas las piezas — luz
  desde arriba-izquierda (`bevel()` en `gen-sprites.mjs`: seam claro en los bordes
  superior/izquierdo, oscuro en inferior/derecho) — y la mayoría de siluetas usan
  esquinas recortadas (`clipCorners()`) en vez de ángulos rectos puros.
  **Todo mueble, de una celda o multi-celda, se renderiza al 100% de su celda en
  `BoardGrid.vue`** (`w-full h-full`) — no hay un tamaño reducido especial para el
  mobiliario de una celda. El margen visible respecto al borde de la celda viene
  siempre del propio sprite: cada función generadora deja `FURNITURE_MARGIN` píxeles
  de hueco dentro de su lienzo de 16×16 (bookshelf ya lo hacía así desde el principio;
  plant/lamp/table/vase/chair y los 4 tipos añadidos después se ajustaron a ese mismo
  margen). Antes el mobiliario de una celda se escalaba al 70% por CSS (dando un margen
  "gratis" que no tenía nada que ver con lo dibujado) mientras que las piezas
  multi-celda iban al 100% — por eso, aunque ambas usaran el mismo `FURNITURE_MARGIN`
  en píxeles, el margen visible no coincidía. Si se añade un tipo de mueble nuevo, hay
  que dejarle ese mismo margen a mano — no hay ningún mecanismo que lo fuerce
  automáticamente.
  Los 12 iconos de una sola celda (incluidos `rug-solo`/`bed-solo`/`sofa-solo`) pasan además por
  `center()` justo antes de `outline()`: calcula la caja delimitadora real de lo
  dibujado y desplaza el contenido para que quede centrada en el lienzo, en vez de
  depender de que las coordenadas a mano ya salgan simétricas (con formas irregulares
  como `vase` o `plant`, un ajuste posterior en un lado sin tocar el otro las descentraba
  con facilidad — ver el historial de `vase()`). No se aplica a las piezas multi-celda
  ni a la L: ahí el contenido está pensado para llenar/conectar todo el footprint,
  hueco del cuadrante vacío de la L incluido, así que centrar el bounding box real
  rompería esa colocación en vez de darle un margen.
  La silla (`chair()`) tiene el mismo lenguaje de zonas de valor que el sofá — ver más
  abajo — en vez del respaldo-que-asoma-por-detrás de las versiones anteriores: banda
  oscura de respaldo con 2 tablillas claras de detalle, asiento con tapizado resaltado,
  y 4 patas que asoman por las esquinas un poco más allá del propio margen (mismo
  convenio que los brazos del sofá).
  **Los 12 tipos son deliberadamente objetos que se leen bien en cenital.** Los
  originales `window`/`painting`/`mirror`/`clock` eran objetos de pared vistos de
  frente (una ventana, un cuadro colgado, un espejo, un reloj de pared) — desde
  directamente arriba no tienen huella en el suelo, así que rompían la convención que
  sí cumple el resto del mobiliario (silla, mesa, sofá, planta...). Se sustituyeron por
  `bed` (cama — almohada grande y clara como forma dominante, cabecero fino para no
  competirle protagonismo, edredón con una sola arruga suave; ver más abajo por qué es
  multi-celda), `chest` (baúl — tapa
  abombada, una única correa metálica cerca del frente con candado, refuerzos en las
  esquinas; una cruz de dos bandas se probó primero y se leía como ventana/tablero, no
  como baúl), `globe` (globo terráqueo — esfera con continentes y el pie del soporte
  asomando) y `statue` (estatua sobre pedestal — base de piedra con una figura clara
  encima, cabeza y hombros como dos círculos superpuestos; sustituyó a un `coatrack`
  inicial — un perchero visto en planta apenas tiene huella en el suelo, mismo problema
  de fondo que los 4 originales, así que ningún dibujo de "abrigos alrededor de un
  poste" se leía como percha). Los 12 tipos actuales: `plant`, `rug`, `chair`,
  `bookshelf`, `sofa`, `bed`, `chest`, `lamp`, `table`, `statue`, `globe`, `vase`.
- **Mobiliario multi-celda** (`rug`, `bed`, `sofa` — ver
  [`procedural-generator.md`](./procedural-generator.md) para cómo crece su footprint):
  cada pieza de más de 1 celda se renderiza como **una sola imagen** que ocupa varias
  celdas del grid (`gridColumn`/`gridRow` en `BoardGrid.vue`), no como un icono
  independiente por celda. La primera versión intentó lo segundo — dos tiles de 16×16
  rotados por CSS para que sus bordes "encajaran" — y tenía dos problemas de raíz
  imposibles de parchear del todo: (1) el borde real de cada celda del grid (línea
  divisoria entre celdas de la misma sala) seguía cortando visualmente la pieza aunque
  el propio sprite fuera continuo, y (2) un diseño con un lado privilegiado (p. ej.
  "el respaldo siempre arriba") se rompe al rotar 180° para el extremo opuesto de una
  tirada recta, porque rotar 180° también voltea arriba↔abajo. La pieza deja de
  fusionarse en cuanto cualquiera de las dos falla. Por eso ahora cada pieza multi-celda
  es un único bitmap ensamblado en `gen-sprites.mjs`: `rugMotif`/`bedMotif`/`sofaMotif`
  dibujan directamente en un lienzo del tamaño final para las formas rectas (`rug-pair-h/v`,
  `bed-pair-h/v`, `sofa-pair-h/v`); la pieza en L del sofá no es un rectángulo, así que se ensambla en
  `sofaLMotif()` — no hay ninguna costura de la que depender en ningún caso.
  `furniturePieces()`/`pieceShape()` en `gridLogic.ts` agrupan las celdas de un mismo
  tipo (cada `FurnitureType` aparece como mucho una vez por caso, así que agrupar por
  tipo basta, sin metadato extra en `Puzzle`) y calculan el bounding box. Una pieza que
  se quedó en 1 celda (footprint bloqueado, ver `growRug`/`growSofa`) usa el icono
  normal de una sola celda, igual que cualquier otro mueble — excepto `bed`, que nunca
  se queda en 1 celda: si no encuentra hueco para 2, se descarta del caso en vez de
  aparecer así (ver `assignBed` en `generator/furniture.ts` y `for-agents.md`).
  `bed-solo.png` sigue existiendo por completitud de `FurnitureType`, no porque el
  generador vaya a usarlo.
  **Las 4 orientaciones de la L también son 4 bitmaps distintos, no una rotación CSS**:
  `sofaLMotif()` dibuja solo la orientación canónica (esquina arriba-izda, hueco
  abajo-dcha) con un respaldo genuinamente asimétrico (banda solo en el borde
  superior+izquierdo, brazos en los dos extremos reales) — un diseño así de asimétrico
  es precisamente lo que rompía con `transform: rotate` (ver el problema (2) de arriba).
  `rotate90CW()` rota esa orientación como datos de píxel reales para generar las otras
  3 (`sofa-l-topLeft/topRight/bottomLeft/bottomRight.png`), lo que sí traslada
  cualquier asimetría correctamente. `pieceShape()` + `FurniturePiece.missingCorner`
  le dicen a `BoardGrid.vue` qué de los 4 ficheros usar — sin ningún `rotate()` en
  tiempo de render.
  **`bed` se hizo multi-celda porque una cama real es alargada, no cuadrada** — a 1
  celda, cabecero+almohada+edredón quedaban apretados en una caja 1:1; en 2 celdas el
  edredón simplemente se estira para llenar el largo extra, todo lo demás igual (ver
  `bedMotif()`). No necesita forma en L (una cama en esquina no tiene sentido real, a
  diferencia de un sofá de esquina), así que crece igual que `rug` — con una diferencia
  importante: no hereda la caída a 1 celda de `rug`, porque a 1 celda deja de leerse
  como cama; si no encuentra hueco para 2, se descarta en vez de degradar (ver arriba).
  Su cabecero es un
  tope en un extremo del recorrido, no una banda a lo largo de todo un lado como el
  respaldo de `sofaMotif` — por eso su parámetro de orientación se llama `headEnd`
  (`'top'`/`'left'`) en vez de `backrest`, aunque sigue el mismo convenio de qué
  extremo/lado usa cada pieza (`bedSolo`/`bedPairV` → `'top'`, `bedPairH` → `'left'`).
  Cada pieza multi-celda deja el mismo margen pequeño y constante que el resto del
  mobiliario (`FURNITURE_MARGIN` en `gen-sprites.mjs`, medido en píxeles del lienzo, no
  proporcional al tamaño de la pieza) respecto al borde de su propia celda — para que
  se lea como un mueble flotando sobre el suelo, no como una baldosa que rellena la
  celda de borde a borde. Al ser ya una única pieza sin costura interna, el margen se
  aplica por igual en los 4 lados.
  **Trampa de CSS Grid a tener en cuenta si se toca esto**: como estas piezas usan
  `gridColumn`/`gridRow` explícitos para abarcar varias celdas, las 144 casillas
  normales del tablero (`v-for` en `BoardGrid.vue`) *también* necesitan posición
  explícita — si se dejan en auto-flow, el algoritmo de colocación de Grid reserva
  primero las celdas de los ítems con posición explícita, lo que empuja algunas casillas
  normales a una fila implícita extra y rompe la correspondencia entre casilla visual y
  casilla real (los clics dejan de registrar en las celdas desplazadas).
  Una pieza multi-celda **nunca se oculta** porque haya un sospechoso sobre alguna de
  sus casillas — `multiCellFurniturePlacements()` en `gridLogic.ts` ni siquiera recibe
  `Placements` como parámetro, así que es estructuralmente imposible que su resultado
  dependa de la ocupación. `BoardGrid.vue` dibuja la capa de sospechosos colocados
  *encima* de estos overlays (cada uno en su propia celda del grid, con
  `pointer-events: none` para que el clic siga llegando a la casilla real debajo), en
  vez de sustituir la pieza.
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
  Las 40 combinaciones y la cara de la víctima se pueden repasar todas a la vez en
  `/furni` (sección "Caras de sospechosos", ver más abajo).
- **Salas**: color plano (paleta de pastel cíclica) más textura de dither, sin sprite
  propio. Los bordes entre salas distintas se dibujan más gruesos que los internos,
  para que la forma irregular de cada sala se lea con claridad.
