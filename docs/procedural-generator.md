# Generador procedural

Todo vive bajo `src/lib/` (solver, RNG) y `src/lib/generator/` (todo lo demás), como
funciones puras sin ningún import de Vue/Pinia — ver [`architecture.md`](./architecture.md).
Punto de entrada: `generatePuzzle({ difficulty, seed? }): Puzzle`
(`src/lib/generator/generatePuzzle.ts`).

## Mapeo dificultad → tamaño

| Dificultad | Tamaño |
|---|---|
| muy-fácil | 6×6 |
| fácil / medio / difícil | 9×9 |
| experto | 12×12 |

## Pipeline

```mermaid
flowchart TD
    A[generateRegions] -->|partición de salas| B[roster + tema de salas]
    B --> C[selectVictim]
    C -->|solución + víctima| D[assignFurniture]
    D --> E[enumerateFacts]
    E -->|hechos candidatos| F[selectClues]
    F -->|reglas mínimas y únicas| G[clueText]
    G --> H[Puzzle ensamblado]
    H -->|hasUniqueSolution de nuevo, cinturón de seguridad| I[devuelto o descartado]
    I -.reintento si falla cualquier paso.-> A
```

Todo el pipeline está envuelto en un reintento acotado (20 intentos por defecto): un
fallo en cualquier paso descarta el intento entero y prueba con una sub-semilla nueva,
derivada de la semilla maestra para mantener reproducibilidad.

## El solver (`src/lib/solver.ts`)

Backtracking con variable = sospechoso, usando **MRV** (most-remaining-values): en
cada nodo, coloca primero al sospechoso sin colocar con menos celdas candidatas
válidas. Las reglas unarias (`room`, `on-furniture`, `near-furniture`) anclan a una
posición antes de empezar la búsqueda; las binarias (`direction`, `adjacent`) se
comprueban de forma incremental (forward-checking). Corta la búsqueda en cuanto
encuentra 2 soluciones distintas — nunca hace falta saber cuántas hay, solo si es
única. Incluye un tope de nodos explorados como cinturón de seguridad frente a
combinaciones de reglas patológicas.

API pública: `countSolutions(input, cap?, maxNodes?): SolveResult`,
`hasUniqueSolution(input, maxNodes?): boolean`.

## Generador de salas (`generator/regions.ts`)

Partición de la cuadrícula NxN en N regiones conexas de N celdas: semillas
repartidas por muestreo, crecimiento simultáneo (la región con menos frontera crece
primero), y una pasada de variedad de forma (intercambios locales entre celdas de
borde) para que salgan formas en escalera/L, no solo bloques rectangulares.

## Selección de víctima (`generator/victim.ts`)

Prueba permutaciones de solución aleatorias hasta encontrar una donde alguna sala
tenga **exactamente 2** ocupantes — necesario para que el asesino quede bien definido
(ver [`game-rules.md`](./game-rules.md)).

## Mobiliario y pistas

Hasta una instancia única de cada tipo de mobiliario (12 tipos), colocada en la celda
de un sospechoso no-víctima distinto cada vez. Cada sospechoso muestra como mucho una
pista (`Suspect.clue` es un único string): se le da su hecho unario más fuerte
disponible (`on-furniture` > `room` > `near-furniture`), y luego se minimiza el
conjunto quitando reglas mientras la solución siga siendo única.

## Limitaciones conocidas

- Los casos generados solo usan pistas de sala/mobiliario — nunca `direction` o
  `adjacent` (los casos hechos a mano sí las usan, con más variedad narrativa).
- El mobiliario ocupa una sola celda; piezas multi-celda (alfombras, sofás en L) no
  están soportadas todavía.
- El solver garantiza unicidad matemática de la solución, no que sea resoluble sin
  tanteo en algún punto.

`scripts/stress-generate.ts` genera un lote de semillas × dificultades y reporta tasa
de éxito y tiempos — ejecutar tras cualquier cambio al pipeline.
