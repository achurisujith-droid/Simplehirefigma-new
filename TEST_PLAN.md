# Test Plan: Backend-Driven Authentication & Session Management

## Overview
This test plan covers the removal of localStorage-based authentication and implementation of backend session management via cookies and `/api/auth/me`.

## Prerequisites

### Backend Setup
1. Navigate to backend directory: `cd Simplehirefigma-main/src/backend`
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` (copy from `.env.example`)
4. Generate Prisma client: `npm run prisma:generate`
5. Run database migrations: `npm run prisma:migrate`
6. **Seed demo users**: `npm run prisma:seed`
7. Start backend server: `npm run dev` (runs on port 3000)

### Frontend Setup
1. Navigate to frontend directory: `cd Simplehirefigma-main`
2. Install dependencies: `npm install`
3. Start frontend dev server: `npm run dev` (runs on port 5173)

## Test Scenarios

### 1. Authentication Flow

#### 1.1 Manual Login
- [ ] Navigate to login page
- [ ] Enter email: `demo@simplehire.ai`, password: `demo`
- [ ] Click "Sign in"
- [ ] **Expected**: User is logged in, redirected to dashboard/my products
- [ ] **Expected**: No `currentUser` data in localStorage (check DevTools > Application > Local Storage)
- [ ] **Expected**: HTTP-only cookie set (check DevTools > Application > Cookies)

#### 1.2 Quick Login with Demo Users
For each demo user, test the quick-login flow:

- [ ] Click on "Demo User" quick-login button
  - **Expected**: Form auto-fills with `demo@simplehire.ai` and `demo`
  - **Expected**: Login proceeds automatically
  - **Expected**: User is authenticated and redirected

- [ ] Click on "John Anderson" quick-login button
  - **Expected**: Form auto-fills with `john@example.com` and `password123`
  - **Expected**: Login proceeds automatically
  
- [ ] Click on "Sarah Mitchell" quick-login button
  - **Expected**: Form auto-fills with credentials
  - **Expected**: Login proceeds automatically

- [ ] Repeat for remaining demo users (Mike Chen, Emma Thompson, Alex Rodriguez)

#### 1.3 Invalid Credentials
- [ ] Enter invalid email/password
- [ ] Click "Sign in"
- [ ] **Expected**: Error toast displayed
- [ ] **Expected**: Demo accounts section becomes visible
- [ ] **Expected**: User remains on login page

#### 1.4 Session Persistence
- [ ] Log in with any demo user
- [ ] Refresh the page (F5)
- [ ] **Expected**: User remains logged in
- [ ] **Expected**: Same dashboard/products state restored from backend
- [ ] **Expected**: No localStorage check performed (verify in Network tab - should see `/api/auth/me` call)

#### 1.5 Logout
- [ ] Click logout from top bar
- [ ] **Expected**: User redirected to login page
- [ ] **Expected**: Session cookie cleared
- [ ] **Expected**: No localStorage data remains

### 2. Dashboard Data Loading

#### 2.1 User with No Products (john@example.com or alex@example.com)
- [ ] Log in as `john@example.com` / `password123`
- [ ] **Expected**: Dashboard shows "Welcome to Simplehire!" message
- [ ] **Expected**: Shows value proposition cards for all 3 products
- [ ] **Expected**: "Get Started" CTA to view pricing
- [ ] **Expected**: Loading state visible during data fetch
- [ ] **Expected**: No hardcoded product data

#### 2.2 User with Products (demo@simplehire.ai, sarah@example.com, mike@example.com)
- [ ] Log in as `sarah@example.com` / `password123`
- [ ] **Expected**: Redirected to "My Products" page
- [ ] **Expected**: Shows 2 purchased products (skill, id-visa)
- [ ] **Expected**: Shows interview progress (voice interview completed, MCQ pending)
- [ ] **Expected**: Progress data loaded from `/api/users/me/data`
- [ ] **Expected**: No localStorage data used

- [ ] Log in as `mike@example.com` / `password123`
- [ ] **Expected**: Shows all 3 products
- [ ] **Expected**: Shows advanced progress (voice + MCQ + coding partially complete)
- [ ] **Expected**: ID verification status shows "pending"
- [ ] **Expected**: Reference check status shows "in-progress"

- [ ] Log in as `emma@example.com` / `password123`
- [ ] **Expected**: Shows 1 product (skill)
- [ ] **Expected**: Shows completed interview (all steps done)
- [ ] **Expected**: Certificate ready to view

#### 2.3 Data Refresh
- [ ] Log in as any user with products
- [ ] Navigate to different pages (Dashboard → My Products → Certificates)
- [ ] **Expected**: No data loss when navigating
- [ ] **Expected**: Data persists across page changes
- [ ] Refresh browser (F5)
- [ ] **Expected**: Data reloads from backend via `/api/users/me/data`

### 3. Error Handling

#### 3.1 Backend Unavailable
- [ ] Stop backend server
- [ ] Try to log in
- [ ] **Expected**: Error toast with appropriate message
- [ ] **Expected**: User remains on login page

- [ ] Log in successfully, then stop backend
- [ ] Refresh page
- [ ] **Expected**: Error handling for failed session restore
- [ ] **Expected**: Redirect to login page (or error state)

#### 3.2 Invalid Session
- [ ] Log in successfully
- [ ] Clear session cookie manually (DevTools)
- [ ] Refresh page
- [ ] **Expected**: Redirected to login page
- [ ] **Expected**: No errors in console

#### 3.3 Network Errors
- [ ] Log in successfully
- [ ] Open DevTools > Network tab
- [ ] Throttle connection to "Slow 3G"
- [ ] Navigate between pages
- [ ] **Expected**: Loading states shown appropriately
- [ ] **Expected**: Graceful error handling if requests timeout

### 4. Interview Progress Flow

#### 4.1 Start Interview (john@example.com - no progress)
- [ ] Log in as `john@example.com`
- [ ] Purchase skill verification product (if needed)
- [ ] Click "Start verification" on skill product
- [ ] Complete document upload step
- [ ] **Expected**: Progress saved to backend via API
- [ ] Refresh page
- [ ] **Expected**: Progress restored (documents uploaded = true)
- [ ] **Expected**: Can continue from next step

#### 4.2 Resume Interview (sarah@example.com - partial progress)
- [ ] Log in as `sarah@example.com`
- [ ] Click "Continue" on skill verification
- [ ] **Expected**: Resumes at correct step (MCQ test)
- [ ] **Expected**: Shows voice interview as completed
- [ ] Complete MCQ test
- [ ] **Expected**: Progress saved to backend
- [ ] **Expected**: Can proceed to coding challenge

### 5. ID Verification Flow

#### 5.1 Start ID Verification
- [ ] Log in as user with id-visa product
- [ ] Navigate to ID verification
- [ ] Upload documents
- [ ] Submit for review
- [ ] **Expected**: Status updated to "pending" via backend API
- [ ] Refresh page
- [ ] **Expected**: Status still shows "pending" (loaded from backend)

### 6. Reference Check Flow

#### 6.1 Submit References
- [ ] Log in as user with reference product
- [ ] Navigate to reference check
- [ ] Add 2-3 references
- [ ] Submit references
- [ ] **Expected**: References saved to backend
- [ ] **Expected**: Status updated to "pending"
- [ ] Refresh page
- [ ] **Expected**: References list loaded from backend

### 7. Security Checks

#### 7.1 No localStorage Usage
- [ ] Open DevTools > Application > Local Storage
- [ ] Log in with any user
- [ ] **Expected**: No `currentUser` key
- [ ] **Expected**: No `authToken` key
- [ ] **Expected**: No authentication-related data in localStorage

#### 7.2 Cookie Security
- [ ] Log in successfully
- [ ] Open DevTools > Application > Cookies
- [ ] Check session cookie
- [ ] **Expected**: Cookie has `HttpOnly` flag (if implemented)
- [ ] **Expected**: Cookie has `Secure` flag in production
- [ ] **Expected**: Cookie has appropriate expiry

#### 7.3 Unauthorized Access
- [ ] Log out completely
- [ ] Try to access `/api/users/me/data` directly (use Postman or curl)
- [ ] **Expected**: 401 Unauthorized response
- [ ] Try to access dashboard route without logging in
- [ ] **Expected**: Redirected to login page

### 8. Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

For each browser, verify:
- [ ] Login works
- [ ] Session persists after refresh
- [ ] Quick-login works
- [ ] Dashboard data loads correctly
- [ ] Logout works

### 9. Edge Cases

#### 9.1 Concurrent Logins
- [ ] Log in with one user in Browser A
- [ ] Log in with different user in Browser B (same machine)
- [ ] **Expected**: Both sessions work independently
- [ ] Refresh both browsers
- [ ] **Expected**: Both users remain logged in to their respective accounts

#### 9.2 Expired Session
- [ ] Log in successfully
- [ ] Wait for session to expire (or manually expire the token)
- [ ] Try to navigate or perform an action
- [ ] **Expected**: Redirected to login page or appropriate error shown

#### 9.3 Simultaneous Tab Logout
- [ ] Log in successfully
- [ ] Open app in multiple tabs
- [ ] Log out from one tab
- [ ] Switch to other tab
- [ ] **Expected**: User is logged out in all tabs (or appropriate handling)

## Verification Checklist

After completing all tests:

- [ ] No localStorage is used for authentication or session management
- [ ] All authentication is handled via backend session/cookies
- [ ] `/api/auth/me` is called on app load to restore session
- [ ] Demo users can log in via quick-login buttons
- [ ] Dashboard data is fetched from `/api/users/me/data`
- [ ] Progress updates are saved to backend
- [ ] Session persists across page refreshes
- [ ] Logout clears session properly
- [ ] Error states are handled gracefully
- [ ] Loading states are shown appropriately
- [ ] No console errors during normal operation

## Reporting Issues

If any test fails, report with:
1. Test scenario number and name
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser and version
5. Screenshots/console errors if applicable
6. Network tab screenshots for API issues

## Sign-Off

After completing all tests, provide sign-off:

- Tester Name: _______________
- Date: _______________
- Overall Status: [ ] PASS [ ] FAIL
- Notes: _______________
