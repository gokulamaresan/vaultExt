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

    console.group('%c[VaultGuard] Auto-fill triggered', 'color:#2563eb;font-weight:bold');
    console.log('href    :', window.location.href);
    console.log('host    :', window.location.host);
    console.log('hostname:', window.location.hostname);
    console.log('currentDomain (extracted):', currentDomain);
    console.log('forms detected:', forms ? forms.length : 0);

    // Fetch credentials list directly via MessageHandler channel
    MessageHandler.send(APP_CONSTANTS.MESSAGE_TYPES.FETCH_CREDENTIALS, {}).then((res) => {
      console.log('Raw FETCH_CREDENTIALS response:', JSON.stringify(res));

      // MessageHandler wraps service worker responses as { success, data: <actual response> }
      // Service worker returns { success, credentials: [...] } so we unwrap via res.data
      const allCreds = res?.data?.credentials || res?.credentials || [];
      console.log('allCreds count:', allCreds.length);
      console.log('allCreds:', JSON.stringify(allCreds));

      // Normalize both the live page URL and stored credential URLs for robust matching.
      // For non-standard protocol pages like 'sky:366', window.location.host may be set
      // while window.location.hostname remains empty.
      const normalizeHost = (value) => {
        if (!value || typeof value !== 'string') return '';
        return value.toLowerCase().trim().replace(/^www\./, '');
      };

      const stripPort = (host) => {
        if (!host) return '';
        return host.split(':')[0];
      };

      const getPort = (hostOrUrl) => {
        if (!hostOrUrl || typeof hostOrUrl !== 'string') return null;
        const host = ValidationUtils.extractRawHost(hostOrUrl) || hostOrUrl;
        const match = host.match(/:(\d+)$/);
        return match ? match[1] : null;
      };

      const pageHost = normalizeHost(window.location.host || window.location.hostname || currentDomain || '');
      const pageHostBase = stripPort(pageHost);
      const pageHref = window.location.href.toLowerCase();
      console.log('pageHost for matching:', pageHost);
      console.log('pageHostBase for matching:', pageHostBase);

      const credHost = (c) => {
        const raw = (c.url || c.domain || '').toString();
        return normalizeHost(ValidationUtils.extractRawHost(raw) || raw);
      };

      const credHostMatches = (ch) => {
        if (!ch || !pageHost) return false;
        
        // Strict port validation: if both specify a port and they are different, do not match.
        const credPort = getPort(ch);
        const pagePort = getPort(pageHost);
        if (credPort && pagePort && credPort !== pagePort) {
          return false;
        }

        const credBase = stripPort(ch);
        return (
          ch === pageHost ||
          pageHost === credBase ||
          ch === pageHostBase ||
          pageHost.includes(ch) ||
          ch.includes(pageHost) ||
          credBase === pageHostBase
        );
      };

      // Log each credential's computed host
      allCreds.forEach(c => {
        const ch = credHost(c);
        const matched = credHostMatches(ch);
        console.log(`  cred "${c.name}" → credHost:"${ch}" | match:${matched}`);
      });

      // Primary match: host-level comparison (covers standard and non-standard protocols)
      let matchedCred = allCreds.find(c => {
        const ch = credHost(c);
        return credHostMatches(ch);
      });

      console.log('Primary match:', matchedCred ? '✅ ' + matchedCred.name : '❌ none');

      // Secondary match: substring match on the full href (catches any edge cases)
      if (!matchedCred) {
        matchedCred = allCreds.find(c => {
          const domainCandidate = (c.domain || '').toString().toLowerCase();
          const urlCandidate = (c.url || '').toString().toLowerCase();

          // Port check for secondary match
          const credPort = getPort(domainCandidate) || getPort(urlCandidate);
          const pagePort = getPort(pageHost);
          if (credPort && pagePort && credPort !== pagePort) {
            return false;
          }

          return (domainCandidate && pageHref.includes(domainCandidate)) ||
            (urlCandidate && pageHref.includes(urlCandidate));
        });
        console.log('Secondary match:', matchedCred ? '✅ ' + matchedCred.name : '❌ none');
      }

      if (matchedCred && forms && forms[0]) {
        console.log('Injecting for:', matchedCred.name, '| user:', matchedCred.username);
        console.groupEnd();
        FormDetectionService.injectCredentials(forms[0], matchedCred.username, matchedCred.password, true);
        widget.innerHTML = `<span>✨ Credentials Injected!</span>`;
        setTimeout(() => { widget.remove(); }, 1800);
      } else {
        console.warn('No match or no form found — showing alert');
        console.log('matchedCred:', matchedCred, '| forms[0]:', forms && forms[0]);
        console.groupEnd();
        alert('VaultGuard: No matching active user credentials configured for this URL workspace.');
        widget.innerHTML = originalContent;
      }
    }).catch((err) => {
      console.error('[VaultGuard] FETCH_CREDENTIALS threw:', err);
      console.groupEnd();
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
