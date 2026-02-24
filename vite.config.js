import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Asegura que las rutas sean relativas para que funcione en cualquier subcarpeta o IP
})
