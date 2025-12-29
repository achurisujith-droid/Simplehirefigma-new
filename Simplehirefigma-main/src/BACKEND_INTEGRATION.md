# Simplehire Backend Integration Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [File Uploads](#file-uploads)
7. [Security](#security)
8. [Environment Setup](#environment-setup)
9. [Error Handling](#error-handling)
10. [WebSocket Integration](#websocket-integration)
11. [Testing](#testing)

---

## Overview

Simplehire is a comprehensive candidate verification platform that includes:
- **Skill Interview**: AI-powered voice interview, MCQ test, and coding challenges
- **ID + Visa Verification**: Document upload and identity verification
- **Reference Check**: Automated reference collection and verification

This document provides complete specifications for integrating the frontend application with your backend API.

---

## Architecture

### Frontend Stack
- React 18 with TypeScript
- Tailwind CSS v4
- Vite build tool
- Local state management with localStorage (to be replaced with backend)

### Recommended Backend Stack
- Node.js (Express/NestJS) or Python (FastAPI/Django)
- PostgreSQL for relational data
- Redis for session/cache management
- S3-compatible storage for file uploads
- Stripe for payment processing

### Communication
- RESTful API for primary operations
- WebSocket for real-time features (optional)
- JWT-based authentication

---

## Authentication

### Authentication Flow

#### 1. User Registration (Signup)
**Endpoint**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Account created successfully"
}
```

#### 2. User Login
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Google OAuth
**Endpoint**: `POST /api/auth/google`

**Request Body**:
```json
{
  "idToken": "google-id-token-from-client"
}
```

**Response**: Same as login

#### 4. Token Refresh
**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

#### 5. Get Current User
**Endpoint**: `GET /api/auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "usr_123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

#### 6. Logout
**Endpoint**: `POST /api/auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 7. Password Reset Request
**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### 8. Password Reset Confirm
**Endpoint**: `POST /api/auth/reset-password/confirm`

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## API Endpoints

### User Management

#### Get User Data
**Endpoint**: `GET /api/users/me/data`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "usr_123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "purchasedProducts": ["skill", "id-visa", "reference"],
    "interviewProgress": {
      "documentsUploaded": true,
      "voiceInterview": true,
      "mcqTest": true,
      "codingChallenge": false
    },
    "idVerificationStatus": "verified",
    "referenceCheckStatus": "in-progress",
    "references": [],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-20T15:45:00Z"
  }
}
```

#### Update User Profile
**Endpoint**: `PATCH /api/users/me`

**Request Body**:
```json
{
  "name": "John Updated Doe"
}
```

#### Get Purchased Products
**Endpoint**: `GET /api/users/me/products`

**Response**:
```json
{
  "success": true,
  "data": ["skill", "id-visa", "reference"]
}
```

#### Update Interview Progress
**Endpoint**: `PATCH /api/users/me/interview-progress`

**Request Body**:
```json
{
  "voiceInterview": true
}
```

---

### Skill Interview API

#### 1. Upload Documents
**Endpoint**: `POST /api/interviews/documents`

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body** (FormData):
- `resume`: File (PDF, max 10MB)
- `coverLetter`: File (optional, PDF, max 10MB)

**Response**:
```json
{
  "success": true,
  "data": {
    "resumeUrl": "https://storage.simplehire.ai/resumes/usr_123_resume.pdf",
    "coverLetterUrl": "https://storage.simplehire.ai/covers/usr_123_cover.pdf"
  }
}
```

#### 2. Start Voice Interview
**Endpoint**: `POST /api/interviews/voice/start`

**Request Body**:
```json
{
  "role": "React Developer"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123def456",
    "questions": [
      {
        "id": "q1",
        "question": "Can you explain the concept of React hooks?",
        "category": "technical"
      }
    ]
  }
}
```

#### 3. Submit Voice Interview
**Endpoint**: `POST /api/interviews/voice/submit`

**Headers**: `Content-Type: multipart/form-data`

**Request Body** (FormData):
- `sessionId`: string
- `audio`: Blob/File (WebM format)

**Response**:
```json
{
  "success": true,
  "message": "Interview submitted for evaluation"
}
```

#### 4. Get MCQ Questions
**Endpoint**: `GET /api/interviews/mcq?role=React%20Developer`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "mcq_1",
      "question": "What is the Virtual DOM in React?",
      "options": [
        "A copy of the real DOM",
        "A JavaScript representation of the DOM",
        "A browser API",
        "None of the above"
      ],
      "category": "react",
      "difficulty": "medium"
    }
  ]
}
```

Note: `correctAnswer` should NOT be sent to frontend. Store it server-side for validation.

#### 5. Submit MCQ Test
**Endpoint**: `POST /api/interviews/mcq/submit`

**Request Body**:
```json
{
  "answers": {
    "mcq_1": 1,
    "mcq_2": 0,
    "mcq_3": 2
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 18,
    "totalQuestions": 20,
    "percentage": 90
  }
}
```

#### 6. Get Coding Challenge
**Endpoint**: `GET /api/interviews/coding?role=React%20Developer`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "coding_1",
    "title": "Implement a Todo List Component",
    "description": "Create a functional React component that manages a list of todos...",
    "difficulty": "medium",
    "starterCode": "import React, { useState } from 'react';\n\nfunction TodoList() {\n  // Your code here\n}\n\nexport default TodoList;",
    "testCases": [
      {
        "input": "Add todo 'Buy milk'",
        "expectedOutput": "Todo added successfully"
      }
    ]
  }
}
```

#### 7. Submit Coding Challenge
**Endpoint**: `POST /api/interviews/coding/submit`

**Request Body**:
```json
{
  "challengeId": "coding_1",
  "code": "import React, { useState } from 'react'...",
  "language": "javascript"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "passed": true,
    "testResults": [
      {
        "testCase": 1,
        "passed": true,
        "output": "Todo added successfully"
      }
    ]
  }
}
```

#### 8. Get Evaluation Results
**Endpoint**: `GET /api/interviews/evaluation`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "category": "React Fundamentals",
      "score": 92,
      "feedback": "Excellent understanding of core concepts"
    },
    {
      "category": "JavaScript",
      "score": 88,
      "feedback": "Strong JavaScript skills demonstrated"
    }
  ]
}
```

#### 9. Generate Certificate
**Endpoint**: `POST /api/interviews/certificate`

**Response**:
```json
{
  "success": true,
  "data": {
    "certificateId": "cert_abc123",
    "certificateUrl": "https://simplehire.ai/certificate/cert_abc123",
    "certificateNumber": "SH-2025-001234"
  }
}
```

---

### ID + Visa Verification API

#### 1. Upload ID Document
**Endpoint**: `POST /api/id-verification/id`

**Headers**: `Content-Type: multipart/form-data`

**Request Body** (FormData):
- `file`: File (JPEG/PNG, max 10MB)
- `documentType`: string ("passport" | "drivers-license" | "national-id")

**Response**:
```json
{
  "success": true,
  "data": {
    "documentUrl": "https://storage.simplehire.ai/id-docs/usr_123_id.jpg",
    "documentId": "doc_abc123"
  }
}
```

#### 2. Upload Visa/EAD Document
**Endpoint**: `POST /api/id-verification/visa`

**Request Body** (FormData):
- `file`: File (JPEG/PNG/PDF, max 10MB)
- `documentType`: string ("visa" | "ead" | "green-card")

**Response**:
```json
{
  "success": true,
  "data": {
    "documentUrl": "https://storage.simplehire.ai/visa-docs/usr_123_visa.jpg",
    "documentId": "doc_def456"
  }
}
```

#### 3. Upload Selfie
**Endpoint**: `POST /api/id-verification/selfie`

**Request Body** (FormData):
- `file`: File (JPEG/PNG, captured from camera)

**Response**:
```json
{
  "success": true,
  "data": {
    "selfieUrl": "https://storage.simplehire.ai/selfies/usr_123_selfie.jpg",
    "selfieId": "selfie_ghi789"
  }
}
```

#### 4. Submit Verification
**Endpoint**: `POST /api/id-verification/submit`

**Request Body**:
```json
{
  "idDocumentUrl": "https://storage.simplehire.ai/id-docs/usr_123_id.jpg",
  "visaDocumentUrl": "https://storage.simplehire.ai/visa-docs/usr_123_visa.jpg",
  "selfieUrl": "https://storage.simplehire.ai/selfies/usr_123_selfie.jpg"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "verificationId": "verify_123456",
    "status": "pending",
    "estimatedReviewTime": "24-48 hours"
  }
}
```

#### 5. Get Verification Status
**Endpoint**: `GET /api/id-verification/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_123456789",
    "status": "verified",
    "submittedAt": "2025-01-20T10:00:00Z",
    "reviewedAt": "2025-01-21T14:30:00Z",
    "notes": "All documents verified successfully"
  }
}
```

---

### Reference Check API

#### 1. Get All References
**Endpoint**: `GET /api/references`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "ref_123",
      "name": "Jane Smith",
      "email": "jane@company.com",
      "company": "Tech Corp",
      "position": "Engineering Manager",
      "relationship": "Direct Manager",
      "phone": "+1-555-0123",
      "status": "verified",
      "submittedAt": "2025-01-15T10:00:00Z",
      "responseReceivedAt": "2025-01-16T14:30:00Z",
      "verifiedAt": "2025-01-17T09:00:00Z"
    }
  ]
}
```

#### 2. Add Reference
**Endpoint**: `POST /api/references`

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "company": "Tech Corp",
  "position": "Engineering Manager",
  "relationship": "Direct Manager",
  "phone": "+1-555-0123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "ref_123",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "company": "Tech Corp",
    "position": "Engineering Manager",
    "relationship": "Direct Manager",
    "phone": "+1-555-0123",
    "status": "draft"
  }
}
```

#### 3. Update Reference
**Endpoint**: `PATCH /api/references/{referenceId}`

**Request Body**:
```json
{
  "phone": "+1-555-9999"
}
```

#### 4. Delete Reference
**Endpoint**: `DELETE /api/references/{referenceId}`

**Response**:
```json
{
  "success": true,
  "message": "Reference deleted successfully"
}
```

#### 5. Submit References (Send Emails)
**Endpoint**: `POST /api/references/submit`

**Request Body**:
```json
{
  "referenceIds": ["ref_123", "ref_456", "ref_789"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "emailsSent": 3,
    "failedEmails": []
  }
}
```

#### 6. Resend Reference Email
**Endpoint**: `POST /api/references/{referenceId}/resend`

**Response**:
```json
{
  "success": true,
  "message": "Email resent successfully"
}
```

#### 7. Get Reference Summary
**Endpoint**: `GET /api/references/summary`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalReferences": 5,
    "responsesReceived": 3,
    "verified": 2,
    "pending": 2
  }
}
```

---

### Payment API

#### 1. Get Products
**Endpoint**: `GET /api/products`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "skill",
      "name": "Skill verification",
      "description": "AI-powered interview validates your professional skills",
      "price": 49,
      "features": [
        "15-min AI interview",
        "MCQ test (20 questions)",
        "Coding challenge",
        "Instant certificate"
      ]
    },
    {
      "id": "id-visa",
      "name": "ID + Visa verification",
      "description": "Validate government ID and work authorization",
      "price": 15,
      "features": [
        "ID document verification",
        "Visa/EAD check",
        "Selfie verification",
        "24-48hr review"
      ]
    },
    {
      "id": "reference",
      "name": "Reference check",
      "description": "Professional references collection and verification",
      "price": 10,
      "features": [
        "Up to 5 references",
        "Automated email outreach",
        "Response tracking",
        "Verification summary"
      ]
    },
    {
      "id": "combo",
      "name": "Complete combo",
      "description": "All three verifications at a discounted price",
      "price": 60,
      "features": [
        "All skill verification features",
        "All ID verification features",
        "All reference check features",
        "Save $14"
      ]
    }
  ]
}
```

#### 2. Create Payment Intent (Stripe)
**Endpoint**: `POST /api/payments/create-intent`

**Request Body**:
```json
{
  "productId": "skill"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

#### 3. Confirm Payment
**Endpoint**: `POST /api/payments/confirm`

**Request Body**:
```json
{
  "paymentIntentId": "pi_xxx",
  "paymentMethodId": "pm_xxx"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "purchasedProduct": "skill",
    "invoice": {
      "id": "inv_123",
      "amount": 49,
      "currency": "usd",
      "date": "2025-01-20T10:00:00Z"
    }
  }
}
```

#### 4. Get Payment History
**Endpoint**: `GET /api/payments/history`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "pay_123",
      "productId": "skill",
      "productName": "Skill verification",
      "amount": 49,
      "currency": "usd",
      "status": "succeeded",
      "createdAt": "2025-01-20T10:00:00Z",
      "invoiceUrl": "https://invoice.stripe.com/xxx"
    }
  ]
}
```

#### 5. Apply Coupon
**Endpoint**: `POST /api/payments/apply-coupon`

**Request Body**:
```json
{
  "productId": "skill",
  "couponCode": "SAVE10"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "discountedPrice": 44.10,
    "discount": 4.90,
    "discountPercentage": 10
  }
}
```

---

### Certificate API

#### 1. Get All Certificates
**Endpoint**: `GET /api/certificates`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cert_abc123",
      "userId": "usr_123456789",
      "productId": "skill",
      "issueDate": "2025-01-20T15:00:00Z",
      "certificateNumber": "SH-2025-001234",
      "status": "active",
      "skills": [
        {
          "category": "React Fundamentals",
          "score": 92
        }
      ]
    }
  ]
}
```

#### 2. Get Certificate by ID
**Endpoint**: `GET /api/certificates/{certificateId}`

**Response**: Same as individual certificate object above

#### 3. Get Public Certificate
**Endpoint**: `GET /api/certificates/public/{certificateNumber}`

**Note**: This endpoint does NOT require authentication

**Response**:
```json
{
  "success": true,
  "data": {
    "certificateNumber": "SH-2025-001234",
    "candidateName": "John Doe",
    "productName": "React Developer Verification",
    "issueDate": "2025-01-20",
    "status": "active",
    "skills": [
      {
        "category": "React Fundamentals",
        "score": 92
      }
    ]
  }
}
```

#### 4. Download Certificate PDF
**Endpoint**: `GET /api/certificates/{certificateId}/download`

**Response**: Binary PDF file

#### 5. Verify Certificate
**Endpoint**: `GET /api/certificates/verify/{certificateNumber}`

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificate": {
      "certificateNumber": "SH-2025-001234",
      "candidateName": "John Doe",
      "issueDate": "2025-01-20",
      "status": "active"
    }
  }
}
```

#### 6. Generate Shareable Link
**Endpoint**: `POST /api/certificates/{certificateId}/share`

**Response**:
```json
{
  "success": true,
  "data": {
    "shareableUrl": "https://simplehire.ai/certificate/SH-2025-001234"
  }
}
```

---

## Data Models

### User Model
```typescript
{
  id: string;                    // Primary key (e.g., "usr_123456789")
  email: string;                 // Unique, indexed
  password: string;              // Hashed (bcrypt)
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### User Data Model
```typescript
{
  userId: string;                // Foreign key to User
  purchasedProducts: string[];   // ["skill", "id-visa", "reference"]
  interviewProgress: {
    documentsUploaded: boolean;
    voiceInterview: boolean;
    mcqTest: boolean;
    codingChallenge: boolean;
  };
  idVerificationStatus: "not-started" | "in-progress" | "pending" | "verified";
  referenceCheckStatus: "not-started" | "in-progress" | "pending" | "verified";
}
```

### Reference Model
```typescript
{
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  name: string;
  email: string;
  company: string;
  position: string;
  relationship: string;
  phone?: string;
  status: "draft" | "pending" | "email-sent" | "response-received" | "verified";
  submittedAt?: Date;
  responseReceivedAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Certificate Model
```typescript
{
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  productId: string;             // "skill", "id-visa", "reference"
  issueDate: Date;
  certificateNumber: string;     // Unique (e.g., "SH-2025-001234")
  status: "active" | "revoked";
  skills?: Array<{
    category: string;
    score: number;
    feedback?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment Model
```typescript
{
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  productId: string;
  amount: number;                // In cents (e.g., 4900 for $49)
  currency: string;              // "usd"
  status: "pending" | "succeeded" | "failed" | "refunded";
  paymentIntentId: string;       // Stripe payment intent ID
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## File Uploads

### Storage Requirements
- Use S3-compatible storage (AWS S3, DigitalOcean Spaces, MinIO)
- Organize files by user ID and document type
- Set appropriate CORS headers for client uploads (if using presigned URLs)

### File Structure
```
/storage/
  /resumes/
    usr_123456789_resume_20250120.pdf
  /cover-letters/
    usr_123456789_cover_20250120.pdf
  /id-documents/
    usr_123456789_id_20250120.jpg
  /visa-documents/
    usr_123456789_visa_20250120.jpg
  /selfies/
    usr_123456789_selfie_20250120.jpg
  /certificates/
    cert_abc123.pdf
```

### File Upload Flow

#### Option 1: Direct Upload to Backend
1. Client selects file
2. Client sends file via FormData to backend endpoint
3. Backend validates file (type, size, virus scan)
4. Backend uploads to S3
5. Backend returns file URL

#### Option 2: Presigned URL Upload (Recommended for large files)
1. Client requests presigned URL from backend
2. Backend generates presigned URL from S3
3. Client uploads directly to S3 using presigned URL
4. Client notifies backend of successful upload
5. Backend validates and processes file

### File Validation
```javascript
// Server-side validation
const FILE_SIZE_LIMITS = {
  resume: 10 * 1024 * 1024,      // 10MB
  image: 10 * 1024 * 1024,       // 10MB
  audio: 50 * 1024 * 1024,       // 50MB
};

const ALLOWED_MIME_TYPES = {
  resume: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  audio: ['audio/webm', 'audio/wav', 'audio/mp3'],
};
```

---

## Security

### Authentication
- Use JWT with short expiration (15 minutes for access token)
- Implement refresh tokens (7 days expiration)
- Store tokens securely (httpOnly cookies or secure localStorage)
- Implement CSRF protection

### Authorization
- Verify user owns resources before allowing access
- Implement role-based access control (RBAC) if needed
- Use middleware to check permissions on protected routes

### Data Protection
- Hash passwords with bcrypt (cost factor: 12)
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement rate limiting to prevent abuse
- Sanitize all user inputs

### API Security
```javascript
// Rate limiting example (Express.js)
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, loginController);
```

### File Upload Security
- Validate file types (check magic bytes, not just extension)
- Scan files for viruses
- Limit file sizes
- Generate random filenames to prevent overwriting
- Set appropriate S3 bucket permissions

---

## Environment Setup

### Environment Variables

Create a `.env` file in your backend:

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/simplehire

# Redis (for sessions/cache)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS S3 (or compatible)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=simplehire-storage

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid/Mailgun/SES)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@simplehire.ai

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services (for interview evaluation)
OPENAI_API_KEY=your-openai-key
# or
ANTHROPIC_API_KEY=your-anthropic-key
```

### Frontend Environment Variables

Create `.env` file in frontend:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENVIRONMENT=development

# Google OAuth (if client-side)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Stripe (if client-side)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message for display",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email is already registered"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_EMAIL` | 409 | Email already exists |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `UNSUPPORTED_FILE_TYPE` | 415 | Invalid file format |
| `PAYMENT_FAILED` | 402 | Payment processing error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Frontend Error Handling

```typescript
// Example error handling in frontend
try {
  const response = await authService.login(email, password);
  
  if (!response.success) {
    // Handle specific errors
    if (response.error.includes('credentials')) {
      toast.error('Invalid email or password');
    } else {
      toast.error(response.error || 'Login failed');
    }
  }
} catch (error) {
  // Network or unexpected errors
  toast.error('Unable to connect to server');
  console.error(error);
}
```

---

## WebSocket Integration (Optional)

For real-time features like live interview status, notification updates, etc.

### WebSocket Events

#### Client → Server
```javascript
// Connect with authentication
socket.emit('authenticate', { token: 'jwt-token' });

// Subscribe to updates
socket.emit('subscribe', { channel: 'verification-updates' });
```

#### Server → Client
```javascript
// Verification status update
socket.on('verification-status-update', (data) => {
  // data: { type: 'id-verification', status: 'verified' }
});

// Reference response received
socket.on('reference-response', (data) => {
  // data: { referenceId: 'ref_123', status: 'response-received' }
});

// Payment confirmation
socket.on('payment-confirmed', (data) => {
  // data: { productId: 'skill', status: 'succeeded' }
});
```

---

## Testing

### API Testing Checklist

#### Authentication Endpoints
- [ ] Signup with valid data
- [ ] Signup with duplicate email
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token refresh
- [ ] Logout
- [ ] Password reset flow

#### Protected Endpoints
- [ ] Access with valid token
- [ ] Access with expired token
- [ ] Access without token
- [ ] Access with invalid token

#### File Uploads
- [ ] Upload valid file
- [ ] Upload oversized file
- [ ] Upload invalid file type
- [ ] Upload with malicious content

#### Payment Flow
- [ ] Create payment intent
- [ ] Successful payment
- [ ] Failed payment
- [ ] Webhook handling

### Example Test Cases

```javascript
// Example using Jest + Supertest
describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  it('should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

---

## Additional Recommendations

### 1. Database Indexing
```sql
-- Essential indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_references_user_id ON references(user_id);
CREATE INDEX idx_references_status ON references(status);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_payments_user_id ON payments(user_id);
```

### 2. Caching Strategy
- Cache user data in Redis for 15 minutes
- Cache product list for 1 hour
- Cache certificate public data for 24 hours

### 3. Monitoring & Logging
- Implement structured logging (Winston, Pino)
- Set up error tracking (Sentry, Rollbar)
- Monitor API performance (New Relic, DataDog)
- Set up uptime monitoring (Pingdom, UptimeRobot)

### 4. Backup Strategy
- Daily database backups
- Retain backups for 30 days
- Store backups in separate region
- Test restore procedures monthly

### 5. Scalability Considerations
- Use connection pooling for database
- Implement job queues for long-running tasks (Bull, BullMQ)
- Consider microservices for AI processing
- Use CDN for static assets

---

## Support & Contact

For questions or issues with integration:
- Documentation: https://docs.simplehire.ai
- API Status: https://status.simplehire.ai
- Email: dev@simplehire.ai
- Slack: #simplehire-dev

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Simplehire Engineering Team
