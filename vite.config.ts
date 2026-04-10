import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { invoicesRestPlugin } from './src/mocks/api/invoicesRestPlugin'

export default defineConfig({
  plugins: [react(), invoicesRestPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __USE_MOCK__: JSON.stringify(process.env.USE_MOCK !== 'false'),
  },
})
