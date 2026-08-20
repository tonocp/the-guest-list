# Registro de decisiones

Decisiones que no son obvias mirando solo el código actual — el qué se descartó y por
qué, para no volver a proponerlo sin motivo ni repetir el mismo debate.

## Reglas de colaboración con el usuario (durables, no solo de una sesión)

- **Nunca hacer commit de nada**, bajo ninguna circunstancia, salvo petición explícita
  del usuario en el momento. Regla dura para este proyecto, más estricta que el
  comportamiento por defecto habitual.
- El usuario pide explícitamente **postura crítica y metodología socrática** en cada
  paso de decisiones de arquitectura — no asumir que "sí" es la respuesta esperada;
  cuestionar con preguntas concretas y dar una recomendación razonada, no solo opciones.

## Renombrado de MurDoku a The Guest List (riesgo de marca)

El proyecto se llamó "MurDoku" hasta que se investigó el nombre antes de plantear
publicarlo en un portfolio: "Murdoku" no es solo la web de referencia que inspiró la
mecánica — es una serie de libros de puzzles de Manuel Garand (Workman/Hachette,
bestseller de USA Today y Publishers Weekly), y hay una solicitud de marca activa en
la USPTO (expediente 99677726, "Studios Digivoid Inc.") que cubre explícitamente
**software de juegos de lógica** — la misma categoría de este proyecto, no un
solapamiento tangencial.

Se descartó mantener el nombre para cualquier uso público (portfolio, tiendas de
apps). Se renombró a **"The Guest List"** — sin ningún parecido lingüístico con
"Murdoku"/"Sudoku" (se evitó deliberadamente cualquier patrón "-doku", que es
justo el tipo de construcción que causó el problema) ni con otras marcas del género
detectadas de paso ("Clue"/"Cluedo" es de Hasbro, "Sherlock" tiene marca asociada).

**La mecánica del juego en sí nunca fue el problema** — las reglas/sistemas no son
propiedad intelectual protegible, solo el nombre de marca lo era. Por eso el
`README.md` raíz incluye una mención de inspiración factual y puntual a Murdoku
(uso nominativo/referencial, no usar su nombre en branding/SEO/marketing propios).

Quedan como referencia histórica del nombre anterior: el repositorio de GitHub
(`tonocp/MurDoku`, pendiente de renombrar por el usuario) y cualquier commit previo
al cambio.

## Arquitectura: se rechazó Hexagonal/DDD/TDD estricto/Atomic Design formales

El usuario propuso aplicar Arquitectura Hexagonal, DDD, TDD y Atomic Design "para
minimizar el acoplamiento". La respuesta (aceptada por el usuario tras el debate) fue
rechazar la aplicación formal de las cuatro, manteniendo el *principio* subyacente sin
la ceremonia:

- **Hexagonal**: el proyecto ya tiene la sustancia (dominio puro en `src/lib/`, cero
  imports de framework) sin necesitar carpetas `ports/`/`adapters/` formales — solo
  hay un adapter real (Vue+Pinia; Capacitor no cuenta como uno distinto). Formalizarlo
  sería papeleo sin beneficio a esta escala. *(Actualización: el guardado de partidas
  sí se convirtió en un puerto real más adelante — ver más abajo, "Puerto de
  persistencia". No cambia el rechazo del resto: sigue siendo la única excepción.)*
- **DDD**: es un dominio pequeño y cohesionado, no varios "bounded contexts" — se
  mantiene el lenguaje ubicuo (`Suspect`, `Room`, `ClueRule`...) que ya existía, sin
  agregados/repositorios/domain events formales.
- **TDD estricto**: se mantiene cobertura de tests seria sobre la capa de dominio
  (ver `testing-and-tooling.md`), pero sin dogma de test-primero en cada línea durante
  la fase exploratoria de diseñar el generador — el propio Kent Beck advierte que el
  TDD estricto puede atar a un diseño prematuro cuando la forma del algoritmo todavía
  está cambiando.
- **Atomic Design**: taxonomía pensada para decenas de componentes en un design
  system de equipo. Con ~5 componentes, forzar carpetas `atoms/molecules/organisms`
  es ceremonia sin beneficio — y no toca para nada el acoplamiento real motor↔UI, que
  ya está resuelto por el hecho de que `BoardGrid.vue` no reimplementa reglas.

Si el proyecto crece mucho (30+ componentes reutilizados en contextos distintos,
múltiples adapters reales), reconsiderar entonces — no antes.

## Mapeo dificultad → tamaño de tablero

muy-fácil = 6×6, fácil/medio/difícil = 9×9, experto = 12×12. Es un mapeo simplificado
elegido por el usuario, **no** una descripción de lo que hace la web de referencia
(murdoku.com) en la práctica — esa mezcla tamaños dentro de cada nivel de dificultad
(muy fácil va de 5x5 a 6x6, fácil de 6x6 a 9x9, etc.). Este proyecto usa el mapeo fijo
de arriba, ver `SIZE_BY_DIFFICULTY` en `src/lib/generator/generatePuzzle.ts`.

## Mobiliario multi-celda: fuera de alcance de v1, pero con nota de diseño

El usuario pidió explícitamente tener en cuenta que mobiliario como alfombras o sofás
pueda ocupar varias celdas, incluyendo formas en L (esquina) — pero solo **de cara al
futuro del generador procedural**, no como requisito de la v1 actual.

El modelo de datos actual (`Cell.furniture?: FurnitureType`, una pieza por celda) no
lo soporta. Cuando se aborde:

- Cambiar a `FurniturePiece { id, type, cells: Position[] }` en vez de por-celda, con
  un lookup `getFurnitureAt(row, col)`.
- Las reglas `on-furniture`/`near-furniture` (`src/lib/solver.ts`,
  `src/lib/gridLogic.ts`) tendrían que comprobar contra *cualquier* celda de la huella
  de la pieza, no una sola.
- Una huella no rectangular (en L) necesita arte específico por forma o un sistema de
  autotile (piezas de borde/esquina/centro que encajan según celdas vecinas ocupadas
  por la misma pieza) — un sprite fijo 16×16 por tipo (el enfoque actual de
  `gen-sprites.mjs`) no cubre esto.
- Por sensatez, cada pieza debería quedarse dentro de una sola sala salvo que se
  quiera deliberadamente que cruce un límite de sala.

## Puerto de persistencia: IndexedDB, no SQLite — la excepción a Hexagonal, activada

El usuario pidió guardar/retomar partidas (casos generados a medias o resueltos) y
propuso SQLite + arquitectura hexagonal "para no acoplarnos a una sola capa de
persistencia". Se rechazó SQLite específicamente, se aceptó el puerto:

- **SQLite descartado**: lo que hay que persistir es una lista de registros sin
  ninguna consulta relacional — el caso de uso nativo de IndexedDB (integrado en el
  navegador, cero coste de bundle). SQLite en web implica WASM (1-2MB+), o un plugin
  nativo de Capacitor que no funciona en el navegador — la vía principal de prueba de
  esta app — obligando a mantener dos implementaciones para una necesidad inexistente.
- **Puerto `GameRepository` aceptado**: no es una reversión del rechazo de Hexagonal
  de arriba — es exactamente la excepción que ya se había anticipado en ese mismo
  debate ("el único sitio donde sí le veo valor futuro es el guardado de progreso...
  ahí un puerto de repositorio pagaría su precio"). Un puerto, un único adapter
  concreto (IndexedDB), sin ceremonia adicional.
- Detalle completo, incluyendo por qué no se guarda el `Puzzle` completo (se
  reconstruye por semilla) y el bug de `DataCloneError` encontrado al construirlo: ver
  [`persistence.md`](./persistence.md).

## Reskin visual: pixel-art propio en vez de un pack de terceros

Ver [`visual-design.md`](./visual-design.md) para el razonamiento completo — en
resumen, evita dudas de licencia dentro de una PWA offline y el permiso explícito que
requeriría descargar un asset pack externo.

## Layout móvil: CSS Grid de áreas nombradas, no duplicar componentes

`PlayView.vue` reordena tablero/sospechosos/acciones entre móvil y escritorio usando
`grid-template-areas` distinto por media query, con una única instancia de cada
componente — la alternativa (renderizar el tablero o la lista de sospechosos dos
veces, una oculta por CSS según el breakpoint) se descartó por duplicar DOM y estado
sin necesidad real.
