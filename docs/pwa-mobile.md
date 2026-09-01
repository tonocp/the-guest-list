# PWA, offline y móvil

Instalable como PWA y funcional sin conexión (`vite-plugin-pwa` / Workbox). Manifest e
iconos se configuran en `vite.config.ts` (`VitePWA({ manifest, workbox })`); las
`<meta>` de iOS y `apple-touch-icon` van en `index.html`. Los iconos se generan con
`node scripts/gen-icons.mjs` (PNG opacos, sin canal alfa).

## Qué hace falta para que un móvil ofrezca "Instalar" y no solo "añadir enlace"

1. **HTTPS con certificado de confianza real.** Es el motivo más común de que solo
   salga un acceso directo: servir el `dev`/`preview` por IP de LAN usa el certificado
   de `vite-plugin-mkcert`, cuya CA el teléfono no conoce → el navegador no lo trata
   como contexto seguro y no ofrece instalación. Hay que probarlo desde un hosting con
   HTTPS válido (o un túnel HTTPS de confianza), no desde `192.168.x.x`.
2. **Service worker activo** en el scope de la página (`/sw.js`, scope `/`).
3. **Manifest completo**: `name`, `short_name`, `start_url`, `scope`, `id`,
   `display: standalone`, e iconos de 192 y 512 px (uno `any`, uno `maskable`).
4. **Servido desde la raíz del dominio.** `start_url`/`scope` son `/`. Si se despliega
   en un subdirectorio hay que ajustar `base` en `vite.config.ts` y regenerar.

### Android (Chrome)

Con lo anterior, Chrome muestra el icono de instalar en la barra o un diálogo
"Instalar app". Sin `screenshots` en el manifest el diálogo es más escueto pero
funciona igual.

### iOS (Safari)

iOS **nunca** muestra un banner de instalación: solo Compartir → "Añadir a pantalla de
inicio". Con `apple-mobile-web-app-capable` + `mobile-web-app-capable` + el manifest,
el icono abre la app a pantalla completa (sin barra de Safari). Si abre dentro de
Safari con la barra visible, el `<meta>` no se está aplicando — suele ser caché;
recarga la página una vez antes de añadirla.

## Cómo verificar

- **Chrome de escritorio** en `npm run preview` (`https://localhost:4173`, que sí es
  contexto seguro): DevTools → Application → Manifest lista errores; Application →
  Service Workers muestra el SW "activated"; el icono de instalar aparece en la barra.
- **Lighthouse** (pestaña en DevTools) → categoría "PWA".
- En el móvil real: Chrome → `chrome://inspect` desde el escritorio para ver la consola.

## Probar el service worker

```bash
npm run build
npm run preview
```

`npm run dev` también registra el SW (`devOptions.enabled`), pero el de `preview` es el
build real.

## Sin fuentes externas

Sin Google Fonts ni CDN: los títulos usan `.pixel-heading` (CSS puro) para funcionar
100% offline.
