import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts so tests don't load the CRX plugin.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
