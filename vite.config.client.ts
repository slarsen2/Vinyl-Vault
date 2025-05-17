import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import cartographer from '@replit/vite-plugin-cartographer';

// Update this to match your GitHub repository name
const REPO_NAME = 'vinyl-vault';

export default defineConfig({
  plugins: [
    react(),
    cartographer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@components': resolve(__dirname, './client/src/components'),
      '@assets': resolve(__dirname, './assets'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
  // Add this for GitHub Pages deployment - replace with your actual repository name
  base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
  build: {
    outDir: 'dist',
  },
});