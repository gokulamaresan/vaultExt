# Contributing Guidelines

Thank you for contributing to VaultGuard! Please follow these guidelines.

## Code Standards

### JavaScript Style

- Use ES6 modules (`import`/`export`)
- Use `async`/`await` for async operations
- Variable names: `camelCase`
- Class names: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

```javascript
// ✓ Good
class AuthService {
  static async loginUser(email) {
    const MAX_RETRIES = 3;
    let currentAttempt = 0;
    // ...
  }
}

// ✗ Bad
class authService {
  async LoginUser(email) {
    const maxRetries = 3;
    // ...
  }
}
```

### Commenting

- JSDoc for functions
- Inline comments for complex logic
- No obvious comments

```javascript
/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Auth result with token
 */
async function authenticateUser(email, password) {
  // Validate input before API call
  if (!isValidEmail(email)) {
    throw new Error('Invalid email');
  }
  
  return await api.login(email, password);
}
```

### Error Handling

All async functions must have try-catch:

```javascript
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  Logger.error('Failed to fetch data:', error);
  showUserError('Failed to load data');
}
```

### File Structure

```javascript
/**
 * Module Name
 * Brief description
 */

// 1. Imports
import Logger from '../utils/logger.js';

// 2. Constants
const CONSTANTS = { ... };

// 3. Main class/function
class ModuleName {
  // Public methods
  static publicMethod() { ... }
  
  // Private methods (prefixed with _)
  static _privateMethod() { ... }
}

// 4. Export
export default ModuleName;
```

## File Organization

- **One class per file** (with rare exceptions)
- **Logical grouping** of related functions
- **Descriptive file names** (kebab-case)
- **Organized imports** (standard lib → local)

## Testing

Before submitting:

- [ ] Code follows style guide
- [ ] No console errors/warnings
- [ ] Tested in Chrome
- [ ] No hardcoded values
- [ ] No console.log() left in code
- [ ] Security reviewed

## Commit Messages

```
Type: Brief description

Detailed explanation of changes.
- Point 1
- Point 2

Fixes #123
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactoring
- `test:` Testing

## Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request with description

## PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation

## How to Test
Steps to test the changes

## Checklist
- [ ] Follows code style
- [ ] No console errors
- [ ] Tested locally
- [ ] Updated docs
```

## Reporting Bugs

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS version
- Console errors (if any)

## Feature Requests

Include:
- Use case
- Proposed solution
- Alternative solutions
- Priority level

## Security Issues

**DO NOT** open public issue for security problems.

Report to: security@vaultguard.app

## Code Review Guidelines

**As Author:**
- Respond to feedback
- Make requested changes
- Update PR with changes

**As Reviewer:**
- Be constructive
- Ask questions
- Suggest improvements
- Approve when satisfied

## Performance Guidelines

- Minimize API calls
- Use local caching
- Debounce user input
- Lazy load when possible
- Monitor memory usage

**Before optimization:**
```javascript
// Measure performance
const start = performance.now();
// ... operation
const duration = performance.now() - start;
console.log(`Operation took ${duration}ms`);
```

## Documentation

Update docs for:
- New features
- API changes
- Configuration options
- Security implications

## Development Tools

### Useful Chrome DevTools

1. **DevTools for popup**: Right-click popup → Inspect
2. **Background worker**: `chrome://extensions` → Details → Inspect views
3. **Content script**: Inspect target page

### Debugging Commands

```javascript
// Check authentication
const token = await chrome.storage.local.get('vaultguard_jwt_token');

// Send test message
chrome.runtime.sendMessage({ type: 'TEST_MESSAGE', payload: {} });

// Clear all data
chrome.storage.local.clear();
```

## Adding Dependencies

**VaultGuard uses ZERO external dependencies.**

If adding functionality:
1. First check if browser API provides it
2. Implement with Web APIs
3. Only last resort: vendor a library (discouraged)

## Internationalization

Future support for i18n:
- String literals → use constants
- `messages.json` format (future)
- Locale switching (future)

## Accessibility

All UI must be:
- Keyboard navigable
- Screen reader friendly
- High contrast support
- Focus visible

```javascript
// ✓ Good
<button aria-label="Copy password">Copy</button>
<input aria-describedby="password-hint">

// ✗ Bad
<div onClick={copy}>Copy</div>
```

## Version Numbering

Follow SemVer: `MAJOR.MINOR.PATCH`

- `1.0.0` → Initial release
- `1.1.0` → New feature
- `1.1.1` → Bug fix
- `2.0.0` → Breaking changes

## Release Process

1. Update version in `manifest.json`
2. Create CHANGELOG entry
3. Tag release: `git tag v1.2.3`
4. Submit to Chrome Web Store

## Questions?

Open discussion or email: dev@vaultguard.app

---

Thank you for making VaultGuard better! 🚀
