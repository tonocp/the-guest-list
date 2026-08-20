# The Guest List

Un juego de lógica tipo "misterio de asesinato": coloca a cada sospechoso en una
cuadrícula (una fila y una columna por persona) siguiendo sus pistas, hasta descubrir
quién compartía sala con la víctima. Ese es el asesino.

## Características

- Generador procedural de casos, en 5 niveles de dificultad (6×6 a 12×12)
- PWA instalable, funcional sin conexión
- Guardado automático de partidas
- Arte pixel-art generado por código, sin assets de terceros

Construido con Vue 3 + TypeScript + Vite + Pinia.

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

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
