# Tests y herramientas

## Tests automatizados

```bash
npx vitest run          # o: npm run test
```

Runner: Vitest. Tests sobre la capa de dominio pura (`src/lib/`): reglas del solver,
generación de regiones y generación de casos completos por dificultad × semilla.

## Scripts (`scripts/`)

| Script | Qué hace |
|---|---|
| `verify-puzzle.ts` | Para semillas fijas por dificultad, comprueba que el solver da solución única y reproduce la solución del generador. |
| `stress-generate.ts` | Genera un lote de casos por semilla × dificultad y reporta tasa de éxito + tiempos. |
| `gen-sprites.mjs` | Genera todos los sprites pixel-art por código, vía `sharp`. |
| `gen-icons.mjs` | Genera los iconos PWA desde un SVG generado por código. |

Ninguno se ejecuta como parte del build — son herramientas de desarrollo manuales.

## Build y verificación de tipos

```bash
npm run build            # vue-tsc -b && vite build — falla si hay errores de tipos
npm run dev -- --host    # servidor de desarrollo, expuesto en la red local
npm run preview          # sirve el build de producción para probar el service worker real
```
