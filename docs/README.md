# The Guest List — documentación

The Guest List es un juego de lógica tipo "misterio de asesinato": coloca a cada
sospechoso en una cuadrícula siguiendo pistas de texto, hasta deducir quién compartía
sala con la víctima. App Vue 3 + TypeScript, empaquetada como PWA instalable y offline,
con Capacitor para envoltorio nativo (Android). El diseño del tablero está inspirado en
el juego [Murdoku](https://murdoku.com/), de Manuel Garand — ver
[`decisions.md`](./decisions.md) para el porqué del nombre y el cambio de marca.

Esta carpeta documenta tanto el **qué** (reglas, arquitectura, cómo correr cosas) como
el **por qué** (decisiones tomadas, alternativas descartadas y por qué, bugs reales
encontrados durante el desarrollo y cómo se resolvieron). Si vas a tocar este código
—humano o agente— empieza por [`for-agents.md`](./for-agents.md), que es un mapa denso
pensado para cargar contexto rápido; el resto de documentos profundizan cada tema.

## Índice

| Documento | Contenido |
|---|---|
| [`for-agents.md`](./for-agents.md) | Mapa denso del repo: invariantes, dónde está cada cosa, trampas conocidas. Punto de entrada para un agente. |
| [`game-rules.md`](./game-rules.md) | Las reglas reales del juego: por qué las salas no son exclusivas, qué significa "junto a", cómo se deduce el asesino. |
| [`architecture.md`](./architecture.md) | Capas del código, el modelo de datos (`Puzzle` como contrato único), flujo de datos UI↔dominio. |
| [`procedural-generator.md`](./procedural-generator.md) | Cómo funciona el generador de casos: solver, generador de salas, selección de pistas — y los dos bugs reales que se encontraron construyéndolo. |
| [`persistence.md`](./persistence.md) | Guardado/retomado de partidas: por qué IndexedDB y no SQLite, por qué no se guarda el `Puzzle` completo, y la trampa de `DataCloneError` con estado reactivo de Pinia. |
| [`testing-and-tooling.md`](./testing-and-tooling.md) | Cómo correr tests y scripts, y qué comprueba cada uno. |
| [`pwa-mobile-capacitor.md`](./pwa-mobile-capacitor.md) | PWA offline, HTTPS local para probar en el móvil (con la trampa de `mkcert`), Capacitor/Android. |
| [`visual-design.md`](./visual-design.md) | El sistema de sprites pixel-art generados por código, y por qué no se usó un pack de terceros. |
| [`decisions.md`](./decisions.md) | Registro de decisiones: qué se descartó (Hexagonal/DDD/Atomic Design formales) y por qué, mapeo dificultad→tamaño, reglas de colaboración con el usuario. |

## Estado a fecha de este commit

- La pantalla de inicio muestra **tus partidas guardadas** (generadas por ti, en
  progreso o resueltas), no una lista fija de casos de ejemplo.
- 2 casos hechos a mano (`src/data/puzzles/`) siguen existiendo como fixtures de
  tests, pero ya no se listan en la pantalla de inicio.
- Generador procedural funcional para las 5 dificultades (6x6 hasta 12x12), con
  autoguardado en cada jugada (IndexedDB) — ver [`persistence.md`](./persistence.md).
- 44 tests (`npx vitest run`), todos en verde.
- PWA instalable y funcional offline (`npm run build && npm run preview`, o
  `npm run dev -- --host` para probar en el móvil por la red local).
