/**
 * Content Script
 * Runs on all web pages to detect forms and handle auto-fill
 */

import Logger from '../utils/logger.js';
import MessageHandler from '../utils/message-handler.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
import FormDetectionService from '../services/form-detection-service.js';
import ValidationUtils from '../utils/validation-utils.js';

// ============ Form Detection ============

/**
 * Detect forms on page load and send to background
 */
function detectAndReportForms() {
  try {
    const forms = FormDetectionService.detectForms();

    if (forms.length > 0) {
      const domain = ValidationUtils.extractDomain(window.location.href);

      MessageHandler.send(APP_CONSTANTS.MESSAGE_TYPES.FORM_DETECTED, {
        domain,
        forms: forms.map(f => ({
          id: f.id,
          isVisible: f.isVisible,
          formAction: f.formAction,
          formMethod: f.formMethod,
        })),
      }).catch(error => {
        Logger.warn('Error reporting forms:', error);
      });
    }
  } catch (error) {
    Logger.error('Error detecting forms:', error);
  }
}

// Detect forms on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectAndReportForms);
} else {
  detectAndReportForms();
}

// Re-detect forms if page content changes significantly
const observer = new MutationObserver((mutations) => {
  // Debounce to avoid excessive detection
  clearTimeout(window.formDetectionTimeout);
  window.formDetectionTimeout = setTimeout(detectAndReportForms, 1000);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// ============ Message Handlers ============

/**
 * Handle inject credentials request
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.INJECT_CREDENTIALS, (payload) => {
  try {
    const { credentialId, username, password, formId } = payload;

    const forms = FormDetectionService.detectForms();
    let targetForm = null;

    if (formId) {
      targetForm = forms.find(f => f.id === formId);
    } else {
      // Use first detected form
      targetForm = forms[0];
    }

    if (!targetForm) {
      Logger.warn('No target form found');
      return { success: false, error: 'No form found' };
    }

    const success = FormDetectionService.injectCredentials(
      targetForm,
      username,
      password
    );

    if (success) {
      const domain = ValidationUtils.extractDomain(window.location.href);

      MessageHandler.send(APP_CONSTANTS.MESSAGE_TYPES.CREDENTIAL_INJECTED, {
        domain,
        credentialId,
        username,
      }).catch(error => {
        Logger.warn('Error sending credential injection notification:', error);
      });
    }

    return { success };
  } catch (error) {
    Logger.error('Error injecting credentials:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handle detect forms request
 */
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.DETECT_FORMS, () => {
  try {
    const forms = FormDetectionService.detectForms();
    return { success: true, forms };
  } catch (error) {
    Logger.error('Error detecting forms:', error);
    return { success: false, error: error.message };
  }
});

Logger.info('Content script loaded');
