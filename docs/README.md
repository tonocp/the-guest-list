# The Guest List — documentación

Juego de lógica "misterio de asesinato": coloca a cada sospechoso en una cuadrícula
siguiendo pistas de texto, hasta deducir quién compartía sala con la víctima. Vue 3 +
TypeScript, empaquetado como PWA instalable y offline.

| Documento | Contenido |
|---|---|
| [`for-agents.md`](./for-agents.md) | Mapa denso del repo: invariantes, dónde está cada cosa, trampas conocidas. Entrada para un agente. |
| [`game-rules.md`](./game-rules.md) | Reglas del juego: salas no exclusivas, "junto a", cómo se deduce el asesino. |
| [`architecture.md`](./architecture.md) | Capas del código y el contrato `Puzzle`. |
| [`procedural-generator.md`](./procedural-generator.md) | El generador de casos: solver, regiones, mobiliario, pistas. |
| [`persistence.md`](./persistence.md) | Guardado/retomado de partidas (IndexedDB). |
| [`testing-and-tooling.md`](./testing-and-tooling.md) | Tests y scripts. |
| [`pwa-mobile.md`](./pwa-mobile.md) | PWA offline y pruebas en el móvil. |
| [`visual-design.md`](./visual-design.md) | Sprites pixel-art generados por código. |
