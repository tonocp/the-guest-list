# PWA, offline y pruebas en el móvil

El objetivo del proyecto incluye explícitamente: instalable como PWA, funcional
offline, y testeable en local desde un móvil real — no solo "es una web".

## PWA offline

`vite-plugin-pwa` (Workbox, `vite.config.ts`), `registerType: 'autoUpdate'`. El build
de producción precachea todo el app shell + los sprites (`npm run build` reporta
cuántas entradas — última cifra conocida: 30 entradas, ~193KB). Para probar el
comportamiento real del service worker (no el de `vite dev`, que es más ligero):

```bash
npm run build
npm run preview
```

**No se usa ninguna fuente de Google Fonts ni CDN externa** — es una decisión
deliberada por el requisito de offline. Los títulos usan una clase `.pixel-heading`
(en `src/style.css`) que imita un look "pixel UI" solo con CSS (monoespaciada,
mayúsculas, sombra dura sin blur) en vez de cargar una webfont.

⚠️ **Trampa al depurar en local**: el Service Worker de desarrollo
(`devOptions.enabled: true`, activado a propósito para que las pruebas en el móvil se
comporten como producción) puede servir una versión **cacheada** de un módulo aunque
el archivo fuente ya esté corregido — ni una recarga normal lo nota, el bug parece no
arreglarse. Si sospechas esto, en la consola del navegador:

```js
;(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister())
;(await caches.keys()).forEach(k => caches.delete(k))
```

y recarga. Costó tiempo real de depuración confundirlo con un bug de código durante el
desarrollo de [`persistence.md`](./persistence.md) — si un fix "no hace efecto" en el
navegador, comprueba esto antes de seguir buscando en el código.

## HTTPS local (necesario para Service Worker fuera de `localhost`)

El proyecto usa `vite-plugin-mkcert`. La primera vez hay que confiar en su CA
manualmente — **hazlo tú mismo en una terminal interactiva**, no delegable a un
agente sin sesión interactiva (pide contraseña de administrador):

```bash
sudo env CAROOT=$HOME/.vite-plugin-mkcert $HOME/.vite-plugin-mkcert/mkcert -install
```

⚠️ **La trampa real**: `sudo mkcert -install` (sin el `env CAROOT=...`) hace que
`sudo` resetee `$HOME`, y la CA se instala en la ubicación por defecto de mkcert
(`~/Library/Application Support/mkcert`) — que **no** es la que espera el plugin
(`~/.vite-plugin-mkcert`). El síntoma es que el servidor de desarrollo sigue fallando
al arrancar con HTTPS aunque "ya hayas ejecutado mkcert -install". Usa el comando de
arriba tal cual, con el `env CAROOT=...` incluido.

## Probar en el móvil (misma red Wi-Fi)

1. `npm run dev -- --host`
2. Copia la URL "Network" que imprime Vite (tipo `https://192.168.1.x:5173`).
3. Ábrela en el navegador del móvil. El certificado no será de confianza para el
   móvil (solo lo es en el Mac donde se generó) — acepta el aviso para seguir.
4. Menú del navegador → "Añadir a pantalla de inicio" / "Instalar app" para probarla
   como PWA instalada, y comprobar que sigue funcionando en modo avión.

## Capacitor (envoltorio nativo)

Ya inicializado con la plataforma Android (`android/`, `capacitor.config.ts`).

```bash
npm run build
npx cap sync android
npx cap open android   # abre Android Studio
```

Compilar/ejecutar desde Android Studio requiere el SDK configurado (`ANDROID_HOME`) —
Android Studio estaba instalado pero el SDK no configurado en el entorno de
desarrollo original; el `npx cap add android` en sí no lo necesitó, solo hace falta
para el build final del APK. iOS (`npx cap add ios`) no se ha añadido, aunque el Mac
de desarrollo tiene Xcode instalado y sería viable.
