import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project 사이트는 https://<user>.github.io/<repo>/ 서브경로로 서빙되므로
// 프로덕션 빌드에서만 base를 저장소 이름으로 맞춘다. 로컬 dev는 그대로 루트에서 서빙.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/runelium/' : '/',
  plugins: [react()],
}));
