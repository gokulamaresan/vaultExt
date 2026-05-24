/**
 * Form Detection Service
 * Detects login forms on pages and identifies username/password fields using advanced DOM heuristics and field scoring.
 */

import { APP_CONSTANTS } from "/src/constants/app-constants.js.js";
import Logger from "/src/utils/logger.js.js";
import DOMUtils from "/src/utils/dom-utils.js.js";

const AUTO_LOGIN_MARKER = '__vaultguardAutoLoginApplied';
const DEFAULT_RETRY_DELAY = 500;
const MAX_RETRY_ATTEMPTS = 9;

const FIELD_PATTERNS = {
  username: [
    'username', 'user', 'user_name', 'user-id', 'useremail', 'email', 'e-mail', 'login', 'loginid', 'userid', 'user_id', 'account', 'identifier', 'auth'
  ],
  password: [
    'password', 'passwd', 'pass', 'pwd', 'secret', 'credential'
  ],
  otp: [
    'otp', 'pin', 'verification', 'authcode', '2fa', 'twofactor', 'two-factor', 'mfa', 'code'
  ],
  captcha: [
    'captcha', 'security', 'code', 'verification', 'human'
  ]
};

const BUTTON_PATTERNS = [
  'login', 'sign in', 'signin', 'log in', 'submit', 'continue', 'next', 'verify', 'authenticate', 'finish'
];

const FORM_CANDIDATE_SELECTORS = [
  'form',
  'div[role="form"]',
  'fieldset',
  '[data-form]',
  'section',
  'main',
  'article'
];

const INPUT_SELECTORS = [
  'input[type="text"]',
  'input[type="email"]',
  'input[type="password"]',
  'input:not([type])',
  'textarea'
];

class FormDetectionService {
  /**
   * Detect login forms on the page using scoring heuristics and visibility checks.
   * @returns {Array<Object>}
   */
  static detectForms() {
    try {
      const containers = this._collectFormContainers();
      const forms = containers
        .map((container, index) => this._scoreFormContainer(container, index))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .map((formData, index) => ({ ...formData, rank: index + 1 }));

      Logger.debug('Detected login forms', forms.map(f => ({ id: f.id, score: f.score, visible: f.isVisible })));
      return forms;
    } catch (error) {
      Logger.error('Error detecting forms:', error);
      return [];
    }
  }

  /**
   * Auto-fill the best-matched form using provided credentials.
   * @param {{username:string,password:string}} credentials
   * @param {Object} options
   * @param {boolean} [options.autoSubmit=true]
   * @param {boolean} [options.retry=true]
   * @returns {boolean}
   */
  static autoFillLogin(credentials, options = {}) {
    const { username, password } = credentials || {};
    if (!username || !password) {
      Logger.warn('AutoFill skipped: missing credentials');
      return false;
    }

    if (this._hasAutoLoggedIn()) {
      Logger.debug('AutoFill skipped: page already auto-filled');
      return false;
    }

    const forms = this.detectForms();
    if (!forms.length) {
      if (options.retry !== false) {
        return this._retryAutoFill(credentials, options);
      }
      return false;
    }

    const bestForm = forms[0];
    if (!bestForm.usernameField || !bestForm.passwordField) {
      Logger.warn('No valid credential fields found');
      return false;
    }

    const success = this.injectCredentials(bestForm, username, password, options.autoSubmit !== false);
    if (success) {
      this._markAutoLoggedIn(bestForm);
    }
    return success;
  }

  /**
   * Detect if the current page is currently showing an OTP step.
   * @returns {boolean}
   */
  static isOtpStepPresent() {
    const otpInputs = Array.from(document.querySelectorAll(INPUT_SELECTORS.join(','))).filter(input => {
      if (!this._isVisibleInput(input)) return false;
      const fingerprint = this._getFieldFingerprint(input);
      return FIELD_PATTERNS.otp.some(pattern => fingerprint.includes(pattern));
    });
    return otpInputs.length > 0;
  }

  /**
   * Detect if the current page is currently showing a Captcha field.
   * @returns {boolean}
   */
  static isCaptchaPresent() {
    const captchaElements = Array.from(document.querySelectorAll(INPUT_SELECTORS.join(',') + ',img,canvas')).filter(el => {
      if (!DOMUtils.isVisible(el)) return false;
      const fingerprint = this._getFieldFingerprint(el);
      return FIELD_PATTERNS.captcha.some(pattern => fingerprint.includes(pattern));
    });
    return captchaElements.length > 0;
  }

  /**
   * Inject credentials into a form and optionally submit it.
   * @param {Object} form
   * @param {string} username
   * @param {string} password
   * @param {boolean} autoSubmit
   * @returns {boolean}
   */
  static injectCredentials(form, username, password, autoSubmit = true) {
    try {
      if (!form || !username || !password) {
        Logger.warn('injectCredentials requires form and credentials');
        return false;
      }

      const usernameField = this._resolveField(form.usernameField?.selector);
      const passwordField = this._resolveField(form.passwordField?.selector);
      if (!usernameField || !passwordField) {
        Logger.warn('injectCredentials could not resolve selectors, retrying with live detect');
        const fallback = this.detectForms()[0];
        if (!fallback) return false;
        return this.injectCredentials(fallback, username, password, autoSubmit);
      }

      this._fillField(usernameField, username);
      this._fillField(passwordField, password);

      if (this.isOtpStepPresent() || this.isCaptchaPresent()) {
        Logger.info('OTP/Captcha detected after credential injection; interrupting auto-submit');
        this._markAutoLoggedIn(form);
        return true;
      }

      if (autoSubmit) {
        this._submitForm(form, usernameField, passwordField);
      }

      this._markAutoLoggedIn(form);
      return true;
    } catch (error) {
      Logger.error('Error injecting credentials:', error);
      return false;
    }
  }

  /**
   * Observe DOM changes and re-run detection with debounce.
   * @param {Function} callback
   * @param {number} delay
   */
  static observeDynamicForms(callback, delay = 350) {
    if (this._observer) {
      return;
    }

    const debounced = DOMUtils.debounce(() => {
      try {
        callback();
      } catch (error) {
        Logger.warn('Error in dynamic form observer callback:', error);
      }
    }, delay);

    this._observer = new MutationObserver(debounced);
    this._observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'class', 'type', 'name', 'placeholder', 'autocomplete', 'style'],
    });
  }

  /**
   * Collect candidate containers for form detection.
   * @returns {Array<HTMLElement>}
   * @private
   */
  static _collectFormContainers() {
    const selectors = FORM_CANDIDATE_SELECTORS.join(',');
    const containers = Array.from(DOMUtils.querySelectorAll(selectors, document)).filter(container => this._isVisibleContainer(container));

    if (!containers.length) {
      return [document.body];
    }

    return containers;
  }

  /**
   * Score a container for login form likelihood.
   * @param {HTMLElement} container
   * @param {number} index
   * @returns {Object|null}
   * @private
   */
  static _scoreFormContainer(container, index) {
    const inputs = this._getCandidates(container);
    if (!inputs.length) return null;

    const scoredFields = inputs.map(input => ({ element: input, usernameScore: this._scoreField(input, 'username'), passwordScore: this._scoreField(input, 'password') }));
    const usernameCandidate = scoredFields.reduce((best, current) => current.usernameScore > best.usernameScore ? current : best, { usernameScore: 0 });
    const passwordCandidate = scoredFields.reduce((best, current) => current.passwordScore > best.passwordScore ? current : best, { passwordScore: 0 });

    if (!usernameCandidate.element || !passwordCandidate.element || usernameCandidate.element === passwordCandidate.element) {
      return null;
    }

    const score = usernameCandidate.usernameScore + passwordCandidate.passwordScore + (container.tagName === 'FORM' ? 20 : 0);
    if (score < 20) {
      return null;
    }

    const submitButton = this._findSubmitButton(container) || this._findSubmitButton(document.body);
    const formElement = container.tagName === 'FORM' ? container : this._findNearestFormContainer(container) || container;

    return {
      id: `vaultguard-login-form-${index}`,
      element: formElement,
      usernameField: {
        selector: this._getSelector(usernameCandidate.element),
        name: usernameCandidate.element.name || usernameCandidate.element.id || '',
      },
      passwordField: {
        selector: this._getSelector(passwordCandidate.element),
        name: passwordCandidate.element.name || passwordCandidate.element.id || '',
      },
      submitButton: submitButton ? this._getSelector(submitButton) : null,
      formAction: formElement?.action || '',
      formMethod: (formElement?.method || 'POST').toUpperCase(),
      isVisible: this._isVisibleContainer(container),
      score,
    };
  }

  /**
   * Find a nearest semantic form container for fallback submission.
   * @param {HTMLElement} start
   * @returns {HTMLElement|null}
   * @private
   */
  static _findNearestFormContainer(start) {
    let node = start;
    while (node && node !== document.body) {
      if (node.tagName === 'FORM') {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  /**
   * Get candidate input fields within a container.
   * @param {HTMLElement} container
   * @returns {HTMLElement[]}
   * @private
   */
  static _getCandidates(container) {
    return Array.from(container.querySelectorAll(INPUT_SELECTORS.join(','))).filter(input => this._isVisibleInput(input) && !this._isHiddenInput(input));
  }

  /**
   * Score a single input field for username/password likelihood.
   * @param {HTMLElement} input
   * @param {string} mode
   * @returns {number}
   * @private
   */
  static _scoreField(input, mode) {
    const fingerprint = this._getFieldFingerprint(input);
    let score = 0;

    if (mode === 'username') {
      if (input.type === 'email') score += 30;
      if (input.autocomplete && input.autocomplete.toLowerCase().includes('username')) score += 35;
      if (input.autocomplete && input.autocomplete.toLowerCase().includes('email')) score += 20;
      if (/text|email|search/i.test(input.type)) score += 6;
      if (/user|login|account|id|identifier|email/.test(fingerprint)) score += 25;
      if (/name/.test(fingerprint)) score += 10;
      if (/username/.test(fingerprint)) score += 20;
      if (/email/.test(fingerprint)) score += 18;
    }

    if (mode === 'password') {
      if (input.type === 'password') score += 40;
      if (input.autocomplete && input.autocomplete.toLowerCase().includes('current-password')) score += 35;
      if (/pass|pwd|secret/.test(fingerprint)) score += 25;
      if (/password/.test(fingerprint)) score += 25;
      if (input.type !== 'password' && /pass|pwd/.test(fingerprint)) score += 6;
    }

    if (!input.disabled && !input.readOnly) {
      score += 2;
    }

    return score;
  }

  /**
   * Determine if an element is a visible container.
   * @param {HTMLElement} element
   * @returns {boolean}
   * @private
   */
  static _isVisibleContainer(element) {
    return Boolean(element && DOMUtils.isVisible(element) && element.offsetWidth > 1 && element.offsetHeight > 1);
  }

  /**
   * Determine if an input field is visible and interactive.
   * @param {HTMLElement} input
   * @returns {boolean}
   * @private
   */
  static _isVisibleInput(input) {
    if (!input || !(input instanceof HTMLElement)) return false;
    if (input.type === 'hidden') return false;
    if (input.disabled) return false;
    if (!DOMUtils.isVisible(input)) return false;
    const rect = input.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Determine if an input should be ignored because it is hidden or semantic hidden.
   * @param {HTMLElement} input
   * @returns {boolean}
   * @private
   */
  static _isHiddenInput(input) {
    return input.type === 'hidden' || input.getAttribute('aria-hidden') === 'true' || input.hasAttribute('hidden');
  }

  /**
   * Build a safe searching fingerprint for a form field.
   * @param {HTMLElement} input
   * @returns {string}
   * @private
   */
  static _getFieldFingerprint(input) {
    const values = [
      input.id,
      input.name,
      input.placeholder,
      input.autocomplete,
      input.getAttribute('aria-label'),
      input.className,
      input.getAttribute('alt'),
      input.getAttribute('src'),
      this._getLabelText(input),
    ].filter(Boolean).join(' ');
    return values.toLowerCase();
  }

  /**
   * Get unique structural selector for a target input element.
   * @param {HTMLElement} element
   * @returns {string}
   * @private
   */
  static _getSelector(element) {
    if (!element) return '';
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.name) {
      return `[name="${element.name}"]`;
    }

    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
      } else {
        const sameTagSiblings = Array.from(current.parentElement?.children || []).filter(sibling => sibling.tagName === current.tagName);
        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
      if (current && current.id) {
        path.unshift(`#${current.id}`);
        break;
      }
    }

    return path.join(' > ');
  }

  /**
   * Resolve a selector into a live DOM element.
   * @param {string} selector
   * @returns {HTMLElement|null}
   * @private
   */
  static _resolveField(selector) {
    if (!selector) return null;
    return DOMUtils.querySelector(selector, document);
  }

  /**
   * Fill a field with a value using native setters and dispatch events.
   * @param {HTMLElement} input
   * @param {string} value
   * @private
   */
  static _fillField(input, value) {
    if (!input) return;

    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    const setter = descriptor && descriptor.set;

    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }

    this._dispatchReactiveEvents(input);
  }

  /**
   * Dispatch a suite of events to trigger React/Vue/Angular bindings.
   * @param {HTMLElement} input
   * @private
   */
  static _dispatchReactiveEvents(input) {
    if (!input) return;
    const eventTypes = ['focus', 'input', 'change', 'blur'];
    eventTypes.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      input.dispatchEvent(event);
    });
  }

  /**
   * Find the best submit button for a login container.
   * @param {HTMLElement} container
   * @returns {HTMLElement|null}
   * @private
   */
  static _findSubmitButton(container) {
    if (!container || !container.querySelectorAll) return null;
    const buttons = Array.from(container.querySelectorAll('button, input[type="submit"], input[type="button"], input[type="image"]')).filter(button => this._isVisibleInput(button));
    if (!buttons.length) return null;

    const scored = buttons.map(button => ({
      element: button,
      score: this._scoreButton(button),
    })).sort((a, b) => b.score - a.score);

    return scored.length ? scored[0].element : null;
  }

  /**
   * Score a button based on text, type and labels.
   * @param {HTMLElement} button
   * @returns {number}
   * @private
   */
  static _scoreButton(button) {
    const fingerprint = `${button.id} ${button.name} ${button.value} ${button.textContent} ${button.className}`.toLowerCase();
    let score = 0;
    BUTTON_PATTERNS.forEach(pattern => {
      if (fingerprint.includes(pattern)) score += 20;
    });

    if (button.tagName === 'BUTTON' && button.type === 'submit') score += 10;
    if (button.tagName === 'INPUT' && button.type === 'submit') score += 8;
    if (/disabled/.test(fingerprint)) score -= 50;

    return score;
  }

  /**
   * Submit a login form using the preferred button or fallback mechanisms.
   * @param {Object} form
   * @param {HTMLElement} usernameField
   * @param {HTMLElement} passwordField
   * @private
   */
  static _submitForm(form, usernameField, passwordField) {
    const submitButton = form.submitButton ? this._resolveField(form.submitButton) : null;
    if (submitButton && !submitButton.disabled) {
      submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return;
    }

    const container = form.element || document.body;
    const fallbackButton = this._findSubmitButton(container) || this._findSubmitButton(document.body);
    if (fallbackButton) {
      fallbackButton.click();
      return;
    }

    if (form.element && typeof form.element.requestSubmit === 'function') {
      form.element.requestSubmit();
      return;
    }

    if (form.element && typeof form.element.submit === 'function') {
      form.element.submit();
    }
  }

  /**
   * Read the visible label text for a given input.
   * @param {HTMLElement} input
   * @returns {string}
   * @private
   */
  static _getLabelText(input) {
    if (!input) return '';
    const labels = input.labels ? Array.from(input.labels).map(label => label.textContent) : [];
    if (labels.length) {
      return labels.join(' ').trim();
    }

    let node = input.parentElement;
    while (node && node !== document.body) {
      if (node.tagName === 'LABEL') {
        return node.textContent.trim();
      }
      node = node.parentElement;
    }

    return '';
  }

  /**
   * Mark the current page or form as auto-filled so duplicate runs are prevented.
   * @param {Object} form
   * @private
   */
  static _markAutoLoggedIn(form) {
    try {
      if (form && form.element && form.element.dataset) {
        form.element.dataset.vaultguardAutoLoginApplied = 'true';
      }
      window[AUTO_LOGIN_MARKER] = true;
    } catch (error) {
      Logger.warn('Could not mark auto-login state:', error);
    }
  }

  /**
   * Check whether auto-log in has already been applied for this page.
   * @returns {boolean}
   * @private
   */
  static _hasAutoLoggedIn() {
    return Boolean(window[AUTO_LOGIN_MARKER]);
  }

  /**
   * Retry auto-fill detection if the first pass fails.
   * @param {{username:string,password:string}} credentials
   * @param {Object} options
   * @returns {boolean}
   * @private
   */
  static _retryAutoFill(credentials, options) {
    let attempts = 0;
    const retry = () => {
      attempts += 1;
      if (attempts > MAX_RETRY_ATTEMPTS || this._hasAutoLoggedIn()) {
        return false;
      }

      const forms = this.detectForms();
      if (forms.length) {
        return this.autoFillLogin(credentials, { ...options, retry: false });
      }

      window.setTimeout(retry, DEFAULT_RETRY_DELAY * attempts);
      return false;
    };

    retry();
    return true;
  }
}

export default FormDetectionService;
