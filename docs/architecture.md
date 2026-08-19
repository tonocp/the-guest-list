# Arquitectura

Stack: Vue 3 (`<script setup>`, Composition API) + TypeScript + Vite + Pinia +
vue-router + Tailwind v4. PWA vía `vite-plugin-pwa` (Workbox). Capacitor para
empaquetado nativo (Android añadido, iOS no).

## Capas

```
types/          → contrato de datos (no depende de nada)
lib/            → lógica de dominio pura (solo depende de types/, cero Vue/Pinia)
data/puzzles/   → contenido: instancias de Puzzle, hechas a mano o generadas
stores/         → estado de sesión de partida (Pinia), delega reglas a lib/
views/, components/ → UI "tonta": lee del store, no reimplementa reglas
scripts/        → herramientas de desarrollo offline (verificación, generación de assets)
```

La dirección de dependencia es estricta: cada capa solo conoce la de abajo. Nunca hay
un import "hacia arriba" (p.ej. `lib/` nunca importa de `stores/` o `components/`).

## El contrato central: `Puzzle`

Todo el sistema gira en torno al tipo `Puzzle` (`src/types/puzzle.ts`). El store, los
componentes de UI, el script de verificación y el generador procedural solo saben
consumir/producir un objeto `Puzzle` — a ninguno de ellos le importa si salió escrito a
mano (`src/data/puzzles/fiestaDisfraces.ts`) o generado en tiempo de ejecución
(`generatePuzzle()`). Este es el punto de enganche por el que el generador procedural
se integró sin tocar ni un componente `.vue`.

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

Ficheros clave, todos sin ningún import de Vue/Pinia (comprobable: buscar `from 'vue'`
o `from 'pinia'` en `src/lib/` no debería encontrar nada fuera de los tests si los
hubiera):

- **`gridLogic.ts`** — las reglas del juego como funciones puras: `isNextTo`,
  `getConflicts`, `isComplete`, `matchesSolution`, `getMurderer`. Usadas tanto por el
  store (en tiempo real, mientras se juega) como por el solver y el generador.
- **`solver.ts`** — resuelve/cuenta soluciones para un conjunto de reglas dado
  (backtracking + poda). Ver [`procedural-generator.md`](./procedural-generator.md).
- **`rng.ts`** — PRNG determinista (mulberry32) para que el generador sea reproducible
  por semilla.
- **`furnitureIcons.ts`** — mapa `FurnitureType` → ruta de sprite.
- **`suspectTint.ts`** — hash determinista de `suspectId` → desplazamiento de matiz CSS,
  para que cada sospechoso tenga un color propio y consistente entre el tablero y las
  tarjetas, sin necesitar N sprites distintos.
- **`generator/`** — el generador procedural completo, ver el documento dedicado.

## Estado (`src/stores/puzzleStore.ts`)

Un único store Pinia con el estado de la partida *actual*: colocaciones, sospechoso
seleccionado, historial de deshacer, pistas usadas, si se ha ganado, IDs de casos
completados (persistidos en `localStorage`). Las acciones llaman a las funciones puras
de `gridLogic.ts` para detectar conflictos/victoria en vez de reimplementar esa lógica.

## UI (`src/views/`, `src/components/`)

- **Vistas**: `PuzzleListView.vue` (elegir/generar caso), `PlayView.vue` (pantalla de
  juego — layout responsive con CSS Grid de áreas nombradas, ver comentario en el
  propio archivo).
- **Componentes**: `BoardGrid.vue` (tablero), `SuspectCard.vue`, `ActionBar.vue`
  (resetear/deshacer/pista), `WinModal.vue`.

Los componentes son deliberadamente "tontos": leen `puzzle` + `store.placements` y
delegan cualquier decisión de reglas a `lib/`. Ninguno reimplementa lógica de juego.

## Enrutado

Dos rutas (`src/router/index.ts`): `/` (lista de casos) y `/play/:id`. Los casos
generados procedimentalmente no viven en el registro estático de
`src/data/puzzles/index.ts` — se registran en un `Map` transitorio en memoria
(`registerGeneratedPuzzle`) justo antes de navegar a jugarlos, y se pierden al recargar
la página (intencional: regenerar uno nuevo es gratis).
