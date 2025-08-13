import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevelopment = command === 'serve';
  const isProduction = mode === 'production';
  
  // For GitHub Pages deployment, use the repository name as base
  // This can be overridden with VITE_BASE_PATH environment variable
  const basePath = isDevelopment 
    ? '/' 
    : process.env.VITE_BASE_PATH || '/LFM2-WebGPU-IDEATOR/';

  return {
    plugins: [react(), tailwindcss()],
    base: basePath,
    build: {
      outDir: 'dist',
      sourcemap: isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react'],
            ml: ['@huggingface/transformers'],
          },
        },
      },
    },
    // Optimize for GitHub Pages
    server: {
      port: 3000,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});
