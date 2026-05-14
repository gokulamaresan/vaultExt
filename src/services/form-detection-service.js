/**
 * Form Detection Service
 * Detects login forms on pages and identifies username/password fields
 */

import { APP_CONSTANTS } from '../constants/app-constants.js';
import Logger from '../utils/logger.js';
import DOMUtils from '../utils/dom-utils.js';

class FormDetectionService {
  /**
   * Detect all forms on page
   * @returns {Array<Object>}
   */
  static detectForms() {
    try {
      const forms = DOMUtils.querySelectorAll(APP_CONSTANTS.FORM_PATTERNS.FORM_SELECTORS.join(','));
      const detectedForms = [];

      forms.forEach((form, index) => {
        const formData = this._analyzeForm(form, index);
        if (formData) {
          detectedForms.push(formData);
        }
      });

      Logger.debug(`Detected ${detectedForms.length} forms`, detectedForms);

      return detectedForms;
    } catch (error) {
      Logger.error('Error detecting forms:', error);
      return [];
    }
  }

  /**
   * Analyze a single form
   * @private
   * @param {HTMLElement} form
   * @param {number} index
   * @returns {Object|null}
   */
  static _analyzeForm(form, index) {
    try {
      const usernameField = this._findField(
        form,
        APP_CONSTANTS.FORM_PATTERNS.USERNAME_FIELDS
      );
      const passwordField = this._findField(
        form,
        APP_CONSTANTS.FORM_PATTERNS.PASSWORD_FIELDS
      );

      // Only consider it a login form if it has both username and password
      if (!usernameField || !passwordField) {
        return null;
      }

      const submitButton = this._findSubmitButton(form);

      return {
        id: `form-${index}`,
        element: form,
        usernameField: {
          selector: this._getSelector(usernameField),
          name: usernameField.name || usernameField.id || '',
          value: usernameField.value || '',
        },
        passwordField: {
          selector: this._getSelector(passwordField),
          name: passwordField.name || passwordField.id || '',
          value: passwordField.value || '',
        },
        submitButton: submitButton ? this._getSelector(submitButton) : null,
        isVisible: DOMUtils.isVisible(form),
        formAction: form.action || '',
        formMethod: form.method || 'POST',
      };
    } catch (error) {
      Logger.warn('Error analyzing form:', error);
      return null;
    }
  }

  /**
   * Find input field matching patterns
   * @private
   * @param {HTMLElement} form
   * @param {Array<string>} patterns
   * @returns {HTMLElement|null}
   */
  static _findField(form, patterns) {
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input:not([type])');

    for (const input of inputs) {
      const nameAttr = (input.name || '').toLowerCase();
      const idAttr = (input.id || '').toLowerCase();
      const typeAttr = (input.type || '').toLowerCase();

      for (const pattern of patterns) {
        if (
          nameAttr.includes(pattern) ||
          idAttr.includes(pattern) ||
          typeAttr.includes(pattern)
        ) {
          return input;
        }
      }
    }

    return null;
  }

  /**
   * Find submit button in form
   * @private
   * @param {HTMLElement} form
   * @returns {HTMLElement|null}
   */
  static _findSubmitButton(form) {
    const buttons = form.querySelectorAll('button[type="submit"], button, input[type="submit"]');

    for (const button of buttons) {
      if (DOMUtils.isVisible(button)) {
        return button;
      }
    }

    return null;
  }

  /**
   * Get unique selector for element
   * @private
   * @param {HTMLElement} element
   * @returns {string}
   */
  static _getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.name) {
      return `[name="${element.name}"]`;
    }

    let path = [];
    let el = element;

    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();

      if (el.id) {
        selector += `#${el.id}`;
      } else {
        let sibling = el;
        let nth = 1;

        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling;
          if (sibling.tagName.toLowerCase() === selector) {
            nth++;
          }
        }

        if (nth > 1) {
          selector += `:nth-of-type(${nth})`;
        }
      }

      path.unshift(selector);
      el = el.parentElement;

      if (el && el.id) {
        path.unshift(`#${el.id}`);
        break;
      }
    }

    return path.join(' > ');
  }

  /**
   * Inject credentials into form
   * @param {Object} form - Detected form object
   * @param {string} username
   * @param {string} password
   * @returns {boolean}
   */
  static injectCredentials(form, username, password) {
    try {
      const usernameField = document.querySelector(form.usernameField.selector);
      const passwordField = document.querySelector(form.passwordField.selector);

      if (!usernameField || !passwordField) {
        Logger.warn('Could not find form fields');
        return false;
      }

      // Set values
      usernameField.value = username;
      passwordField.value = password;

      // Trigger change events
      this._triggerEvent(usernameField, 'input');
      this._triggerEvent(usernameField, 'change');
      this._triggerEvent(passwordField, 'input');
      this._triggerEvent(passwordField, 'change');

      Logger.info('Credentials injected successfully');

      return true;
    } catch (error) {
      Logger.error('Error injecting credentials:', error);
      return false;
    }
  }

  /**
   * Trigger event on element
   * @private
   * @param {HTMLElement} element
   * @param {string} eventType
   */
  static _triggerEvent(element, eventType) {
    const event = new Event(eventType, { bubbles: true });
    element.dispatchEvent(event);
  }
}

export default FormDetectionService;
