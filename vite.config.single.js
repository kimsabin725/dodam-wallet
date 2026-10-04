// 단일 HTML 파일 빌드용 설정.
// 코드 분할을 끄고 IIFE로 뽑는다 — file:// 에서는 ES 모듈 스크립트가 CORS로 막히기 때문이다.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',            // file:// 에서 절대경로는 못 찾는다
  plugins: [react()],
  build: {
    outDir: 'dist-single',
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]'
      }
    }
  }
});
