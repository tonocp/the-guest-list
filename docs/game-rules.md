# Reglas del juego

## La mecánica central

Tablero N×N. Hay N sospechosos y cada uno ocupa exactamente una celda, con la
restricción de que **cada fila tiene exactamente un sospechoso y cada columna
exactamente un sospechoso** — es una colocación tipo "N torres" / matriz de
permutación, no un sudoku de números. Es la **única** restricción dura de colocación.

El tablero también está dividido en N "salas" (regiones irregulares y conexas de N
celdas cada una). **Las salas no son exclusivas**: varios sospechosos pueden
compartir sala, no hay ninguna regla de "una sala, un sospechoso".

## Por qué las salas importan

Dado que cada sospechoso tiene fila y columna únicas, dos sospechosos nunca pueden
estar en celdas ortogonalmente adyacentes — requeriría compartir fila o columna,
ambas cosas prohibidas. Por eso la única forma en que dos sospechosos pueden estar
"junto a" el otro es **compartiendo sala**, incluso si sus celdas están en extremos
opuestos de una sala con forma irregular.

```
junto_a(A, B) ⟺ adyacentes_ortogonalmente(A, B) ∨ misma_sala(A, B)
```

La proximidad a un mueble («pegado a», ver tabla) también exige compartir sala con él:
una celda ortogonalmente contigua a un mueble pero en la sala de al lado **no** cuenta.
Ninguna relación de proximidad del juego cruza el borde de una sala.

## Tipos de pista

| Tipo | Significado | Ejemplo de texto |
|---|---|---|
| Sala | El sospechoso está en una sala concreta. | "Estaba en la Sala de Disfraces." |
| Dirección | Comparación de fila o columna respecto a otro sospechoso. | "Estaba al sur de Marcus." |
| Junto a otro | Dos sospechosos comparten sala. | "Estaba junto a Nora." |
| Sobre mueble | La celda del sospechoso es la del mueble (o una de sus celdas, si ocupa varias). El texto siempre sitúa a la persona *sobre* el mueble, nunca a su lado. | "Estaba sentado en una silla." / "Estaba apoyado en un piano de cola." |
| Pegado a mueble | La celda del sospechoso es la del mueble o una ortogonalmente contigua, **dentro de la misma sala** (puede negarse). | "Estaba pegado a un jarrón." / "No estaba pegado a un jarrón." |

## La víctima y el asesino

La víctima es un sospechoso más, colocado en el tablero, pero **sin pista propia** —
su posición se deduce por eliminación una vez colocados todos los demás. El asesino
es quien comparte sala con la víctima en la solución.

## Interacción en la app

- Tocar una tarjeta de sospechoso lo selecciona; tocar una celda lo coloca ahí (o lo
  quita, si la celda ya tiene a alguien).
- Colocar dos sospechosos en la misma fila o columna se marca como conflicto visual,
  sin bloquear la jugada.
- "Pista" revela la posición correcta de un sospechoso.
- El caso se resuelve automáticamente al colocar a todos correctamente.
