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

Entre mobiliario y sospechosos sí puede darse la rama de adyacencia ortogonal (un
sospechoso junto a una planta en la celda de al lado, sin compartir sala) — pero entre
dos *sospechosos*, solo por sala compartida.

## Tipos de pista

| Tipo | Significado | Ejemplo de texto |
|---|---|---|
| Sala | El sospechoso está en una sala concreta. | "Estaba en la Sala de Disfraces." |
| Dirección | Comparación de fila o columna respecto a otro sospechoso. | "Estaba al sur de Marcus." |
| Junto a otro | Dos sospechosos comparten sala. | "Estaba junto a Nora." |
| Sobre mueble | La celda del sospechoso tiene ese mueble. | "Estaba sentado en una silla." |
| Cerca de mueble | La celda del sospechoso está "junto a" una celda con ese mueble (puede negarse). | "Estaba junto a un perchero." / "No estaba junto a un perchero." |

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
