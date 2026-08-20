# The Guest List

Un juego de lógica tipo "misterio de asesinato": coloca a cada sospechoso en una
cuadrícula (una fila y una columna por persona) siguiendo sus pistas, hasta descubrir
quién compartía sala con la víctima. Ese es el asesino.

Vue 3 + TypeScript + Vite. PWA instalable y funcional sin conexión, con un generador
procedural de casos y guardado automático de partidas.

El diseño del tablero está inspirado en el juego de lógica
[Murdoku](https://murdoku.com/), de Manuel Garand — código, arte y casos son
originales.

📖 Documentación técnica en [`docs/`](./docs/README.md).

## Desarrollo

```bash
npm install
npm run dev
```

```bash
npx vitest run   # tests
npm run build    # build de producción
```
