import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router-vendor'
          }
          if (id.includes('node_modules/antd')) {
            return 'antd-vendor'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-vendor'
          }
        },
      },
    },
  },
})
