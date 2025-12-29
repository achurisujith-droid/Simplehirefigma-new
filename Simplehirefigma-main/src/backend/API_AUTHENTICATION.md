# Authentication & Session Management API

This document describes the upgraded authentication and session management system.

## Authentication Endpoints

### POST /api/auth/signup
Create a new user account with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Account created successfully"
}
```

### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/logout
Logout and invalidate refresh tokens (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Session Management Endpoints

### POST /api/session/heartbeat
Keep session alive by updating last activity timestamp.

**Request Body:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session heartbeat recorded"
}
```

### POST /api/session/expire
Manually expire a session (e.g., on browser close).

**Request Body:**
```json
{
  "sessionId": "uuid",
  "reason": "Browser closed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session expired"
}
```

### GET /api/session/:sessionId/status
Get the status of a specific session.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "status": "active",
    "lastActivity": "2025-01-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### GET /api/session/user-sessions
Get all active sessions for the authenticated user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "uuid",
      "status": "active",
      "lastActivity": "2025-01-01T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## Security Features

### SHA-256 Refresh Token Hashing
- Refresh tokens are hashed using SHA-256 before storage
- Prevents token theft from database breaches
- Client receives unhashed token, server stores hashed version

### JWT Token Types
- Access tokens: 15-minute expiry, type: 'access'
- Refresh tokens: 7-day expiry, type: 'refresh'
- Token type validation prevents misuse

### Optional Authentication Middleware
- `authenticate`: Requires valid JWT token
- `optionalAuth`: Parses token if present, doesn't block if missing

### Input Validation
- Zod schemas for all endpoints
- Email format validation
- Password strength requirements (min 6 chars)
- Comprehensive error messages

## Database Models

### Session
```prisma
model Session {
  id           String    @id @default(uuid())
  sessionId    String    @unique
  userId       String?
  ownerId      String?   // IP-based ownership for non-authenticated sessions
  status       String    @default("active")
  data         Json      // Session data (resume, questions, etc.)
  lastActivity DateTime  @default(now())
  expiryReason String?
  expiredAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### RefreshToken
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique // SHA-256 hashed
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

## Environment Variables

See `.env.example` for all required environment variables including:

- `JWT_SECRET`: Access token secret (min 64 chars)
- `JWT_REFRESH_SECRET`: Refresh token secret (min 64 chars)
- `JWT_EXPIRES_IN`: Access token expiry (default: 15m)
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiry (default: 7d)
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)
- `SESSION_MAX_AGE_MS`: Session max age in milliseconds (default: 3600000 = 1 hour)

## Testing

```bash
# Start development server
npm run dev

# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'
```
