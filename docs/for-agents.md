# Mapa para agentes

Contexto denso para cargar antes de tocar el repo. El resto de `docs/` profundiza.

## Qué es esto

Vue 3 + TS + Vite + Pinia. Juego de lógica "misterio de asesinato + sudoku": colocar
sospechosos en una cuadrícula (una fila, una columna cada uno) siguiendo pistas de
texto, hasta deducir quién compartía sala con la víctima. PWA instalable y offline,
sin backend — todo el estado en el cliente (IndexedDB, ver [`persistence.md`](./persistence.md)).

## Invariantes de la lógica del juego

1. **Única restricción dura de colocación**: una persona por fila y por columna (matriz
   de permutación). Las salas **no son exclusivas**.
2. **Dos sospechosos nunca están ortogonalmente adyacentes** — consecuencia de (1), no
   regla aparte. `adjacent` entre sospechosos solo se satisface compartiendo sala.
3. **La sala de la víctima tiene exactamente 2 ocupantes** en la solución, o
   `getMurderer()` queda mal definido.
4. **`Suspect.clue` es un único string** — un sospechoso muestra como mucho una pista.

Detalle: [`game-rules.md`](./game-rules.md).

## Mapa de archivos

```
src/types/puzzle.ts          contrato de datos único (Puzzle, Suspect, Room, Cell, ClueRule)
src/lib/gridLogic.ts         reglas puras: isNextTo, isBesideFurniture, getConflicts, getMurderer, furniturePieces...
src/lib/solver.ts            backtracking + MRV + poda; countSolutions/hasUniqueSolution
src/lib/rng.ts               PRNG determinista (mulberry32) — SIEMPRE esto en el generador, nunca Math.random()
src/lib/generator/           generador procedural (ver procedural-generator.md)
src/lib/persistence/         puerto GameRepository + adapter IndexedDB (ver persistence.md)
src/data/resolvePuzzle.ts    regenera el Puzzle jugable desde seed+difficulty del SavedGame
src/stores/puzzleStore.ts    estado de partida (Pinia), load(id) async + autoguardado, delega en gridLogic.ts
src/views/, src/components/  UI — leen del store, no reimplementan reglas
scripts/verify-puzzle.ts     solver vs generador en semillas fijas: solución única y coincidente
scripts/stress-generate.ts   generador: tasa de éxito + tiempos por semilla × dificultad
scripts/gen-sprites.mjs      genera todos los sprites pixel-art por código (sharp)
```

Dirección de dependencia estricta: `types/` ← `lib/` ← `data/` ← `stores/` ←
`views/`+`components/`. Nunca al revés.

## Trampas conocidas

- **El solver explota exponencialmente sin anclaje unario**: una cadena de reglas
  `direction` sin ningún `room`/`on-furniture` tarda muchísimo incluso con MRV. Por eso
  `solver.ts` tiene tope `maxNodes` y `selectClues.ts` **nunca** selecciona reglas
  binarias. No quites ninguna de las dos sin releer
  [`procedural-generator.md`](./procedural-generator.md). El forward-checking de
  `liveCandidates` también es carga estructural: sin él, una cadena `direction` de
  12×12 pasa de milisegundos a colgarse.
- **Nunca pases estado de Pinia a `gameRepository.save(...)`**: IndexedDB no clona un
  `Proxy` de Vue. Resuelto en `indexedDbGameRepository.ts` (aplana con
  `JSON.parse(JSON.stringify(...))`).
- **El Service Worker de desarrollo sirve código cacheado y viejo**. Si un fix no surte
  efecto: desregistra el SW y limpia sus cachés en consola
  (`(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister())` +
  `caches.keys().then(ks => ks.forEach(k => caches.delete(k)))`).
- **El mobiliario NO garantiza 1 celda por tipo**: `rug`/`bed`/`piano` hasta 2, `sofa`
  hasta 3 (L), `screen` hasta 3 (recto). Nunca asumas cardinalidad 1 al leer
  `cell.furniture` — usa `cells.filter(c => c.furniture === type)`.
- **`bed`/`piano` nunca degradan a 1 celda** (a diferencia de `rug`/`sofa`/`screen`):
  se asignan aparte en `assignMustGrow` (una vez por tipo en `MUST_GROW_TYPES`), y si
  ningún sospechoso tiene hueco para 2 celdas el tipo se descarta del caso — una cama o
  un piano de 1 celda no se leen como tales. `bed-solo.png`/`piano-solo.png` existen
  solo por completitud de `FurnitureType`.
  **Regresión ya sufrida**: la primera `assignMustGrow` reasignaba el `type` entre
  sospechosos ya emparejados en vez de sacar del pool al que creció. Si el mismo
  sospechoso era el único con hueco para *ambos* tipos, el segundo se quedaba pegado a
  un sospechoso sin relación → segunda pieza de ese tipo en otra sala. El fix saca al
  grower del pool para siempre. Test de regresión en `furniture.test.ts`
  ("never produces two placements of the same type").
- **`near-furniture` es alcanzable pero nunca seleccionado**: todo sospechoso tiene un
  hecho `room` (fuerza 3) que supera a `near-furniture` (2). Los casos generados solo
  muestran `room` y `on-furniture`. El tipo sigue plumbed end-to-end para la variedad
  narrativa futura.

## Verificación

```bash
npx vitest run                        # todos deben pasar
npx tsx scripts/verify-puzzle.ts      # semillas fijas del generador, todas UNIQUE ✔
npx tsx scripts/stress-generate.ts    # generador: tasa de éxito alta, rápido incluso en experto
npm run build                         # vue-tsc -b && vite build, sin errores de tipos
```

## Qué NO hacer sin preguntar

- Aplicar Hexagonal/DDD/Atomic Design formales — ver [`AGENTS.md`](../AGENTS.md).
- `git commit` de nada.
- Añadir dependencias de fuentes/CDN externas (rompe el offline).
- Asumir que "más tests pasando" = "el generador va bien" sin correr `stress-generate.ts`.
- Dejar `docs/` desactualizado tras un cambio de funcionalidad.
