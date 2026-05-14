/**
 * Crypto Utilities
 * Handles encryption and decryption of sensitive data
 */

import Logger from './logger.js';

class CryptoUtils {
  /**
   * Hash a string using SubtleCrypto
   * @param {string} text
   * @returns {Promise<string>}
   */
  static async hashText(text) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return this._bufferToHex(hashBuffer);
    } catch (error) {
      Logger.error('Error hashing text', error);
      throw new Error('Hashing failed');
    }
  }

  /**
   * Generate a random token
   * @returns {string}
   */
  static generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this._bufferToHex(array);
  }

  /**
   * Encrypt text using AES-GCM
   * @param {string} text
   * @param {CryptoKey} key
   * @returns {Promise<string>}
   */
  static async encryptAES(text, key) {
    try {
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encoder.encode(text)
      );

      // Combine IV and ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);

      return this._bufferToBase64(combined);
    } catch (error) {
      Logger.error('Encryption error', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt text using AES-GCM
   * @param {string} encryptedText - Base64 encoded
   * @param {CryptoKey} key
   * @returns {Promise<string>}
   */
  static async decryptAES(encryptedText, key) {
    try {
      const combined = this._base64ToBuffer(encryptedText);
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      Logger.error('Decryption error', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate an AES key
   * @returns {Promise<CryptoKey>}
   */
  static async generateAESKey() {
    try {
      return await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      Logger.error('Error generating AES key', error);
      throw new Error('Key generation failed');
    }
  }

  /**
   * Convert ArrayBuffer to Hex string
   * @private
   * @param {ArrayBuffer} buffer
   * @returns {string}
   */
  static _bufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert ArrayBuffer to Base64
   * @private
   * @param {Uint8Array} buffer
   * @returns {string}
   */
  static _bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to Uint8Array
   * @private
   * @param {string} base64String
   * @returns {Uint8Array}
   */
  static _base64ToBuffer(base64String) {
    const binary = atob(base64String);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export default CryptoUtils;
