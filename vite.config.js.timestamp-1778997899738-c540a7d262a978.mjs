// vite.config.js
import { defineConfig } from "file:///D:/Extention/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Extention/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///D:/Extention/node_modules/@crxjs/vite-plugin/dist/index.mjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// manifest.config.js
import { defineManifest } from "file:///D:/Extention/node_modules/@crxjs/vite-plugin/dist/index.mjs";
var manifest_config_default = defineManifest({
  // Manifest version (required to be 3)
  manifest_version: 3,
  // Extension metadata
  name: "VaultGuard - Password Manager",
  version: "2.0.0",
  description: "Secure password manager with auto-fill capability for Chrome",
  author: "VaultGuard Team",
  // Popup action (click extension icon to show popup)
  action: {
    default_popup: "src/popup/popup.html",
    default_title: "VaultGuard - Click to open"
  },
  // Background service worker (replaces background scripts in MV2)
  background: {
    service_worker: "src/background/service-worker.js",
    type: "module"
    // Enable ES modules in service worker
  },
  // Content scripts - injected into web pages
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/content-script.js"],
      run_at: "document_start",
      all_frames: true,
      match_about_blank: true
    }
  ],
  // Required permissions for extension functionality
  permissions: [
    "storage",
    // Access chrome.storage API
    "tabs",
    // Access tab information
    "scripting",
    // Inject scripts into pages
    "activeTab",
    // Access active tab
    "contextMenus"
    // Create context menus (for future features)
  ],
  // Host permissions - which websites the extension can access
  host_permissions: [
    "<all_urls>"
    // Access all websites
  ],
  // Content Security Policy
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  },
  // Commands (keyboard shortcuts) - for future features
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Ctrl+Shift+Y",
        mac: "MacCtrl+Shift+Y"
      }
    }
  },
  // Minimum Chrome version required
  minimum_chrome_version: "120",
  // Key for Chrome Web Store (if deployed)
  key: process.env.VITE_EXTENSION_KEY || void 0
});

// vite.config.js
var __vite_injected_original_import_meta_url = "file:///D:/Extention/vite.config.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig(({ mode, command }) => {
  const envFile = `.env.${mode}`;
  const envDefaultFile = ".env";
  const env = loadEnv(envDefaultFile);
  if (fs.existsSync(envFile)) {
    Object.assign(env, loadEnv(envFile));
  }
  return {
    mode,
    // Define global variables for the application
    define: {
      __DEV__: mode === "development",
      __PROD__: mode === "production",
      "process.env.VITE_API_BASE_URL": JSON.stringify(env.VITE_API_BASE_URL),
      "process.env.VITE_DEBUG": env.VITE_DEBUG === "true",
      "process.env.VITE_LOG_LEVEL": JSON.stringify(env.VITE_LOG_LEVEL),
      "process.env.VITE_ENVIRONMENT": JSON.stringify(env.VITE_ENVIRONMENT || mode)
    },
    // Plugins
    plugins: [
      // React with automatic JSX runtime
      react({
        jsxRuntime: "automatic",
        jsxImportSource: "react",
        // Optimize React in production
        babel: {
          plugins: mode === "production" ? ["@babel/plugin-transform-react-pure-annotations"] : []
        }
      }),
      // CRXJS plugin for Chrome Extension support
      crx({
        manifest: manifest_config_default
      })
    ],
    // Module resolution
    resolve: {
      alias: {
        // Main aliases
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@state": path.resolve(__dirname, "./src/state"),
        "@api": path.resolve(__dirname, "./src/api"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@constants": path.resolve(__dirname, "./src/constants"),
        "@config": path.resolve(__dirname, "./src/config"),
        "@storage": path.resolve(__dirname, "./src/storage"),
        "@styles": path.resolve(__dirname, "./src/styles"),
        "@validators": path.resolve(__dirname, "./src/validators"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@content": path.resolve(__dirname, "./src/content"),
        "@background": path.resolve(__dirname, "./src/background")
      },
      extensions: [".js", ".jsx", ".json", ".mjs"]
    },
    // Build configuration
    build: {
      outDir: "dist",
      emptyOutDir: false,
      // Source maps in development, disabled in production
      sourcemap: mode === "development" ? "inline" : false,
      // Minification
      minify: mode === "production" ? "terser" : false,
      // Terser minification options
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          passes: 2
        },
        mangle: true,
        output: {
          comments: false
        }
      },
      // Chunk splitting strategy
      rollupOptions: {},
      // Target modern browsers (Chrome supports this)
      target: "chrome120",
      // CSS code splitting
      cssCodeSplit: true,
      // Keep CSS in JS or extract
      cssMinify: true,
      // Report compressed size
      reportCompressedSize: false,
      // Increase chunk size warning limit for extensions
      chunkSizeWarningLimit: 1e3
    },
    // Optimization
    optimizeDeps: {
      include: ["react", "react-dom", "zustand", "axios"],
      exclude: []
    },
    // Development server
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 5173
      },
      // Watch for changes in src directory
      watch: {
        include: ["src/**"],
        exclude: ["node_modules", "dist"]
      }
    },
    // Preview server (for testing built extension)
    preview: {
      port: 5174
    },
    // Logging
    logLevel: mode === "development" ? "info" : "warn"
  };
});
function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  content.split("\n").forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) {
      return;
    }
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=").trim();
    const cleanValue = value.replace(/^['"](.+)['"]$/, "$1");
    if (key) {
      env[key.trim()] = cleanValue;
    }
  });
  return env;
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAibWFuaWZlc3QuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcRXh0ZW50aW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxFeHRlbnRpb25cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0V4dGVudGlvbi92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XHJcblxyXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xyXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XHJcblxyXG4vLyBJbXBvcnQgbWFuaWZlc3QgY29uZmlndXJhdGlvblxyXG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9tYW5pZmVzdC5jb25maWcuanMnO1xyXG5cclxuLyoqXHJcbiAqIFZpdGUgQ29uZmlndXJhdGlvbiBmb3IgQ2hyb21lIEV4dGVuc2lvblxyXG4gKiBcclxuICogRmVhdHVyZXM6XHJcbiAqIC0gUmVhY3Qgc3VwcG9ydCB3aXRoIEZhc3QgUmVmcmVzaFxyXG4gKiAtIENSWEpTIHBsdWdpbiBmb3IgYXV0b21hdGljIG1hbmlmZXN0IGhhbmRsaW5nXHJcbiAqIC0gRW52aXJvbm1lbnQtYmFzZWQgY29uZmlndXJhdGlvblxyXG4gKiAtIFBhdGggYWxpYXNlcyBmb3IgY2xlYW4gaW1wb3J0c1xyXG4gKiAtIE9wdGltaXplZCBidWlsZCBmb3IgQ2hyb21lIFdlYiBTdG9yZVxyXG4gKiAtIERldmVsb3BtZW50IHNlcnZlciB3aXRoIGhvdCByZWxvYWRcclxuICovXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSwgY29tbWFuZCB9KSA9PiB7XHJcbiAgLy8gTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSAuZW52IGZpbGVzXHJcbiAgY29uc3QgZW52RmlsZSA9IGAuZW52LiR7bW9kZX1gO1xyXG4gIGNvbnN0IGVudkRlZmF1bHRGaWxlID0gJy5lbnYnO1xyXG4gIFxyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYoZW52RGVmYXVsdEZpbGUpO1xyXG4gIFxyXG4gIGlmIChmcy5leGlzdHNTeW5jKGVudkZpbGUpKSB7XHJcbiAgICBPYmplY3QuYXNzaWduKGVudiwgbG9hZEVudihlbnZGaWxlKSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgbW9kZSxcclxuXHJcbiAgICAvLyBEZWZpbmUgZ2xvYmFsIHZhcmlhYmxlcyBmb3IgdGhlIGFwcGxpY2F0aW9uXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19ERVZfXzogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcclxuICAgICAgX19QUk9EX186IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcclxuICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfQVBJX0JBU0VfVVJMJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfQVBJX0JBU0VfVVJMKSxcclxuICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfREVCVUcnOiBlbnYuVklURV9ERUJVRyA9PT0gJ3RydWUnLFxyXG4gICAgICAncHJvY2Vzcy5lbnYuVklURV9MT0dfTEVWRUwnOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9MT0dfTEVWRUwpLFxyXG4gICAgICAncHJvY2Vzcy5lbnYuVklURV9FTlZJUk9OTUVOVCc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0VOVklST05NRU5UIHx8IG1vZGUpLFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQbHVnaW5zXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIC8vIFJlYWN0IHdpdGggYXV0b21hdGljIEpTWCBydW50aW1lXHJcbiAgICAgIHJlYWN0KHtcclxuICAgICAgICBqc3hSdW50aW1lOiAnYXV0b21hdGljJyxcclxuICAgICAgICBqc3hJbXBvcnRTb3VyY2U6ICdyZWFjdCcsXHJcbiAgICAgICAgLy8gT3B0aW1pemUgUmVhY3QgaW4gcHJvZHVjdGlvblxyXG4gICAgICAgIGJhYmVsOiB7XHJcbiAgICAgICAgICBwbHVnaW5zOiBtb2RlID09PSAncHJvZHVjdGlvbicgPyBbJ0BiYWJlbC9wbHVnaW4tdHJhbnNmb3JtLXJlYWN0LXB1cmUtYW5ub3RhdGlvbnMnXSA6IFtdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG5cclxuICAgICAgLy8gQ1JYSlMgcGx1Z2luIGZvciBDaHJvbWUgRXh0ZW5zaW9uIHN1cHBvcnRcclxuICAgICAgY3J4KHtcclxuICAgICAgICBtYW5pZmVzdCxcclxuICAgICAgfSksXHJcbiAgICBdLFxyXG5cclxuICAgIC8vIE1vZHVsZSByZXNvbHV0aW9uXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgLy8gTWFpbiBhbGlhc2VzXHJcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgICAnQGNvbXBvbmVudHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29tcG9uZW50cycpLFxyXG4gICAgICAgICdAcGFnZXMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvcGFnZXMnKSxcclxuICAgICAgICAnQGhvb2tzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2hvb2tzJyksXHJcbiAgICAgICAgJ0BzZXJ2aWNlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9zZXJ2aWNlcycpLFxyXG4gICAgICAgICdAc3RhdGUnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvc3RhdGUnKSxcclxuICAgICAgICAnQGFwaSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9hcGknKSxcclxuICAgICAgICAnQHV0aWxzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL3V0aWxzJyksXHJcbiAgICAgICAgJ0Bjb25zdGFudHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29uc3RhbnRzJyksXHJcbiAgICAgICAgJ0Bjb25maWcnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29uZmlnJyksXHJcbiAgICAgICAgJ0BzdG9yYWdlJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL3N0b3JhZ2UnKSxcclxuICAgICAgICAnQHN0eWxlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9zdHlsZXMnKSxcclxuICAgICAgICAnQHZhbGlkYXRvcnMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvdmFsaWRhdG9ycycpLFxyXG4gICAgICAgICdAYXNzZXRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2Fzc2V0cycpLFxyXG4gICAgICAgICdAY29udGVudCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb250ZW50JyksXHJcbiAgICAgICAgJ0BiYWNrZ3JvdW5kJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2JhY2tncm91bmQnKSxcclxuICAgICAgfSxcclxuICAgICAgZXh0ZW5zaW9uczogWycuanMnLCAnLmpzeCcsICcuanNvbicsICcubWpzJ10sXHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvLyBCdWlsZCBjb25maWd1cmF0aW9uXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgICAgZW1wdHlPdXREaXI6IGZhbHNlLFxyXG4gICAgICBcclxuICAgICAgLy8gU291cmNlIG1hcHMgaW4gZGV2ZWxvcG1lbnQsIGRpc2FibGVkIGluIHByb2R1Y3Rpb25cclxuICAgICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnID8gJ2lubGluZScgOiBmYWxzZSxcclxuICAgICAgXHJcbiAgICAgIC8vIE1pbmlmaWNhdGlvblxyXG4gICAgICBtaW5pZnk6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/ICd0ZXJzZXInIDogZmFsc2UsXHJcbiAgICAgIFxyXG4gICAgICAvLyBUZXJzZXIgbWluaWZpY2F0aW9uIG9wdGlvbnNcclxuICAgICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgICBkcm9wX2NvbnNvbGU6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcclxuICAgICAgICAgIHBhc3NlczogMixcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1hbmdsZTogdHJ1ZSxcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIGNvbW1lbnRzOiBmYWxzZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ2h1bmsgc3BsaXR0aW5nIHN0cmF0ZWd5XHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIFRhcmdldCBtb2Rlcm4gYnJvd3NlcnMgKENocm9tZSBzdXBwb3J0cyB0aGlzKVxyXG4gICAgICB0YXJnZXQ6ICdjaHJvbWUxMjAnLFxyXG4gICAgICBcclxuICAgICAgLy8gQ1NTIGNvZGUgc3BsaXR0aW5nXHJcbiAgICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICAgICAgXHJcbiAgICAgIC8vIEtlZXAgQ1NTIGluIEpTIG9yIGV4dHJhY3RcclxuICAgICAgY3NzTWluaWZ5OiB0cnVlLFxyXG4gICAgICBcclxuICAgICAgLy8gUmVwb3J0IGNvbXByZXNzZWQgc2l6ZVxyXG4gICAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXHJcbiAgICAgIFxyXG4gICAgICAvLyBJbmNyZWFzZSBjaHVuayBzaXplIHdhcm5pbmcgbGltaXQgZm9yIGV4dGVuc2lvbnNcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBPcHRpbWl6YXRpb25cclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICd6dXN0YW5kJywgJ2F4aW9zJ10sXHJcbiAgICAgIGV4Y2x1ZGU6IFtdLFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBEZXZlbG9wbWVudCBzZXJ2ZXJcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBwb3J0OiA1MTczLFxyXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxyXG4gICAgICBobXI6IHtcclxuICAgICAgICBwcm90b2NvbDogJ3dzJyxcclxuICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgICBwb3J0OiA1MTczLFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBXYXRjaCBmb3IgY2hhbmdlcyBpbiBzcmMgZGlyZWN0b3J5XHJcbiAgICAgIHdhdGNoOiB7XHJcbiAgICAgICAgaW5jbHVkZTogWydzcmMvKionXSxcclxuICAgICAgICBleGNsdWRlOiBbJ25vZGVfbW9kdWxlcycsICdkaXN0J10sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFByZXZpZXcgc2VydmVyIChmb3IgdGVzdGluZyBidWlsdCBleHRlbnNpb24pXHJcbiAgICBwcmV2aWV3OiB7XHJcbiAgICAgIHBvcnQ6IDUxNzQsXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIExvZ2dpbmdcclxuICAgIGxvZ0xldmVsOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnID8gJ2luZm8nIDogJ3dhcm4nLFxyXG4gIH07XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gYSBmaWxlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aCAtIFBhdGggdG8gdGhlIGVudiBmaWxlXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGFyc2VkIGVudmlyb25tZW50IHZhcmlhYmxlc1xyXG4gKi9cclxuZnVuY3Rpb24gbG9hZEVudihmaWxlUGF0aCkge1xyXG4gIGNvbnN0IGVudiA9IHt9O1xyXG5cclxuICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XHJcbiAgICByZXR1cm4gZW52O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XHJcbiAgXHJcbiAgY29udGVudC5zcGxpdCgnXFxuJykuZm9yRWFjaCgobGluZSkgPT4ge1xyXG4gICAgbGluZSA9IGxpbmUudHJpbSgpO1xyXG4gICAgXHJcbiAgICAvLyBTa2lwIGVtcHR5IGxpbmVzIGFuZCBjb21tZW50c1xyXG4gICAgaWYgKCFsaW5lIHx8IGxpbmUuc3RhcnRzV2l0aCgnIycpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBba2V5LCAuLi52YWx1ZVBhcnRzXSA9IGxpbmUuc3BsaXQoJz0nKTtcclxuICAgIGNvbnN0IHZhbHVlID0gdmFsdWVQYXJ0cy5qb2luKCc9JykudHJpbSgpO1xyXG5cclxuICAgIC8vIFJlbW92ZSBxdW90ZXMgaWYgcHJlc2VudFxyXG4gICAgY29uc3QgY2xlYW5WYWx1ZSA9IHZhbHVlLnJlcGxhY2UoL15bJ1wiXSguKylbJ1wiXSQvLCAnJDEnKTtcclxuXHJcbiAgICBpZiAoa2V5KSB7XHJcbiAgICAgIGVudltrZXkudHJpbSgpXSA9IGNsZWFuVmFsdWU7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBlbnY7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxFeHRlbnRpb25cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXEV4dGVudGlvblxcXFxtYW5pZmVzdC5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0V4dGVudGlvbi9tYW5pZmVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVNYW5pZmVzdCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbic7XHJcblxyXG4vKipcclxuICogQ2hyb21lIEV4dGVuc2lvbiBNYW5pZmVzdCBWMyBDb25maWd1cmF0aW9uXHJcbiAqIFVzZWQgYnkgQ1JYSlMgVml0ZSBQbHVnaW4gdG8gZ2VuZXJhdGUgdGhlIGZpbmFsIG1hbmlmZXN0Lmpzb25cclxuICogXHJcbiAqIFRoaXMgY29uZmlndXJhdGlvbiBpcyBlbnZpcm9ubWVudC1hd2FyZSBhbmQgc3VwcG9ydHM6XHJcbiAqIC0gRGV2ZWxvcG1lbnQ6IGxvY2FsaG9zdCBBUElcclxuICogLSBTdGFnaW5nOiBzdGFnaW5nIEFQSVxyXG4gKiAtIFByb2R1Y3Rpb246IHByb2R1Y3Rpb24gQVBJXHJcbiAqL1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lTWFuaWZlc3Qoe1xyXG4gIC8vIE1hbmlmZXN0IHZlcnNpb24gKHJlcXVpcmVkIHRvIGJlIDMpXHJcbiAgbWFuaWZlc3RfdmVyc2lvbjogMyxcclxuXHJcbiAgLy8gRXh0ZW5zaW9uIG1ldGFkYXRhXHJcbiAgbmFtZTogJ1ZhdWx0R3VhcmQgLSBQYXNzd29yZCBNYW5hZ2VyJyxcclxuICB2ZXJzaW9uOiAnMi4wLjAnLFxyXG4gIGRlc2NyaXB0aW9uOiAnU2VjdXJlIHBhc3N3b3JkIG1hbmFnZXIgd2l0aCBhdXRvLWZpbGwgY2FwYWJpbGl0eSBmb3IgQ2hyb21lJyxcclxuICBhdXRob3I6ICdWYXVsdEd1YXJkIFRlYW0nLFxyXG5cclxuXHJcblxyXG4gIC8vIFBvcHVwIGFjdGlvbiAoY2xpY2sgZXh0ZW5zaW9uIGljb24gdG8gc2hvdyBwb3B1cClcclxuICBhY3Rpb246IHtcclxuICAgIGRlZmF1bHRfcG9wdXA6ICdzcmMvcG9wdXAvcG9wdXAuaHRtbCcsXHJcbiAgICBkZWZhdWx0X3RpdGxlOiAnVmF1bHRHdWFyZCAtIENsaWNrIHRvIG9wZW4nLFxyXG4gIH0sXHJcblxyXG4gIC8vIEJhY2tncm91bmQgc2VydmljZSB3b3JrZXIgKHJlcGxhY2VzIGJhY2tncm91bmQgc2NyaXB0cyBpbiBNVjIpXHJcbiAgYmFja2dyb3VuZDoge1xyXG4gICAgc2VydmljZV93b3JrZXI6ICdzcmMvYmFja2dyb3VuZC9zZXJ2aWNlLXdvcmtlci5qcycsXHJcbiAgICB0eXBlOiAnbW9kdWxlJywgLy8gRW5hYmxlIEVTIG1vZHVsZXMgaW4gc2VydmljZSB3b3JrZXJcclxuICB9LFxyXG5cclxuICAvLyBDb250ZW50IHNjcmlwdHMgLSBpbmplY3RlZCBpbnRvIHdlYiBwYWdlc1xyXG4gIGNvbnRlbnRfc2NyaXB0czogW1xyXG4gICAge1xyXG4gICAgICBtYXRjaGVzOiBbJzxhbGxfdXJscz4nXSxcclxuICAgICAganM6IFsnc3JjL2NvbnRlbnQvY29udGVudC1zY3JpcHQuanMnXSxcclxuICAgICAgcnVuX2F0OiAnZG9jdW1lbnRfc3RhcnQnLFxyXG4gICAgICBhbGxfZnJhbWVzOiB0cnVlLFxyXG4gICAgICBtYXRjaF9hYm91dF9ibGFuazogdHJ1ZSxcclxuICAgIH0sXHJcbiAgXSxcclxuXHJcbiAgLy8gUmVxdWlyZWQgcGVybWlzc2lvbnMgZm9yIGV4dGVuc2lvbiBmdW5jdGlvbmFsaXR5XHJcbiAgcGVybWlzc2lvbnM6IFtcclxuICAgICdzdG9yYWdlJywgICAgICAgIC8vIEFjY2VzcyBjaHJvbWUuc3RvcmFnZSBBUElcclxuICAgICd0YWJzJywgICAgICAgICAgLy8gQWNjZXNzIHRhYiBpbmZvcm1hdGlvblxyXG4gICAgJ3NjcmlwdGluZycsICAgICAvLyBJbmplY3Qgc2NyaXB0cyBpbnRvIHBhZ2VzXHJcbiAgICAnYWN0aXZlVGFiJywgICAgIC8vIEFjY2VzcyBhY3RpdmUgdGFiXHJcbiAgICAnY29udGV4dE1lbnVzJywgIC8vIENyZWF0ZSBjb250ZXh0IG1lbnVzIChmb3IgZnV0dXJlIGZlYXR1cmVzKVxyXG4gIF0sXHJcblxyXG4gIC8vIEhvc3QgcGVybWlzc2lvbnMgLSB3aGljaCB3ZWJzaXRlcyB0aGUgZXh0ZW5zaW9uIGNhbiBhY2Nlc3NcclxuICBob3N0X3Blcm1pc3Npb25zOiBbXHJcbiAgICAnPGFsbF91cmxzPicsIC8vIEFjY2VzcyBhbGwgd2Vic2l0ZXNcclxuICBdLFxyXG5cclxuXHJcblxyXG4gIC8vIENvbnRlbnQgU2VjdXJpdHkgUG9saWN5XHJcbiAgY29udGVudF9zZWN1cml0eV9wb2xpY3k6IHtcclxuICAgIGV4dGVuc2lvbl9wYWdlczogXCJzY3JpcHQtc3JjICdzZWxmJzsgb2JqZWN0LXNyYyAnc2VsZidcIixcclxuICB9LFxyXG5cclxuXHJcblxyXG4gIC8vIENvbW1hbmRzIChrZXlib2FyZCBzaG9ydGN1dHMpIC0gZm9yIGZ1dHVyZSBmZWF0dXJlc1xyXG4gIGNvbW1hbmRzOiB7XHJcbiAgICBfZXhlY3V0ZV9hY3Rpb246IHtcclxuICAgICAgc3VnZ2VzdGVkX2tleToge1xyXG4gICAgICAgIGRlZmF1bHQ6ICdDdHJsK1NoaWZ0K1knLFxyXG4gICAgICAgIG1hYzogJ01hY0N0cmwrU2hpZnQrWScsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIE1pbmltdW0gQ2hyb21lIHZlcnNpb24gcmVxdWlyZWRcclxuICBtaW5pbXVtX2Nocm9tZV92ZXJzaW9uOiAnMTIwJyxcclxuXHJcbiAgLy8gS2V5IGZvciBDaHJvbWUgV2ViIFN0b3JlIChpZiBkZXBsb3llZClcclxuICBrZXk6IHByb2Nlc3MuZW52LlZJVEVfRVhU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
