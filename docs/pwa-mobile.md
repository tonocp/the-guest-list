# PWA, offline y pruebas en el móvil

Instalable como PWA y funcional sin conexión, vía `vite-plugin-pwa` (Workbox). Para
probar el comportamiento real del service worker (no el de `vite dev`):

```bash
npm run build
npm run preview
```

No se usa ninguna fuente de Google Fonts ni CDN externa — los títulos usan una clase
`.pixel-heading` (CSS puro) en vez de cargar una webfont, para mantener el
funcionamiento 100% offline.

## Probar en el móvil (misma red Wi-Fi)

1. `npm run dev -- --host`
2. Abre la URL "Network" que imprime Vite en el navegador del móvil.
3. Menú del navegador → "Añadir a pantalla de inicio" para probarla como PWA
   instalada, incluido el modo avión.
