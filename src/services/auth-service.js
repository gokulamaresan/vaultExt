/**
 * Authentication Service
 * Handles user authentication, token management, and session handling
 */

import HTTPClient from '../api/http-client.js';
import StorageManager from '../storage/storage-manager.js';
import { API_ENDPOINTS } from '../config/environment.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
import ValidationUtils from '../utils/validation-utils.js';
import Logger from '../utils/logger.js';

class AuthService {
  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  static async login(email, password) {
    try {
      // Validate input
      if (!ValidationUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (!password || password.length < 1) {
        throw new Error('Password is required');
      }

      Logger.info('Attempting login for user:', email);

      // API call
      const response = await HTTPClient.post(API_ENDPOINTS.AUTH_LOGIN, {
        email,
        password,
      }, { requiresAuth: false });

      // Validate response
      if (!response.data || !response.data.token) {
        throw new Error(APP_CONSTANTS.ERRORS.AUTHENTICATION_FAILED);
      }

      const { token, user } = response.data;

      // Validate JWT
      if (!ValidationUtils.isValidJWT(token)) {
        throw new Error('Invalid token received');
      }

      // Save token and user data
      await StorageManager.saveJWTToken(token);
      await StorageManager.saveUserData(user);
      
      // Reset session timeout
      await this._resetSessionTimeout();

      Logger.info('Login successful for user:', email);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      Logger.error('Login failed:', error);

      return {
        success: false,
        error: error.message || APP_CONSTANTS.ERRORS.AUTHENTICATION_FAILED,
      };
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>}
   */
  static async logout() {
    try {
      Logger.info('Logging out user');

      const token = await StorageManager.getJWTToken();

      // Notify server (optional, but recommended)
      if (token) {
        try {
          await HTTPClient.post(API_ENDPOINTS.AUTH_LOGOUT, {});
        } catch (error) {
          Logger.warn('Error notifying server of logout:', error);
          // Continue logout even if server notification fails
        }
      }

      // Clear storage
      await StorageManager.removeJWTToken();
      await StorageManager.remove(APP_CONSTANTS.STORAGE_KEYS.USER_DATA);
      await StorageManager.clearSessionData();

      Logger.info('Logout successful');

      return {
        success: true,
      };
    } catch (error) {
      Logger.error('Logout failed:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  static async isAuthenticated() {
    try {
      const token = await StorageManager.getJWTToken();

      if (!token) {
        return false;
      }

      // Check if token is valid and not expired
      if (ValidationUtils.isJWTExpired(token)) {
        Logger.warn('JWT token expired');
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object|null>}
   */
  static async getCurrentUser() {
    try {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        return null;
      }

      return await StorageManager.getUserData();
    } catch (error) {
      Logger.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Refresh token
   * @returns {Promise<Object>}
   */
  static async refreshToken() {
    try {
      Logger.info('Refreshing authentication token');

      const response = await HTTPClient.post(API_ENDPOINTS.AUTH_REFRESH, {});

      if (!response.data || !response.data.token) {
        throw new Error('Invalid refresh response');
      }

      const { token } = response.data;

      if (!ValidationUtils.isValidJWT(token)) {
        throw new Error('Invalid token received');
      }

      await StorageManager.saveJWTToken(token);
      await this._resetSessionTimeout();

      Logger.info('Token refreshed successfully');

      return {
        success: true,
        token,
      };
    } catch (error) {
      Logger.error('Token refresh failed:', error);

      // If refresh fails, logout user
      await this.logout();

      return {
        success: false,
        error: error.message || APP_CONSTANTS.ERRORS.INVALID_TOKEN,
      };
    }
  }

  /**
   * Get JWT token
   * @returns {Promise<string|null>}
   */
  static async getToken() {
    const token = await StorageManager.getJWTToken();
    
    // Check if token is expiring soon
    if (token && !ValidationUtils.isJWTExpired(token)) {
      const expirationTime = ValidationUtils.getJWTExpirationTime(token);
      const timeUntilExpiry = expirationTime - Date.now();

      // If less than 5 minutes left, try to refresh
      if (timeUntilExpiry < APP_CONSTANTS.SESSION.TOKEN_EXPIRY_WARNING) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          return refreshResult.token;
        }
      }
    }

    return token;
  }

  /**
   * Reset session timeout
   * @private
   * @returns {Promise<void>}
   */
  static async _resetSessionTimeout() {
    const timeout = Date.now() + APP_CONSTANTS.SESSION.TIMEOUT_DURATION;
    await StorageManager.saveSessionTimeout(timeout);
  }

  /**
   * Check session expiry
   * @returns {Promise<boolean>}
   */
  static async isSessionExpired() {
    try {
      const timeout = await StorageManager.getSessionTimeout();

      if (!timeout) {
        return true;
      }

      return Date.now() > timeout;
    } catch (error) {
      Logger.error('Error checking session expiry:', error);
      return true;
    }
  }
}

export default AuthService;
