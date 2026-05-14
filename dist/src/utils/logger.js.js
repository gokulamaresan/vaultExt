/**
 * Logger Utility
 * Provides consistent logging across the extension
 */

import { config } from "/src/config/environment.js.js";

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_MAP = {
  debug: LOG_LEVELS.DEBUG,
  info: LOG_LEVELS.INFO,
  warn: LOG_LEVELS.WARN,
  error: LOG_LEVELS.ERROR,
};

const currentLogLevel = LOG_LEVEL_MAP[config.LOG_LEVEL] || LOG_LEVELS.INFO;

class Logger {
  /**
   * Debug log
   * @param {string} message
   * @param {any} data
   */
  static debug(message, data) {
    if (LOG_LEVELS.DEBUG >= currentLogLevel) {
      console.debug(`[VaultGuard Debug] ${message}`, data || '');
    }
  }

  /**
   * Info log
   * @param {string} message
   * @param {any} data
   */
  static info(message, data) {
    if (LOG_LEVELS.INFO >= currentLogLevel) {
      console.info(`[VaultGuard Info] ${message}`, data || '');
    }
  }

  /**
   * Warning log
   * @param {string} message
   * @param {any} data
   */
  static warn(message, data) {
    if (LOG_LEVELS.WARN >= currentLogLevel) {
      console.warn(`[VaultGuard Warn] ${message}`, data || '');
    }
  }

  /**
   * Error log
   * @param {string} message
   * @param {any} error
   */
  static error(message, error) {
    if (LOG_LEVELS.ERROR >= currentLogLevel) {
      console.error(`[VaultGuard Error] ${message}`, error || '');
    }
  }

  /**
   * Log with custom prefix
   * @param {string} prefix
   * @param {string} message
   * @param {any} data
   */
  static custom(prefix, message, data) {
    console.log(`[${prefix}] ${message}`, data || '');
  }
}

export default Logger;
