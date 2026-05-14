/**
 * Message Handler
 * Centralized message handling for extension communication
 */

import { APP_CONSTANTS } from '../constants/app-constants.js';
import Logger from '../utils/logger.js';

class MessageHandler {
  static listeners = {};

  /**
   * Register message listener
   * @param {string} messageType
   * @param {Function} handler
   */
  static on(messageType, handler) {
    if (!this.listeners[messageType]) {
      this.listeners[messageType] = [];
    }

    this.listeners[messageType].push(handler);

    Logger.debug(`Registered listener for: ${messageType}`);
  }

  /**
   * Remove message listener
   * @param {string} messageType
   * @param {Function} handler
   */
  static off(messageType, handler) {
    if (!this.listeners[messageType]) {
      return;
    }

    this.listeners[messageType] = this.listeners[messageType].filter(
      (h) => h !== handler
    );
  }

  /**
   * Send message
   * @param {string} messageType
   * @param {Object} payload
   * @param {Object} options
   * @returns {Promise<any>}
   */
  static async send(messageType, payload = {}, options = {}) {
    const { tabId = null, timeout = 5000 } = options;

    try {
      const message = {
        type: messageType,
        payload,
        timestamp: Date.now(),
      };

      Logger.debug(`Sending message: ${messageType}`, payload);

      let response;

      if (tabId) {
        // Send to specific tab
        response = await chrome.tabs.sendMessage(tabId, message);
      } else {
        // Send to extension
        response = await chrome.runtime.sendMessage(message);
      }

      Logger.debug(`Message response: ${messageType}`, response);

      return response;
    } catch (error) {
      Logger.error(`Error sending message: ${messageType}`, error);
      throw error;
    }
  }

  /**
   * Broadcast message to all tabs
   * @param {string} messageType
   * @param {Object} payload
   * @returns {Promise<void>}
   */
  static async broadcast(messageType, payload = {}) {
    try {
      const tabs = await chrome.tabs.query({});

      const promises = tabs.map((tab) =>
        this.send(messageType, payload, { tabId: tab.id }).catch(() => {
          // Ignore errors for individual tabs
        })
      );

      await Promise.all(promises);

      Logger.debug(`Broadcasted message: ${messageType}`);
    } catch (error) {
      Logger.error(`Error broadcasting message: ${messageType}`, error);
    }
  }

  /**
   * Handle incoming messages
   * @param {Object} message
   * @param {Object} sender
   * @param {Function} sendResponse
   * @returns {boolean}
   */
  static handleMessage(message, sender, sendResponse) {
    const { type, payload } = message;

    Logger.debug(`Received message: ${type}`, payload);

    if (!this.listeners[type]) {
      Logger.warn(`No listeners for message type: ${type}`);
      sendResponse({ success: false, error: 'No listener found' });
      return true;
    }

    // Execute all listeners for this message type
    Promise.all(
      this.listeners[type].map((handler) => {
        return Promise.resolve(handler(payload, sender));
      })
    )
      .then((results) => {
        // Send back the last result
        sendResponse({ success: true, data: results[results.length - 1] });
      })
      .catch((error) => {
        Logger.error(`Error handling message: ${type}`, error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }

  /**
   * Register chrome.runtime.onMessage listener
   */
  static initializeMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.handleMessage(message, sender, sendResponse);
    });

    Logger.info('Message listener initialized');
  }
}

export default MessageHandler;
