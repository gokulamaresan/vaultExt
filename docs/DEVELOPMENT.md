# Development Setup & Workflow

Complete guide for setting up a development environment.

## System Requirements

- **OS:** Windows, macOS, or Linux
- **Browser:** Chrome 90+
- **Editor:** VS Code recommended
- **Backend:** ASP.NET Core API running locally or remote

## Initial Setup

### 1. Clone/Download Project

```bash
# Clone from Git
git clone https://github.com/yourusername/vaultguard.git
cd Extention

# Or extract from ZIP
unzip vaultguard.zip
cd Extention
```

### 2. Load in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `Extention` folder
5. Extension now appears in toolbar

### 3. Configure Environment

Edit `src/config/environment.js`:

```javascript
// Development
API_BASE_URL: 'http://localhost:5000/api'
DEBUG: true
LOG_LEVEL: 'debug'
```

### 4. Backend Setup

Ensure ASP.NET Core backend is running:

```bash
# If using the provided template
cd backend
dotnet run
# Server runs on http://localhost:5000
```

## Development Workflow

### File Editing Cycle

1. **Edit file** in VS Code
2. **Save file** (Ctrl+S / Cmd+S)
3. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click reload icon on VaultGuard
4. **Test changes** in popup or page
5. **Check console** for errors

### Debug Popup Script

1. Click VaultGuard icon in toolbar
2. Right-click popup → **Inspect**
3. Chrome DevTools opens
4. View console logs and errors
5. Set breakpoints in Sources tab

### Debug Background Service Worker

1. Go to `chrome://extensions/`
2. Find VaultGuard extension
3. Under "Inspect views", click **service worker**
4. Chrome DevTools opens for background script

### Debug Content Script

1. Navigate to any website
2. Right-click → **Inspect**
3. In Console, select the appropriate frame
4. Content script logs appear here

## Useful Commands

### Clear All Extension Data

```javascript
// In any extension page console
chrome.storage.local.clear();
chrome.storage.session.clear();
```

### Test API Endpoint

```bash
# Using curl
curl -X GET http://localhost:5000/api/credentials \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or use Postman/Insomnia
```

### Check Current State

```javascript
// Get authentication status
chrome.storage.local.get('vaultguard_jwt_token', (result) => {
  console.log('Token:', result);
});

// Get cached credentials
chrome.storage.local.get('vaultguard_credentials', (result) => {
  console.log('Credentials:', result);
});

// Get all storage
chrome.storage.local.get(null, (result) => {
  console.log('All storage:', result);
});
```

### Send Test Message

```javascript
// Manually send a message to test handlers
chrome.runtime.sendMessage({
  type: 'FETCH_CREDENTIALS',
  payload: {}
}, (response) => {
  console.log('Response:', response);
});
```

## Debugging Specific Issues

### Issue: Forms Not Detected

1. Navigate to target website
2. Open DevTools on that page
3. In console, run:
```javascript
// Check if content script loaded
console.log('Content script loaded');

// Manually trigger form detection
chrome.runtime.sendMessage({
  type: 'DETECT_FORMS',
  payload: {}
}, (response) => {
  console.log('Forms detected:', response);
});
```

### Issue: Auto-fill Not Working

1. In popup DevTools console:
```javascript
// Check stored credentials
chrome.storage.local.get('vaultguard_credentials', console.log);

// Check if authenticated
chrome.storage.local.get('vaultguard_jwt_token', console.log);
```

2. Verify:
   - JWT token exists and is valid
   - Credentials are cached
   - Domain matches exactly

### Issue: API Errors

1. Open background DevTools
2. Check network tab or console
3. Verify:
   - Backend is running
   - API endpoint is correct
   - CORS headers are set
   - JWT token is valid

### Issue: Storage Not Persisting

```javascript
// Check storage size
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log(`Storage used: ${bytes} bytes`);
  console.log(`Storage used: ${bytes / 1024 / 1024} MB`);
});

// Storage quota is 10MB - if approaching limit, cleanup required
```

## Performance Debugging

### Monitor Memory Usage

```javascript
// Check memory in background DevTools
chrome.runtime.getBackgroundPage(function(backgroundPage) {
  console.log(performance.memory);
});
```

### Measure Operation Duration

```javascript
const start = performance.now();
// ... operation
const duration = performance.now() - start;
Logger.debug(`Operation took ${duration}ms`);
```

### Detect Slow Operations

```javascript
// Use PerformanceObserver
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 100) {
      console.warn(`Slow operation: ${entry.name} - ${entry.duration}ms`);
    }
  }
});

observer.observe({ entryTypes: ['measure', 'navigation'] });
```

## Hot Reload Development

### Automatic Reload on Changes

For faster development, create a file watcher script:

**watch.js** (Node.js):
```javascript
const chokidar = require('chokidar');
const http = require('http');

chokidar.watch('src/**').on('change', () => {
  // Notify Chrome to reload
  http.get('http://localhost:8888/reload', () => {
    console.log('Reloading extension...');
  }).on('error', () => {});
});
```

Then in background script:
```javascript
// Listen for reload requests
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RELOAD') {
    chrome.runtime.reload();
  }
});
```

## Testing Workflow

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Login functionality works
- [ ] Credentials fetch from API
- [ ] Credentials display in popup
- [ ] Search filters correctly
- [ ] Forms detected on websites
- [ ] Auto-fill injects credentials
- [ ] Logout works
- [ ] Session timeout works
- [ ] Token refresh works
- [ ] Error messages display correctly
- [ ] UI responsive on all screen sizes

### Test Different Scenarios

```javascript
// Test with expired token
chrome.storage.local.set({
  vaultguard_jwt_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNjA0OTI4MTYwfQ...'
});

// Test with no credentials
chrome.storage.local.set({
  vaultguard_credentials: []
});

// Test with network error (disable backend)
```

## Debugging Best Practices

### Add Logging

```javascript
// Use Logger utility - automatically hidden in production
Logger.debug('Variable state:', variable);
Logger.info('User action:', action);
Logger.warn('Potential issue:', issue);
Logger.error('Critical error:', error);
```

### Use Breakpoints

1. In DevTools Sources tab
2. Click line number to set breakpoint
3. Execution pauses at breakpoint
4. Inspect variables in Scope

### Step Through Code

- **Step Over** (F10): Execute next line
- **Step Into** (F11): Go into function
- **Step Out** (Shift+F11): Exit function
- **Continue** (F8): Resume execution

### Network Inspection

In background DevTools:
1. Go to Network tab
2. Make API request
3. View request/response details
4. Check headers, body, status

## VS Code Setup

### Recommended Extensions

- **ES7+ React/Redux/React-Native snippets**
- **Prettier** (code formatter)
- **ESLint**
- **Thunder Client** or **REST Client** (test API)
- **Chrome DevTools** (VSCode integration)

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.rulers": [80, 120],
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true
  }
}
```

## Troubleshooting Development

### Extension Keeps Crashing

1. Check DevTools for errors
2. Check background worker for infinite loops
3. Ensure no memory leaks
4. Restart browser

### Changes Not Taking Effect

1. Reload extension (red circle on `chrome://extensions`)
2. Clear cache: `Ctrl+Shift+Delete`
3. Hard reload: `Ctrl+Shift+R`
4. Close and reopen popup

### Cannot Connect to Backend

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check CORS headers
curl -i -X OPTIONS http://localhost:5000/api/credentials

# If using HTTPS, check certificates
```

### Storage Issues

```javascript
// Check storage limits
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log(`Using ${(bytes/1024/1024).toFixed(2)}MB of 10MB`);
});

// Clear specific keys
chrome.storage.local.remove('vaultguard_credentials');
```

## Production Build

### Prepare for Release

1. Update version in `manifest.json`
2. Set `DEBUG: false` in environment.js
3. Set production API endpoint
4. Test thoroughly
5. Create ZIP file: `Extention` folder

### Verify Production Settings

```javascript
// environment.js should have:
API_BASE_URL: 'https://api.yourdomain.com/api'
DEBUG: false
LOG_LEVEL: 'error'

// No hardcoded credentials
// No test data
// All error messages are user-friendly
```

---

For detailed information, see:
- [README.md](../README.md)
- [API.md](./API.md)
- [SECURITY.md](./SECURITY.md)
