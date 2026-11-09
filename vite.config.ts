import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'


export default defineConfig(({ command }) => ({
  
  base: command === 'build' ? '/game-petualangan1/' : '/',
  plugins: [react()],
  server: {
    host: true, 
  },
}))
