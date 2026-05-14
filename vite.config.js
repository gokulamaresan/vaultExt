import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import manifest configuration
import manifest from './manifest.config.js';

/**
 * Vite Configuration for Chrome Extension
 * 
 * Features:
 * - React support with Fast Refresh
 * - CRXJS plugin for automatic manifest handling
 * - Environment-based configuration
 * - Path aliases for clean imports
 * - Optimized build for Chrome Web Store
 * - Development server with hot reload
 */

export default defineConfig(({ mode, command }) => {
  // Load environment variables from .env files
  const envFile = `.env.${mode}`;
  const envDefaultFile = '.env';
  
  const env = loadEnv(envDefaultFile);
  
  if (fs.existsSync(envFile)) {
    Object.assign(env, loadEnv(envFile));
  }

  return {
    mode,

    // Define global variables for the application
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'process.env.VITE_DEBUG': env.VITE_DEBUG === 'true',
      'process.env.VITE_LOG_LEVEL': JSON.stringify(env.VITE_LOG_LEVEL),
      'process.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT || mode),
    },

    // Plugins
    plugins: [
      // React with automatic JSX runtime
      react({
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        // Optimize React in production
        babel: {
          plugins: mode === 'production' ? ['@babel/plugin-transform-react-pure-annotations'] : [],
        },
      }),

      // CRXJS plugin for Chrome Extension support
      crx({
        manifest,
      }),
    ],

    // Module resolution
    resolve: {
      alias: {
        // Main aliases
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@state': path.resolve(__dirname, './src/state'),
        '@api': path.resolve(__dirname, './src/api'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@constants': path.resolve(__dirname, './src/constants'),
        '@config': path.resolve(__dirname, './src/config'),
        '@storage': path.resolve(__dirname, './src/storage'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@validators': path.resolve(__dirname, './src/validators'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@content': path.resolve(__dirname, './src/content'),
        '@background': path.resolve(__dirname, './src/background'),
      },
      extensions: ['.js', '.jsx', '.json', '.mjs'],
    },


    // Build configuration
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      
      // Source maps in development, disabled in production
      sourcemap: mode === 'development' ? 'inline' : false,
      
      // Minification
      minify: mode === 'production' ? 'terser' : false,
      
      // Terser minification options
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          passes: 2,
        },
        mangle: true,
        output: {
          comments: false,
        },
      },

      // Chunk splitting strategy
      rollupOptions: {
      },

      // Target modern browsers (Chrome supports this)
      target: 'chrome120',
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Keep CSS in JS or extract
      cssMinify: true,
      
      // Report compressed size
      reportCompressedSize: false,
      
      // Increase chunk size warning limit for extensions
      chunkSizeWarningLimit: 1000,
    },

    // Optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand', 'axios'],
      exclude: [],
    },

    // Development server
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
      },
      // Watch for changes in src directory
      watch: {
        include: ['src/**'],
        exclude: ['node_modules', 'dist'],
      },
    },

    // Preview server (for testing built extension)
    preview: {
      port: 5174,
    },

    // Logging
    logLevel: mode === 'development' ? 'info' : 'warn',
  };
});

/**
 * Load environment variables from a file
 * @param {string} filePath - Path to the env file
 * @returns {object} - Parsed environment variables
 */
function loadEnv(filePath) {
  const env = {};

  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  content.split('\n').forEach((line) => {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();

    // Remove quotes if present
    const cleanValue = value.replace(/^['"](.+)['"]$/, '$1');

    if (key) {
      env[key.trim()] = cleanValue;
    }
  });

  return env;
}
