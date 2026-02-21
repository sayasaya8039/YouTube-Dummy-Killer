import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'YouTube_Dummy_Killer',
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/background/background.ts'),
      name: 'BackgroundScript',
      formats: ['iife'],
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
})
