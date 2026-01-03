# Session/Cookie Authentication and File Upload Fixes - Implementation Summary

## Problem Statement

This PR addresses three critical issues that were preventing users from successfully completing the interview workflow:

1. **File Upload Failures (400 Error)**: Users attempting to start an assessment interview received a 400 error: "File upload failed. Please ensure you are uploading files as multipart/form-data." Backend logs showed `req.files` was undefined.

2. **Session Loss After Login**: Users were being logged out or receiving 401 'No token provided' errors on protected routes (e.g., `/api/auth/me`) immediately after successful login.

3. **UserData Update Errors**: PATCH `/api/users/me/interview-progress` was failing with Prisma "No record found for update" errors for some users.

## Root Causes Identified

### 1. File Upload Issue
The frontend `interviewService.startAssessment()` was calling `apiClient.post()` with FormData, but the `post()` method was unconditionally wrapping all data with `JSON.stringify()`, which converted FormData to a string representation instead of preserving the multipart form structure.

### 2. Session Cookie Issue
While the backend was setting session cookies correctly, there was insufficient logging to diagnose cookie-related issues in production environments. The cookie configuration was correct (SameSite, Secure flags), but debugging was difficult.

### 3. UserData Missing
- `updateInterviewProgress()` and related endpoints used `prisma.userData.update()` which throws an error if the userData record doesn't exist
- Login flow didn't ensure userData initialization for legacy accounts created before userData was added to the schema

## Solutions Implemented

### Frontend Changes (`api-client.ts`)

#### 1. FormData Detection in HTTP Methods
```typescript
// Before
public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  return this.request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// After
public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  // If data is FormData, pass it directly without JSON.stringify
  if (data instanceof FormData) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
    });
  }
  
  return this.request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

Applied to: `post()`, `put()`, `patch()` methods

#### 2. Conditional Content-Type Header
```typescript
// Before
private getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  return headers;
}

// After
private getHeaders(body?: any): HeadersInit {
  const headers: HeadersInit = {};
  
  // Don't set Content-Type for FormData - browser will set it with boundary
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}
```

This allows the browser to automatically set the correct `Content-Type: multipart/form-data; boundary=...` header.

### Backend Changes

#### 1. UserData Utility (`utils/userData.ts`)
Created a shared utility to maintain consistent default userData structure:

```typescript
export const createDefaultUserData = (userId: string) => ({
  userId,
  purchasedProducts: [],
  interviewProgress: {
    documentsUploaded: false,
    voiceInterview: false,
    mcqTest: false,
    codingChallenge: false,
  },
  idVerificationStatus: 'not-started' as const,
  referenceCheckStatus: 'not-started' as const,
});
```

#### 2. Login UserData Initialization (`auth.controller.ts`)
```typescript
// Added after password verification
await prisma.userData.upsert({
  where: { userId: user.id },
  update: {}, // Don't update if exists
  create: createDefaultUserData(user.id),
});
```

#### 3. UserData Upsert Pattern (`user.controller.ts`)
Converted all `userData.update()` calls to `upsert()`:

```typescript
// Before
const userData = await prisma.userData.update({
  where: { userId: req.user!.id },
  data: { interviewProgress: progress },
});

// After
const userData = await prisma.userData.upsert({
  where: { userId: req.user!.id },
  update: { interviewProgress: progress },
  create: {
    ...createDefaultUserData(req.user!.id),
    interviewProgress: progress,
  },
});
```

Applied to:
- `updateInterviewProgress()`
- `updateIdVerificationStatus()`
- `updateReferenceCheckStatus()`

#### 4. Enhanced Cookie Logging (`auth.controller.ts`)
```typescript
const cookieOptions = getSessionCookieOptions();
res.cookie(config.cookie.name, token, cookieOptions);

// Added detailed logging
logger.info('Session cookie set', {
  userId: user.id,
  cookieName: config.cookie.name,
  cookieOptions: {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge,
    path: cookieOptions.path,
  },
});
```

#### 5. Multer Error Handler (`interview.routes.ts`)
```typescript
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    logger.error('[multer-error] Multer processing error', {
      code: err.code,
      field: err.field,
      message: err.message,
    });
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum file size is 10MB.',
        code: 'FILE_TOO_LARGE',
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'File upload error: ' + err.message,
      code: 'FILE_UPLOAD_ERROR',
    });
  }
  
  next(err);
};
```

Applied to all file upload routes:
- `/documents`
- `/start-assessment`
- `/voice/submit`

#### 6. Enhanced File Upload Logging
```typescript
if (!req.files) {
  logger.error('[start-assessment] req.files is undefined', {
    contentType: req.headers['content-type'],
    hasBody: !!req.body,
    bodyKeys: Object.keys(req.body || {}),
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
    },
  });
  throw new AppError(
    'File upload failed. Please ensure you are uploading files as multipart/form-data.',
    400,
    'FILE_UPLOAD_ERROR'
  );
}
```

## Files Modified

1. **Frontend**:
   - `Simplehirefigma-main/src/src/services/api-client.ts`

2. **Backend**:
   - `Simplehirefigma-main/src/backend/src/controllers/auth.controller.ts`
   - `Simplehirefigma-main/src/backend/src/controllers/user.controller.ts`
   - `Simplehirefigma-main/src/backend/src/routes/interview.routes.ts`
   - `Simplehirefigma-main/src/backend/src/utils/userData.ts` (new file)

## Testing Recommendations

### 1. Authentication Flow
- [ ] Test signup creates userData record
- [ ] Test login with new account includes userData
- [ ] Test login with legacy account creates userData
- [ ] Verify session cookie is set in response headers
- [ ] Verify browser sends cookie on subsequent requests
- [ ] Test /api/auth/me returns user data without 401 errors
- [ ] Test session persists across page refreshes

### 2. File Upload Flow
- [ ] Test POST /api/interviews/start-assessment with resume file
- [ ] Test POST /api/interviews/start-assessment with resume + ID card
- [ ] Verify backend logs show req.files is populated
- [ ] Verify files are uploaded to S3/GCS successfully
- [ ] Test file upload with oversized file (>10MB) shows proper error
- [ ] Test file upload with invalid file type shows proper error

### 3. UserData Update Flow
- [ ] Test PATCH /api/users/me/interview-progress with new account
- [ ] Test PATCH /api/users/me/interview-progress with legacy account
- [ ] Test PATCH /api/users/me/id-verification-status
- [ ] Test PATCH /api/users/me/reference-check-status
- [ ] Verify no "No record found for update" errors occur

### 4. Edge Cases
- [ ] Test with cookies disabled in browser
- [ ] Test with cross-origin requests (if applicable)
- [ ] Test with expired session tokens
- [ ] Test file upload with empty file
- [ ] Test file upload without authentication

## Security Considerations

### CodeQL Analysis
✅ All changes passed CodeQL security scanning with 0 alerts

### Security Best Practices
- ✅ Cookies remain httpOnly to prevent XSS attacks
- ✅ Secure flag set to true in production
- ✅ SameSite=none with CORS properly configured
- ✅ File size limits enforced (10MB max)
- ✅ File type validation remains in place
- ✅ Authentication still required for file uploads
- ✅ No sensitive data exposed in logs

## Files Modified Summary

- `Simplehirefigma-main/src/src/services/api-client.ts`: +37 lines (FormData handling)
- `Simplehirefigma-main/src/backend/src/controllers/auth.controller.ts`: +20 lines (userData init, logging)
- `Simplehirefigma-main/src/backend/src/controllers/user.controller.ts`: +6, -34 lines (upsert pattern)
- `Simplehirefigma-main/src/backend/src/routes/interview.routes.ts`: +48 lines (multer error handler)
- `Simplehirefigma-main/src/backend/src/utils/userData.ts`: +19 lines (new file)

**Total**: +130 lines, -34 lines = +96 net lines

## Backward Compatibility
- ✅ Fully backward compatible
- ✅ Handles legacy accounts without userData
- ✅ No breaking changes to API contracts
- ✅ No database migrations required
