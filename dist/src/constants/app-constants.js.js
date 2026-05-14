/**
 * Application-wide constants
 * Defines all constant values used across the extension
 */

export const APP_CONSTANTS = {
  // Extension metadata
  VERSION: '1.0.0',
  EXTENSION_NAME: 'VaultGuard',
  
  // API Configuration
  API: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    JWT_TOKEN: 'vaultguard_jwt_token',
    USER_DATA: 'vaultguard_user_data',
    CREDENTIALS: 'vaultguard_credentials',
    SESSION_TIMEOUT: 'vaultguard_session_timeout',
    VAULT_DATA: 'vaultguard_vault_data',
    LAST_SYNC: 'vaultguard_last_sync',
    USER_PREFERENCES: 'vaultguard_user_preferences',
    MASTER_KEY: 'vaultguard_master_key',
  },
  
  // Session Configuration
  SESSION: {
    TIMEOUT_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
    TOKEN_EXPIRY_WARNING: 5 * 60 * 1000, // 5 minutes before expiry
  },
  
  // Form Detection Patterns
  FORM_PATTERNS: {
    USERNAME_FIELDS: ['username', 'email', 'user_email', 'login', 'user_login', 'userid', 'user_id'],
    PASSWORD_FIELDS: ['password', 'pass', 'pwd', 'passwd'],
    FORM_SELECTORS: ['form', 'div[role="form"]', '[data-form]'],
  },
  
  // UI Constants
  UI: {
    POPUP_WIDTH: 400,
    POPUP_HEIGHT: 600,
    NOTIFICATION_DURATION: 5000, // 5 seconds
    ANIMATION_DURATION: 300, // 300ms
  },
  
  // Message Types for communication
  MESSAGE_TYPES: {
    // Background to Content
    INJECT_CREDENTIALS: 'INJECT_CREDENTIALS',
    DETECT_FORMS: 'DETECT_FORMS',
    LOCK_VAULT: 'LOCK_VAULT',
    
    // Content to Background
    FORM_DETECTED: 'FORM_DETECTED',
    CREDENTIAL_REQUEST: 'CREDENTIAL_REQUEST',
    CREDENTIAL_INJECTED: 'CREDENTIAL_INJECTED',
    
    // Popup to Background
    LOGIN_REQUEST: 'LOGIN_REQUEST',
    LOGOUT_REQUEST: 'LOGOUT_REQUEST',
    FETCH_CREDENTIALS: 'FETCH_CREDENTIALS',
    SEARCH_CREDENTIALS: 'SEARCH_CREDENTIALS',
    DELETE_CREDENTIAL: 'DELETE_CREDENTIAL',
    UPDATE_CREDENTIAL: 'UPDATE_CREDENTIAL',
    GET_SESSION_STATUS: 'GET_SESSION_STATUS',
    
    // Background to Popup
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    CREDENTIALS_UPDATED: 'CREDENTIALS_UPDATED',
    VAULT_LOCKED: 'VAULT_LOCKED',
  },
  
  // Error Messages
  ERRORS: {
    AUTHENTICATION_FAILED: 'Authentication failed. Please check your credentials.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    INVALID_TOKEN: 'Session expired. Please login again.',
    TIMEOUT_ERROR: 'Request timeout. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    INVALID_FORM: 'Invalid form detected.',
    NO_CREDENTIALS: 'No credentials found for this domain.',
    ENCRYPTION_ERROR: 'Encryption error occurred.',
    DECRYPTION_ERROR: 'Decryption error occurred.',
  },
  
  // Success Messages
  SUCCESS: {
    LOGIN_SUCCESSFUL: 'Login successful!',
    LOGOUT_SUCCESSFUL: 'Logout successful!',
    CREDENTIALS_COPIED: 'Credentials copied to clipboard!',
    CREDENTIAL_DELETED: 'Credential deleted successfully!',
    CREDENTIAL_UPDATED: 'Credential updated successfully!',
    AUTOFILL_SUCCESSFUL: 'Credentials autofilled!',
  },
  
  // API Response Status
  API_STATUS: {
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending',
  },
};

export default APP_CONSTANTS;
