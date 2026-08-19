# Reglas del juego

## La mecánica central

Tablero N×N. Hay N sospechosos y cada uno ocupa exactamente una celda, con la
restricción de que **cada fila tiene exactamente un sospechoso y cada columna
exactamente un sospechoso** — es una colocación tipo "N torres" / matriz de
permutación, no un sudoku de números. Esta es la **única** restricción dura de
colocación.

El tablero también está dividido en N "salas" (regiones irregulares y conexas de N
celdas cada una). Esto es fácil de malinterpretar, así que se explícito:

> **Las salas NO son exclusivas.** Varios sospechosos pueden compartir sala. No hay
> ninguna regla de "una sala, un sospechoso".

## Por qué las salas no son exclusivas (y por qué importa)

Dado que cada sospechoso tiene fila y columna únicas, **dos sospechosos nunca pueden
estar en celdas ortogonalmente adyacentes** — eso requeriría que compartan fila o
columna, ambas cosas prohibidas. Es una consecuencia matemática directa de la regla de
colocación, no una decisión de diseño aparte.

Esto significa que la única forma en que dos sospechosos pueden estar "junto a" el
otro es **compartiendo sala**, incluso si sus celdas están en extremos opuestos de una
sala con forma irregular (ej. una sala en forma de L). Por eso las salas existen: no
solo como sabor visual, sino como el único mecanismo que permite la relación "junto a"
entre personas.

Definición exacta (`isNextTo` en [`src/lib/gridLogic.ts`](../src/lib/gridLogic.ts)):

```
junto_a(A, B) ⟺ adyacentes_ortogonalmente(A, B) ∨ misma_sala(A, B)
```

La rama de adyacencia ortogonal está ahí por completitud del concepto general "junto
a" (y se usa para las pistas de mobiliario: un sospechoso puede estar junto a una
planta que está en una celda ortogonalmente contigua, sin compartir sala) — pero entre
dos *sospechosos*, nunca se puede satisfacer más que por la vía de sala compartida.

## Tipos de pista

Definidos como `ClueRule` en [`src/types/puzzle.ts`](../src/types/puzzle.ts):

| Tipo | Significado | Ejemplo de texto |
|---|---|---|
| `room` | El sospechoso está en una sala concreta. | "Estaba en la Sala de Disfraces." |
| `direction` | Comparación de fila O columna (no ambas) respecto a otro sospechoso — no implica adyacencia, solo desigualdad. | "Estaba al sur de Marcus." |
| `adjacent` | Dos sospechosos comparten sala (ver arriba — nunca por contacto ortogonal). | "Estaba junto a Nora." |
| `on-furniture` | La celda propia del sospechoso tiene ese mueble. Como cada tipo de mueble aparece como mucho una vez por caso, esto ancla a una única celda. | "Estaba sentado en una silla." |
| `near-furniture` | La celda del sospechoso está "junto a" (ver definición arriba) una celda con ese mueble. Puede negarse (`negate: true`). | "Estaba junto a una ventana." / "No estaba junto a una ventana." |

## La víctima y el asesino

La víctima es un sospechoso más, colocado en el tablero como cualquier otro, pero
**sin pista propia** — su tarjeta siempre dice "La víctima. Estaba a solas con el
asesino." Su posición se deduce por eliminación: una vez colocados (o deducidos) todos
los demás, solo queda una fila y una columna libres.

El asesino es, por definición, **quien comparte sala con la víctima en la solución**
(`getMurderer` en `gridLogic.ts`). Para que esto esté bien definido, la sala de la
víctima debe tener **exactamente dos ocupantes** en la solución (la víctima + el
asesino) — si tuviera 0, 1 extra o más, `getMurderer` (que usa `.find()`) devolvería
`undefined` o un resultado arbitrario. Esta invariante se aplica explícitamente en el
generador procedural (`victim.ts`, ver [`procedural-generator.md`](./procedural-generator.md)).

## Interacción en la app

- Tocar una tarjeta de sospechoso lo selecciona.
- Tocar una celda coloca al sospechoso seleccionado ahí; si la celda ya tiene a
  alguien, lo quita.
- Colocar dos sospechosos en la misma fila o columna se marca visualmente como
  conflicto (halo rojo) pero no bloquea la jugada — es solo ayuda visual.
- "Pista" revela la posición correcta de un sospechoso sin colocar (o mal colocado).
- El caso se resuelve automáticamente en cuanto todos los sospechosos están colocados
  en su posición correcta — no hay un botón "Enviar" explícito.
