# Quick Start Guide

Get VaultGuard running in 5 minutes.

## Prerequisites

- Chrome browser (latest version)
- ASP.NET Core backend running
- Basic understanding of Chrome extensions

## Step 1: Load Extension

1. Download or clone the project
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `Extention` folder
6. Extension appears in Chrome toolbar

## Step 2: Configure API Endpoint

Edit `src/config/environment.js`:

```javascript
// For local development
API_BASE_URL: 'http://localhost:5000/api'

// For production
API_BASE_URL: 'https://api.yourdomain.com/api'
```

## Step 3: Open Extension

Click the VaultGuard icon in Chrome toolbar.

## Step 4: Login

- Enter your registered email
- Enter your password
- Click **Login**

## Step 5: Use Extension

### Auto-Fill Credentials
1. Go to any login page
2. Extension detects forms
3. Click VaultGuard icon
4. Select credential
5. Click **Auto-fill** button (↗)
6. Credentials injected into form

### Search Vault
1. Click VaultGuard icon
2. Type in search box
3. Results filter in real-time

### Sync Vault
Click the sync button (↻) to get latest credentials from server.

## Step 6: Logout

Click **Logout** button in footer.

---

## Troubleshooting

### Extension Not Loading?
- Check Developer mode is enabled
- Ensure you're loading the correct folder
- Clear cache: `chrome://extensions` → refresh

### Forms Not Detecting?
- Check browser console for errors
- Verify form has username and password fields
- Form structure must match detection patterns

### Auto-Fill Not Working?
- Ensure you're logged in
- Check credentials exist for this domain
- Verify domain in URL matches credential domain

### API Connection Failed?
- Verify backend is running
- Check API endpoint in environment.js
- Use curl to test endpoint directly

### Debugging

**View Logs:**
1. Right-click VaultGuard icon → Inspect popup
2. Open Chrome DevTools for tab
3. Console shows all logs

**Clear Storage:**
```javascript
// In console
chrome.storage.local.clear();
chrome.storage.session.clear();
```

**Check JWT Token:**
```javascript
chrome.storage.local.get('vaultguard_jwt_token', console.log);
```

## Development Workflow

1. **Make changes** to any file
2. **Reload extension**: `chrome://extensions` → refresh button
3. **Check console** for errors
4. **Test functionality**

## Common Tasks

### Add New API Endpoint

1. Define in `src/config/environment.js`:
```javascript
API_ENDPOINTS: {
  NEW_ENDPOINT: '/path/to/endpoint',
}
```

2. Use in service:
```javascript
const response = await HTTPClient.get(API_ENDPOINTS.NEW_ENDPOINT);
```

### Modify UI

1. Edit `src/popup/popup.html` for structure
2. Edit `src/styles/popup.css` for styling
3. Edit `src/popup/popup.js` for logic
4. Reload extension

### Add Message Handler

1. In `src/background/service-worker.js`:
```javascript
MessageHandler.on(APP_CONSTANTS.MESSAGE_TYPES.MY_MESSAGE, async (payload) => {
  // Handle message
  return { success: true };
});
```

2. In `src/popup/popup.js`:
```javascript
const result = await MessageHandler.send(APP_CONSTANTS.MESSAGE_TYPES.MY_MESSAGE, data);
```

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Login works with valid credentials
- [ ] Credentials display in vault
- [ ] Search filters credentials
- [ ] Auto-fill injects credentials
- [ ] Logout clears session
- [ ] Forms detected on multiple sites
- [ ] No console errors

---

For detailed documentation, see [README.md](../README.md)
