import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag == 'video-js',
        },
      },
    }),
  ],
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:1234',
        ws: true,
      },
      '/webcam': {
        target: 'http://localhost:1234',
      },
    },
  },
});
