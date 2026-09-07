import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Standalone Vite config for running ProofPass locally (outside Figma Make).
// The original scaffold config depended on Figma Make's hosted dev
// environment (it imported `.figma/make/site.json` and registered
// Figma-only dev plugins), so it couldn't run on its own. This is a plain
// React + Tailwind v4 setup that keeps the same `@` -> `src` alias so
// nothing else in the project needs to change.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
