import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Em dev o site vem do Vite e a API do servidor Express ao lado
    proxy: {
      '/api': { target: 'http://localhost:3100', changeOrigin: true },
    },
  },
  preview: {
    allowedHosts: true,
  },
})
