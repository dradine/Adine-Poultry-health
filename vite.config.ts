import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs keep local development at the root; the Pages workflow overrides base.
  base: './',
  build: { sourcemap: true },
})
