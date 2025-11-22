import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This polyfills process.env.API_KEY so the @google/genai SDK works in the browser
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    server: {
      host: true, // Needed for Docker
      port: 5173,
      watch: {
        usePolling: true // Needed for Docker on some systems (Windows)
      }
    },
    resolve: {
      alias: {
        // Ensures compatible module resolution
      },
    },
  };
});