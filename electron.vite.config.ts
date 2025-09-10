import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({
      exclude: ['electron-log']
    })]
  },
  preload: {
    plugins: [externalizeDepsPlugin({
      exclude: ['electron-log']
    })]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@': resolve('src/renderer')
      }
    },
    plugins: [react(), tailwindcss()],
    publicDir: resolve('public')
  }
})