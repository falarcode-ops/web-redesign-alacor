import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
        },
      }
    },
    minify: true,
    target: 'es2020',
  },
  server: {
    watch: {
      ignored: ['**/*.json', '**/*.log', '**/scratch/**', '**/data/**', '**/subscribers.json', '**/ai-config.json', '**/chat_config.json']
    },
    proxy: {
      '/coreprice-proxy': {
        target: 'https://coreprice.alacor.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/coreprice-proxy/, '')
      },
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
