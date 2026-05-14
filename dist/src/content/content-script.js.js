/**
 * Content Script
 * Runs on all web pages to detect forms and handle auto-fill
 */

import Logger from "/src/utils/logger.js.js";
import MessageHandler from "/src/utils/message-handler.js.js";
import { APP_CONSTANTS } from "/src/constants/app-constants.js.js";
import FormDetectionService from "/src/services/form-detection-service.js.js";
import ValidationUtils from "/src/utils/validation-utils.js.js";

// ============ Form Detection ============

/**
 * Inject floating Web Quick-Fill Launcher Option onto the live web page
 * Matches Zoho Vault extension persistent inline user controls
 */
function injectQuickFillOption(forms) {
  if (document.getElementById('vaultguard-quickfill-widget')) return;

  const widget = document.createElement('div');
  widget.id = 'vaultguard-quickfill-widget';
  widget.style.cssText = `
    position: fixed !important;
    bottom: 24px !important;
    right: 24px !important;
    z-index: 2147483647 !important;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
    color: #ffffff !important;
    padding: 10px 18px !important;
    border-radius: 50px !important;
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4) !important;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
    user-select: none !important;
    letter-spacing: 0.3px !important;
  `;

  widget.innerHTML = `
    <span style="font-size: 15px; line-height: 1;">🛡️</span>
    <span>Auto-fill Vault</span>
  `;

  widget.onmouseover = () => {
    widget.style.transform = 'translateY(-2px) scale(1.03)';
    widget.style.boxShadow = '0 12px 28px rgba(37, 99, 235, 0.5)';
  };
  widget.onmouseout = () => {
    widget.style.transform = 'none';
    widget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
  };

  widget.onclick = () => {
    const originalContent = widget.innerHTML;
    widget.innerHTML = `<span style="font-size: 14px;">⏳</span><span>Filling fields...</span>`;

    const currentDomain = ValidationUtils.extractDomain(window.location.href) || window.location.hostname;

    // Fetch credentials list directly via MessageHandler channel
    MessageHandler.send(APP_CONSTANTS.MESSAGE_TYPES.FETCH_CREDENTIALS, {}).then((res) => {
      const allCreds = res?.credentials || [];

      // Normalize both the live page URL and stored credential URLs for robust matching.
      // window.location.host gives 'sky:366' for non-standard-protocol pages where
      // window.location.hostname returns an empty string.
      const pageHost = (window.location.host || window.location.hostname || currentDomain || '').toLowerCase();

      // Extract the raw host from a credential's domain/url value.
      // Stored values may be full URLs (e.g. 'http://sky:366/') or bare domains.
      const credHost = (c) => {
        const raw = c.url || c.domain || '';
        return ValidationUtils.extractRawHost(raw) || raw.toLowerCase();
      };

      // Primary match: host-level comparison (covers standard and non-standard protocols)
      let matchedCred = allCreds.find(c => {
        const ch = credHost(c).toLowerCase();
        return ch && pageHost && (ch === pageHost || ch.includes(pageHost) || pageHost.includes(ch));
      });

      // Secondary match: substring match on the full href (catches any edge cases)
      if (!matchedCred) {
        matchedCred = allCreds.find(c =>
          window.location.href.includes(c.domain) ||
          (c.url && window.location.href.includes(c.url))
        );
      }

      if (matchedCred && forms && forms[0]) {
        FormDetectionService.injectCredentials(forms[0], matchedCred.username, matchedCred.password, true);
        widget.innerHTML = `<span>✨ Credentials Injected!</span>`;
        setTimeout(() => {
          widget.remove();
        }, 1800);
      } else {
        alert('VaultGuard: No matching active user credentials configured for this URL workspace.');
        widget.innerHTML = originalContent;
      }
    }).catch((err) => {
      Logger.warn('QuickFill action fetching warning:', err);
      widget.innerHTML = originalContent;
    });
  };

  document.body.appendChild(widget);
}

/**
 * Detect forms on page load and send to background
 */
function detectAndReportForms() {
  try {
    const forms = FormDetectionService.detectForms();

    if (forms.length > 0) {
      const domain = ValidationUtils.extractDomain(window.location.href);

      // Inject perspective webpage UI interaction option badge directly
      injectQuickFillOption(forms);

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
      password,
      payload.autoSubmit !== false
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
