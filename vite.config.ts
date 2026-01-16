import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site: https://<user>.github.io/<repo>/
  // NOTE: path is case-sensitive on GitHub Pages
  base: '/Smile0n/',
  plugins: [react()],
})
