import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: true,
    allowedHosts: ['ibooth.arwndoprtma.space.test', 'ibooth.arwndoprtma.space', '127.0.0.1', 'localhost'],
  },
  plugins: [
    react(),
  ],
});
