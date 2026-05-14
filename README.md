# VaultGuard - Chrome Extension Password Manager

A production-ready, enterprise-level Chrome Extension for secure password management with auto-fill capabilities, built with vanilla JavaScript following best practices and security standards.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Core Concepts](#core-concepts)
4. [Setup & Installation](#setup--installation)
5. [Development Guide](#development-guide)
6. [Security Best Practices](#security-best-practices)
7. [API Integration](#api-integration)
8. [Extension Communication](#extension-communication)
9. [Debugging](#debugging)
10. [Deployment](#deployment)
11. [Scalability](#scalability)

## Architecture Overview

VaultGuard follows a **modular, layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Content Script                        │
│          (Form Detection & Auto-fill on Pages)           │
└────────────────┬────────────────────────────────────────┘
                 │ Messages (Chrome Runtime)
┌────────────────┴────────────────────────────────────────┐
│           Popup (UI - User Interface)                    │
│  • Login Screen  • Vault Display  • Search  • Settings   │
└────────────────┬────────────────────────────────────────┘
                 │ Messages
┌────────────────┴────────────────────────────────────────┐
│        Background Service Worker (Logic Layer)           │
│  • Message Routing  • Session Management  • State        │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
 ┌──────────┐ ┌──────────┐ ┌──────────────┐
 │ Services │ │ Storage  │ │ API Client   │
 │ Layer    │ │ Manager  │ │              │
 └────┬─────┘ └──────────┘ └──────┬───────┘
      │                            │
      ├─────────────────────┬──────┘
      │                     │
 ┌────▼──────┐        ┌────▼───────┐
 │ Auth Svc  │        │ HTTP Client │
 │ Cred Svc  │        │ (Retry/...)│
 │ Form Svc  │        └─────┬──────┘
 └───────────┘              │
                      ┌─────▼──────────┐
                      │ ASP.NET Core   │
                      │ API Backend    │
                      └────────────────┘
```

### Design Patterns Used

1. **Service Pattern**: Encapsulates business logic (AuthService, CredentialsService)
2. **Module Pattern**: Organized code modules for separation of concerns
3. **Repository Pattern**: StorageManager acts as data access layer
4. **Event-Driven**: Message-based communication between components
5. **Singleton Pattern**: Services are instantiated once and reused
6. **Factory Pattern**: DOM creation utilities
7. **Observer Pattern**: Chrome runtime message listeners

## Folder Structure

```
Extention/
├── manifest.json                 # Extension configuration
├── src/
│   ├── popup/                   # Popup UI & Logic
│   │   ├── popup.html          # Popup interface
│   │   └── popup.js            # Popup logic & event handlers
│   ├── background/              # Service Worker
│   │   └── service-worker.js   # Background logic & message routing
│   ├── content/                 # Content Script
│   │   └── content-script.js   # Form detection & injection
│   ├── services/                # Business Logic Layer
│   │   ├── auth-service.js     # Authentication & JWT handling
│   │   ├── credentials-service.js # Credential management
│   │   └── form-detection-service.js # Form detection logic
│   ├── api/                     # API Communication Layer
│   │   └── http-client.js      # HTTP requests with retry logic
│   ├── storage/                 # Data Persistence Layer
│   │   └── storage-manager.js  # Chrome storage abstraction
│   ├── utils/                   # Utility Helpers
│   │   ├── logger.js           # Logging utility
│   │   ├── crypto-utils.js     # Encryption/decryption
│   │   ├── dom-utils.js        # DOM manipulation helpers
│   │   ├── validation-utils.js # Input validation
│   │   └── message-handler.js  # Message routing
│   ├── constants/               # Constant Values
│   │   └── app-constants.js    # App-wide constants
│   ├── config/                  # Configuration
│   │   └── environment.js       # Environment config
│   ├── styles/                  # Styling
│   │   ├── global.css          # Global styles
│   │   └── popup.css           # Popup-specific styles
│   ├── components/              # Reusable UI Components (future)
│   └── hooks/                   # Custom Hooks (future)
├── assets/
│   └── icons/                   # Extension icons
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
└── docs/
    ├── API.md                   # API documentation
    ├── SECURITY.md              # Security guidelines
    └── CONTRIBUTING.md          # Contributing guidelines
```

### Folder Purposes

| Folder | Purpose |
|--------|---------|
| `popup/` | Extension popup UI and user interaction |
| `background/` | Service worker handling all background logic |
| `content/` | Script injected into web pages |
| `services/` | Business logic (auth, credentials, forms) |
| `api/` | API communication with backend |
| `storage/` | Local data persistence via Chrome storage |
| `utils/` | Reusable utility functions |
| `constants/` | App-wide constants and message types |
| `config/` | Environment configuration |
| `styles/` | CSS styling |
| `assets/` | Images, icons, fonts |

## Core Concepts

### 1. Extension Lifecycle

```
User clicks extension icon
         ↓
   popup.html loads
         ↓
   popup.js initializes
         ↓
Check authentication status
         ↓
   ┌─────────────┐
   │   Logged in?│
   └──┬────────┬─┘
     NO       YES
      ↓        ↓
  Show Login  Load Vault
```

### 2. JWT Token Management

- Tokens stored in Chrome storage (encrypted)
- Auto-refresh before expiry (5-minute warning)
- Session timeout: 30 minutes of inactivity
- Logout clears all sensitive data

### 3. Message Communication Flow

**Popup → Background:**
```
popup.js sends message with type: LOGIN_REQUEST
    ↓
background/service-worker.js receives
    ↓
AuthService handles login
    ↓
Sends response back to popup
```

**Content Script → Background:**
```
content-script.js detects forms
    ↓
Sends FORM_DETECTED message
    ↓
Background logs form information
    ↓
When user triggers auto-fill in popup
    ↓
Background sends INJECT_CREDENTIALS to content script
    ↓
Form is auto-filled
```

### 4. Storage Architecture

**Local Storage (Chrome Storage API):**
- JWT Token
- User Data
- Credentials (cached)
- User Preferences

**Session Storage (cleared on browser close):**
- Session Timeout Timestamp

**Never Stored:**
- Master Password
- Raw passwords (in memory only during injection)

### 5. Security Model

```
User Types Credentials
         ↓
  Password validation
         ↓
  Send to API (HTTPS only)
         ↓
API verifies & returns JWT
         ↓
Extension stores JWT securely
         ↓
     JWT refreshed before expiry
         ↓
      When form detected
         ↓
  User can auto-fill from vault
         ↓
Credentials retrieved & injected (never logged)
```

## Setup & Installation

### Prerequisites

- Node.js 14+ (for development tools if added later)
- Chrome/Chromium browser
- ASP.NET Core backend API running

### Local Installation

1. **Clone/Download the project**
```bash
git clone <repository-url>
cd Extention
```

2. **Open in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `Extention` folder
   - Extension now appears in your Chrome toolbar

3. **Configure API Endpoint**
   - Open `src/config/environment.js`
   - Set `API_BASE_URL` for your environment:
     ```javascript
     // Development
     API_BASE_URL: 'http://localhost:5000/api'
     
     // Production
     API_BASE_URL: 'https://api.vaultguard.app/api'
     ```

### Environment Setup

```bash
# For Development (edit in environment.js)
NODE_ENV = development
API_BASE_URL = http://localhost:5000/api
DEBUG = true

# For Production
NODE_ENV = production
API_BASE_URL = https://api.vaultguard.app/api
DEBUG = false
```

## Development Guide

### File Structure Best Practices

Each module should follow this structure:

```javascript
/**
 * Module Purpose
 * Description of what this module does
 */

// Imports
import DependencyA from '../path/to/file.js';

// Constants
const MODULE_CONSTANTS = { ... };

// Main Class/Object
class ModuleName {
  // Public methods
  static publicMethod() { ... }
  
  // Private methods
  static _privateMethod() { ... }
}

// Exports
export default ModuleName;
```

### Adding New Features

**Example: Adding "View Password" Feature**

1. **Update Constants** (`src/constants/app-constants.js`)
   ```javascript
   MESSAGE_TYPES: {
     VIEW_PASSWORD: 'VIEW_PASSWORD',
     // ... existing
   }
   ```

2. **Update Popup UI** (`src/popup/popup.html`)
   ```html
   <button class="btn btn-small" data-action="view-password">
     👁
   </button>
   ```

3. **Add Handler** (`src/popup/popup.js`)
   ```javascript
   case 'view-password':
     togglePasswordVisibility(credential);
     break;
   ```

4. **Test in Chrome**
   - Make changes
   - Go to `chrome://extensions/`
   - Click reload button on extension

### Code Standards

- **ES6 Modules**: Use `import`/`export`
- **Async/Await**: Prefer over Promise chains
- **Error Handling**: Always use try-catch
- **Logging**: Use `Logger.info()`, `.error()`, etc.
- **Variable Naming**: camelCase for variables, PascalCase for classes
- **Comments**: JSDoc for functions, inline for complex logic
- **No External Dependencies**: Vanilla JavaScript only

### Example: Creating a New Service

```javascript
/**
 * Sync Service
 * Handles synchronization with backend
 */

import HTTPClient from '../api/http-client.js';
import Logger from '../utils/logger.js';

class SyncService {
  /**
   * Sync vault data
   * @returns {Promise<Object>}
   */
  static async syncVault() {
    try {
      Logger.info('Starting vault sync');
      
      const response = await HTTPClient.post('/vault/sync', {});
      
      if (!response.data) {
        throw new Error('Invalid response');
      }
      
      Logger.info('Vault synced successfully');
      return { success: true };
    } catch (error) {
      Logger.error('Sync failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default SyncService;
```

## Security Best Practices

### 1. Password Handling

✅ **DO:**
- Store only JWT tokens in storage
- Keep passwords in memory only during auto-fill
- Clear sensitive data after use
- Use HTTPS for all API calls

❌ **DON'T:**
- Store passwords in local storage
- Log passwords to console
- Send passwords in unencrypted requests
- Store passwords in plaintext

### 2. Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 3. CORS & Origin Validation

- Only communicate with your backend domain
- Validate all messages from content scripts
- Use secure Web API only

### 4. Token Management

```javascript
// Token refresh logic (in AuthService)
if (expiresIn < 5 * 60 * 1000) { // Less than 5 minutes
  await this.refreshToken();
}

// Automatic logout on session expiry
if (sessionExpired) {
  await this.logout();
  broadcastSessionExpired();
}
```

### 5. Form Auto-Fill Security

- Detect forms before injection
- Verify form legitimacy (check domain)
- Only fill on matching domain
- Never auto-fill on suspicious pages

### 6. Phishing Prevention

```javascript
// Verify domain match
const currentDomain = extractDomain(window.location.href);
const credentialDomain = credential.domain;

if (currentDomain !== credentialDomain) {
  showWarning('Domain mismatch - be careful!');
  // Don't auto-fill
}
```

### 7. Data Encryption

- Sensitive data should be encrypted at rest
- Use Chrome's Crypto API for encryption
- Never use simple Base64 encoding for passwords

## API Integration

### Base Configuration

```javascript
// src/config/environment.js
const config = {
  API_BASE_URL: 'http://localhost:5000/api',
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

### HTTP Client Usage

```javascript
import HTTPClient from '../api/http-client.js';

// GET request
const result = await HTTPClient.get('/credentials');

// POST request
const result = await HTTPClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// PUT request
const result = await HTTPClient.put('/credentials/123', {
  name: 'Updated Name'
});

// DELETE request
const result = await HTTPClient.delete('/credentials/123');
```

### Required API Endpoints

```
POST   /auth/login              - User login
POST   /auth/refresh-token      - Refresh JWT
POST   /auth/logout             - Logout

GET    /credentials             - Get all credentials
GET    /credentials/:id         - Get single credential
POST   /credentials             - Create credential
PUT    /credentials/:id         - Update credential
DELETE /credentials/:id         - Delete credential
GET    /credentials/search      - Search credentials

POST   /vault/sync              - Sync vault
```

### Response Format Expected

```javascript
// Login Response
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id: "user-123",
    email: "user@example.com",
    name: "John Doe"
  }
}

// Credentials Response
{
  credentials: [
    {
      id: "cred-1",
      name: "Gmail",
      domain: "gmail.com",
      username: "user@gmail.com",
      password: "encrypted_password",
      createdAt: "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Extension Communication

### Message Types

All message types defined in `APP_CONSTANTS.MESSAGE_TYPES`:

**Between Popup and Background:**
```javascript
// Popup sends
LOGIN_REQUEST
LOGOUT_REQUEST
FETCH_CREDENTIALS
SEARCH_CREDENTIALS
DELETE_CREDENTIAL
UPDATE_CREDENTIAL
GET_SESSION_STATUS

// Background responds
LOGIN_SUCCESS
LOGIN_FAILURE
SESSION_EXPIRED
CREDENTIALS_UPDATED
VAULT_LOCKED
```

**Between Content Script and Background:**
```javascript
// Content Script sends
FORM_DETECTED
CREDENTIAL_INJECTED

// Background sends
INJECT_CREDENTIALS
DETECT_FORMS
LOCK_VAULT
```

### Message Handler Pattern

```javascript
// Register listener
MessageHandler.on(MESSAGE_TYPE, async (payload, sender) => {
  // Handle message
  return { success: true, data: ... };
});

// Send message
const result = await MessageHandler.send(MESSAGE_TYPE, payload);

// Broadcast to all tabs
await MessageHandler.broadcast(MESSAGE_TYPE, payload);
```

## Debugging

### Enable Debug Logging

Set in `src/config/environment.js`:
```javascript
DEBUG: true
LOG_LEVEL: 'debug'
```

### View Logs

1. **Popup Script**: Right-click popup → Inspect
2. **Background Worker**: `chrome://extensions` → Details → Inspect views (service worker)
3. **Content Script**: 
   - Open target page
   - Right-click → Inspect
   - Select "Top-level" from context selector

### Common Issues

| Issue | Solution |
|-------|----------|
| Forms not detected | Check console logs, verify form structure |
| Auto-fill not working | Check domain matching, form selector |
| API errors | Verify backend is running, API endpoint correct |
| JWT expired | Check session timeout, token refresh logic |
| Storage not persisting | Check Chrome permissions, storage quota |

### Debug Commands in Console

```javascript
// Check storage
chrome.storage.local.get(null, (items) => console.log(items));

// Check JWT
await chrome.storage.local.get('vaultguard_jwt_token');

// Manually send message
chrome.runtime.sendMessage({
  type: 'LOGIN_REQUEST',
  payload: { email: 'test@example.com', password: 'test' }
});
```

## Deployment

### Chrome Web Store Submission

1. **Create ZIP of extension**
   ```bash
   zip -r vaultguard.zip Extention/ -x "*.git*" "*/node_modules/*" "*/.*"
   ```

2. **Prepare for submission**
   - Update version in `manifest.json`
   - Create 128x128px icon
   - Write compelling description
   - Prepare screenshots

3. **Submit**
   - Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole)
   - Upload ZIP file
   - Fill in required fields
   - Submit for review

### Production Checklist

- [ ] Update version number
- [ ] Test all features
- [ ] Run security audit
- [ ] Update API endpoint to production
- [ ] Disable debug logging
- [ ] Test on various Chrome versions
- [ ] Test offline scenarios
- [ ] Verify error handling
- [ ] Update documentation
- [ ] Create CHANGELOG

## Scalability

### Architecture for Growth

#### Current: ~100 Users
- Single API endpoint
- Local storage caching
- Simple sync strategy

#### Medium: ~10K Users
- API load balancing
- Smart sync intervals
- Credential encryption at rest
- Analytics integration

#### Large: ~50K+ Users

```
CDN for extension delivery
       ↓
Load-balanced API servers
       ↓
Database replication
       ↓
Cache layer (Redis)
       ↓
Message queue for async tasks
       ↓
Search service (Elasticsearch)
```

### Performance Optimization

1. **Lazy Loading**
   - Load credentials on demand
   - Paginate credential lists

2. **Caching Strategy**
   - Cache credentials locally
   - Sync on intervals
   - Invalidate on logout

3. **Request Optimization**
   - Batch API requests
   - Implement request debouncing
   - Use compression

4. **Storage Optimization**
   - Compress credential data
   - Clean up old sync data
   - Archive unused credentials

### Feature Roadmap

**Phase 1 (Current):**
- Basic login/logout
- Credential storage
- Auto-fill
- Search

**Phase 2:**
- Credential sharing
- Audit logs
- Two-factor authentication
- Password strength checker

**Phase 3:**
- Browser sync
- Team management
- API integration templates
- Advanced reporting

**Phase 4:**
- Biometric auth
- Offline-first capability
- End-to-end encryption
- Zero-knowledge architecture

---

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

Proprietary - VaultGuard Security

## Support

For issues and feature requests, please contact: support@vaultguard.app
