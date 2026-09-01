# Guardado de partidas

Los casos se retoman a medias o se consultan como resueltos desde la pantalla de
inicio, con autoguardado en cada jugada. IndexedDB, sin sincronización entre
dispositivos.

## Por qué no se guarda el `Puzzle` completo

El generador es determinista por semilla. `{ id, seed, difficulty }` basta para
reconstruir el `Puzzle` exacto — solo se persiste el *progreso* del jugador.

## Piezas

- **`persistence/gameRepository.ts`** — el puerto: tipo `SavedGame` + interfaz
  `GameRepository` (`list`/`get`/`save`/`remove`), sin imports de framework.
- **`persistence/indexedDbGameRepository.ts`** — el adapter (IndexedDB nativo en
  promesas).
- **`data/resolvePuzzle.ts`** — `resolvePuzzle(id)` regenera el `Puzzle` desde el
  `SavedGame`. No hay registro estático de casos.
- **`stores/puzzleStore.ts`** — `load(id)` resuelve y restaura el progreso; `persist()`
  autoguarda tras cada mutación del tablero.

## Ciclo de vida

1. **Crear**: se genera `seed` + `id`, se guarda un `SavedGame` inicial, se navega.
2. **Jugar**: cada colocación/deshacer/pista/reseteo autoguarda.
3. **Retomar**: se regenera el `Puzzle` y se restauran las colocaciones.
4. **Cronómetro**: se guarda tiempo activo acumulado, no una marca absoluta — no cuenta
   con la app cerrada.
5. **Borrar**: desde la tarjeta en la pantalla de inicio.

**Limitación**: el historial de deshacer no se persiste — al retomar, "Deshacer"
empieza vacío.
