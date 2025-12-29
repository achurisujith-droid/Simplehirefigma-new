# Migration Guide: localStorage → Backend API

## Overview

Your current App.tsx uses localStorage for all data persistence. This guide shows how to migrate to the backend API that's now built and ready.

---

## Current State

### What App.tsx Does Now

```typescript
// ❌ Current: Uses localStorage
useEffect(() => {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    setCurrentUser(JSON.parse(storedUser));
    setPurchasedProducts(userData.purchasedProducts);
    // ... all from localStorage
  }
}, []);

// ❌ Saves to localStorage
useEffect(() => {
  localStorage.setItem('currentUser', JSON.stringify(userData));
}, [purchasedProducts, interviewProgress, ...]);
```

### Issues

1. **No persistence across devices** - User logs in on laptop, data not available on phone
2. **No real authentication** - Anyone can edit localStorage
3. **No payment verification** - Can fake purchases in localStorage
4. **No backend integration** - Frontend services exist but aren't called
5. **Security risk** - Sensitive data in browser storage

---

## Migration Options

### Option 1: Drop-in Replacement (Recommended)

Replace current `App.tsx` with `App-NEW.tsx` I just created.

**Steps**:

```bash
# Backup current App.tsx
mv App.tsx App-OLD.tsx

# Use new App.tsx
mv App-NEW.tsx App.tsx

# Update environment
# Make sure .env.local has:
VITE_API_BASE_URL=http://localhost:3000/api

# Restart frontend
npm run dev
```

**What Changes**:
- ✅ Uses `useAuth()` hook instead of local state
- ✅ Calls backend API for all operations
- ✅ Real authentication with JWT
- ✅ Data persists in PostgreSQL
- ✅ Payments verified by Stripe
- ✅ File uploads go to S3

**Testing**:
```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (new terminal)
cd .. && npm run dev

# 3. Open http://localhost:5173
# 4. Sign up with email
# 5. Check backend logs - you'll see API calls
# 6. Check database: cd backend && npm run prisma:studio
```

---

### Option 2: Gradual Migration

Migrate feature by feature while keeping app running.

#### Step 1: Add Backend Authentication

```typescript
// Install new hooks
import { useAuth } from './hooks/useAuth';

function App() {
  // Replace local auth with backend
  const { isAuthenticated, user, login, signup, logout } = useAuth();
  
  // Keep other localStorage features temporarily
  const [purchasedProducts, setPurchasedProducts] = useState(() => {
    const stored = localStorage.getItem('purchasedProducts');
    return stored ? JSON.parse(stored) : [];
  });
  
  // ... rest stays same for now
}
```

#### Step 2: Migrate Payments

```typescript
import { paymentService } from './services/payment.service';

const handlePaymentSuccess = async (productId: string) => {
  // ❌ Old way:
  // setPurchasedProducts([...purchasedProducts, productId]);
  // localStorage.setItem('purchasedProducts', JSON.stringify([...]));
  
  // ✅ New way:
  // Payment already confirmed by PaymentPage component
  // Just refresh user data from backend
  const response = await userService.getUserData();
  if (response.success && response.data) {
    setPurchasedProducts(response.data.purchasedProducts);
  }
};
```

#### Step 3: Migrate Interview Progress

```typescript
import { userService } from './services/user.service';

const handleVoiceInterviewComplete = async () => {
  const newProgress = { ...interviewProgress, voiceInterview: true };
  
  // ❌ Old way:
  // setInterviewProgress(newProgress);
  // localStorage.setItem('interviewProgress', JSON.stringify(newProgress));
  
  // ✅ New way:
  setInterviewProgress(newProgress);
  await userService.updateInterviewProgress(newProgress);
};
```

#### Step 4: Migrate ID Verification

```typescript
import { idVerificationService } from './services/id-verification.service';

const handleIdVerificationSubmit = async () => {
  // ❌ Old way:
  // setIdVerificationStatus('pending');
  // localStorage.setItem('idVerificationStatus', 'pending');
  
  // ✅ New way:
  const response = await idVerificationService.submitVerification({
    idDocumentUrl: '...',
    visaDocumentUrl: '...',
    selfieUrl: '...',
  });
  
  if (response.success) {
    setIdVerificationStatus('pending');
  }
};
```

#### Step 5: Migrate References

```typescript
import { referenceService } from './services/reference.service';

const handleReferenceSubmit = async (references: ReferenceItem[]) => {
  // ❌ Old way:
  // setReferences(references);
  // localStorage.setItem('references', JSON.stringify(references));
  
  // ✅ New way:
  const referenceIds = references.map(r => r.id);
  const response = await referenceService.submitReferences(referenceIds);
  
  if (response.success) {
    setReferences(references);
    setReferenceCheckStatus('in-progress');
  }
};
```

---

## Testing Migration

### Test Checklist

#### Authentication
- [ ] Can sign up with email/password
- [ ] Can login with existing account
- [ ] Token stored in localStorage (check DevTools → Application → Local Storage)
- [ ] Can refresh page and stay logged in
- [ ] Can logout (token cleared)
- [ ] Cannot access API without token (test in Network tab)

#### User Data
- [ ] User profile shows correct name/email
- [ ] Purchased products load from backend
- [ ] Interview progress persists
- [ ] ID verification status correct
- [ ] References display correctly

#### Payments
- [ ] Can purchase product with Stripe test card
- [ ] Product appears in "My Products" immediately
- [ ] Payment recorded in backend (check Prisma Studio)
- [ ] Cannot purchase same product twice
- [ ] Combo purchase adds all 3 products

#### File Uploads
- [ ] Resume upload works
- [ ] ID document upload works
- [ ] Visa document upload works
- [ ] Selfie upload/capture works
- [ ] Files appear in S3 bucket
- [ ] File URLs work (can view uploaded files)

#### References
- [ ] Can add references
- [ ] Can edit references
- [ ] Can delete references
- [ ] Can submit references (sends to backend)
- [ ] Status updates correctly

---

## Debugging

### Common Issues

#### 1. "Network Error" or "Failed to fetch"

**Check**:
```typescript
// In .env.local
VITE_API_BASE_URL=http://localhost:3000/api  // No trailing slash!
```

**Verify**:
```bash
# Backend is running
curl http://localhost:3000/health
# Should return: {"success":true,"message":"Simplehire API is running"}
```

#### 2. "401 Unauthorized"

**Cause**: Token expired or invalid

**Fix**:
```typescript
// Logout and login again
// Or check token in localStorage:
localStorage.getItem('authToken');
// Should be a JWT string like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. "CORS Error"

**Check backend config**:
```typescript
// backend/src/server.ts
app.use(cors({
  origin: 'http://localhost:5173',  // Must match frontend URL
  credentials: true,
}));
```

#### 4. Data Not Persisting

**Check**:
```bash
# Is backend saving to database?
cd backend
npm run prisma:studio
# Open http://localhost:5555
# Check users table, user_data table, etc.
```

#### 5. File Upload Fails

**Check AWS config**:
```bash
# In backend/.env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket-name

# Test S3 access:
aws s3 ls s3://your-bucket-name
```

**For local dev**, use MinIO:
```bash
brew install minio
minio server ~/minio-data

# In backend/.env
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

---

## Rollback Plan

If something breaks:

```bash
# Restore old App.tsx
mv App.tsx App-NEW.tsx
mv App-OLD.tsx App.tsx

# Restart frontend
npm run dev

# Everything back to localStorage
```

---

## Data Migration

### Moving Existing localStorage Data to Backend

If you have test users with localStorage data:

```typescript
// Run this once in browser console after logging in:
const oldData = JSON.parse(localStorage.getItem('currentUser') || '{}');

// Upload to backend
await fetch('http://localhost:3000/api/users/me/data', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    purchasedProducts: oldData.purchasedProducts,
    interviewProgress: oldData.interviewProgress,
    idVerificationStatus: oldData.idVerificationStatus,
    referenceCheckStatus: oldData.referenceCheckStatus,
  })
});

// Clean up old localStorage
localStorage.removeItem('currentUser');
```

---

## Performance Comparison

### Before (localStorage)

```typescript
// Instant, but:
setUser(data);
localStorage.setItem('user', JSON.stringify(data));
// ❌ No validation
// ❌ No security
// ❌ No cross-device sync
```

### After (Backend API)

```typescript
// ~100-200ms, with:
const response = await userService.updateProfile(data);
// ✅ Validated by backend
// ✅ Secured with JWT
// ✅ Synced across devices
// ✅ Persisted in database
```

**Trade-off**: Slightly slower (~200ms) but infinitely more robust.

---

## Optimizations

### Add Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await apiCall();
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

### Add Optimistic Updates

```typescript
const handleLike = async (itemId: string) => {
  // Update UI immediately
  setLiked(true);
  
  // Update backend in background
  apiCall().catch(() => {
    // Revert if failed
    setLiked(false);
    alert('Failed to like');
  });
};
```

### Cache Data

```typescript
import { useState, useEffect } from 'react';

const useUserData = () => {
  const [data, setData] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  
  useEffect(() => {
    // Only fetch if stale (> 5 minutes)
    const now = Date.now();
    if (now - lastFetch > 5 * 60 * 1000) {
      fetchUserData().then(setData);
      setLastFetch(now);
    }
  }, []);
  
  return data;
};
```

---

## Next Steps

1. **Choose migration strategy** (Option 1 or 2)
2. **Test locally** with backend running
3. **Deploy backend** to Railway (see DEPLOYMENT_RAILWAY_GCP.md)
4. **Update frontend** .env with Railway URL
5. **Deploy frontend** to Vercel
6. **Test production** with real Stripe payments
7. **Monitor** logs and errors
8. **Iterate** based on user feedback

---

## Support

**Questions?**
- Check backend logs: `backend/logs/combined.log`
- Check Prisma Studio: `cd backend && npm run prisma:studio`
- Review API docs: `BACKEND_INTEGRATION.md`
- Test with curl: `API_INTEGRATION_EXAMPLES.md`

**Still stuck?**
- Review this guide again
- Check environment variables
- Verify backend is running
- Test API endpoints manually

---

**Ready to migrate! The backend is waiting for you. 🚀**
