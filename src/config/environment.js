/**
 * Environment Configuration
 * Handles different environment settings for development and production
 */

const ENVIRONMENT = process.env.NODE_ENV || 'development';

const environments = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api',
    DEBUG: true,
    LOG_LEVEL: 'debug',
  },
  staging: {
    API_BASE_URL: 'https://staging-api.vaultguard.app/api',
    DEBUG: true,
    LOG_LEVEL: 'info',
  },
  production: {
    API_BASE_URL: 'https://api.vaultguard.app/api',
    DEBUG: false,
    LOG_LEVEL: 'error',
  },
};

export const config = environments[ENVIRONMENT] || environments.production;

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_REFRESH: '/auth/refresh-token',
  AUTH_LOGOUT: '/auth/logout',
  CREDENTIALS_GET_ALL: '/credentials',
  CREDENTIALS_GET_BY_ID: '/credentials/:id',
  CREDENTIALS_CREATE: '/credentials',
  CREDENTIALS_UPDATE: '/credentials/:id',
  CREDENTIALS_DELETE: '/credentials/:id',
  CREDENTIALS_SEARCH: '/credentials/search',
  VAULT_SYNC: '/vault/sync',
};

export default config;
