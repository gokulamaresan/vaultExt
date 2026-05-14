/**
 * Storage Manager
 * Repository pattern for managing all storage operations
 * Supports both local and session storage
 */

import Logger from '../utils/logger.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';

class StorageManager {
  /**
   * Get value from Chrome storage
   * @param {string} key
   * @param {string} type - 'local' or 'session'
   * @returns {Promise<any>}
   */
  static async get(key, type = 'local') {
    try {
      const storage = type === 'local' ? chrome.storage.local : chrome.storage.session;
      const result = await storage.get(key);
      return result[key];
    } catch (error) {
      Logger.error(`Error getting ${key} from ${type} storage`, error);
      return null;
    }
  }

  /**
   * Get multiple values
   * @param {Array<string>} keys
   * @param {string} type
   * @returns {Promise<Object>}
   */
  static async getMultiple(keys, type = 'local') {
    try {
      const storage = type === 'local' ? chrome.storage.local : chrome.storage.session;
      const result = await storage.get(keys);
      return result;
    } catch (error) {
      Logger.error(`Error getting multiple keys from ${type} storage`, error);
      return {};
    }
  }

  /**
   * Set value in Chrome storage
   * @param {string} key
   * @param {any} value
   * @param {string} type
   * @returns {Promise<boolean>}
   */
  static async set(key, value, type = 'local') {
    try {
      const storage = type === 'local' ? chrome.storage.local : chrome.storage.session;
      await storage.set({ [key]: value });
      return true;
    } catch (error) {
      Logger.error(`Error setting ${key} in ${type} storage`, error);
      return false;
    }
  }

  /**
   * Set multiple values
   * @param {Object} items
   * @param {string} type
   * @returns {Promise<boolean>}
   */
  static async setMultiple(items, type = 'local') {
    try {
      const storage = type === 'local' ? chrome.storage.local : chrome.storage.session;
      await storage.set(items);
      return true;
    } catch (error) {
      Logger.error(`Error setting multiple items in ${type} storage`, error);
      return false;
    }
  }

  /**
   * Remove value from storage
   * @param {string} key
   * @param {string} type
   * @returns {Promise<boolean>}
   */
  static async remove(key, type = 'local') {
    try {
      const storage = type === 'local' ? chrome.storage.local : chrome.storage.session;
      await storage.remove(key);
      return true;
    } catch (error) {
      Logger.error(`Error removing ${key} from ${type} storage`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   * @param {string} type
   * @returns {Promise<boolean>}
   */
  static async clear(type = 'local') {
    try {
      const storage = type === 'local' ? chrome.storage.local : chrome.storage.session;
      await storage.clear();
      return true;
    } catch (error) {
      Logger.error(`Error clearing ${type} storage`, error);
      return false;
    }
  }

  /**
   * Get all stored data
   * @param {string} type
   * @returns {Promise<Object>}
   */
  static async getAll(type = 'local') {
    try {
      const storage = type === 'local' ? chrome.storage.local : chrome.storage.session;
      return await storage.get(null);
    } catch (error) {
      Logger.error(`Error getting all from ${type} storage`, error);
      return {};
    }
  }

  // ============ Specialized Methods ============

  /**
   * Save JWT token
   * @param {string} token
   * @returns {Promise<boolean>}
   */
  static async saveJWTToken(token) {
    return this.set(APP_CONSTANTS.STORAGE_KEYS.JWT_TOKEN, token);
  }

  /**
   * Get JWT token
   * @returns {Promise<string|null>}
   */
  static async getJWTToken() {
    return this.get(APP_CONSTANTS.STORAGE_KEYS.JWT_TOKEN);
  }

  /**
   * Remove JWT token
   * @returns {Promise<boolean>}
   */
  static async removeJWTToken() {
    return this.remove(APP_CONSTANTS.STORAGE_KEYS.JWT_TOKEN);
  }

  /**
   * Save user data
   * @param {Object} userData
   * @returns {Promise<boolean>}
   */
  static async saveUserData(userData) {
    return this.set(APP_CONSTANTS.STORAGE_KEYS.USER_DATA, userData);
  }

  /**
   * Get user data
   * @returns {Promise<Object|null>}
   */
  static async getUserData() {
    return this.get(APP_CONSTANTS.STORAGE_KEYS.USER_DATA);
  }

  /**
   * Save credentials
   * @param {Array} credentials
   * @returns {Promise<boolean>}
   */
  static async saveCredentials(credentials) {
    return this.set(APP_CONSTANTS.STORAGE_KEYS.CREDENTIALS, credentials);
  }

  /**
   * Get credentials
   * @returns {Promise<Array|null>}
   */
  static async getCredentials() {
    return this.get(APP_CONSTANTS.STORAGE_KEYS.CREDENTIALS) || [];
  }

  /**
   * Save session timeout timestamp
   * @param {number} timestamp
   * @returns {Promise<boolean>}
   */
  static async saveSessionTimeout(timestamp) {
    return this.set(APP_CONSTANTS.STORAGE_KEYS.SESSION_TIMEOUT, timestamp, 'session');
  }

  /**
   * Get session timeout timestamp
   * @returns {Promise<number|null>}
   */
  static async getSessionTimeout() {
    return this.get(APP_CONSTANTS.STORAGE_KEYS.SESSION_TIMEOUT, 'session');
  }

  /**
   * Clear session data
   * @returns {Promise<boolean>}
   */
  static async clearSessionData() {
    return this.clear('session');
  }
}

export default StorageManager;
