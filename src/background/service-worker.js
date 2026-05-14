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

/**
 * Fetch credentials
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.FETCH_CREDENTIALS, async (payload) => {
  const { domain } = payload;

  if (domain) {
    const credentials = await CredentialsService.getCredentialsByDomain(domain);
    return { success: true, credentials };
  }

  const credentials = await CredentialsService.getCredentials();
  return { success: true, credentials };
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

/**
 * Form detected from content script
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.FORM_DETECTED, async (payload) => {
  const { domain, forms } = payload;

  Logger.info(`Forms detected on ${domain}:`, forms.length);

  // You can implement additional logic here if needed
  // For example, storing which domains have forms detected

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

    // Open welcome page
    chrome.tabs.create({ url: 'src/popup/welcome.html' });
  } else if (details.reason === 'update') {
    Logger.info('Extension updated');
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
