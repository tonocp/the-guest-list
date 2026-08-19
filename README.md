# MurDoku

MVP de un juego de lógica estilo "sudoku de misterio": coloca a cada sospechoso en la
cuadrícula (una fila y una columna por persona) siguiendo sus pistas, hasta descubrir
quién compartía sala con la víctima. Ese es el asesino.

Vue 3 + TypeScript + Vite, pensado como PWA instalable y offline, con Capacitor listo
para empaquetar como app nativa más adelante.

## Reglas del juego

- Tablero N x N con **una persona por fila y una por columna** (como un tablero de N torres/permutación).
- El tablero se divide en N **salas** de forma irregular. Las salas **no son exclusivas**:
  varios sospechosos pueden compartir sala.
- "Junto a" significa: casilla ortogonalmente adyacente (arriba/abajo/izq/dcha), **o**
  compartir sala (aunque no se toquen).
- Cada sospechoso tiene una pista de texto (sala, mueble, dirección relativa a otro sospechoso...).
- La víctima no necesita pista propia: se deduce por eliminación. El asesino es quien
  acaba compartiendo sala con la víctima en la solución.

El motor de reglas vive en `src/lib/gridLogic.ts` y los datos de cada caso en
`src/data/puzzles/*.ts` (tipos en `src/types/puzzle.ts`).

### Verificar que un puzzle tiene solución única

```bash
npx tsx scripts/verify-puzzle.ts
```

Hace una búsqueda por fuerza bruta de todas las colocaciones posibles y confirma que
solo una cumple todas las reglas del caso (y que coincide con la solución guardada).
Ejecútalo siempre que añadas o edites un puzzle.

## Desarrollo

```bash
npm install
npm run dev -- --host
```

`--host` expone el servidor en tu red local para poder abrirlo desde el móvil.

### HTTPS local (necesario para Service Worker/PWA fuera de localhost)

El proyecto usa `vite-plugin-mkcert` para servir por HTTPS en local. La primera vez
tienes que confiar en su CA manualmente (requiere contraseña de administrador, así que
hazlo tú mismo en una terminal, no vía un asistente sin sesión interactiva):

```bash
sudo env CAROOT=$HOME/.vite-plugin-mkcert $HOME/.vite-plugin-mkcert/mkcert -install
```

⚠️ Importante: si usas `sudo mkcert -install` sin el `env CAROOT=...`, sudo resetea el
`$HOME` y se instala una CA en el sitio equivocado (no la que espera el plugin). Usa el
comando de arriba tal cual.

### Probar en el móvil (misma red Wi-Fi)

1. `npm run dev -- --host`
2. Copia la URL "Network" que imprime Vite (algo como `https://192.168.1.x:5173`).
3. Ábrela en el navegador del móvil. La primera vez el certificado no será de confianza
   para el móvil (solo lo es en este Mac) — acepta el aviso de "sitio no seguro" para
   seguir probando.
4. Menú del navegador → **Añadir a pantalla de inicio** / **Instalar app** para probarla
   como PWA instalada y offline.

## Build de producción

```bash
npm run build      # genera dist/ con Service Worker (Workbox) precacheando la app
npm run preview    # sirve dist/ para probar el build final
```

## Capacitor (app nativa)

Ya está inicializado con la plataforma Android (`android/`). Para sincronizar el build
web más reciente dentro del proyecto nativo:

```bash
npm run build
npx cap sync android
npx cap open android   # abre Android Studio
```

Necesitas Android Studio con el SDK configurado (`ANDROID_HOME`) para compilar/ejecutar
desde ahí. iOS (`npx cap add ios`) es posible en este Mac ya que tiene Xcode instalado,
pero no se ha añadido todavía.

## Estructura

```
src/
  types/puzzle.ts       tipos del modelo de datos de un caso
  lib/gridLogic.ts       reglas del juego (adyacencia, conflictos, asesino)
  lib/furnitureIcons.ts  emojis para el mobiliario de las celdas
  data/puzzles/          casos jugables (uno por archivo) + registro
  stores/puzzleStore.ts  estado de la partida (Pinia)
  components/            tablero, tarjetas de sospechosos, barra de herramientas, modal de victoria
  views/                 lista de casos y vista de juego
scripts/
  verify-puzzle.ts       verificador de unicidad de solución (fuerza bruta)
  gen-icons.mjs           genera los iconos PWA a partir de un SVG generado por código
```
