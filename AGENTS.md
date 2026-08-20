# AGENTS.md

Instrucciones para cualquier agente de IA (Claude, Codex, Cursor, etc.) que trabaje en
este repositorio. Léelas antes de tocar código.

## Por dónde empezar

**[`docs/for-agents.md`](./docs/for-agents.md) primero** — es el mapa denso de
contexto: invariantes del juego, mapa de archivos, trampas ya resueltas, comandos de
verificación. Este archivo (`AGENTS.md`) añade las reglas de comportamiento que se
aplican por encima de ese contexto; no lo duplica.

Resto de la documentación, según lo que vayas a tocar:

- [`docs/game-rules.md`](./docs/game-rules.md) — mecánica del juego
- [`docs/architecture.md`](./docs/architecture.md) — capas, `Puzzle` como contrato único
- [`docs/procedural-generator.md`](./docs/procedural-generator.md) — pipeline del
  generador de casos
- [`docs/persistence.md`](./docs/persistence.md) — guardado/retomado de partidas
  (IndexedDB), por qué no se guarda el `Puzzle` completo
- [`docs/testing-and-tooling.md`](./docs/testing-and-tooling.md) — tests y scripts
- [`docs/pwa-mobile.md`](./docs/pwa-mobile.md) — PWA/offline/móvil
- [`docs/visual-design.md`](./docs/visual-design.md) — sistema de sprites

No se documenta nada sobre infraestructura de despliegue (dónde ni cómo se hostea) —
el repo es público, esa información no vive aquí.

## Reglas de arquitectura (no negociables sin volver a debatirlo con el usuario)

- `src/lib/` es lógica de dominio pura: **cero imports de Vue, Pinia o cualquier
  framework de UI**. Todo lo que toque reglas del juego (grid, solver, generador) vive
  ahí, no en componentes ni en el store.
- `Puzzle` (`src/types/puzzle.ts`) es el contrato único entre dominio y UI. Cualquier
  código que produzca un `Puzzle` válido es intercambiable — hecho a mano o generado —
  nada aguas abajo debe tratar uno distinto del otro.
- Dirección de dependencia estricta y en un solo sentido:
  `types/` ← `lib/` ← `data/` ← `stores/` ← `views/`+`components/`. Nunca importar
  hacia arriba.
- Toda decisión aleatoria dentro del generador procedural debe salir del RNG con
  semilla (`src/lib/rng.ts`), nunca de `Math.random()` — si no, se rompe la
  reproducibilidad por semilla.
- **No apliques Arquitectura Hexagonal formal (carpetas `ports/`/`adapters/`), DDD
  táctico (agregados, repositorios, domain events), TDD estricto con orden
  test-primero dogmático, ni Atomic Design (taxonomía de componentes atoms/molecules/
  organisms).** Esto se debatió explícitamente con el usuario y se rechazó por ser
  ceremonia sin beneficio a esta escala. Mantén el principio de fondo (dominio puro y
  testable, cobertura de tests real, componentes organizados con sentido) sin la
  ceremonia formal, salvo que el usuario reabra la discusión explícitamente.
  **Excepción ya realizada**: `src/lib/persistence/` (`GameRepository`) es un puerto
  con un único adapter (IndexedDB), para el guardado de partidas. No la uses como
  precedente para meter puertos/adapters en ningún otro sitio de la app sin el mismo
  debate explícito.

## Prácticas de código

- Sin código muerto, sin abstracciones especulativas, sin comentarios que expliquen el
  QUÉ (los identificadores ya lo hacen) — solo el PORQUÉ cuando de verdad no es obvio.
  Mira los comentarios existentes en `src/lib/solver.ts` y `src/lib/generator/*.ts`
  como referencia de densidad y estilo esperados.
- No añadas manejo de errores ni validaciones para escenarios que no pueden ocurrir;
  confía en las invariantes internas ya documentadas.
- Antes de tocar `solver.ts`, `gridLogic.ts` o cualquier cosa en `generator/`, relee
  [`docs/procedural-generator.md`](./docs/procedural-generator.md) — varias decisiones
  ahí (por qué nunca se seleccionan pistas binarias, por qué existe el tope de nodos)
  son el resultado de fallos medidos, no de preferencia estética.
- Tras tocar el pipeline del generador, corre `npx tsx scripts/stress-generate.ts`
  además de `npx vitest run` — los tests solo cubren un puñado de semillas fijas.
- Sin dependencias externas de CDN/fuentes web — la app tiene que seguir funcionando
  100% offline como PWA instalada.

## Cómo trabajar con el usuario

- **Nunca hagas `git commit` de nada, bajo ninguna circunstancia.** Regla dura para
  este proyecto, más estricta que el default habitual de "confirma antes de acciones
  destructivas". Si el usuario quiere que algo se commitee, lo hace él mismo, o tiene
  que decirlo explícitamente en ese momento — una autorización pasada no se acumula.
- **Sé crítico, no complaciente.** Cuando el usuario proponga un enfoque
  arquitectónico, cuestiónalo con argumentos concretos si no estás de acuerdo — no lo
  valides sin más. Basa las objeciones en comportamiento medible o en trade-offs
  específicos, no en preferencia vaga.
- **Aplica metodología socrática en las decisiones de arquitectura**: saca a la luz el
  razonamiento con preguntas concretas (¿cuántos adapters reales vas a tener? ¿qué
  escala real tiene esto?) en vez de sermonear o estar de acuerdo por defecto. Esto
  aplica "en todos los pasos", no es una petición de una sola vez — trátalo como
  comportamiento estándar en este proyecto.
- Cuando una decisión de diseño en este código parezca arbitraria, probablemente no lo
  sea — revisa `docs/procedural-generator.md` antes de asumir que se puede
  simplificar; varias simplificaciones "obvias" (pistas binarias en casos generados,
  búsqueda sin cinturón de seguridad) ya se probaron y fallaron.

## Mantener la documentación al día

Un cambio de funcionalidad sin su documentación actualizada **no está terminado**,
aunque el código funcione y los tests pasen.

- Cualquier cambio que toque reglas del juego, arquitectura, el pipeline del
  generador, tooling/tests, PWA/móvil o el sistema visual actualiza el documento
  correspondiente de `docs/` **en el mismo cambio**, no como tarea pendiente para
  después.
- El repo es público y `docs/` es documentación de producto/arquitectura, no un diario
  de debate interno: cuando un cambio corrija un bug o revierta una decisión previa,
  actualiza el documento afectado para que refleje el estado y el motivo actuales en
  una o dos frases — sin narrar el proceso de depuración ni cifras de benchmarks
  concretas, salvo que sea una invariante que de verdad haga falta conocer para no
  reintroducir el mismo bug (ver "Trampas conocidas" en `docs/for-agents.md` como
  referencia de nivel de detalle apropiado).
- No documentes nada sobre infraestructura de despliegue (proveedor, dominio,
  configuración de hosting) en ningún archivo del repo — el repo es público.
- Si el cambio añade, quita o mueve un archivo/patrón relevante, actualiza el "Mapa de
  archivos" y las "Trampas conocidas" de [`docs/for-agents.md`](./docs/for-agents.md)
  para que sigan siendo precisos.
- Si el cambio afecta a un comando (test, build, script), confirma que los bloques de
  comandos en `README.md`, este archivo y `docs/testing-and-tooling.md` siguen siendo
  correctos.
- Prefiere actualizar un documento existente a crear uno nuevo — solo crea un archivo
  nuevo en `docs/` si de verdad es un tema distinto a todo lo que ya existe, y enlázalo
  desde `docs/README.md` y desde "Por dónde empezar" arriba.

## Verificación antes de dar algo por terminado

```bash
npx vitest run                        # 44 tests, deben pasar todos
npx tsx scripts/verify-puzzle.ts      # los 2 casos hechos a mano, deben salir UNIQUE ✔
npx tsx scripts/stress-generate.ts    # generador: ~150/150, rápido incluso en experto
npm run build                         # vue-tsc -b && vite build, sin errores de tipos
```
