import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project sites need a repository sub-path; local dev keeps root.
  base: process.env.GITHUB_PAGES === 'true' ? '/Adine-Poultry-health/' : '/',
  build: { sourcemap: true },
})
