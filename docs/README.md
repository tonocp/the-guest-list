# The Guest List — documentación

The Guest List es un juego de lógica tipo "misterio de asesinato": coloca a cada
sospechoso en una cuadrícula siguiendo pistas de texto, hasta deducir quién compartía
sala con la víctima. App Vue 3 + TypeScript, empaquetada como PWA instalable y
offline.

## Índice

| Documento | Contenido |
|---|---|
| [`for-agents.md`](./for-agents.md) | Mapa denso del repo: invariantes, dónde está cada cosa. Punto de entrada para un agente de IA. |
| [`game-rules.md`](./game-rules.md) | Las reglas del juego: por qué las salas no son exclusivas, qué significa "junto a", cómo se deduce el asesino. |
| [`architecture.md`](./architecture.md) | Capas del código, el modelo de datos (`Puzzle` como contrato único). |
| [`procedural-generator.md`](./procedural-generator.md) | Cómo funciona el generador de casos: solver, generador de salas, selección de pistas. |
| [`persistence.md`](./persistence.md) | Guardado/retomado de partidas: modelo de datos y ciclo de vida. |
| [`testing-and-tooling.md`](./testing-and-tooling.md) | Cómo correr tests y scripts. |
| [`pwa-mobile.md`](./pwa-mobile.md) | PWA offline y cómo probar en el móvil. |
| [`visual-design.md`](./visual-design.md) | El sistema de sprites pixel-art generados por código. |
