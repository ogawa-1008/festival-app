import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 開発中はノベルティ在庫 API（backend: composer start）へ転送する
    // API に CORS の設定がないため、同じドメインの /api として呼び出す
    proxy: {
      '/api': 'http://localhost:8095',
    },
  },
})
