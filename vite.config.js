import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
        extensions: ['.js', '.jsx'],
    },
})
