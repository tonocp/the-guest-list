# Mapa para agentes

Contexto denso para cargar rápido antes de tocar este repo. Los demás documentos en
`docs/` profundizan cada sección.

## Qué es esto

Vue 3 + TypeScript + Vite + Pinia. Juego de lógica "misterio de asesinato + sudoku":
colocar sospechosos en una cuadrícula (una fila, una columna cada uno) siguiendo
pistas de texto, hasta deducir quién compartía sala con la víctima. PWA instalable y
offline. Sin backend — todo el estado vive en el cliente (IndexedDB para las
partidas guardadas, ver [`persistence.md`](./persistence.md)).

## Invariantes que hay que conocer antes de tocar la lógica del juego

1. **Solo hay una restricción dura de colocación**: una persona por fila, una por
   columna (matriz de permutación). Las salas **no son exclusivas** — varios
   sospechosos pueden compartirla.
2. **Dos sospechosos nunca pueden estar ortogonalmente adyacentes** — es una
   consecuencia matemática de (1), no una regla aparte. Por tanto `adjacent` entre dos
   sospechosos solo se puede satisfacer compartiendo sala.
3. **La sala de la víctima debe tener exactamente 2 ocupantes** en la solución (víctima
   + asesino), o `getMurderer()` en `gridLogic.ts` devuelve un resultado mal definido.
4. **`Suspect.clue` es un único string** — cada sospechoso muestra como mucho una
   pista.
5. Detalle completo: [`game-rules.md`](./game-rules.md).

## Mapa de archivos

```
src/types/puzzle.ts          contrato de datos único (Puzzle, Suspect, Room, Cell, ClueRule)
src/lib/gridLogic.ts         reglas puras: isNextTo, getConflicts, getMurderer...
src/lib/solver.ts            backtracking + MRV + poda; countSolutions/hasUniqueSolution
src/lib/rng.ts               PRNG determinista (mulberry32) — usar SIEMPRE esto en el generador, nunca Math.random()
src/lib/generator/           generador procedural completo (ver procedural-generator.md)
src/lib/persistence/         puerto GameRepository + adapter IndexedDB (ver persistence.md)
src/data/puzzles/            casos hechos a mano + resolvePuzzle(id) (regenera casos guardados desde su semilla)
src/stores/puzzleStore.ts    estado de partida (Pinia), load(id) async + autoguardado, delega reglas a gridLogic.ts
src/views/, src/components/  UI — no reimplementan reglas, solo leen del store
scripts/verify-puzzle.ts     verifica unicidad de los casos hechos a mano (usa solver.ts)
scripts/stress-generate.ts   generador: tasa de éxito + tiempos, por semilla × dificultad
scripts/gen-sprites.mjs      genera TODOS los sprites pixel-art por código (sharp)
```

Dirección de dependencia estricta: `types/` ← `lib/` ← `data/` ← `stores/` ←
`views/`+`components/`. Nunca al revés.

## Trampas conocidas

- **El solver puede explotar exponencialmente sin anclaje unario**: una cadena larga
  de reglas `direction` sin ningún `room`/`on-furniture` puede tardar mucho incluso
  con MRV. Por eso `solver.ts` tiene un tope `maxNodes` y `selectClues.ts` **nunca**
  selecciona reglas binarias. No quitar ninguna de las dos cosas sin releer
  [`procedural-generator.md`](./procedural-generator.md).
- **Nunca pases estado de Pinia directamente a `gameRepository.save(...)`** —
  IndexedDB no puede clonar un `Proxy` reactivo de Vue. Ya está resuelto dentro de
  `indexedDbGameRepository.ts` (aplana con `JSON.parse(JSON.stringify(...))` antes de
  `store.put`).
- **El Service Worker de desarrollo puede servir código cacheado y viejo** aunque el
  archivo fuente ya esté arreglado. Si un fix no parece surtir efecto, desregistra el
  Service Worker y limpia sus cachés en la consola
  (`(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister())`
  + `caches.keys().then(ks => ks.forEach(k => caches.delete(k)))`) antes de seguir
  depurando.
- **El mobiliario ya NO garantiza 1 celda por tipo**: `rug`/`bed` pueden ocupar 2 celdas
  y `sofa` hasta 3 (`generator/furniture.ts`, `growRug`/`growSofa`). Quien toque
  `BoardGrid.vue` o cualquier lógica que lea `cell.furniture` no debe asumir
  cardinalidad 1 — usar `cells.filter(c => c.furniture === type)` como ya hace
  `solver.ts`/`clueFacts.ts`, nunca "el" `Cell` de ese tipo.
- **`bed` nunca degrada a 1 celda** (a diferencia de `rug`/`sofa`, que sí): se asigna
  aparte en `assignBed` (`generator/furniture.ts`), antes que el resto del mobiliario,
  y si ningún sospechoso candidato tiene hueco para 2 celdas, se descarta del todo para
  ese caso en vez de aparecer en 1 celda — una cama de 1 celda no se lee como cama. El
  sprite `bed-solo.png`/`FURNITURE_SPRITES.bed` se mantiene igualmente por completitud
  de tipos (todo `FurnitureType` necesita una entrada) y como red de seguridad para un
  futuro caso hecho a mano, pero el generador procedural nunca lo produce.

## Cómo verificar que algo sigue funcionando

```bash
npx vitest run                        # deben pasar todos
npx tsx scripts/verify-puzzle.ts      # los casos hechos a mano, deben salir UNIQUE ✔
npx tsx scripts/stress-generate.ts    # generador, tasa de éxito alta y rápido incluso en experto
npm run build                         # vue-tsc -b && vite build, debe compilar sin errores de tipos
```

## Qué NO hacer sin preguntar primero

- No aplicar Hexagonal/DDD/Atomic Design formales a toda la app — ver
  [`AGENTS.md`](../AGENTS.md).
- No hacer `git commit` de nada.
- No añadir dependencias de fuentes/CDN externas — rompe el requisito de PWA offline.
- No dar por hecho que "más tests pasando" = "el generador funciona bien" sin también
  correr `stress-generate.ts` — los tests solo cubren unas pocas semillas fijas.
- No dejar `docs/` desactualizado tras un cambio de funcionalidad — ver
  [`AGENTS.md`](../AGENTS.md).
