# API Integration Guide

Complete documentation for integrating VaultGuard with your ASP.NET Core backend.

## Base Configuration

### 1. API Endpoint Setup

```javascript
// src/config/environment.js
const API_BASE_URL = 'https://api.vaultguard.app/api'; // Production
```

### 2. CORS Configuration (Backend)

**ASP.NET Core:**
```csharp
// Startup.cs or Program.cs
var chromExtensionId = "YOUR_EXTENSION_ID";

services.AddCors(options => {
    options.AddPolicy("VaultGuardExtension", builder => {
        builder
            .WithOrigins($"chrome-extension://{chromExtensionId}")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithCredentials()
            .AllowAnyOrigin(); // Only if truly needed
    });
});

app.UseCors("VaultGuardExtension");
```

## Authentication Endpoints

### POST /auth/login

User login to get JWT token.

**Request:**
```javascript
const response = await HTTPClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "error": "Invalid credentials"
}

// 400 Bad Request
{
  "error": "Email is required"
}
```

### POST /auth/refresh-token

Refresh JWT token before expiry.

**Request:**
```javascript
const response = await HTTPClient.post('/auth/refresh-token', {});
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### POST /auth/logout

Logout and invalidate session.

**Request:**
```javascript
const response = await HTTPClient.post('/auth/logout', {});
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Credentials Endpoints

### GET /credentials

Fetch all credentials for the authenticated user.

**Request:**
```javascript
const response = await HTTPClient.get('/credentials');
```

**Response:**
```json
{
  "credentials": [
    {
      "id": "cred-123",
      "name": "Gmail Account",
      "domain": "gmail.com",
      "username": "user@gmail.com",
      "password": "encrypted_password_here",
      "notes": "Personal email",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-15T15:30:00Z"
    }
  ]
}
```

### GET /credentials/:id

Fetch specific credential by ID.

**Request:**
```javascript
const response = await HTTPClient.get('/credentials/cred-123');
```

**Response:**
```json
{
  "credential": {
    "id": "cred-123",
    "name": "Gmail Account",
    "domain": "gmail.com",
    "username": "user@gmail.com",
    "password": "encrypted_password_here",
    "notes": "Personal email",
    "tags": ["email", "personal"],
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T15:30:00Z"
  }
}
```

### POST /credentials

Create a new credential.

**Request:**
```javascript
const response = await HTTPClient.post('/credentials', {
  name: 'Gmail Account',
  domain: 'gmail.com',
  username: 'user@gmail.com',
  password: 'encrypted_password_here',
  notes: 'Personal email account',
  tags: ['email', 'personal']
});
```

**Response (201 Created):**
```json
{
  "credential": {
    "id": "cred-new-123",
    "name": "Gmail Account",
    "domain": "gmail.com",
    "username": "user@gmail.com",
    "createdAt": "2024-01-20T12:00:00Z",
    "updatedAt": "2024-01-20T12:00:00Z"
  }
}
```

### PUT /credentials/:id

Update an existing credential.

**Request:**
```javascript
const response = await HTTPClient.put('/credentials/cred-123', {
  name: 'Gmail - Updated',
  notes: 'Updated notes'
});
```

**Response:**
```json
{
  "credential": {
    "id": "cred-123",
    "name": "Gmail - Updated",
    "domain": "gmail.com",
    "username": "user@gmail.com",
    "notes": "Updated notes",
    "updatedAt": "2024-01-20T12:05:00Z"
  }
}
```

### DELETE /credentials/:id

Delete a credential.

**Request:**
```javascript
const response = await HTTPClient.delete('/credentials/cred-123');
```

**Response (204 No Content):**
No body returned.

### GET /credentials/search

Search credentials by query.

**Request:**
```javascript
const response = await HTTPClient.get('/credentials/search?q=gmail');
```

**Query Parameters:**
- `q` - Search query (searches in name, username, domain)
- `limit` - Max results (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "credentials": [
    {
      "id": "cred-123",
      "name": "Gmail Account",
      "domain": "gmail.com",
      "username": "user@gmail.com"
    }
  ],
  "total": 1
}
```

## Vault Sync Endpoint

### POST /vault/sync

Synchronize vault with latest server data.

**Request:**
```javascript
const response = await HTTPClient.post('/vault/sync', {
  lastSyncTime: '2024-01-20T10:00:00Z' // Optional
});
```

**Response:**
```json
{
  "credentials": [...],
  "deletedIds": ["cred-old-1", "cred-old-2"],
  "lastSyncTime": "2024-01-20T12:00:00Z"
}
```

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "details": {
    "field": ["error message"]
  }
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Successful deletion |
| 400 | Bad Request | Invalid input - validate locally |
| 401 | Unauthorized | Token invalid/expired - force logout |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Retry with backoff |

### Error Handling in Extension

```javascript
try {
  const response = await HTTPClient.post('/auth/login', { email, password });
} catch (error) {
  if (error.status === 401) {
    // Force logout
    await AuthService.logout();
  } else if (error.status === 500) {
    // Retry with exponential backoff
    // Already handled by HTTPClient
  } else if (error.status === 400) {
    // Show validation error to user
    showValidationError(error.response.details);
  }
}
```

## Authentication Headers

All requests (except login) must include JWT token:

```javascript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

This is automatically added by HTTPClient.

## JWT Token Structure

Expected JWT payload:

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "exp": 1705776000,
  "iat": 1705772400,
  "iss": "VaultGuard"
}
```

## Rate Limiting

API implements rate limiting:

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705776000
```

**When exceeded (429):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

Extension implements client-side rate limiting as backup.

## Data Validation

### Email Validation
```javascript
// Client-side
ValidationUtils.isValidEmail(email) // true/false

// Server should also validate
```

### Domain Format
```javascript
// Expected format
"gmail.com"    // ✓ Correct
"Gmail.com"    // ✓ Also accepted (normalized to lowercase)
"www.gmail"    // ✗ Invalid
```

### Password Requirements (Server-enforced)
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

## Implementation Checklist

- [ ] CORS configured for extension origin
- [ ] JWT token generation/validation working
- [ ] All endpoints implemented
- [ ] Error responses in standard format
- [ ] Rate limiting configured
- [ ] Database encryption for passwords
- [ ] Audit logging for sensitive operations
- [ ] API documentation generated
- [ ] Load testing completed
- [ ] Security review passed

## Testing API Endpoints

### Using cURL (for development)

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get credentials
curl -X GET http://localhost:5000/api/credentials \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create credential
curl -X POST http://localhost:5000/api/credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Gmail","domain":"gmail.com","username":"user@gmail.com","password":"encrypted"}'
```

### Using Postman

1. Create collection "VaultGuard API"
2. Set base URL: `{{base_url}}/api`
3. Create environment variable for token
4. Test each endpoint

## Versioning

API uses URL versioning:

```
v1: /api/v1/credentials
v2: /api/v2/credentials (future)
```

Current version: v1 (implicit if not specified)

## Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 | 15 minutes |
| GET /credentials | 100 | 1 minute |
| POST /credentials | 50 | 1 hour |
| PUT/DELETE | 50 | 1 hour |
| /search | 100 | 1 minute |

---

For API support, contact: api-support@vaultguard.app
