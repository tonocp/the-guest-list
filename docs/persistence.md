# Guardado de partidas

Los casos procedurales se pueden retomar a medias o consultar como resueltos desde la
pantalla de inicio, con autoguardado en cada jugada. Los 2 casos hechos a mano
(`src/data/puzzles/fiestaDisfraces.ts`, `estudioYoga.ts`) ya no aparecen en esa
pantalla — siguen existiendo solo como fixtures de `solver.test.ts`.

## Por qué IndexedDB y no SQLite

Lo que hay que persistir es una lista de registros sin ninguna consulta relacional —
el caso de uso nativo de IndexedDB, integrado en cualquier navegador sin coste de
bundle. SQLite en web implicaría compilarlo a WASM (1-2MB+ añadidos) para una
necesidad que hoy no existe.

## Por qué no se guarda el `Puzzle` completo

El generador es determinista por semilla (ver
[`procedural-generator.md`](./procedural-generator.md)). Guardar `{ id, seed,
difficulty }` basta para reconstruir el `Puzzle` exacto llamando de nuevo a
`generatePuzzle({ difficulty, seed, id, title })` — así que solo se persiste el
*progreso* del jugador, no el contenido del caso.

## Arquitectura

- **`src/lib/persistence/gameRepository.ts`** — el puerto: tipo `SavedGame` +
  interfaz `GameRepository` (`list`/`get`/`save`/`remove`), TypeScript puro, sin
  ningún import de framework.
- **`src/lib/persistence/indexedDbGameRepository.ts`** — el único adapter concreto
  hoy. IndexedDB nativo envuelto en promesas a mano; sin librería.
- **`src/lib/persistence/index.ts`** — exporta el singleton `gameRepository` que usa
  el resto de la app.
- **`src/data/puzzles/index.ts`** → `resolvePuzzle(id)` — resuelve un `Puzzle`
  jugable por id: primero mira el registro estático (casos hechos a mano), si no,
  busca un `SavedGame` por ese id y regenera el `Puzzle` desde su semilla.
- **`src/stores/puzzleStore.ts`** — `load(id)` (ahora async) resuelve el puzzle y
  restaura el progreso guardado si existe; `persist()` se llama al final de cada
  acción que muta el tablero (`placeAt`, `removeSuspect`, `undo`, `clearAll`, `hint`)
  y guarda un `SavedGame` actualizado, sin bloquear la UI (fire-and-forget).

Esta es la única excepción a "sin arquitectura hexagonal formal" de
[`decisions.md`](./decisions.md) — un puerto de persistencia, nada más. No hay
`ports/`/`adapters/` para el resto de la app.

## Ciclo de vida de una partida

1. **Crear**: `PuzzleListView.vue` genera `seed` + `id` (`crypto.randomUUID()`),
   llama a `generatePuzzle({ difficulty, seed, id })`, guarda un `SavedGame` inicial
   (progreso vacío) y navega a `/play/{id}`.
2. **Jugar**: cada colocación/deshacer/pista/reseteo autoguarda vía `persist()`.
3. **Retomar**: al abrir `/play/{id}` de nuevo (mismo dispositivo, misma sesión de
   navegador — no hay sync entre dispositivos), `store.load(id)` regenera el `Puzzle`
   y restaura las colocaciones exactamente como se dejaron.
4. **Cronómetro sin trampa**: se guarda el tiempo *activo* acumulado
   (`elapsedMs`), no una marca de tiempo absoluta — así el reloj no cuenta el rato
   con la pestaña o la app cerrada. Al retomar, `startedAt = Date.now() -
   elapsedMs`.
5. **Borrar**: desde la tarjeta en la pantalla de inicio, `gameRepository.remove(id)`.

**Limitación conocida**: el historial de deshacer no se persiste — al retomar una
partida guardada, "Deshacer" empieza vacío. Aceptado como limitación menor, no
bloqueante.

## Trampa real encontrada construyendo esto

**`SavedGame` nunca se puede pasar directamente al store de IndexedDB si contiene
algún objeto reactivo de Pinia** (`DataCloneError: ... could not be cloned`) — el
algoritmo de clonación estructurada que usa IndexedDB no sabe clonar un `Proxy`
(cómo Vue envuelve el estado reactivo), aunque el objeto contenedor en sí sea un
literal plano. La solución vive en el propio adapter
(`indexedDbGameRepository.ts`, método `save`): `JSON.parse(JSON.stringify(game))`
antes de `store.put(...)`, deliberadamente en el *adapter* (el límite hacia la Web
API con esa restricción), no en cada llamador — así cualquier futuro caller queda
protegido automáticamente sin tener que acordarse de aplanar nada.

Al depurar esto también se confirmó otra trampa (ver
[`for-agents.md`](./for-agents.md)): el Service Worker de desarrollo
(`devOptions.enabled: true` en `vite.config.ts`, activado a propósito para que las
pruebas en el móvil se comporten como producción) puede servir una versión cacheada
de un módulo aunque el archivo fuente ya esté corregido — ni una recarga normal lo
soluciona, hace falta desregistrar el Service Worker y limpiar sus cachés
explícitamente (o abrir en una pestaña de incógnito nueva) para confirmar que un fix
realmente se está probando.
