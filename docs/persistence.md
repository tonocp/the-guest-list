# Guardado de partidas

Los casos procedurales se pueden retomar a medias o consultar como resueltos desde la
pantalla de inicio, con autoguardado en cada jugada. Persistencia vía IndexedDB — sin
sincronización entre dispositivos.

## Por qué no se guarda el `Puzzle` completo

El generador es determinista por semilla (ver
[`procedural-generator.md`](./procedural-generator.md)). Guardar `{ id, seed,
difficulty }` basta para reconstruir el `Puzzle` exacto — así que solo se persiste el
*progreso* del jugador, no el contenido del caso.

## Arquitectura

- **`src/lib/persistence/gameRepository.ts`** — el puerto: tipo `SavedGame` +
  interfaz `GameRepository` (`list`/`get`/`save`/`remove`), sin ningún import de
  framework.
- **`src/lib/persistence/indexedDbGameRepository.ts`** — el adapter concreto
  (IndexedDB nativo envuelto en promesas).
- **`src/data/puzzles/index.ts`** → `resolvePuzzle(id)` — resuelve un `Puzzle`
  jugable por id: primero mira el registro estático (casos hechos a mano), si no,
  regenera desde el `SavedGame` correspondiente.
- **`src/stores/puzzleStore.ts`** — `load(id)` resuelve el puzzle y restaura el
  progreso guardado; `persist()` se llama al final de cada acción que muta el tablero.

## Ciclo de vida de una partida

1. **Crear**: se genera `seed` + `id`, se guarda un `SavedGame` inicial y se navega a
   la partida.
2. **Jugar**: cada colocación/deshacer/pista/reseteo autoguarda.
3. **Retomar**: al volver a abrir la partida, se regenera el `Puzzle` y se restauran
   las colocaciones exactamente como se dejaron.
4. **Cronómetro**: se guarda el tiempo activo acumulado, no una marca de tiempo
   absoluta, así no cuenta el rato con la app cerrada.
5. **Borrar**: desde la tarjeta en la pantalla de inicio.

**Limitación conocida**: el historial de deshacer no se persiste — al retomar una
partida guardada, "Deshacer" empieza vacío.
