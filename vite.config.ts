import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_API_BASE_URL.replace(/\/api\/?$/, "")
  const targetOrigin = new URL(apiTarget).origin
  const isProduction = mode === "production"

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("origin", targetOrigin)
              proxyReq.setHeader("referer", `${targetOrigin}/`)
            })
          },
        },
      },
    },
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
