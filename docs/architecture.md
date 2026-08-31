# Arquitectura

Stack: Vue 3 (`<script setup>`, Composition API) + TypeScript + Vite + Pinia +
vue-router + Tailwind v4. PWA instalable y offline vía `vite-plugin-pwa` (Workbox).

## Capas

```
types/                → contrato de datos (no depende de nada)
lib/                   → lógica de dominio pura (solo depende de types/, cero Vue/Pinia)
lib/persistence/        → puerto GameRepository + adapter IndexedDB (ver persistence.md)
data/puzzles/             → contenido: casos hechos a mano + resolvePuzzle(id)
stores/                     → estado de sesión de partida (Pinia), delega reglas a lib/
views/, components/          → UI "tonta": lee del store, no reimplementa reglas
scripts/                      → herramientas de desarrollo (verificación, generación de assets)
```

La dirección de dependencia es estricta: cada capa solo conoce la de abajo. Nunca hay
un import "hacia arriba".

## El contrato central: `Puzzle`

Todo el sistema gira en torno al tipo `Puzzle` (`src/types/puzzle.ts`). El store, los
componentes de UI y el generador procedural solo saben consumir/producir un objeto
`Puzzle` — no importa si salió escrito a mano o generado en tiempo de ejecución.

```ts
interface Puzzle {
  id: string
  title: string
  size: number
  difficulty: Difficulty
  rooms: Room[]
  cells: Cell[]              // grid completo, size×size, con roomId + mueble opcional
  suspects: Suspect[]        // incluye a la víctima, con isVictim: true
  solution: Record<string, Position>  // suspectId -> {row, col}
  rules: ClueRule[]          // predicados estructurados, usados por el solver
}
```

Ver [`game-rules.md`](./game-rules.md) para el significado de cada campo, y
[`procedural-generator.md`](./procedural-generator.md) para cómo se construye un
`Puzzle` desde cero.

## Lógica de dominio pura (`src/lib/`)

- **`gridLogic.ts`** — las reglas del juego como funciones puras: `isNextTo`,
  `getConflicts`, `isComplete`, `matchesSolution`, `getMurderer`, y
  `furniturePieces`/`pieceShape`/`multiCellFurniturePlacements` (agrupan las celdas de
  una pieza de mobiliario multi-celda y calculan qué sprite y colocación de grid usar,
  ver [`visual-design.md`](./visual-design.md)).
- **`solver.ts`** — resuelve/cuenta soluciones para un conjunto de reglas dado
  (backtracking + poda). Ver [`procedural-generator.md`](./procedural-generator.md).
- **`rng.ts`** — PRNG determinista (mulberry32) para que el generador sea reproducible
  por semilla.
- **`furnitureIcons.ts`** — mapa `FurnitureType` → ruta de sprite base, más
  `CONNECTABLE_FURNITURE_SPRITES` para las variantes conectadas de `rug`/`bed`/`piano`/
  `sofa`/`screen`.
- **`suspectFace.ts`** — hash determinista de `suspectId` → sprite de cara (tono de
  piel + color de pelo), con el estilo de pelo según `gender`. Ver
  [`visual-design.md`](./visual-design.md).
- **`generator/`** — el generador procedural completo, ver el documento dedicado.
- **`persistence/`** — puerto `GameRepository` + adapter IndexedDB — ver
  [`persistence.md`](./persistence.md).

## Estado (`src/stores/puzzleStore.ts`)

Un único store Pinia con el estado de la partida *actual*: colocaciones, sospechoso
seleccionado, historial de deshacer, pistas usadas, si se ha ganado. `load(id)` (async)
resuelve el `Puzzle` y restaura el progreso guardado si existe; `persist()` autoguarda
tras cada acción que muta el tablero. Las acciones delegan a `gridLogic.ts` para
detectar conflictos/victoria en vez de reimplementar esa lógica.

## UI (`src/views/`, `src/components/`)

- **Vistas**: `PuzzleListView.vue` (elegir/generar caso), `PlayView.vue` (pantalla de
  juego).
- **Componentes**: `BoardGrid.vue`, `SuspectCard.vue`, `ActionBar.vue`
  (resetear/deshacer/pista), `WinModal.vue`, `HelpModal.vue` (reglas del juego).

## Enrutado

Dos rutas (`src/router/index.ts`): `/` (tus partidas guardadas) y `/play/:id`. Un caso
generado procedimentalmente no vive en ningún registro estático — `resolvePuzzle(id)`
lo reconstruye bajo demanda desde su `{ seed, difficulty }` guardado, así que
sobrevive a recargar la página o cerrar la app. Ver [`persistence.md`](./persistence.md).
