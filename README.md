# The Guest List

MVP de un juego de lógica estilo "misterio de asesinato": coloca a cada sospechoso en
la cuadrícula (una fila y una columna por persona) siguiendo sus pistas, hasta
descubrir quién compartía sala con la víctima. Ese es el asesino.

Vue 3 + TypeScript + Vite, PWA instalable y offline — sin envoltorio nativo. Incluye
un generador procedural de casos además de los hechos a mano, con guardado de
partidas en IndexedDB.

📖 **Documentación completa en [`docs/`](./docs/README.md)** — reglas del juego,
arquitectura, cómo funciona el generador procedural (con los bugs reales encontrados
al construirlo), guardado de partidas, tests/herramientas, PWA/móvil, y el sistema de
sprites. Si eres un agente de IA retomando este proyecto, empieza por
[`docs/for-agents.md`](./docs/for-agents.md).

## Inspiración

El diseño del tablero y la mecánica de colocación están inspirados en el juego de
lógica [Murdoku](https://murdoku.com/), de Manuel Garand — una referencia de diseño,
no una base de código ni de contenido compartida. Todo el código, el arte y los casos
de este proyecto son originales.

## Arrancar

```bash
npm install
npm run dev -- --host   # --host expone el servidor en tu red local, para probar en el móvil
```

La primera vez necesitas confiar en la CA de `mkcert` para servir por HTTPS local —
ver [`docs/pwa-mobile.md`](./docs/pwa-mobile.md) (el comando correcto, y la trampa
habitual con `sudo` si no lo copias tal cual).

```bash
npx vitest run                      # tests (44, deben pasar todos)
npx tsx scripts/verify-puzzle.ts    # confirma solución única de los casos hechos a mano
npm run build && npm run preview    # build de producción + Service Worker real
```
