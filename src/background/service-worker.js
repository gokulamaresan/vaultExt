/**
 * Background Service Worker
 * Handles extension logic, message routing, session management, and API calls
 */

import Logger from '../utils/logger.js';
import MessageHandler from '../utils/message-handler.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
import AuthService from '../services/auth-service.js';
import CredentialsService from '../services/credentials-service.js';
import StorageManager from '../storage/storage-manager.js';

// Initialize message listener
MessageHandler.initializeMessageListener();

// ============ Event Listeners for Messages ============

/**
 * Login request
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.LOGIN_REQUEST, async (payload) => {
  const { email, password } = payload;
  const result = await AuthService.login(email, password);

  if (result.success) {
    // Notify all tabs about successful login
    await MessageHandler.broadcast(APP_CONSTANTS.MESSAGE_TYPES.LOGIN_SUCCESS, {
      user: result.user,
    });

    // Fetch credentials for newly logged-in user
    await CredentialsService.fetchCredentials();
  }

  return result;
});

/**
 * Logout request
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.LOGOUT_REQUEST, async () => {
  const result = await AuthService.logout();

  if (result.success) {
    // Notify all tabs about logout
    await MessageHandler.broadcast(APP_CONSTANTS.MESSAGE_TYPES.VAULT_LOCKED);
  }

  return result;
});

// Default credential seed — keeps content-script matching working even before popup opens.
const DEFAULT_CREDENTIALS = [
  {
    id: 'cred_1',
    name: 'test',
    username: '20240360',
    password: 'password123',
    domain: 'test.com',
    isFavorite: true,
    avatarLetter: 'T',
    avatarBg: '#2dd4bf',
  },
  {
    id: 'cred_2',
    name: 'Coursera',
    username: 'wert',
    password: 'password123',
    domain: 'coursera.org',
    isFavorite: false,
    avatarIcon: 'coursera',
    avatarBg: '#2563eb',
  },
  {
    id: 'cred_3',
    name: 'INDEXER',
    username: '20240360',
    password: 'TDX0963',
    domain: 'http://sky:366',
    url: 'http://sky:366',
    isFavorite: false,
    avatarIcon: 'indexer',
    avatarBg: '#f8fafc',
  },
];

/**
 * Fetch credentials
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.FETCH_CREDENTIALS, async (payload) => {
  const { domain } = payload;

  // Ensure storage is seeded before any lookup
  let stored = await CredentialsService.getCredentials();
  if (!stored || stored.length === 0) {
    await StorageManager.saveCredentials(DEFAULT_CREDENTIALS);
    stored = DEFAULT_CREDENTIALS;
  }

  if (domain) {
    const credentials = await CredentialsService.getCredentialsByDomain(domain);
    return { success: true, credentials };
  }

  return { success: true, credentials: stored };
});

/**
 * Search credentials
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.SEARCH_CREDENTIALS, async (payload) => {
  const { query } = payload;
  const credentials = await CredentialsService.searchCredentials(query);
  return { success: true, credentials };
});

/**
 * Get session status
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.GET_SESSION_STATUS, async () => {
  const isAuth = await AuthService.isAuthenticated();
  const isExpired = await AuthService.isSessionExpired();
  const user = await AuthService.getCurrentUser();

  return {
    isAuthenticated: isAuth,
    isSessionExpired: isExpired,
    user,
  };
});

// Pending auto-fill requests mapping: domain -> credential payload
self.pendingAutoFills = {};

/**
 * Register injection intention from Popup
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.INJECT_CREDENTIALS, async (payload) => {
  const targetUrl = payload.targetUrl || payload.domain || '';
  let cleanDomain = '';
  try {
    cleanDomain = new URL(targetUrl.startsWith('http') ? targetUrl : 'http://' + targetUrl).hostname.replace('www.', '');
  } catch {
    cleanDomain = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];
  }
  
  if (cleanDomain) {
    self.pendingAutoFills[cleanDomain] = payload;
    Logger.info(`Stored auto-fill intention for domain: ${cleanDomain}`, payload);
  }
  
  return { success: true };
});


/**
 * Form detected from content script
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.FORM_DETECTED, async (payload, sender) => {
  const { domain, forms } = payload;

  Logger.info(`Forms detected on ${domain}:`, forms.length);

  if (domain && self.pendingAutoFills[domain]) {
    const credToInject = self.pendingAutoFills[domain];
    Logger.info(`Auto-injecting queued credentials for ${domain}`);

    if (sender && sender.tab) {
      setTimeout(() => {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: APP_CONSTANTS.MESSAGE_TYPES.INJECT_CREDENTIALS,
          payload: {
            credentialId: credToInject.id,
            username: credToInject.username,
            password: credToInject.password,
            formId: forms[0]?.id,
            autoSubmit: true
          }
        }).catch(() => {});
      }, 600);

      // Keep record brief or clear once consumed
      delete self.pendingAutoFills[domain];
    }
  }

  return { success: true };
});


/**
 * Credential injected notification
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.CREDENTIAL_INJECTED, async (payload) => {
  const { domain, username } = payload;

  Logger.info(`Credentials injected for ${domain}`);

  return { success: true };
});

// ============ Session Management ============

/**
 * Check session expiry periodically
 */
setInterval(async () => {
  const isExpired = await AuthService.isSessionExpired();
  const isAuth = await AuthService.isAuthenticated();

  if (isAuth && isExpired) {
    Logger.warn('Session expired');

    // Logout user
    await AuthService.logout();

    // Notify all tabs
    await MessageHandler.broadcast(APP_CONSTANTS.MESSAGE_TYPES.SESSION_EXPIRED);
  }
}, 60000); // Check every minute

// ============ Extension Lifecycle Events ============

/**
 * On extension install
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Logger.info('Extension installed');
    // Seed default credentials into storage on fresh install
    StorageManager.saveCredentials(DEFAULT_CREDENTIALS);
    chrome.tabs.create({ url: 'src/popup/welcome.html' });
  } else if (details.reason === 'update') {
    Logger.info('Extension updated');
    // Re-seed to pick up any new default credentials
    StorageManager.saveCredentials(DEFAULT_CREDENTIALS);
  }
});

/**
 * On extension startup
 */
chrome.runtime.onStartup.addListener(() => {
  Logger.info('Extension started');

  // Could perform initialization tasks here
});

Logger.info('Background service worker loaded');
