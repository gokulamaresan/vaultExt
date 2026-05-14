/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

class DOMUtils {
  /**
   * Create an element with attributes and classes
   * @param {string} tag
   * @param {Object} options
   * @returns {HTMLElement}
   */
  static createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.id) {
      element.id = options.id;
    }

    if (options.classes) {
      const classes = Array.isArray(options.classes)
        ? options.classes
        : [options.classes];
      element.classList.add(...classes);
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.text) {
      element.textContent = options.text;
    }

    if (options.html) {
      element.innerHTML = options.html;
    }

    return element;
  }

  /**
   * Query selector with error handling
   * @param {string} selector
   * @param {HTMLElement} parent
   * @returns {HTMLElement|null}
   */
  static querySelector(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Query all selectors with error handling
   * @param {string} selector
   * @param {HTMLElement} parent
   * @returns {NodeList}
   */
  static querySelectorAll(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Add event listener with cleanup
   * @param {HTMLElement} element
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} - function to remove listener
   */
  static on(element, event, handler) {
    if (!element) return () => {};
    
    element.addEventListener(event, handler);
    
    return () => {
      element.removeEventListener(event, handler);
    };
  }

  /**
   * Check if element is visible
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  static isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  /**
   * Get element offset from top
   * @param {HTMLElement} element
   * @returns {number}
   */
  static getOffsetTop(element) {
    let top = 0;
    let el = element;
    
    while (el) {
      top += el.offsetTop;
      el = el.offsetParent;
    }
    
    return top;
  }

  /**
   * Scroll element into view
   * @param {HTMLElement} element
   * @param {Object} options
   */
  static scrollIntoView(element, options = {}) {
    const { behavior = 'smooth', block = 'center' } = options;
    
    element.scrollIntoView({
      behavior,
      block,
    });
  }

  /**
   * Add/Remove class with condition
   * @param {HTMLElement} element
   * @param {string} className
   * @param {boolean} condition
   */
  static toggleClass(element, className, condition) {
    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }

  /**
   * Debounce function
   * @param {Function} func
   * @param {number} delay
   * @returns {Function}
   */
  static debounce(func, delay) {
    let timeoutId;
    
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  /**
   * Throttle function
   * @param {Function} func
   * @param {number} limit
   * @returns {Function}
   */
  static throttle(func, limit) {
    let inThrottle;
    
    return function throttled(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
}

export default DOMUtils;
