# 🔧 Backend Authentication Integration Guide

## Overview

The **frontend authentication is 100% complete and production-ready**. However, the backend currently has **placeholder/mock data** and needs real authentication logic implementation.

This document provides the exact specifications for the backend team to implement.

---

## 🎯 Current State

### ✅ Frontend (Complete)
- Cookie-based authentication
- Zustand state management
- Protected routes
- Session restoration
- Error handling
- Loading states
- Toast notifications

### ⚠️ Backend (Needs Implementation)
- Placeholder auth controllers
- Mock user data
- No real password hashing
- No real JWT generation
- No real database queries
- No cookie management

---

## 📋 Backend Implementation Checklist

### Required Implementations:

- [ ] **Real password hashing** (bcrypt/argon2)
- [ ] **JWT token generation** with proper secrets
- [ ] **HTTP-only cookie management**
- [ ] **Database user queries** (Prisma/TypeORM/raw SQL)
- [ ] **Session validation middleware**
- [ ] **CORS configuration** with credentials
- [ ] **Error handling** with proper status codes
- [ ] **Input validation** (email, password strength)
- [ ] **Rate limiting** (prevent brute force)
- [ ] **Email verification** (optional but recommended)

---

## 🔌 API Endpoints to Implement

### 1. POST /api/auth/signup

**Frontend Sends:**
```typescript
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Backend Must:**
1. Validate email format
2. Check password strength (min 8 chars, 1 uppercase, 1 number)
3. Check if email already exists in database
4. Hash password using bcrypt/argon2
5. Create user in database
6. Generate JWT access token
7. Set HTTP-only cookie
8. Return user object (without password)

**Backend Returns:**
```typescript
// Success (201)
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-or-id",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  },
  "message": "Account created successfully"
}

// Set-Cookie header:
Set-Cookie: session=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
```

**Backend Returns (Errors):**
```typescript
// Email already exists (409)
{
  "success": false,
  "message": "Email already registered",
  "code": "DUPLICATE_EMAIL"
}

// Weak password (400)
{
  "success": false,
  "message": "Password must be at least 8 characters with 1 uppercase and 1 number",
  "code": "WEAK_PASSWORD"
}

// Invalid email (400)
{
  "success": false,
  "message": "Invalid email format",
  "code": "INVALID_EMAIL"
}
```

---

### 2. POST /api/auth/login

**Frontend Sends:**
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Backend Must:**
1. Find user by email in database
2. Verify password hash matches
3. Generate JWT access token
4. Set HTTP-only cookie
5. Return user object

**Backend Returns:**
```typescript
// Success (200)
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-or-id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}

// Set-Cookie header:
Set-Cookie: session=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
```

**Backend Returns (Errors):**
```typescript
// Invalid credentials (401)
{
  "success": false,
  "message": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}

// Account locked (423)
{
  "success": false,
  "message": "Account locked due to multiple failed login attempts",
  "code": "ACCOUNT_LOCKED"
}
```

---

### 3. GET /api/auth/me

**Frontend Sends:**
```typescript
GET /api/auth/me
Cookie: session=<JWT_TOKEN>
```

**Backend Must:**
1. Read session cookie
2. Verify JWT token signature
3. Check token expiration
4. Find user by ID from token
5. Return user object

**Backend Returns:**
```typescript
// Success (200)
{
  "success": true,
  "data": {
    "id": "uuid-or-id",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}

// Unauthorized (401)
{
  "success": false,
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**Important:**
- This endpoint is called on every app load/refresh
- Must be fast (< 100ms)
- Must validate JWT and return user data
- Returns 401 if token invalid/expired

---

### 4. POST /api/auth/logout

**Frontend Sends:**
```typescript
POST /api/auth/logout
Cookie: session=<JWT_TOKEN>
```

**Backend Must:**
1. Read session cookie
2. Clear/invalidate session (optional: blacklist token)
3. Clear cookie by setting Max-Age=0
4. Return success

**Backend Returns:**
```typescript
// Success (200)
{
  "success": true,
  "message": "Logged out successfully"
}

// Clear cookie header:
Set-Cookie: session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/
```

---

### 5. POST /api/auth/reset-password (Optional)

**Frontend Sends:**
```typescript
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Backend Must:**
1. Find user by email
2. Generate password reset token
3. Store token with expiration (15-30 min)
4. Send email with reset link
5. Return success (don't reveal if email exists)

**Backend Returns:**
```typescript
// Always return success for security (200)
{
  "success": true,
  "message": "If an account exists, a password reset email has been sent"
}
```

---

### 6. POST /api/auth/reset-password/confirm (Optional)

**Frontend Sends:**
```typescript
POST /api/auth/reset-password/confirm
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Backend Must:**
1. Verify reset token is valid and not expired
2. Hash new password
3. Update user password in database
4. Invalidate reset token
5. Return success

**Backend Returns:**
```typescript
// Success (200)
{
  "success": true,
  "message": "Password updated successfully"
}

// Invalid/expired token (400)
{
  "success": false,
  "message": "Invalid or expired reset token",
  "code": "INVALID_TOKEN"
}
```

---

## 🔒 Backend Implementation Details

### 1. Password Hashing

**Use bcrypt or argon2:**

```typescript
// Using bcrypt
import bcrypt from 'bcrypt';

// Hash password
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Verify password
const isValid = await bcrypt.compare(password, passwordHash);
```

```typescript
// Using argon2 (more secure)
import argon2 from 'argon2';

// Hash password
const passwordHash = await argon2.hash(password);

// Verify password
const isValid = await argon2.verify(passwordHash, password);
```

---

### 2. JWT Token Generation

**Use jsonwebtoken:**

```typescript
import jwt from 'jsonwebtoken';

// Generate token
const generateToken = (userId: string, email: string) => {
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'access'
    },
    process.env.JWT_SECRET!, // MUST be in .env
    { 
      expiresIn: '7d',
      issuer: 'simplehire-api',
      audience: 'simplehire-app'
    }
  );
};

// Verify token
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      type: string;
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

**Environment Variables:**
```bash
# .env (backend)
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
```

---

### 3. HTTP-Only Cookie Management

**Express.js example:**

```typescript
import express from 'express';

const app = express();

// Signup/Login - Set cookie
res.cookie('session', token, {
  httpOnly: true,        // Cannot be accessed by JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',             // Available for all routes
  domain: process.env.COOKIE_DOMAIN || undefined, // For subdomains
});

// Logout - Clear cookie
res.cookie('session', '', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 0,
  path: '/',
});

// Read cookie in middleware
const token = req.cookies.session;
```

**Install cookie-parser:**
```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

```typescript
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

---

### 4. CORS Configuration

**CRITICAL: Must allow credentials**

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // MUST be true for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Environment Variables:**
```bash
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://simplehire.ai
```

**⚠️ Important:**
- Cannot use `origin: '*'` with `credentials: true`
- Must specify exact origin
- Frontend URL must match exactly (no trailing slash)

---

### 5. Authentication Middleware

**Protect routes that require authentication:**

```typescript
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }
};

// Usage
app.get('/api/auth/me', requireAuth, getCurrentUser);
app.post('/api/auth/logout', requireAuth, logout);
app.get('/api/user/data', requireAuth, getUserData);
```

---

### 6. Database Schema

**User table (Prisma example):**

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  userData      UserData?
  
  @@map("users")
}

model UserData {
  id                     String   @id @default(uuid())
  userId                 String   @unique
  purchasedProducts      String[] // Array of product IDs
  interviewProgress      Json     // Store as JSON
  idVerificationStatus   String   @default("not-started")
  referenceCheckStatus   String   @default("not-started")
  
  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_data")
}
```

**Queries:**

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create user
const user = await prisma.user.create({
  data: {
    email,
    passwordHash,
    name,
    userData: {
      create: {
        purchasedProducts: [],
        interviewProgress: {
          documentsUploaded: false,
          voiceInterview: false,
          mcqTest: false,
          codingChallenge: false,
        },
        idVerificationStatus: 'not-started',
        referenceCheckStatus: 'not-started',
      },
    },
  },
});

// Find user
const user = await prisma.user.findUnique({
  where: { email },
});

// Update user
await prisma.user.update({
  where: { id: userId },
  data: { emailVerified: true },
});
```

---

## 🧪 Testing the Integration

### 1. Test Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }' \
  -c cookies.txt -v
```

**Expected:**
- Status: 201
- Returns user object
- Sets `Set-Cookie` header

---

### 2. Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }' \
  -c cookies.txt -v
```

**Expected:**
- Status: 200
- Returns user object
- Sets `Set-Cookie` header

---

### 3. Test /auth/me (Session Restore)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt -v
```

**Expected:**
- Status: 200
- Returns user object
- Uses cookie from previous request

---

### 4. Test Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt -v
```

**Expected:**
- Status: 200
- Clears cookie (Max-Age=0)

---

### 5. Test 401 on Invalid Token

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: session=invalid-token" -v
```

**Expected:**
- Status: 401
- Returns error message

---

## 🚨 Common Backend Mistakes to Avoid

### ❌ Don't Do This:

1. **Returning tokens in response body**
   ```typescript
   // ❌ WRONG
   res.json({ 
     user, 
     token: 'jwt-token' // Never send token in body
   });
   ```

2. **Using `origin: '*'` with credentials**
   ```typescript
   // ❌ WRONG
   cors({ origin: '*', credentials: true });
   ```

3. **Not setting HttpOnly flag**
   ```typescript
   // ❌ WRONG
   res.cookie('session', token, { httpOnly: false });
   ```

4. **Storing plain text passwords**
   ```typescript
   // ❌ WRONG
   await prisma.user.create({ 
     data: { password: plainPassword } 
   });
   ```

5. **Not validating JWT expiration**
   ```typescript
   // ❌ WRONG
   const decoded = jwt.decode(token); // Doesn't verify!
   ```

### ✅ Do This:

1. **Only set HTTP-only cookies**
   ```typescript
   // ✅ CORRECT
   res.cookie('session', token, { 
     httpOnly: true, 
     secure: true 
   });
   res.json({ user }); // No token in body
   ```

2. **Specify exact origin**
   ```typescript
   // ✅ CORRECT
   cors({ 
     origin: 'http://localhost:5173', 
     credentials: true 
   });
   ```

3. **Always hash passwords**
   ```typescript
   // ✅ CORRECT
   const hash = await bcrypt.hash(password, 10);
   await prisma.user.create({ 
     data: { passwordHash: hash } 
   });
   ```

4. **Verify tokens properly**
   ```typescript
   // ✅ CORRECT
   const decoded = jwt.verify(token, secret);
   ```

---

## 📦 Required Backend Dependencies

```bash
# Core
npm install express
npm install cookie-parser
npm install cors
npm install dotenv

# Authentication
npm install bcrypt
npm install jsonwebtoken

# Database (choose one)
npm install @prisma/client    # For Prisma
npm install pg                # For PostgreSQL
npm install mysql2            # For MySQL

# Validation
npm install zod               # For request validation

# TypeScript (if using)
npm install --save-dev @types/express
npm install --save-dev @types/cookie-parser
npm install --save-dev @types/cors
npm install --save-dev @types/bcrypt
npm install --save-dev @types/jsonwebtoken
```

---

## 🔐 Environment Variables (Backend)

**Create `backend/.env`:**

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/simplehire"

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173

# Cookie
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false  # true in production

# Optional: Rate limiting
MAX_LOGIN_ATTEMPTS=5
LOGIN_TIMEOUT_MINUTES=15
```

---

## ✅ Backend Implementation Checklist

### Phase 1: Core Auth
- [ ] Install dependencies
- [ ] Set up environment variables
- [ ] Configure CORS with credentials
- [ ] Implement password hashing
- [ ] Implement JWT generation/verification
- [ ] Create auth middleware
- [ ] Set up cookie-parser

### Phase 2: Endpoints
- [ ] POST /api/auth/signup
- [ ] POST /api/auth/login
- [ ] GET /api/auth/me
- [ ] POST /api/auth/logout

### Phase 3: Security
- [ ] Input validation (email, password)
- [ ] Rate limiting (prevent brute force)
- [ ] CSRF protection (SameSite cookies)
- [ ] SQL injection prevention (use ORM)
- [ ] XSS prevention (sanitize inputs)

### Phase 4: Testing
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test session restoration
- [ ] Test logout flow
- [ ] Test 401 handling
- [ ] Test CORS with frontend

### Phase 5: Optional Features
- [ ] Email verification
- [ ] Password reset
- [ ] Remember me (longer sessions)
- [ ] OAuth (Google, GitHub)
- [ ] 2FA (Two-factor auth)

---

## 📞 Integration Support

### Questions to Ask Backend Team:

1. **Which database are you using?**
   - PostgreSQL, MySQL, MongoDB?
   - Prisma, TypeORM, Sequelize, or raw SQL?

2. **Do you have user table created?**
   - What fields exist?
   - Is there a UserData relation?

3. **Is JWT secret configured?**
   - Length (min 32 chars)?
   - Stored in .env?

4. **Is CORS configured correctly?**
   - Frontend URL whitelisted?
   - Credentials enabled?

5. **Is cookie-parser installed?**
   - Middleware configured?

### Need Help?

- Frontend is ready and waiting
- All cookie handling is automatic
- Just implement these 4 endpoints
- Follow the exact response format
- Test with curl first, then with frontend

---

## 🎯 Summary

### Frontend (Done ✅)
- Sends requests with `withCredentials: true`
- Receives and stores cookies automatically
- Handles 401 errors and redirects
- Shows loading states and errors
- Calls `/api/auth/me` on app load

### Backend (To Do ⚠️)
- Hash passwords with bcrypt
- Generate JWT tokens
- Set HTTP-only cookies
- Validate sessions
- Return proper user objects
- Handle errors with correct status codes

### Integration (Simple 🎉)
1. Implement 4 endpoints (signup, login, me, logout)
2. Set HTTP-only cookies
3. Configure CORS with credentials
4. Test with curl
5. Test with frontend
6. Done!

**Estimated Time: 2-4 hours for experienced backend developer**

---

## 📄 Reference Links

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Cookie-Parser](https://github.com/expressjs/cookie-parser)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Prisma Auth Guide](https://www.prisma.io/docs/guides/database/advanced-database-tasks/authentication)

---

**The frontend is production-ready. Once you implement these 4 endpoints with proper cookie management, authentication will work end-to-end!** 🚀
