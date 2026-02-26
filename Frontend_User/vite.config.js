import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3005,
    proxy: {
      // Khi thấy đường dẫn bắt đầu bằng /api, Vite sẽ chuyển sang cổng 3003
      '/api': {
        target: 'http://localhost:3003', 
        changeOrigin: true,
      }
    }
  }
})