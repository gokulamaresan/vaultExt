/**
 * Validation Utilities
 * Helper functions for data validation
 */

class ValidationUtils {
  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   * @param {string} url
   * @returns {boolean}
   */
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate domain
   * @param {string} domain
   * @returns {boolean}
   */
  static isValidDomain(domain) {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }

  /**
   * Extract domain from URL
   * Handles standard URLs (http/https) and non-standard protocols (e.g. sky:366)
   * @param {string} url
   * @returns {string|null}
   */
  static extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      // Fallback: strip protocol and grab host segment for non-standard URLs
      return ValidationUtils.extractRawHost(url);
    }
  }

  /**
   * Extract raw host from any URL string, including non-standard protocols.
   * e.g. 'http://sky:366/' => 'sky:366'
   *      'sky:366'         => 'sky:366'
   *      'http://foo.com/bar' => 'foo.com'
   * @param {string} url
   * @returns {string|null}
   */
  static extractRawHost(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      // Remove protocol prefix (anything before ://)
      const withoutProtocol = url.replace(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//, '');
      // Remove path, query, hash — take only the host:port part
      const hostPart = withoutProtocol.split('/')[0].split('?')[0].split('#')[0];
      return hostPart.replace(/^www\./, '') || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate password strength
   * @param {string} password
   * @returns {Object}
   */
  static validatePasswordStrength(password) {
    const result = {
      isStrong: false,
      score: 0,
      feedback: [],
    };

    if (password.length >= 8) {
      result.score += 25;
    } else {
      result.feedback.push('Password should be at least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      result.score += 25;
    } else {
      result.feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      result.score += 25;
    } else {
      result.feedback.push('Add uppercase letters');
    }

    if (/[0-9]/.test(password)) {
      result.score += 15;
    } else {
      result.feedback.push('Add numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      result.score += 10;
    } else {
      result.feedback.push('Add special characters');
    }

    result.isStrong = result.score >= 75;
    return result;
  }

  /**
   * Check if value is empty
   * @param {any} value
   * @returns {boolean}
   */
  static isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  }

  /**
   * Sanitize input to prevent XSS
   * @param {string} input
   * @returns {string}
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate JWT token format
   * @param {string} token
   * @returns {boolean}
   */
  static isValidJWT(token) {
    if (typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  /**
   * Check if JWT token is expired
   * @param {string} token
   * @returns {boolean}
   */
  static isJWTExpired(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp && payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get JWT expiration time
   * @param {string} token
   * @returns {number|null}
   */
  static getJWTExpirationTime(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}

export default ValidationUtils;
