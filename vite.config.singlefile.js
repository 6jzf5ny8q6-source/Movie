import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Produces a single, fully self-contained index.html (all JS/CSS inlined) so
// the app can be hosted as one static file. Build with:
//   npx vite build --config vite.config.singlefile.js --outDir dist-single
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
})
