import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        // Keep the locale JSON in its own chunk so the main app bundle stays
        // under the 500 kB budget enforced by the E2E suite.
        manualChunks(id) {
          if (id.includes('src/i18n/locales/')) return 'i18n-locales'
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})

