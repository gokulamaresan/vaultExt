import { defineManifest } from '@crxjs/vite-plugin';

/**
 * Chrome Extension Manifest V3 Configuration
 * Used by CRXJS Vite Plugin to generate the final manifest.json
 * 
 * This configuration is environment-aware and supports:
 * - Development: localhost API
 * - Staging: staging API
 * - Production: production API
 */

export default defineManifest({
  // Manifest version (required to be 3)
  manifest_version: 3,

  // Extension metadata
  name: 'VaultGuard - Password Manager',
  version: '2.0.0',
  description: 'Secure password manager with auto-fill capability for Chrome',
  author: 'VaultGuard Team',



  // Popup action (click extension icon to show popup)
  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'VaultGuard - Click to open',
  },

  // Background service worker (replaces background scripts in MV2)
  background: {
    service_worker: 'src/background/service-worker.js',
    type: 'module', // Enable ES modules in service worker
  },

  // Content scripts - injected into web pages
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-script.js'],
      run_at: 'document_start',
      all_frames: true,
      match_about_blank: true,
    },
  ],

  // Required permissions for extension functionality
  permissions: [
    'storage',        // Access chrome.storage API
    'tabs',          // Access tab information
    'scripting',     // Inject scripts into pages
    'activeTab',     // Access active tab
    'contextMenus',  // Create context menus (for future features)
  ],

  // Host permissions - which websites the extension can access
  host_permissions: [
    '<all_urls>', // Access all websites
  ],



  // Content Security Policy
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },



  // Commands (keyboard shortcuts) - for future features
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Ctrl+Shift+Y',
        mac: 'MacCtrl+Shift+Y',
      },
    },
  },

  // Minimum Chrome version required
  minimum_chrome_version: '120',

  // Key for Chrome Web Store (if deployed)
  key: process.env.VITE_EXTENSION_KEY || undefined,
});
