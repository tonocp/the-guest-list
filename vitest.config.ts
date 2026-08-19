import { defineConfig } from 'vitest/config'

// Deliberately separate from vite.config.ts: the app's PWA/mkcert plugins have no
// business running during `npm test` (mkcert would try to generate certs on every run).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 5000,
  },
})
