# Production Integration - Implementation Guide

This document provides a complete guide for the changes made to make Simplehire production-ready.

## Overview

This PR implements critical production features across four priority levels:
- **Priority 0 (Critical):** Voice interview integration with ElevenLabs
- **Priority 1 (Important):** ID & Visa verification backend enhancements
- **Priority 2 (Recommended):** Interview UI wiring
- **Priority 3 (Required):** Security hardening
- **Priority 4 (Optional):** Nice-to-have features

## 🔴 Priority 0: Voice Interview Integration (COMPLETED)

### 1. Session Manager Service ✅

**File:** `Simplehirefigma-main/src/backend/src/services/session-manager.ts`

**Purpose:** Manages interview session state, questions, and answers for voice interviews.

**Key Features:**
- Creates and manages interview sessions
- Stores questions and user answers
- Supports both ElevenLabs and OpenAI providers
- Persists data to database on completion
- Session lifecycle management (active/completed/cancelled)

**Usage:**
```typescript
import { sessionManager } from '../services/session-manager';

// Create a session
const session = sessionManager.createSession({
  userId: 'user_123',
  assessmentPlanId: 'plan_456',
  provider: 'elevenlabs',
  questions: voiceQuestions,
  resumeContext: resumeText,
});

// Add answer
sessionManager.addAnswer(sessionId, {
  questionId: 'q1',
  question: 'Tell me about yourself',
  transcript: 'I am a software engineer...',
  timestamp: new Date(),
});

// Complete session (saves to database)
await sessionManager.completeSession(sessionId);
```

**Production Notes:**
- Currently uses in-memory storage (Map)
- For production, migrate to Redis for scalability
- Sessions are lost on server restart
- No automatic cleanup (needs cron job)

### 2. ElevenLabs Configuration ✅

**File:** `Simplehirefigma-main/src/backend/src/config/index.ts`

**Changes:**
```typescript
elevenlabs: {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  agentId: process.env.ELEVENLABS_AGENT_ID || '',
}
```

**Environment Variables:**
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

### 3. Voice Interview Endpoints ✅

**File:** `Simplehirefigma-main/src/backend/src/routes/interview.routes.ts`

#### POST /api/interviews/voice/start

**Before:** Returned dummy sessionId
**After:** 
- Creates real session in database
- Generates voice questions
- Gets ElevenLabs signed URL (with 10s timeout)
- Returns sessionId + signedUrl + questions

**Request:**
```json
{
  "role": "Software Engineer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-v4",
    "questions": [
      {
        "id": "voice_1",
        "question": "Tell me about your experience...",
        "category": "experience"
      }
    ],
    "signedUrl": "wss://elevenlabs.io/...",
    "agentConfig": {
      "agentId": "agent_123",
      "provider": "elevenlabs"
    }
  }
}
```

#### POST /api/interviews/voice/submit

**Before:** Just uploaded audio
**After:**
- Validates sessionId
- Uploads audio to S3
- Marks session as completed
- Persists answers to database

**Request:**
```typescript
FormData {
  sessionId: string,
  audio: File (optional),
  transcript: string (optional)
}
```

### 4. Webhook Endpoints ✅

**Note:** ⚠️ These endpoints need webhook signature verification before production use!

#### POST /api/interviews/notify-answer
Called by ElevenLabs when user answers a question.

**Request:**
```json
{
  "sessionId": "uuid",
  "questionId": "voice_1",
  "transcript": "User's answer text..."
}
```

#### POST /api/interviews/next-question
Called by ElevenLabs to get the next question.

**Request:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "completed": false,
  "data": {
    "questionId": "voice_2",
    "question": "What are your strengths?",
    "category": "technical"
  }
}
```

#### POST /api/interviews/stop-interview
Called to gracefully terminate the interview.

**Request:**
```json
{
  "sessionId": "uuid",
  "reason": "completed" | "cancelled"
}
```

### 5. MCQ Submit Endpoint ✅

**File:** `Simplehirefigma-main/src/backend/src/routes/interview.routes.ts`

#### POST /api/interviews/mcq/submit

**Before:** Returned hardcoded `{ score: 18, totalQuestions: 20 }`
**After:**
- Accepts answers array
- Compares with stored correctAnswerIndex
- Calculates real score
- Stores answers in interviewPlan

**Request:**
```json
{
  "answers": [
    {
      "questionId": "mcq_1",
      "selectedOptionIndex": 2
    },
    {
      "questionId": "mcq_2",
      "selectedOptionIndex": 0
    }
  ]
}
```

**Response:**
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

### 6. Coding Submit Endpoint ✅

**File:** `Simplehirefigma-main/src/backend/src/routes/interview.routes.ts`

#### POST /api/interviews/coding/submit

**Before:** Returned hardcoded `{ passed: true }`
**After:**
- Accepts code submission
- Uses LLM to evaluate code (componentEvaluatorService)
- Stores submission with evaluation
- Returns real evaluation results

**Request:**
```json
{
  "challengeId": "code_1",
  "code": "function fibonacci(n) { ... }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "passed": true,
    "score": 85,
    "dimensions": {
      "correctness": 90,
      "efficiency": 80,
      "codeQuality": 85,
      "edgeCases": 80
    },
    "feedback": "Well-structured solution...",
    "strengths": ["Good variable naming", "Efficient algorithm"],
    "improvements": ["Add edge case handling", "Consider memoization"]
  }
}
```

## 🟡 Priority 1: ID & Visa Verification (PARTIALLY COMPLETED)

### 1. Status Endpoint ✅

**File:** `Simplehirefigma-main/src/backend/src/routes/idVerification.routes.ts`

**Status:** Already existed, verified working

#### GET /api/id-verification/status

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "status": "pending" | "verified" | "rejected" | "not-started",
    "submittedAt": "2024-01-01T00:00:00Z",
    "reviewedAt": "2024-01-02T00:00:00Z",
    "notes": "Review notes..."
  }
}
```

### 2. Admin Approval Endpoint ✅

**File:** `Simplehirefigma-main/src/backend/src/routes/idVerification.routes.ts`

**⚠️ Security Warning:** This endpoint needs proper admin role middleware!

#### POST /api/id-verification/admin/approve/:verificationId

**Request:**
```json
{
  "approved": true,
  "notes": "Documents verified successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "verify_123",
    "status": "verified"
  }
}
```

### 3. AWS Integration ✅

**Status:** Already working in `document-verification.service.ts`

**Features:**
- AWS Textract for document text extraction
- AWS Rekognition for face matching
- Automatic verification if AI confidence is high
- Fallback to manual review if AI fails

### 4. Frontend Wiring ⏳ (TODO)

**Files to Update:**
- `src/components/id-verification-page.tsx`
- `src/components/upload-id-step.tsx`
- `src/components/upload-visa-step.tsx`
- `src/components/selfie-step.tsx`
- `src/components/review-submit-step.tsx`
- `src/App.tsx`

**Current State:** Uses sessionStorage for mock data
**Required:** Replace with real API calls using `idVerificationService`

## 🔵 Priority 3: Security Hardening (COMPLETED)

### 1. Audit Logging ✅

**File:** `Simplehirefigma-main/src/backend/src/middleware/audit-logger.ts`

**Features:**
- Logs all API requests with user info
- Tracks response time
- Records IP address and user agent
- Different log levels by status code

**Integrated in:** `src/backend/src/server.ts`

### 2. Password Change with Session Invalidation ✅

**Files:**
- `src/backend/src/controllers/user.controller.ts`
- `src/backend/src/routes/user.routes.ts`

#### POST /api/users/me/change-password

**Request:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Features:**
- Validates current password
- Enforces strong password policy
- Deletes all refresh tokens (forces re-login everywhere)

### 3. CORS Production Whitelist ✅

**File:** `src/backend/src/server.ts`

**Configuration:**
```typescript
const corsOptions = {
  origin:
    config.nodeEnv === 'production'
      ? [config.frontendUrl, /\.railway\.app$/]
      : config.frontendUrl,
  credentials: true,
};
```

### 4. PostgreSQL CI ✅

**File:** `.github/workflows/backend-ci.yml`

**Status:** Already uses correct `test` user, no changes needed

## 🟢 Priority 2: Interview UI Wiring (PARTIALLY COMPLETED)

### 1. Frontend Interview Service ✅

**File:** `Simplehirefigma-main/src/src/services/interview.service.ts`

**Added:**
```typescript
async startAssessment(
  resume: File,
  idCard?: File
): Promise<ApiResponse<{
  sessionId: string;
  plan: any;
  analysis: any;
  voiceQuestions: any[];
  resumeUrl: string;
  idCardUrl?: string;
}>>
```

### 2. Components to Wire ⏳ (TODO)

Still need to wire:
- `InterviewDocumentUploadPage` → call startAssessment
- `InterviewLivePage` → integrate ElevenLabs SDK
- `MCQTestPage` → fetch questions and submit answers
- `CodingChallengePage` → fetch challenges and submit code
- `InterviewResultsPage` → fetch evaluation results

## Environment Variables

Update your `.env` file:

```env
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id

# OpenAI (already exists)
OPENAI_API_KEY=sk-your-openai-api-key

# Session Configuration
SESSION_MAX_AGE_MS=3600000
```

## Testing the Implementation

### 1. Voice Interview Flow

```bash
# Start voice interview
curl -X POST http://localhost:8080/api/interviews/voice/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "Software Engineer"}'

# Response will include sessionId and signedUrl

# Submit voice interview
curl -X POST http://localhost:8080/api/interviews/voice/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "sessionId=SESSION_ID" \
  -F "audio=@interview.webm"
```

### 2. MCQ Test Flow

```bash
# Get MCQ questions
curl http://localhost:8080/api/interviews/mcq \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit answers
curl -X POST http://localhost:8080/api/interviews/mcq/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": "mcq_1", "selectedOptionIndex": 2},
      {"questionId": "mcq_2", "selectedOptionIndex": 0}
    ]
  }'
```

### 3. Coding Challenge Flow

```bash
# Get coding challenges
curl http://localhost:8080/api/interviews/coding \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit solution
curl -X POST http://localhost:8080/api/interviews/coding/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "code_1",
    "code": "function solution() { ... }",
    "language": "javascript"
  }'
```

## Known Limitations & Production TODOs

### Critical (Must Fix)
1. ⚠️ **Webhook authentication** - Add signature verification
2. ⚠️ **Admin authorization** - Add role-based access control
3. ⚠️ **Session store** - Migrate from in-memory to Redis

### Important
4. Session cleanup cron job
5. API versioning (/api/v1/)
6. Frontend component wiring

### Optional
7. Cookie-based authentication
8. Certificate PDF generation
9. Email service integration

## Deployment Checklist

- [ ] Set ElevenLabs credentials in production
- [ ] Configure Redis for session storage
- [ ] Set up webhook signature verification
- [ ] Implement admin role system
- [ ] Configure CORS whitelist for production domain
- [ ] Set up log aggregation
- [ ] Enable HTTPS
- [ ] Run security audit
- [ ] Load test interview endpoints
- [ ] Monitor session cleanup

## Support

For questions or issues:
- Backend: Check `src/backend/src/routes/interview.routes.ts`
- Sessions: Check `src/backend/src/services/session-manager.ts`
- Security: See `SECURITY_IMPLEMENTATION.md`
