/**
 * Popup Script
 * Handles popup UI logic and user interactions
 */

import Logger from '../utils/logger.js';
import MessageHandler from '../utils/message-handler.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
import AuthService from '../services/auth-service.js';
import CredentialsService from '../services/credentials-service.js';
import ValidationUtils from '../utils/validation-utils.js';
import DOMUtils from '../utils/dom-utils.js';

// ============ UI State Management ============

const UIState = {
  current: 'loading', // 'loading', 'auth', 'vault'
  isLoading: false,
  currentCredentials: [],
  filteredCredentials: [],
};

// ============ DOM Elements ============

const elements = {
  popupContent: document.getElementById('popupContent'),
  loadingState: document.getElementById('loadingState'),
  authState: document.getElementById('authState'),
  vaultState: document.getElementById('vaultState'),
  footerContent: document.getElementById('footerContent'),
  loginForm: document.getElementById('loginForm'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  credentialsList: document.getElementById('credentialsList'),
  emptyState: document.getElementById('emptyState'),
  searchInput: document.getElementById('searchInput'),
  syncBtn: document.getElementById('syncBtn'),
  notification: document.getElementById('notification'),
  status: document.getElementById('status'),
};

// ============ Initialization ============

document.addEventListener('DOMContentLoaded', async () => {
  Logger.info('Popup loaded');
  
  // Initialize message listener
  MessageHandler.initializeMessageListener();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check authentication status
  await checkAuthStatus();
  
  // Listen for session changes
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === APP_CONSTANTS.MESSAGE_TYPES.SESSION_EXPIRED) {
      showNotification('Session expired. Please login again.', 'error');
      setTimeout(() => {
        showAuthState();
      }, 2000);
    }
  });
});

// ============ Event Listeners ============

function setupEventListeners() {
  // Login form
  elements.loginForm.addEventListener('submit', handleLogin);
  
  // Search
  const searchDebounced = DOMUtils.debounce(handleSearch, 300);
  elements.searchInput.addEventListener('input', searchDebounced);
  
  // Sync button
  elements.syncBtn.addEventListener('click', handleSync);
}

// ============ Authentication ============

async function checkAuthStatus() {
  try {
    showLoadingState();
    
    const isAuthenticated = await AuthService.isAuthenticated();
    
    if (isAuthenticated) {
      await loadVault();
      showVaultState();
    } else {
      showAuthState();
    }
  } catch (error) {
    Logger.error('Error checking auth status:', error);
    showAuthState();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  
  try {
    setLoading(true);
    
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    // Validate
    if (!ValidationUtils.isValidEmail(email)) {
      showNotification('Please enter a valid email', 'error');
      return;
    }
    
    if (!password) {
      showNotification('Please enter your password', 'error');
      return;
    }
    
    // Send login message to background
    const result = await MessageHandler.send(
      APP_CONSTANTS.MESSAGE_TYPES.LOGIN_REQUEST,
      { email, password }
    );
    
    if (result.success) {
      showNotification(APP_CONSTANTS.SUCCESS.LOGIN_SUCCESSFUL, 'success');
      
      // Load vault
      await loadVault();
      showVaultState();
      
      // Clear form
      elements.loginForm.reset();
    } else {
      showNotification(result.error || APP_CONSTANTS.ERRORS.AUTHENTICATION_FAILED, 'error');
    }
  } catch (error) {
    Logger.error('Login error:', error);
    showNotification('Login failed. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
}

// ============ Vault Management ============

async function loadVault() {
  try {
    const result = await MessageHandler.send(APP_CONSTANTS.MESSAGE_TYPES.FETCH_CREDENTIALS);
    
    if (result.success) {
      UIState.currentCredentials = result.credentials || [];
      UIState.filteredCredentials = UIState.currentCredentials;
      renderCredentials();
    } else {
      showNotification('Failed to load credentials', 'error');
    }
  } catch (error) {
    Logger.error('Error loading vault:', error);
    showNotification('Failed to load vault', 'error');
  }
}

function renderCredentials() {
  elements.credentialsList.innerHTML = '';
  
  if (UIState.filteredCredentials.length === 0) {
    elements.emptyState.style.display = 'flex';
    return;
  }
  
  elements.emptyState.style.display = 'none';
  
  UIState.filteredCredentials.forEach((credential) => {
    const card = createCredentialCard(credential);
    elements.credentialsList.appendChild(card);
  });
}

function createCredentialCard(credential) {
  const card = DOMUtils.createElement('div', {
    classes: 'card credential-card',
  });
  
  const domain = ValidationUtils.extractDomain(credential.domain || '');
  const domainDisplay = domain || 'Unknown';
  const truncatedPassword = '•'.repeat(Math.min(credential.password?.length || 8, 8));
  
  card.innerHTML = `
    <div class="credential-card-header">
      <div>
        <div class="credential-card-title">${credential.name || domainDisplay}</div>
        <div class="credential-card-domain">${domainDisplay}</div>
      </div>
      <div class="credential-card-actions">
        <button class="btn btn-small btn-secondary" title="Copy username" data-action="copy-username">
          👤
        </button>
        <button class="btn btn-small btn-secondary" title="Copy password" data-action="copy-password">
          🔑
        </button>
        <button class="btn btn-small btn-secondary" title="Auto-fill" data-action="autofill">
          ↗
        </button>
        <button class="btn btn-small btn-danger" title="Delete" data-action="delete">
          🗑
        </button>
      </div>
    </div>
    <div style="font-size: 12px; color: var(--text-secondary);">
      <div>Username: ${credential.username}</div>
      <div>Password: ${truncatedPassword}</div>
    </div>
  `;
  
  // Add event listeners
  card.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    
    if (!action) return;
    
    switch (action) {
      case 'copy-username':
        copyToClipboard(credential.username, 'Username copied!');
        break;
      case 'copy-password':
        copyToClipboard(credential.password, 'Password copied!');
        break;
      case 'autofill':
        handleAutoFill(credential);
        break;
      case 'delete':
        handleDeleteCredential(credential.id);
        break;
    }
  });
  
  return card;
}

// ============ Credential Actions ============

async function handleAutoFill(credential) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showNotification('No active tab found', 'error');
      return;
    }
    
    // Send auto-fill message to content script
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: APP_CONSTANTS.MESSAGE_TYPES.INJECT_CREDENTIALS,
        payload: {
          credentialId: credential.id,
          username: credential.username,
          password: credential.password,
        },
      },
      (response) => {
        if (response?.success) {
          showNotification(APP_CONSTANTS.SUCCESS.AUTOFILL_SUCCESSFUL, 'success');
        } else {
          showNotification('Auto-fill failed', 'error');
        }
      }
    );
  } catch (error) {
    Logger.error('Auto-fill error:', error);
    showNotification('Auto-fill not available on this page', 'error');
  }
}

async function handleDeleteCredential(credentialId) {
  if (!confirm('Are you sure you want to delete this credential?')) {
    return;
  }
  
  try {
    setLoading(true);
    
    const result = await MessageHandler.send(
      APP_CONSTANTS.MESSAGE_TYPES.DELETE_CREDENTIAL,
      { id: credentialId }
    );
    
    if (result.success) {
      showNotification(APP_CONSTANTS.SUCCESS.CREDENTIAL_DELETED, 'success');
      await loadVault();
    } else {
      showNotification('Failed to delete credential', 'error');
    }
  } catch (error) {
    Logger.error('Delete error:', error);
    showNotification('Failed to delete credential', 'error');
  } finally {
    setLoading(false);
  }
}

function handleSearch(event) {
  const query = event.target.value.trim();
  
  if (!query) {
    UIState.filteredCredentials = UIState.currentCredentials;
  } else {
    UIState.filteredCredentials = UIState.currentCredentials.filter((cred) => {
      const domain = ValidationUtils.extractDomain(cred.domain || '');
      const lowerQuery = query.toLowerCase();
      
      return (
        (cred.name && cred.name.toLowerCase().includes(lowerQuery)) ||
        (cred.username && cred.username.toLowerCase().includes(lowerQuery)) ||
        (domain && domain.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  renderCredentials();
}

async function handleSync() {
  try {
    setLoading(true);
    elements.syncBtn.style.animation = 'spin 1s linear infinite';
    
    const result = await CredentialsService.syncVault();
    
    if (result.success) {
      showNotification('Vault synced successfully', 'success');
      await loadVault();
    } else {
      showNotification('Sync failed', 'error');
    }
  } catch (error) {
    Logger.error('Sync error:', error);
    showNotification('Sync failed', 'error');
  } finally {
    setLoading(false);
    elements.syncBtn.style.animation = '';
  }
}

async function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) {
    return;
  }
  
  try {
    setLoading(true);
    
    await MessageHandler.send(APP_CONSTANTS.MESSAGE_TYPES.LOGOUT_REQUEST);
    
    showNotification(APP_CONSTANTS.SUCCESS.LOGOUT_SUCCESSFUL, 'success');
    showAuthState();
  } catch (error) {
    Logger.error('Logout error:', error);
    showNotification('Logout failed', 'error');
  } finally {
    setLoading(false);
  }
}

// ============ UI Helpers ============

function showLoadingState() {
  UIState.current = 'loading';
  elements.loadingState.style.display = 'flex';
  elements.authState.style.display = 'none';
  elements.vaultState.style.display = 'none';
}

function showAuthState() {
  UIState.current = 'auth';
  elements.loadingState.style.display = 'none';
  elements.authState.style.display = 'block';
  elements.vaultState.style.display = 'none';
  updateFooter();
}

async function showVaultState() {
  UIState.current = 'vault';
  elements.loadingState.style.display = 'none';
  elements.authState.style.display = 'none';
  elements.vaultState.style.display = 'block';
  
  updateFooter();
  updateStatus();
}

function updateFooter() {
  elements.footerContent.innerHTML = '';
  
  if (UIState.current === 'vault') {
    const logoutBtn = DOMUtils.createElement('button', {
      classes: ['btn', 'btn-danger'],
      text: 'Logout',
    });
    
    logoutBtn.addEventListener('click', handleLogout);
    logoutBtn.style.flex = '1';
    
    elements.footerContent.appendChild(logoutBtn);
  }
}

function updateStatus() {
  // Could update connection status here
  const statusDot = elements.status.querySelector('.status-dot');
  const statusText = elements.status.querySelector('span:last-child');
  
  statusDot?.classList.remove('offline', 'loading');
  statusDot?.classList.add('online');
  
  if (statusText) {
    statusText.textContent = 'Connected';
  }
}

function setLoading(loading) {
  UIState.isLoading = loading;
  const buttons = document.querySelectorAll('button');
  buttons.forEach((btn) => {
    btn.disabled = loading;
  });
}

function showNotification(message, type = 'info') {
  elements.notification.textContent = message;
  elements.notification.className = `alert alert-${type}`;
  elements.notification.classList.remove('hidden');
  
  setTimeout(() => {
    elements.notification.classList.add('hidden');
  }, APP_CONSTANTS.UI.NOTIFICATION_DURATION);
}

function copyToClipboard(text, successMessage = 'Copied!') {
  navigator.clipboard.writeText(text).then(() => {
    showNotification(successMessage, 'success');
  }).catch((error) => {
    Logger.error('Copy error:', error);
    showNotification('Failed to copy', 'error');
  });
}

Logger.info('Popup script loaded');
