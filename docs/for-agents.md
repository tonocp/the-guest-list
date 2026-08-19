# Mapa para agentes

Contexto denso para cargar rápido antes de tocar este repo. Los demás documentos en
`docs/` profundizan cada sección — este archivo es el índice de hechos, no la
explicación completa.

## Qué es esto

Vue 3 + TypeScript + Vite + Pinia. Juego de lógica "misterio de asesinato + sudoku":
colocar sospechosos en una cuadrícula (una fila, una columna cada uno) siguiendo
pistas de texto, hasta deducir quién compartía sala con la víctima. PWA offline +
Capacitor (Android). Sin backend — todo el estado vive en el cliente
(`localStorage` solo para IDs de casos completados).

## Invariantes que hay que conocer antes de tocar la lógica del juego

1. **Solo hay una restricción dura de colocación**: una persona por fila, una por
   columna (matriz de permutación). Las salas **no son exclusivas** — varios
   sospechosos pueden compartirla.
2. **Dos sospechosos nunca pueden estar ortogonalmente adyacentes** — es una
   consecuencia matemática de (1), no una regla aparte. Por tanto `adjacent` entre dos
   sospechosos solo se puede satisfacer compartiendo sala.
3. **La sala de la víctima debe tener exactamente 2 ocupantes** en la solución (víctima
   + asesino), o `getMurderer()` (`.find()` en `gridLogic.ts`) devuelve un resultado
   mal definido. El generador procedural aplica esto explícitamente
   (`generator/victim.ts`).
4. **`Suspect.clue` es un único string** — cada sospechoso muestra como mucho una
   pista. El generador respeta esto dando a cada sospechoso como mucho una regla.
5. Detalle completo: [`game-rules.md`](./game-rules.md).

## Mapa de archivos

```
src/types/puzzle.ts          contrato de datos único (Puzzle, Suspect, Room, Cell, ClueRule)
src/lib/gridLogic.ts         reglas puras: isNextTo, getConflicts, getMurderer...
src/lib/solver.ts            backtracking + MRV + poda; countSolutions/hasUniqueSolution
src/lib/rng.ts               PRNG determinista (mulberry32) — usar SIEMPRE esto en el generador, nunca Math.random()
src/lib/generator/           generador procedural completo (ver procedural-generator.md)
src/data/puzzles/            casos hechos a mano + registro (getPuzzle, registerGeneratedPuzzle)
src/stores/puzzleStore.ts    estado de partida (Pinia), delega reglas a gridLogic.ts
src/views/, src/components/  UI — no reimplementan reglas, solo leen del store
scripts/verify-puzzle.ts     verifica unicidad de los casos hechos a mano (usa solver.ts)
scripts/stress-generate.ts   30 semillas × 5 dificultades, tasa de éxito + tiempos del generador
scripts/gen-sprites.mjs      genera TODOS los sprites pixel-art por código (sharp)
```

Dirección de dependencia estricta: `types/` ← `lib/` ← `data/` ← `stores/` ←
`views/`+`components/`. Nunca al revés.

## Trampas conocidas (ya resueltas, pero re-verificar si algo raro pasa)

- **Fuerza bruta ya no existe**: `verify-puzzle.ts` antes hacía (N!)² permutaciones —
  inviable a partir de 7x7. Ahora usa `solver.ts`. Si ves código que enumera
  permutaciones a mano en vez de llamar a `countSolutions`, es una regresión.
- **El solver explota exponencialmente sin anclaje unario**: una cadena larga de
  reglas `direction` sin ningún `room`/`on-furniture` puede tardar minutos incluso con
  MRV (confirmado: crecimiento exacto C(2N,N)). Por eso `solver.ts` tiene un tope
  `maxNodes` (defecto 50.000) y por eso `selectClues.ts` **nunca** selecciona reglas
  binarias. No quitar ninguna de las dos cosas sin releer
  [`procedural-generator.md`](./procedural-generator.md).
- **`aspect-square` por celda en el tablero causaba huecos visuales** — corregido
  moviendo `aspect-ratio` al contenedor del grid. Ver `visual-design.md` si reaparece.
- **`sudo mkcert -install` sin `env CAROOT=...` instala la CA en el sitio
  equivocado** (sudo resetea `$HOME`). Ver `pwa-mobile-capacitor.md` para el comando
  correcto — no es negociable, es el único que funciona.
- **12 tipos de mobiliario, no 8** — se ampliaron a mitad de desarrollo porque 8 no
  bastaban para anclar a los 11 sospechosos de "experto" (12x12). Si añades un caso o
  tocas el generador para un tamaño mayor, puede volver a hacer falta más margen.

## Cómo verificar que algo sigue funcionando

```bash
npx vitest run                        # 44 tests, deben pasar todos
npx tsx scripts/verify-puzzle.ts      # los 2 casos hechos a mano, deben salir UNIQUE ✔
npx tsx scripts/stress-generate.ts    # generador, debe ser ~150/150 y rápido (<100ms incluso en experto)
npm run build                         # vue-tsc -b && vite build, debe compilar sin errores de tipos
```

## Qué NO hacer sin preguntar primero

- No aplicar Hexagonal/DDD/Atomic Design formales — ya se debatió y se rechazó
  explícitamente, ver [`decisions.md`](./decisions.md).
- No hacer `git commit` de nada — regla dura del usuario para este proyecto.
- No añadir dependencias de fuentes/CDN externas — rompe el requisito de PWA offline.
- No dar por hecho que "más tests pasando" = "el generador funciona bien" sin también
  correr `stress-generate.ts` — los tests solo cubren unas pocas semillas fijas.
