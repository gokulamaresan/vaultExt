# Security Guidelines

This document outlines security best practices for VaultGuard extension development and deployment.

## 1. Secure Coding Practices

### 1.1 Password Handling

**Never:**
```javascript
// ❌ WRONG: Storing passwords in storage
await StorageManager.set('password', password);

// ❌ WRONG: Logging passwords
console.log('Password:', password);

// ❌ WRONG: Keeping passwords in memory indefinitely
window.credentials = { username, password };
```

**Always:**
```javascript
// ✅ CORRECT: Store only JWT token
await StorageManager.saveJWTToken(token);

// ✅ CORRECT: Keep passwords in memory only during injection
const credential = { username, password };
// Inject immediately
FormDetectionService.injectCredentials(form, credential.username, credential.password);
// Password variable goes out of scope and is garbage collected
```

### 1.2 Token Management

```javascript
// Token should be validated and refreshed
async function getValidToken() {
  let token = await StorageManager.getJWTToken();
  
  // Check if expiring soon
  if (ValidationUtils.isJWTExpired(token)) {
    await AuthService.logout();
    throw new Error('Session expired');
  }
  
  const expiresIn = getTimeUntilExpiry(token);
  
  // Refresh before expiry
  if (expiresIn < 5 * 60 * 1000) {
    const result = await AuthService.refreshToken();
    if (result.success) {
      token = result.token;
    }
  }
  
  return token;
}
```

### 1.3 Data Validation

```javascript
// Validate all user inputs
async function handleLogin(email, password) {
  // Validate format
  if (!ValidationUtils.isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  if (!password || password.length < 1) {
    throw new Error('Password required');
  }
  
  // Sanitize inputs
  const sanitizedEmail = email.trim().toLowerCase();
  
  // Send to API
  return await AuthService.login(sanitizedEmail, password);
}
```

### 1.4 XSS Prevention

```javascript
// Sanitize any user input before displaying
function displayCredential(credential) {
  // ❌ WRONG
  element.innerHTML = `<div>${credential.username}</div>`;
  
  // ✅ CORRECT
  element.textContent = credential.username; // or sanitize input
  
  // Or use DOMUtils.sanitizeInput()
  const safe = ValidationUtils.sanitizeInput(credential.username);
  element.innerHTML = safe;
}
```

## 2. Extension Manifest Security

### 2.1 Content Security Policy

```json
{
  "manifest_version": 3,
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**Why:** Prevents inline scripts and external script injection.

### 2.2 Minimal Permissions

Only request permissions absolutely needed:

```json
{
  "permissions": [
    "storage",           // For vault storage
    "tabs",              // To access current tab
    "scripting",         // For content script injection
    "activeTab"          // For auto-fill on active tab
  ],
  "host_permissions": [
    "<all_urls>"         // Required to detect forms on all sites
  ]
}
```

**Guideline:** Request broader permissions only when necessary. Document why each permission is needed.

## 3. Communication Security

### 3.1 Message Validation

```javascript
// Always validate messages from content scripts
MessageHandler.on(MESSAGE_TYPE, async (payload, sender) => {
  // Validate payload structure
  if (!payload.domain || !payload.credentialId) {
    return { error: 'Invalid payload' };
  }
  
  // Validate sender (if applicable)
  // Don't trust content scripts blindly
  
  // Process securely
  return handleSecurely(payload);
});
```

### 3.2 HTTPS Only Communication

```javascript
// In environment.js - Always use HTTPS in production
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api', // OK for dev
  },
  production: {
    API_BASE_URL: 'https://api.vaultguard.app/api', // Required!
  },
};
```

### 3.3 No Cross-Extension Communication

Disable communication with other extensions:

```javascript
// Only listen to messages from extension itself
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only allow messages from extension pages/content scripts
  if (sender.id !== chrome.runtime.id) {
    return false; // Reject
  }
  
  // Process message
  MessageHandler.handleMessage(message, sender, sendResponse);
  return true;
});
```

## 4. API Security

### 4.1 CORS Configuration (Backend)

Backend should set strict CORS headers:

```csharp
// ASP.NET Core
services.AddCors(options => {
    options.AddPolicy("ChromeExtension", builder => {
        builder.WithOrigins("chrome-extension://YOUR-EXTENSION-ID")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .WithCredentials();
    });
});
```

### 4.2 Request Signing (Optional, for High Security)

```javascript
// Sign each request with timestamp
async request(method, endpoint, options) {
  const timestamp = Date.now();
  const token = await StorageManager.getJWTToken();
  
  const signature = await this.signRequest(method, endpoint, timestamp, token);
  
  const headers = {
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  return fetch(...);
}
```

### 4.3 Rate Limiting

Implement client-side rate limiting:

```javascript
class RateLimiter {
  static requests = {};
  
  static async checkLimit(endpoint, maxPerMinute = 10) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${endpoint}:${minute}`;
    
    if (!this.requests[key]) {
      this.requests[key] = 0;
    }
    
    if (this.requests[key] >= maxPerMinute) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests[key]++;
  }
}
```

## 5. Storage Security

### 5.1 Chrome Storage Encryption

For sensitive data, implement encryption:

```javascript
async function saveEncryptedData(key, sensitiveData) {
  // Generate or retrieve encryption key
  const encryptionKey = await CryptoUtils.generateAESKey();
  
  // Encrypt data
  const encrypted = await CryptoUtils.encryptAES(sensitiveData, encryptionKey);
  
  // Store encrypted
  await StorageManager.set(key, encrypted);
}

async function getDecryptedData(key, encryptionKey) {
  const encrypted = await StorageManager.get(key);
  return await CryptoUtils.decryptAES(encrypted, encryptionKey);
}
```

### 5.2 Quota Management

Chrome Storage has limits (10MB for local storage):

```javascript
async function checkStorageQuota() {
  const allData = await StorageManager.getAll();
  const dataSize = new Blob([JSON.stringify(allData)]).size;
  const quotaMB = dataSize / (1024 * 1024);
  
  if (quotaMB > 9) { // Leave 1MB buffer
    Logger.warn('Storage quota nearly full');
    // Implement cleanup strategy
  }
}
```

### 5.3 Data Cleanup

```javascript
async function cleanupExpiredData() {
  const credentials = await StorageManager.getCredentials();
  
  // Remove credentials older than 2 years
  const twoYearsAgo = Date.now() - (2 * 365 * 24 * 60 * 60 * 1000);
  
  const filtered = credentials.filter(cred => {
    const createdAt = new Date(cred.createdAt).getTime();
    return createdAt > twoYearsAgo;
  });
  
  await StorageManager.saveCredentials(filtered);
}

// Run periodically
setInterval(cleanupExpiredData, 7 * 24 * 60 * 60 * 1000); // Weekly
```

## 6. Phishing Prevention

### 6.1 Domain Verification

```javascript
async function autoFillCredential(credential) {
  const currentDomain = ValidationUtils.extractDomain(window.location.href);
  const credentialDomain = credential.domain;
  
  // Exact match only
  if (currentDomain !== credentialDomain) {
    Logger.warn('Domain mismatch');
    showWarning('Domain does not match credential');
    return false;
  }
  
  // Additional checks
  if (!isLegitimateUrl(window.location.href)) {
    showWarning('Suspicious URL detected');
    return false;
  }
  
  return injectCredentials(credential);
}

function isLegitimateUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Reject data: and javascript: URLs
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Check against known phishing domains (if available)
    // Could integrate with Google Safe Browsing API
    
    return true;
  } catch {
    return false;
  }
}
```

### 6.2 Suspicious Site Detection

```javascript
async function checkSuspiciousActivityAndAutoFill(credential) {
  // Check if page contains suspicious elements
  const forms = document.querySelectorAll('form');
  
  for (const form of forms) {
    // Check if form submits to different domain
    const formAction = form.action;
    if (formAction && !formAction.startsWith('javascript:')) {
      try {
        const actionUrl = new URL(formAction, window.location.origin);
        const actionDomain = ValidationUtils.extractDomain(actionUrl.href);
        const currentDomain = ValidationUtils.extractDomain(window.location.href);
        
        if (actionDomain !== currentDomain) {
          Logger.warn('Form submission to different domain detected');
          // Don't auto-fill
          return false;
        }
      } catch {
        return false;
      }
    }
  }
  
  return true;
}
```

## 7. Third-Party Script Protection

### 7.1 Content Security Policy

Never allow inline scripts:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 7.2 Dependency Management

Use only trusted, minimal dependencies:

- ✅ Do: Use web standard APIs (no npm dependencies)
- ❌ Don't: Use external CDNs
- ❌ Don't: Mix different versions

## 8. Audit and Logging

### 8.1 Secure Logging

```javascript
// ❌ NEVER log sensitive data
Logger.debug('User login:', { email, password }); // WRONG!

// ✅ Log safely
Logger.debug('User login attempted', { email }); // OK - no password
Logger.debug('Auto-fill triggered', { domain }); // OK - no credentials

// ✅ Consider omitting sensitive logs in production
if (config.DEBUG) {
  Logger.debug('Request headers:', headers);
}
```

### 8.2 User Activity Tracking

For compliance, track user actions safely:

```javascript
async function logActivity(action, metadata = {}) {
  const activity = {
    action,
    timestamp: Date.now(),
    // Include relevant non-sensitive info
    domain: metadata.domain,
    // Never include
    // password, token, or personal data
  };
  
  // Send to backend for audit trail
  try {
    await HTTPClient.post('/audit/log', activity);
  } catch (error) {
    Logger.error('Failed to log activity');
  }
}
```

## 9. Security Checklist

Before deploying to production:

- [ ] All passwords removed from code
- [ ] No inline scripts in CSP
- [ ] All user input validated
- [ ] XSS protections implemented
- [ ] HTTPS enforced in production
- [ ] JWT tokens properly managed
- [ ] Session timeouts implemented
- [ ] Phishing checks in place
- [ ] Rate limiting implemented
- [ ] Error messages don't leak info
- [ ] No sensitive logs in console
- [ ] CORS properly configured
- [ ] Dependencies minimized
- [ ] Security headers set
- [ ] Penetration testing done

## 10. Incident Response

### If Credentials are Compromised:

1. **Immediate:** 
   - Invalidate all active sessions
   - Force logout on all devices
   - Notify users

2. **Short-term:**
   - Change backend secrets/keys
   - Review audit logs
   - Reset all JWT tokens

3. **Long-term:**
   - Implement 2FA
   - Add rate limiting
   - Enhance monitoring

---

For security vulnerabilities, report to: security@vaultguard.app

Do NOT disclose vulnerabilities publicly.
