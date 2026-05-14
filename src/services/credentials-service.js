/**
 * Credentials Service
 * Handles credential management operations
 */

import HTTPClient from '../api/http-client.js';
import StorageManager from '../storage/storage-manager.js';
import { API_ENDPOINTS } from '../config/environment.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
import Logger from '../utils/logger.js';
import ValidationUtils from '../utils/validation-utils.js';

class CredentialsService {
  /**
   * Fetch all credentials from API and cache locally
   * @returns {Promise<Object>}
   */
  static async fetchCredentials() {
    try {
      Logger.info('Fetching credentials from API');

      const response = await HTTPClient.get(API_ENDPOINTS.CREDENTIALS_GET_ALL);

      if (!response.data) {
        throw new Error('Invalid response');
      }

      const credentials = response.data.credentials || [];

      // Cache credentials locally
      await StorageManager.saveCredentials(credentials);

      Logger.info(`Fetched ${credentials.length} credentials`);

      return {
        success: true,
        credentials,
      };
    } catch (error) {
      Logger.error('Error fetching credentials:', error);

      return {
        success: false,
        error: error.message || APP_CONSTANTS.ERRORS.NETWORK_ERROR,
        credentials: [],
      };
    }
  }

  /**
   * Get cached credentials
   * @returns {Promise<Array>}
   */
  static async getCredentials() {
    try {
      return await StorageManager.getCredentials();
    } catch (error) {
      Logger.error('Error getting credentials:', error);
      return [];
    }
  }

  /**
   * Search credentials by domain or name
   * @param {string} query
   * @returns {Promise<Array>}
   */
  static async searchCredentials(query) {
    try {
      if (!query || query.trim() === '') {
        return await this.getCredentials();
      }

      const credentials = await this.getCredentials();
      const lowerQuery = query.toLowerCase();

      return credentials.filter((cred) => {
        return (
          (cred.domain && cred.domain.toLowerCase().includes(lowerQuery)) ||
          (cred.name && cred.name.toLowerCase().includes(lowerQuery)) ||
          (cred.username && cred.username.toLowerCase().includes(lowerQuery))
        );
      });
    } catch (error) {
      Logger.error('Error searching credentials:', error);
      return [];
    }
  }

  /**
   * Get credentials by domain
   * @param {string} domain
   * @returns {Promise<Array>}
   */
  static async getCredentialsByDomain(domain) {
    try {
      if (!ValidationUtils.isValidDomain(domain)) {
        return [];
      }

      const credentials = await this.getCredentials();
      const normalizedDomain = domain.toLowerCase();

      return credentials.filter((cred) => {
        return cred.domain && cred.domain.toLowerCase() === normalizedDomain;
      });
    } catch (error) {
      Logger.error('Error getting credentials by domain:', error);
      return [];
    }
  }

  /**
   * Get credential by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getCredentialById(id) {
    try {
      const credentials = await this.getCredentials();
      return credentials.find((cred) => cred.id === id) || null;
    } catch (error) {
      Logger.error('Error getting credential by ID:', error);
      return null;
    }
  }

  /**
   * Create new credential
   * @param {Object} credentialData
   * @returns {Promise<Object>}
   */
  static async createCredential(credentialData) {
    try {
      Logger.info('Creating new credential');

      const response = await HTTPClient.post(
        API_ENDPOINTS.CREDENTIALS_CREATE,
        credentialData
      );

      if (!response.data || !response.data.credential) {
        throw new Error('Invalid response');
      }

      // Refresh local cache
      await this.fetchCredentials();

      Logger.info('Credential created successfully');

      return {
        success: true,
        credential: response.data.credential,
      };
    } catch (error) {
      Logger.error('Error creating credential:', error);

      return {
        success: false,
        error: error.message || APP_CONSTANTS.ERRORS.NETWORK_ERROR,
      };
    }
  }

  /**
   * Update credential
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  static async updateCredential(id, updates) {
    try {
      Logger.info('Updating credential:', id);

      const endpoint = API_ENDPOINTS.CREDENTIALS_UPDATE.replace(':id', id);
      const response = await HTTPClient.put(endpoint, updates);

      if (!response.data || !response.data.credential) {
        throw new Error('Invalid response');
      }

      // Refresh local cache
      await this.fetchCredentials();

      Logger.info('Credential updated successfully');

      return {
        success: true,
        credential: response.data.credential,
      };
    } catch (error) {
      Logger.error('Error updating credential:', error);

      return {
        success: false,
        error: error.message || APP_CONSTANTS.ERRORS.NETWORK_ERROR,
      };
    }
  }

  /**
   * Delete credential
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async deleteCredential(id) {
    try {
      Logger.info('Deleting credential:', id);

      const endpoint = API_ENDPOINTS.CREDENTIALS_DELETE.replace(':id', id);
      await HTTPClient.delete(endpoint);

      // Refresh local cache
      await this.fetchCredentials();

      Logger.info('Credential deleted successfully');

      return {
        success: true,
      };
    } catch (error) {
      Logger.error('Error deleting credential:', error);

      return {
        success: false,
        error: error.message || APP_CONSTANTS.ERRORS.NETWORK_ERROR,
      };
    }
  }

  /**
   * Sync vault with server
   * @returns {Promise<Object>}
   */
  static async syncVault() {
    try {
      Logger.info('Syncing vault with server');

      await this.fetchCredentials();

      Logger.info('Vault synced successfully');

      return {
        success: true,
      };
    } catch (error) {
      Logger.error('Error syncing vault:', error);

      return {
        success: false,
        error: error.message || APP_CONSTANTS.ERRORS.NETWORK_ERROR,
      };
    }
  }
}

export default CredentialsService;
