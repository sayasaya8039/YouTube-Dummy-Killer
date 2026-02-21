import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// ビルド後にmanifest.jsonとiconsをコピーするプラグイン
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    closeBundle() {
      const outDir = 'YouTube_Dummy_Killer'

      // manifest.jsonをコピー
      copyFileSync('manifest.json', `${outDir}/manifest.json`)

      // iconsフォルダをコピー
      const iconsDir = `${outDir}/icons`
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true })
      }
      for (const size of [16, 32, 48, 128]) {
        const src = `icons/icon${size}.png`
        const dest = `${iconsDir}/icon${size}.png`
        if (existsSync(src)) {
          copyFileSync(src, dest)
        }
      }

      console.log('✓ Copied manifest.json and icons')
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    copyAssetsPlugin()
  ],
  build: {
    outDir: 'YouTube_Dummy_Killer',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
