# Project Structure & Architecture Deep Dive

Understanding VaultGuard's architecture for better development.

## Module Dependency Graph

```
popup.js
  ├── MessageHandler
  ├── AuthService
  ├── CredentialsService
  ├── ValidationUtils
  ├── DOMUtils
  └── Logger

service-worker.js
  ├── MessageHandler
  ├── AuthService
  ├── CredentialsService
  └── Logger

content-script.js
  ├── Logger
  ├── MessageHandler
  ├── FormDetectionService
  └── ValidationUtils

AuthService
  ├── HTTPClient
  ├── StorageManager
  ├── ValidationUtils
  └── Logger

CredentialsService
  ├── HTTPClient
  ├── StorageManager
  ├── ValidationUtils
  └── Logger

HTTPClient
  ├── Logger
  ├── ValidationUtils
  ├── StorageManager (for JWT)
  └── config/environment

FormDetectionService
  ├── Logger
  ├── DOMUtils
  └── APP_CONSTANTS

StorageManager
  └── Logger

MessageHandler
  └── Logger
```

## Data Flow Diagrams

### Authentication Flow

```
1. User opens popup
   ↓
2. popup.js → Check authentication status
   ↓
   ├─ AuthService.isAuthenticated()
   │  └─ Checks JWT token in storage
   │
   ├─ If authenticated → Show vault
   └─ If not → Show login form

3. User enters email & password
   ↓
4. popup.js → MessageHandler.send(LOGIN_REQUEST)
   ↓
5. service-worker.js → Receives LOGIN_REQUEST
   ├─ AuthService.login(email, password)
   │  ├─ Validates input
   │  ├─ HTTPClient.post(/auth/login)
   │  │  └─ Sends to ASP.NET Core backend
   │  ├─ Receives JWT token
   │  ├─ StorageManager.saveJWTToken(token)
   │  └─ Returns result
   │
   └─ Sends response back to popup
   ↓
6. popup.js → Receives LOGIN_SUCCESS
   ├─ Load vault
   ├─ Show vault UI
   └─ Clear form

7. MessageHandler.broadcast(LOGIN_SUCCESS)
   └─ Notifies all tabs
```

### Auto-fill Flow

```
1. User navigates to website
   ↓
2. content-script.js loads on page
   ├─ FormDetectionService.detectForms()
   └─ Finds all login forms
   ↓
3. If forms found:
   └─ MessageHandler.send(FORM_DETECTED)
      └─ service-worker.js logs the forms

4. User clicks VaultGuard popup
   └─ popup.js → MessageHandler.send(FETCH_CREDENTIALS)

5. service-worker.js
   └─ CredentialsService.getCredentialsByDomain()

6. popup.js → Displays matching credentials

7. User clicks "Auto-fill" button
   └─ popup.js → chrome.tabs.sendMessage(INJECT_CREDENTIALS)

8. content-script.js → Receives INJECT_CREDENTIALS
   ├─ FormDetectionService.injectCredentials()
   ├─ Sets input values
   ├─ Triggers input/change events
   └─ MessageHandler.send(CREDENTIAL_INJECTED)

9. service-worker.js → Logs the auto-fill event
```

### Session Management Flow

```
1. User logs in
   ↓
2. AuthService.saveJWTToken(token)
   └─ Token stored in chrome.storage.local

3. AuthService._resetSessionTimeout()
   └─ Session expiry time saved: now + 30 minutes

4. Background script runs interval check (every 60 seconds)
   ├─ Checks if session has expired
   ├─ If expired:
   │  ├─ AuthService.logout()
   │  ├─ Clears JWT token
   │  └─ MessageHandler.broadcast(SESSION_EXPIRED)
   │
   └─ If not expired:
      └─ Continue normal operation

5. If token expires before session timeout:
   ├─ HTTPClient detects 401 response
   ├─ AuthService.refreshToken()
   ├─ Gets new token from backend
   └─ Saves to storage

6. User closes popup or browser:
   ├─ chrome.storage.session is cleared
   └─ Session expires on next browser open
      └─ Session-based logout on startup
```

## Storage Schema

### Chrome Local Storage

```javascript
{
  // JWT Token
  "vaultguard_jwt_token": "eyJhbGciOiJIUzI1NiIs...",
  
  // User Profile
  "vaultguard_user_data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  
  // Cached Credentials
  "vaultguard_credentials": [
    {
      "id": "cred-1",
      "name": "Gmail",
      "domain": "gmail.com",
      "username": "user@gmail.com",
      "password": "***",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    // ... more credentials
  ],
  
  // User Preferences
  "vaultguard_user_preferences": {
    "theme": "dark",
    "autoSync": true,
    "syncInterval": 3600000
  }
}
```

### Chrome Session Storage

```javascript
{
  // Session timeout - cleared on browser close
  "vaultguard_session_timeout": 1705776000000
}
```

## Message Types & Handlers

### System Diagram

```
       Popup               Background           Content
        ┌────────────┐      ┌────────┐      ┌──────────┐
        │            │      │        │      │          │
        │ popup.js   │      │Service │      │content-  │
        │            │◄────►│Worker  │◄────►│script.js │
        │            │      │        │      │          │
        └────────────┘      └────────┘      └──────────┘

Messages flow:
- Popup ──LOGIN_REQUEST──> Background ──response──> Popup
- Popup ──FETCH_CREDENTIALS──> Background ──CREDENTIALS──> Popup
- Background ──INJECT_CREDENTIALS──> Content
- Content ──FORM_DETECTED──> Background
```

## Security Boundaries

```
┌─────────────────────────────────────────────────────────┐
│ SECURE BOUNDARY: Chrome Extension Isolated Context      │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Extension Code (Popup, Background, Content)      │   │
│ │ - Access to storage                              │   │
│ │ - Can send messages                              │   │
│ │ - Can make API calls                             │   │
│ └──────────────────────────────────────────────────┘   │
│                        │                                 │
│                        │ HTTPS Only                      │
│                        ▼                                 │
│         ┌──────────────────────────┐                    │
│         │ Backend API (ASP.NET)    │                    │
│         │ - Validates JWT          │                    │
│         │ - Encrypts passwords     │                    │
│         │ - Manages credentials    │                    │
│         └──────────────────────────┘                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Injected Scripts on Web Pages                    │  │
│  │ - Content script only (no direct page access)   │  │
│  │ - Cannot access stored credentials              │  │
│  │ - Only receives credentials when injecting      │  │
│  │ - Credentials cleared from memory immediately   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Page Content (UNTRUSTED)
                        ▼
          ┌──────────────────────────────┐
          │ Website JavaScript           │
          │ - Cannot access extension    │
          │ - Cannot read stored data    │
          │ - Cannot intercept messages  │
          └──────────────────────────────┘
```

## Error Handling Strategy

```
Error occurs
      │
      ▼
┌─────────────────────────┐
│ Determine Error Type    │
└─────┬───────────────────┘
      │
      ├─────────────────┬──────────────┬──────────┐
      ▼                 ▼              ▼          ▼
  Network Error    Auth Error     Validation   Server Error
      │                │              │          │
      ├──> Retry      ├──> Logout    ├──> Show  ├──> Retry
      │    with       │    user      │    form  │    with
      │    backoff    │              │    error │    backoff
      └─> Log issue   └─> Clear      └─> Log   └─> Log
                        token
```

## Performance Optimization Points

### Current Optimizations

1. **Local Caching**
   - Credentials cached locally
   - Reduces API calls
   - Synced on intervals

2. **Debouncing**
   - Search input debounced (300ms)
   - Prevents excessive filtering

3. **Lazy Loading**
   - Popup doesn't load until clicked
   - Background service worker only when needed

4. **Message Batching**
   - Multiple form fields in single message
   - Reduces message overhead

### Potential Improvements

```javascript
// 1. Pagination for large credential lists
async getCredentials(page = 1, pageSize = 50) {
  const credentials = await StorageManager.getCredentials();
  const start = (page - 1) * pageSize;
  return credentials.slice(start, start + pageSize);
}

// 2. Request deduplication
const requestCache = new Map();
async function cachedRequest(key, requestFn) {
  if (!requestCache.has(key)) {
    requestCache.set(key, requestFn());
  }
  return requestCache.get(key);
}

// 3. Service worker lifecycle optimization
// Only keep minimal data in memory
// Archive old credentials
```

## Testing Strategy

### Unit Testing Structure

```javascript
// test/services/auth-service.test.js
describe('AuthService', () => {
  describe('login', () => {
    it('should return success with valid credentials', async () => {
      // Mock API response
      // Call AuthService.login()
      // Assert result
    });
    
    it('should return error with invalid email', async () => {
      // Test validation
    });
  });
});
```

### Integration Testing

```javascript
// Test message passing between components
// Test storage persistence
// Test API integration
```

### E2E Testing

```javascript
// Manual or automated testing in Chrome
// Test full user workflows
// Test on real websites
```

## Scaling Considerations

### For 10K Users
- Add credential pagination
- Implement smart sync (only changed items)
- Cache credentials longer

### For 50K+ Users
- Implement credential search on backend
- Add credential versioning
- Consider IndexedDB for larger storage
- Implement credential archival

---

See [README.md](../README.md) for overall architecture overview.
