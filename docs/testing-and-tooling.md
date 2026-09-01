# Tests y herramientas

## Tests

```bash
npx vitest run          # o: npm run test
```

Vitest sobre la capa de dominio pura (`src/lib/`): solver, generación de regiones,
generación de casos completos por dificultad × semilla.

## Scripts (`scripts/`)

| Script | Qué hace |
|---|---|
| `verify-puzzle.ts` | Semillas fijas por dificultad: el solver da solución única y reproduce la del generador. |
| `stress-generate.ts` | Lote de casos por semilla × dificultad: tasa de éxito + tiempos. |
| `gen-sprites.mjs` | Genera todos los sprites pixel-art (vía `sharp`). |
| `gen-icons.mjs` | Genera los iconos PWA desde un SVG generado por código. |

Ninguno corre en el build — son herramientas manuales.

## Build

```bash
npm run build            # vue-tsc -b && vite build — falla si hay errores de tipos
npm run dev -- --host    # servidor de desarrollo en la red local
npm run preview          # sirve el build de producción (service worker real)
```
