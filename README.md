# MurDoku

MVP de un juego de lógica estilo "sudoku de misterio": coloca a cada sospechoso en la
cuadrícula (una fila y una columna por persona) siguiendo sus pistas, hasta descubrir
quién compartía sala con la víctima. Ese es el asesino.

Vue 3 + TypeScript + Vite, pensado como PWA instalable y offline, con Capacitor para
empaquetar como app nativa (Android). Incluye un generador procedural de casos además
de los hechos a mano.

📖 **Documentación completa en [`docs/`](./docs/README.md)** — reglas del juego,
arquitectura, cómo funciona el generador procedural (con los bugs reales encontrados
al construirlo), tests/herramientas, PWA/móvil/Capacitor, y el sistema de sprites.
Si eres un agente de IA retomando este proyecto, empieza por
[`docs/for-agents.md`](./docs/for-agents.md).

## Arrancar

```bash
npm install
npm run dev -- --host   # --host expone el servidor en tu red local, para probar en el móvil
```

La primera vez necesitas confiar en la CA de `mkcert` para servir por HTTPS local —
ver [`docs/pwa-mobile-capacitor.md`](./docs/pwa-mobile-capacitor.md) (el comando
correcto, y la trampa habitual con `sudo` si no lo copias tal cual).

```bash
npx vitest run                      # tests (44, deben pasar todos)
npx tsx scripts/verify-puzzle.ts    # confirma solución única de los casos hechos a mano
npm run build && npm run preview    # build de producción + Service Worker real
```
