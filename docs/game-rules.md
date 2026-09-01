# Reglas del juego

## Mecánica central

Tablero N×N, N sospechosos, uno por celda. **Cada fila y cada columna tienen
exactamente un sospechoso** (matriz de permutación) — la **única** restricción dura de
colocación.

El tablero se divide en N "salas" (regiones irregulares conexas de N celdas). **Las
salas no son exclusivas**: varios sospechosos pueden compartir sala.

## Por qué importan las salas

Como cada sospechoso tiene fila y columna únicas, dos sospechosos nunca están en celdas
ortogonalmente adyacentes. Por eso la única forma de que dos sospechosos estén "junto
a" es **compartir sala**, aunque sus celdas estén en extremos opuestos de una sala
irregular.

```
junto_a(A, B) ⟺ adyacentes_ortogonalmente(A, B) ∨ misma_sala(A, B)
```

La proximidad a un mueble («pegado a») también exige misma sala: una celda contigua a
un mueble pero en la sala de al lado **no** cuenta. Ninguna relación de proximidad
cruza el borde de una sala.

## Tipos de pista

| Tipo | Significado | Ejemplo |
|---|---|---|
| Sala | El sospechoso está en una sala concreta. | "Estaba en la Sala de Disfraces." |
| Dirección | Fila/columna respecto a otro sospechoso. | "Estaba al sur de Marcus." |
| Junto a otro | Dos sospechosos comparten sala. | "Estaba junto a Nora." |
| Sobre mueble | La celda del sospechoso es la del mueble (o una de sus celdas). El texto siempre lo sitúa *sobre* el mueble. | "Estaba sentado en una silla." |
| Pegado a mueble | Celda del mueble o una contigua, **dentro de la misma sala** (puede negarse). | "Estaba pegado a un jarrón." / "No estaba pegado…" |

## Víctima y asesino

La víctima es un sospechoso más, colocado en el tablero, **sin pista propia**: se
deduce por eliminación. El asesino es quien comparte sala con la víctima en la
solución.

## Interacción

- Tocar tarjeta → selecciona; tocar celda → coloca (o quita si ya hay alguien).
- Dos sospechosos en la misma fila/columna: conflicto visual, no bloquea la jugada.
- "Pista" revela la posición correcta de un sospechoso.
- El caso se resuelve solo al colocar a todos correctamente.
