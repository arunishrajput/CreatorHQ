import { fileURLToPath, URL } from 'node:url'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'chrome120',
    rollupOptions: {
      // The calendar tab is not referenced by the manifest, so list it explicitly.
      input: { app: 'src/pages/app/index.html' },
    },
  },
  server: { port: 5173, strictPort: true, hmr: { port: 5173 } },
})
