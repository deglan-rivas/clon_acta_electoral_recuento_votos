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
    publicDir: resolve('public'),
    server: {
      host: '0.0.0.0', // o host: true
      port: 5174,
      allowedHosts: [
        'localhost',
        '.trycloudflare.com', // permite todos los subdominios de trycloudflare.com
        // 'segment-device-indie-carolina.trycloudflare.com/' // o específicamente tu dominio
      ]
    }
  }
})