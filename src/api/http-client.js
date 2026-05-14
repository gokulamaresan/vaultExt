/**
 * HTTP Client
 * Handles all API requests with retry logic, timeouts, and error handling
 */

import Logger from '../utils/logger.js';
import { config, API_ENDPOINTS } from '../config/environment.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
import ValidationUtils from '../utils/validation-utils.js';
import StorageManager from '../storage/storage-manager.js';

class HTTPClient {
  /**
   * Perform HTTP request
   * @param {string} method - GET, POST, PUT, DELETE, etc.
   * @param {string} endpoint - API endpoint
   * @param {Object} options - request options
   * @returns {Promise<Object>}
   */
  static async request(method, endpoint, options = {}) {
    const {
      body = null,
      headers = {},
      requiresAuth = true,
      retries = APP_CONSTANTS.API.RETRY_ATTEMPTS,
      timeout = APP_CONSTANTS.API.TIMEOUT,
    } = options;

    // Build full URL
    const url = `${config.API_BASE_URL}${endpoint}`;

    // Prepare headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = await StorageManager.getJWTToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    // Attempt request with retry logic
    return this._requestWithRetry(
      url,
      method,
      body,
      requestHeaders,
      retries,
      timeout
    );
  }

  /**
   * Request with automatic retry
   * @private
   * @param {string} url
   * @param {string} method
   * @param {any} body
   * @param {Object} headers
   * @param {number} retries
   * @param {number} timeout
   * @returns {Promise<Object>}
   */
  static async _requestWithRetry(url, method, body, headers, retries, timeout) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        Logger.debug(`API Request (Attempt ${attempt}/${retries}):`, {
          method,
          url,
        });

        const response = await this._executeRequest(
          url,
          method,
          body,
          headers,
          timeout
        );

        return response;
      } catch (error) {
        lastError = error;
        Logger.warn(`API Request failed (Attempt ${attempt}/${retries}):`, error.message);

        // Don't retry on auth errors
        if (error.status === 401 || error.status === 403) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          await this._delay(APP_CONSTANTS.API.RETRY_DELAY * attempt);
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Execute fetch request with timeout
   * @private
   * @param {string} url
   * @param {string} method
   * @param {any} body
   * @param {Object} headers
   * @param {number} timeout
   * @returns {Promise<Object>}
   */
  static async _executeRequest(url, method, body, headers, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      Logger.debug('API Response Success:', { status: response.status });

      return {
        status: response.status,
        data,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(APP_CONSTANTS.ERRORS.TIMEOUT_ERROR);
      }

      throw error;
    }
  }

  /**
   * Delay utility
   * @private
   * @param {number} ms
   * @returns {Promise<void>}
   */
  static _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============ Convenience Methods ============

  /**
   * GET request
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static get(endpoint, options) {
    return this.request('GET', endpoint, options);
  }

  /**
   * POST request
   * @param {string} endpoint
   * @param {any} body
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static post(endpoint, body, options) {
    return this.request('POST', endpoint, { ...options, body });
  }

  /**
   * PUT request
   * @param {string} endpoint
   * @param {any} body
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static put(endpoint, body, options) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  /**
   * DELETE request
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static delete(endpoint, options) {
    return this.request('DELETE', endpoint, options);
  }

  /**
   * PATCH request
   * @param {string} endpoint
   * @param {any} body
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static patch(endpoint, body, options) {
    return this.request('PATCH', endpoint, { ...options, body });
  }
}

export default HTTPClient;
