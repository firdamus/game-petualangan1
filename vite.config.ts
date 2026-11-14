import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Saat `npm run dev` alamatnya cukup http://localhost:5173/
  // Saat `npm run build` (deploy GitHub Pages) tetap memakai sub-path repo.
  base: command === 'build' ? '/game-petualangan1/' : '/',
  plugins: [react()],
  server: {
    host: true, // tampilkan & buka akses lewat alamat Network (untuk tes di HP)
  },
}))
