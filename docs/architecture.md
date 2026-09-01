# Arquitectura

Vue 3 (`<script setup>`) + TypeScript + Vite + Pinia + vue-router + Tailwind v4. PWA
instalable y offline vía `vite-plugin-pwa` (Workbox).

## Capas

```
types/               contrato de datos (no depende de nada)
lib/                  lógica de dominio pura (solo types/, cero Vue/Pinia)
lib/persistence/      puerto GameRepository + adapter IndexedDB
data/resolvePuzzle.ts regenera el Puzzle jugable desde el SavedGame
stores/              estado de sesión (Pinia), delega reglas en lib/
views/, components/   UI: leen del store, no reimplementan reglas
scripts/             herramientas de desarrollo
```

Dependencia estricta hacia abajo, nunca hacia arriba.

## El contrato central: `Puzzle`

Todo gira en torno a `Puzzle` (`src/types/puzzle.ts`). Store, UI y generador solo saben
consumir/producir un `Puzzle`. Hoy todos los casos se generan, pero nada aguas abajo
depende de eso: cualquier `Puzzle` válido es igual de jugable.

```ts
interface Puzzle {
  id: string
  title: string
  size: number
  difficulty: Difficulty
  rooms: Room[]
  cells: Cell[]                       // grid size×size, roomId + mueble opcional
  suspects: Suspect[]                 // incluye la víctima (isVictim: true)
  solution: Record<string, Position>  // suspectId -> {row, col}
  rules: ClueRule[]                   // predicados estructurados, usados por el solver
}
```

Significado de cada campo: [`game-rules.md`](./game-rules.md). Cómo se construye:
[`procedural-generator.md`](./procedural-generator.md).

## Dominio puro (`src/lib/`)

- **`gridLogic.ts`** — reglas del juego como funciones puras (`isNextTo`,
  `getConflicts`, `getMurderer`…) y el agrupado de piezas de mobiliario multi-celda
  (`furniturePieces`/`pieceShape`/`multiCellFurniturePlacements`, ver
  [`visual-design.md`](./visual-design.md)).
- **`solver.ts`** — resuelve/cuenta soluciones para un conjunto de reglas.
- **`rng.ts`** — PRNG determinista (mulberry32).
- **`furnitureIcons.ts`** — `FurnitureType` → ruta de sprite (+ variantes conectadas).
- **`suspectFace.ts`** — hash de `suspectId` → sprite de cara.
- **`generator/`** — generador procedural completo.
- **`persistence/`** — puerto `GameRepository` + adapter IndexedDB.

## Estado (`src/stores/puzzleStore.ts`)

Un store Pinia con la partida actual: colocaciones, sospechoso seleccionado, historial
de deshacer, pistas, victoria. `load(id)` regenera el `Puzzle` y restaura el progreso
guardado; `persist()` autoguarda tras cada mutación del tablero. Las acciones delegan
en `gridLogic.ts` para conflictos/victoria.

## UI y enrutado

Vistas: `PuzzleListView.vue` (elegir/generar), `PlayView.vue` (juego). Componentes:
`BoardGrid.vue`, `SuspectCard.vue`, `ActionBar.vue`, `WinModal.vue`, `HelpModal.vue`.

Rutas (`src/router/index.ts`): `/` (partidas guardadas), `/play/:id`, `/furni`
(depuración de sprites, no enlazada). Un caso no vive en ningún registro estático:
`resolvePuzzle(id)` lo reconstruye desde su `{ seed, difficulty }` guardado.
