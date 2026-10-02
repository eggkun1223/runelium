import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 커스텀 도메인(library.runellium.co.kr)으로 루트 경로에서 서빙하므로 base는 항상 '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
});
