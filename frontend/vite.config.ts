import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Configuración para SPA - manejar rutas del frontend
  server: {
    port: 3000,
    open: true,
    // Configuración para manejar rutas del cliente
    historyApiFallback: {
      index: '/index.html'
    }
  },
  // Configuración para build de producción
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Configuración para manejar rutas en producción
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  // Configuración para preview (servidor de producción local)
  preview: {
    port: 4173,
    open: true
  }
})
