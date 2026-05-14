# Extension File Structure & Module Map

## Visual Project Structure

```
d:\Extention\
│
├── 📄 manifest.json              ← Chrome Extension configuration (Manifest V3)
├── 📄 README.md                  ← Main documentation (2000+ lines)
├── 📄 QUICK_START.md             ← 5-minute quick start guide
├── 📄 CHANGELOG.md               ← Version history and roadmap
├── 📄 PROJECT_SUMMARY.md         ← This project summary
│
├── 📁 src/                       ← Source code root
│   │
│   ├── 📁 popup/                 ← Extension popup (400x600px)
│   │   ├── 📄 popup.html         ← UI markup (Login + Vault interface)
│   │   └── 📄 popup.js           ← Popup logic (400 lines)
│   │
│   ├── 📁 background/            ← Service worker
│   │   └── 📄 service-worker.js  ← Background logic, message routing
│   │
│   ├── 📁 content/               ← Content script
│   │   └── 📄 content-script.js  ← Form detection, auto-fill
│   │
│   ├── 📁 services/              ← Business logic layer
│   │   ├── 📄 auth-service.js           ← Login, JWT, session
│   │   ├── 📄 credentials-service.js    ← Credential CRUD
│   │   └── 📄 form-detection-service.js ← Form detection
│   │
│   ├── 📁 api/                   ← API communication
│   │   └── 📄 http-client.js     ← HTTP with retry, timeout
│   │
│   ├── 📁 storage/               ← Data persistence
│   │   └── 📄 storage-manager.js ← Chrome storage abstraction
│   │
│   ├── 📁 utils/                 ← Utility helpers
│   │   ├── 📄 logger.js                ← Structured logging
│   │   ├── 📄 crypto-utils.js          ← Encryption/decryption
│   │   ├── 📄 dom-utils.js             ← DOM helpers
│   │   ├── 📄 validation-utils.js      ← Input validation, XSS prevention
│   │   └── 📄 message-handler.js       ← Message routing
│   │
│   ├── 📁 constants/             ← Constant values
│   │   └── 📄 app-constants.js   ← API messages, error strings
│   │
│   ├── 📁 config/                ← Configuration
│   │   └── 📄 environment.js     ← API endpoints, debug settings
│   │
│   ├── 📁 styles/                ← Styling
│   │   ├── 📄 global.css         ← Global styles, CSS variables
│   │   └── 📄 popup.css          ← Popup styling
│   │
│   ├── 📁 components/            ← Reusable components (future)
│   │   └── [Reserved for expansion]
│   │
│   └── 📁 hooks/                 ← Custom hooks (future)
│       └── [Reserved for expansion]
│
├── 📁 assets/                    ← Extension assets
│   └── 📁 icons/                 ← Extension icons
│       ├── icon-16.png           ← Icon (16x16px)
│       ├── icon-48.png           ← Icon (48x48px)
│       └── icon-128.png          ← Icon (128x128px)
│
└── 📁 docs/                      ← Documentation (5000+ lines)
    ├── 📄 ARCHITECTURE.md        ← Architecture deep dive
    ├── 📄 SECURITY.md            ← Security best practices
    ├── 📄 API.md                 ← API integration guide
    ├── 📄 DEVELOPMENT.md         ← Development workflow
    └── 📄 CONTRIBUTING.md        ← Contributing guidelines
```

## Module Dependency Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                     POPUP.JS (User Interface)                   │
│  Depends on: 8 modules                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼──────────────────┐
                │             │                  │
                ▼             ▼                  ▼
         ┌────────────┐ ┌─────────────┐ ┌──────────────┐
         │ Message    │ │ Auth        │ │ Credentials  │
         │ Handler    │ │ Service     │ │ Service      │
         └────────────┘ └─────────────┘ └──────────────┘
                │             │                  │
                │             └────────┬─────────┘
                │                      │
                └──────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌────────────┐
    │ HTTP    │      │ Storage  │      │ Logger   │      │ Validation │
    │ Client  │      │ Manager  │      │          │      │ Utils      │
    └─────────┘      └──────────┘      └──────────┘      └────────────┘


┌──────────────────────────────────────────────────────────────────┐
│              SERVICE-WORKER.JS (Background Logic)                │
│  Depends on: 4 modules                                           │
└──────────────────────────────────────────────────────────────────┘
        │
        ├────────────┬────────────┬─────────────┐
        │            │            │             │
        ▼            ▼            ▼             ▼
    ┌──────────┐ ┌──────────┐ ┌──────┐ ┌────────────┐
    │ Auth     │ │Credentials│ │Logger│ │Message     │
    │ Service  │ │ Service   │ │      │ │Handler     │
    └──────────┘ └──────────┘ └──────┘ └────────────┘
        │            │
        └────┬───────┘
             │
    ┌────────▼──────────┐
    │ HTTP Client       │
    └───────┬───────────┘
            │
    ┌───────▼──────────┐
    │ Storage Manager  │
    └──────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│            CONTENT-SCRIPT.JS (Form Detection)                    │
│  Depends on: 4 modules                                           │
└──────────────────────────────────────────────────────────────────┘
        │
        ├──────────┬──────────────┬──────────────┐
        │          │              │              │
        ▼          ▼              ▼              ▼
    ┌──────────┐ ┌─────────┐ ┌────────────┐ ┌────────┐
    │ Form     │ │ Message │ │ Logger     │ │Validation
    │ Detection│ │ Handler │ │            │ │Utils
    └──────────┘ └─────────┘ └────────────┘ └────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                              │
│                      (Web Browser Page)                              │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks extension icon
                              ▼
                    ┌──────────────────┐
                    │  popup.html      │
                    │  (UI Loads)      │
                    └────────┬─────────┘
                             │
                             │ popup.js initializes
                             ▼
                    ┌──────────────────┐
                    │ Check Auth Status│
                    └────┬──────────┬──┘
                         │          │
                    NOT  │          │ YES
                    AUTH │          │ AUTH
                         │          │
        ┌────────────────┘          └─────────────────┐
        │                                             │
        ▼                                             ▼
    ┌──────────────┐                         ┌──────────────┐
    │ Show Login   │                         │ Load Vault   │
    │ Form         │                         │              │
    └────┬─────────┘                         └────┬─────────┘
         │                                        │
         │ User submits                           │ popup.js →
         │ email + password                       │ Message.send()
         │                                        │ FETCH_CREDENTIALS
         ▼                                        ▼
    ┌─────────────────────────────────────────────────────┐
    │   MESSAGE HANDLER → Service Worker                  │
    │   Handles message type: LOGIN_REQUEST/FETCH_etc     │
    └──────────┬──────────────────────────────────────────┘
               │
               │ Routes to appropriate service
               │
        ┌──────┴────────────────────────────────┐
        │                                        │
        ▼                                        ▼
    ┌──────────┐                          ┌──────────────┐
    │ Auth     │                          │ Credentials  │
    │ Service  │                          │ Service      │
    └─────┬────┘                          └──────┬───────┘
          │                                      │
          │ (Validate input)                    │ (Search local cache)
          │ (Make API call)                     │ (Or fetch from API)
          │                                      │
          ▼                                      ▼
    ┌─────────────────┐              ┌──────────────────┐
    │   HTTP Client   │              │ Storage Manager  │
    │   (With retry)  │              │ (Chrome storage) │
    └────────┬────────┘              └────────┬─────────┘
             │                                 │
             │ HTTPS POST /auth/login          │ Save credentials
             │                                 │ locally
             ▼                                 │
    ┌──────────────────────┐                  │
    │  Backend API         │◄─────────────────┘
    │  (ASP.NET Core)      │
    │                      │
    │ • Validate creds     │
    │ • Generate JWT       │
    │ • Return credentials │
    └──────┬───────────────┘
           │
           │ Response + JWT
           │
           ▼
    ┌──────────────────────┐
    │ Service Worker       │
    │ Saves JWT + data     │
    │ Returns to popup     │
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Popup Updates UI     │
    │ Display credentials  │
    │ Show search bar      │
    └──────────────────────┘
           │
           │ User browses websites
           │
           ▼
    ┌──────────────────────┐
    │ Website page loads   │
    └──────┬───────────────┘
           │
           │ content-script.js injected
           │
           ▼
    ┌──────────────────────┐
    │ Form Detection       │
    │ Finds login forms    │
    └──────┬───────────────┘
           │
           │ Forms found
           │
           ▼
    ┌──────────────────────┐
    │ Send FORM_DETECTED   │
    │ to Service Worker    │
    └──────────────────────┘
           │
           │ User sees login form
           │ Clicks extension icon
           │
           ▼
    ┌──────────────────────┐
    │ Popup shows domain   │
    │ with matching creds  │
    │ User clicks autofill │
    └──────┬───────────────┘
           │
           │ popup.js → Send INJECT_CREDENTIALS
           │
           ▼
    ┌──────────────────────┐
    │ Content Script       │
    │ Receives message     │
    │ Injects credentials  │
    │ into form fields     │
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Form auto-filled!    │
    │ User can submit      │
    └──────────────────────┘
```

## Storage Schema

```
Chrome Storage (Local)
├── vaultguard_jwt_token
│   └── "eyJhbGciOiJIUzI1NiIs..." (JWT Bearer Token)
│
├── vaultguard_user_data
│   └── {
│       "id": "user-123",
│       "email": "user@example.com",
│       "name": "John Doe"
│     }
│
├── vaultguard_credentials
│   └── [
│       {
│         "id": "cred-1",
│         "name": "Gmail",
│         "domain": "gmail.com",
│         "username": "user@gmail.com",
│         "password": "***",
│         "createdAt": "2024-01-01T00:00:00Z"
│       },
│       ... more credentials
│     ]
│
└── vaultguard_user_preferences
    └── {
        "theme": "dark",
        "autoSync": true,
        "syncInterval": 3600000
      }

Chrome Storage (Session - cleared on close)
└── vaultguard_session_timeout
    └── 1705776000000 (timestamp when session expires)
```

## Component Communication

```
     ┌─────────────────────────────────────────────────┐
     │         POPUP (User Interface)                  │
     │  • Shows login form or vault                    │
     │  • Handles user interactions                    │
     │  • Displays credentials & search                │
     └────────────┬────────────────────────────────────┘
                  │
                  │ chrome.runtime.sendMessage()
                  │ ← Receives response
                  │
     ┌────────────▼────────────────────────────────────┐
     │   MESSAGE HANDLER (Central Router)              │
     │   • Receives all messages                       │
     │   • Routes to appropriate handlers              │
     │   • Sends responses back                        │
     └─────────┬──────────────────────────────┬────────┘
               │                              │
               │ Registered handlers          │
               │                              │
      ┌────────▼──────────┐          ┌───────▼──────────┐
      │ Auth Handlers     │          │ Credential       │
      │ LOGIN_REQUEST     │          │ Handlers         │
      │ LOGOUT_REQUEST    │          │ FETCH_CREDS      │
      │ GET_SESSION_STATUS│          │ SEARCH_CREDS     │
      └────────┬──────────┘          │ DELETE_CRED      │
               │                      └───────┬──────────┘
               │                              │
      ┌────────▼──────────┐          ┌───────▼──────────┐
      │ AuthService       │          │CredentialsService│
      │ • Handles login   │          │ • Searches vault │
      │ • Manages tokens  │          │ • Caches data    │
      │ • Session timeout │          │ • Syncs with API │
      └────────┬──────────┘          └───────┬──────────┘
               │                              │
               │                              │
      ┌────────▼──────────┐          ┌───────▼──────────┐
      │ HTTPClient        │          │ StorageManager   │
      │ • Makes API calls │          │ • Persists data  │
      │ • Retries failed  │          │ • Retrieves data │
      │ • Handles timeouts│          │ • Clears storage │
      └────────┬──────────┘          └───────┬──────────┘
               │                              │
               │ HTTPS Request               │ Chrome Storage
               │                              │
      ┌────────▼──────────────────────────────▼──────────┐
      │  Backend System                                   │
      │  • ASP.NET Core API                              │
      │  • Database                                      │
      │  • Authentication                                │
      └───────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────┐
  │     CONTENT SCRIPT (Web Page Integration)       │
  │  • Detects forms                                │
  │  • Injects credentials                          │
  │  • Runs on every webpage                        │
  └────────────┬────────────────────────────────────┘
               │
               │ chrome.tabs.sendMessage()
               │ ← Receives INJECT_CREDENTIALS
               │
     ┌─────────▼────────────────────────────────────┐
     │   FormDetectionService                       │
     │   • Finds login forms                        │
     │   • Identifies input fields                  │
     │   • Injects credentials                      │
     └──────────────────────────────────────────────┘
```

## Message Flow Sequence

```
Timeline (left to right)

User Opens    Service       Backend       Storage        Content
Popup         Worker        API           Manager        Script
  │             │             │             │              │
  │             │             │             │              │
  └─Login────────>Check Auth  │             │              │
  │             │             │             │              │
  │             │        <────Get JWT─────────────────────>
  │             │             │             │              │
  │             │             │             │              │
  ├─Get Creds──>Get Creds     │             │              │
  │   │         │             │             │              │
  │   │         └─Fetch All──>Return Creds │              │
  │   │             │             │         │              │
  │   │             │<─────Save Cache──────>              │
  │   │             │             │         │              │
  │<─Creds──────────┘             │         │              │
  │             │                 │         │              │
  │ [User visits site with form]  │         │              │
  │             │                 │         │      Form Detected
  │             │                 │         │      <────────────
  │             │                 │         │              │
  │  [User clicks auto-fill]      │         │              │
  │             │                 │         │              │
  ├─Inject──────>Send to Content──────────────────Inject──>
  │             │      Script     │         │      Creds   │
  │             │                 │         │              │
  │             │<─Confirmation───────────────────────────
  │             │                 │         │              │
  │<─Success─────┘                │         │              │
  │
  └─Logout──────>Clear All
                 │
                 └─Remove Token─────────────────────────>
                 │
                 └─Clear Cache──────────────────────────>
                 │
```

## File Interaction Map

```
Files that communicate with Popup:
├── src/utils/message-handler.js  ← Route messages
├── src/services/auth-service.js  ← Login/logout
├── src/services/credentials-service.js ← Get/search creds
└── src/popup/popup.js            ← Main UI logic

Files that communicate with Background:
├── src/popup/popup.js            ← Send messages
├── src/content/content-script.js ← Send form info
├── src/services/auth-service.js  ← Handle auth
├── src/services/credentials-service.js ← Handle creds
└── src/background/service-worker.js ← Router

Files that communicate with Content Script:
├── src/background/service-worker.js ← Send inject messages
├── src/utils/message-handler.js ← Message routing
├── src/services/form-detection-service.js ← Form logic
└── src/content/content-script.js ← Main content logic

Files that communicate with API:
├── src/api/http-client.js        ← Make requests
├── src/services/auth-service.js  ← Use HTTP client
└── src/services/credentials-service.js ← Use HTTP client

Files that communicate with Storage:
├── src/storage/storage-manager.js ← Manage storage
├── src/services/auth-service.js  ← Save tokens/user
└── src/services/credentials-service.js ← Cache credentials
```

## Error Handling Flow

```
Operation Requested
        │
        ▼
Try Block
├─ Validate Input
├─ Make Request
└─ Process Result
        │
        ├─ Success ──────> Return Success Result
        │
        └─ Error
            │
            ├─ Network Error
            │   ├─ Retry with backoff (HTTPClient)
            │   └─ If all retries fail → Throw error
            │
            ├─ Auth Error (401/403)
            │   ├─ Try refresh token
            │   ├─ If success → Retry original request
            │   └─ If fail → Logout user + Show error
            │
            ├─ Validation Error
            │   └─ Show user-friendly error message
            │
            └─ Server Error (500)
                ├─ Log error details
                ├─ Retry with backoff
                └─ Show "Please try again later"
        │
        ▼
Catch Block
├─ Log error with Logger.error()
├─ Determine error type
├─ Return error result
└─ Display to user via showNotification()
```

---

For more detailed information, see:
- [README.md](README.md) - Complete documentation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture deep dive
- [QUICK_START.md](QUICK_START.md) - Quick start guide
