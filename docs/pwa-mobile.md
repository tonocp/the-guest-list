# PWA, offline y móvil

Instalable como PWA y funcional sin conexión (`vite-plugin-pwa` / Workbox). Para
probar el service worker real (no el de `vite dev`):

```bash
npm run build
npm run preview
```

Sin Google Fonts ni CDN externa: los títulos usan `.pixel-heading` (CSS puro) para
mantener el funcionamiento 100% offline.

## Probar en el móvil (misma Wi-Fi)

1. `npm run dev -- --host`
2. Abre la URL "Network" que imprime Vite en el navegador del móvil.
3. Menú → "Añadir a pantalla de inicio" para probarla como PWA instalada (incluido modo
   avión).
