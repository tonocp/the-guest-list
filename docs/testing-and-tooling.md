# Tests y herramientas

## Tests automatizados

```bash
npx vitest run          # o: npm run test
```

Runner: Vitest, configurado en `vitest.config.ts` (deliberadamente separado de
`vite.config.ts` — los plugins de PWA/mkcert de la app no tienen nada que hacer
corriendo en cada `npm test`, y mkcert en concreto intentaría generar certificados en
cada ejecución si compartiera config). `environment: 'node'`, sin nada de DOM — todos
los tests actuales son sobre la capa de dominio pura (`src/lib/`), no hay tests de
componentes Vue todavía.

44 tests repartidos en 3 archivos:

- **`src/lib/solver.test.ts`** — fixtures de regresión (los 2 casos hechos a mano),
  casos de unicidad/contradicción, corrección de cada tipo de regla en un fixture 3x3
  verificado a mano, smoke test de rendimiento 12x12 realista, y un test específico
  del cinturón de seguridad (`maxNodes`) contra el caso adversarial que sí explota.
- **`src/lib/generator/regions.test.ts`** — para tamaños 6/9/12 × varias semillas:
  cobertura completa, N regiones de N celdas conexas, determinismo, variedad de forma.
- **`src/lib/generator/generatePuzzle.test.ts`** — para cada dificultad × varias
  semillas: tamaño correcto, exactamente una víctima, solución válida, mobiliario sin
  repetir, el solver confirma unicidad de forma independiente, `getMurderer` definido,
  determinismo por semilla.

## Scripts (`scripts/`)

| Script | Qué hace | Cuándo usarlo |
|---|---|---|
| `verify-puzzle.ts` | Verifica que los casos hechos a mano en `src/data/puzzles/` tienen solución única (usa `solver.ts`). | Siempre que edites o añadas un caso a mano. `npx tsx scripts/verify-puzzle.ts` |
| `stress-generate.ts` | Genera 30 semillas × 5 dificultades y reporta tasa de éxito + tiempos. | Siempre que toques algo del pipeline del generador. `npx tsx scripts/stress-generate.ts` |
| `gen-sprites.mjs` | Genera todos los sprites pixel-art (mobiliario, fichas, textura de suelo) por código, vía `sharp`. | Al añadir un tipo de mobiliario nuevo o ajustar el arte existente. `node scripts/gen-sprites.mjs` |
| `gen-icons.mjs` | Genera los iconos PWA (192/512/maskable/apple-touch) desde un SVG generado por código. | Rara vez — solo si cambia el icono de la app. `node scripts/gen-icons.mjs` |

Ninguno de estos scripts se ejecuta como parte del build o de CI — son herramientas de
desarrollo manuales.

## Build y verificación de tipos

```bash
npm run build   # vue-tsc -b && vite build — falla si hay errores de tipos
npm run dev -- --host   # servidor de desarrollo, expuesto en la red local
npm run preview          # sirve el build de producción (dist/) para probar el service worker real
```

`vue-tsc -b` también type-checkea los archivos `*.test.ts` (están dentro de `src/`,
incluidos por `tsconfig.app.json`), así que un test con un error de tipos rompe el
build aunque el test en sí "pasara" en tiempo de ejecución.
