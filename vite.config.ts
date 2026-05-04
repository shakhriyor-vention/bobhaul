import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three') || id.includes('react-globe.gl') || id.includes('d3') || id.includes('maplibre-gl')) return 'globe'
          if (id.includes('leaflet') && !id.includes('maplibre')) return 'leaflet'
          if (id.includes('react-router')) return 'router'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react-dom') || id.includes('/react/') || id.endsWith('/react/index.js')) return 'react'
          if (id.includes('zustand') || id.includes('sonner') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'utils'
          return 'vendor'
        },
      },
    },
  },
})
