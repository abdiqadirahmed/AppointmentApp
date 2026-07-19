import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",   // 👈 VERY IMPORTANT
    port: 5173,
    allowedHosts: true,   // 👈 Add this
    proxy: {
      '/api': {
        target: 'http://backend:8000', // 👈 FIXED
        changeOrigin: true,
      },
    },
  },
})