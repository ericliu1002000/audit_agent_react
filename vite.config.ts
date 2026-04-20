import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const appBasePath = env.VITE_APP_BASE_PATH || "/"
  const base = appBasePath.endsWith("/") ? appBasePath : `${appBasePath}/`
  const isProduction = mode === "production"

  return {
    base,
    plugins: [react()],
    build: {
      emptyOutDir: true,
      minify: isProduction ? "terser" : "esbuild",
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
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
  }
})
