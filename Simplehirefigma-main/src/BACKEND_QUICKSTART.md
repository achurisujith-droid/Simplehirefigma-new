# Backend Integration Quick Start Guide

**⏱️ Estimated Time: 30 minutes to understand, 5-7 days to implement**

---

## 📋 Overview

This guide helps backend developers quickly understand and integrate with the Simplehire frontend application.

---

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Run Frontend

```bash
git clone <repository-url>
cd simplehire-app
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 2. Review Key Files

**Read these in order** (30 min total):

1. `PRODUCTION_README.md` (5 min) - Project overview
2. `BACKEND_INTEGRATION.md` (20 min) - API specifications
3. `API_INTEGRATION_EXAMPLES.md` (5 min) - Code examples

---

## 🎯 What You Need to Build

### Backend Stack (Recommended)
- **Runtime**: Node.js 18+ or Python 3.9+
- **Framework**: Express/NestJS or FastAPI/Django
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: S3-compatible (AWS S3, MinIO, DigitalOcean Spaces)
- **Payments**: Stripe
- **Email**: SendGrid/Mailgun/AWS SES

### API Requirements

**Total Endpoints**: 55+

Quick breakdown:
- **Authentication** (8 endpoints): Login, signup, OAuth, tokens
- **User Management** (6 endpoints): Profile, products, progress
- **Skill Interview** (9 endpoints): Documents, interview, tests, certificate
- **ID Verification** (6 endpoints): Upload docs, submit, status
- **Reference Check** (8 endpoints): CRUD, submit, status
- **Payment** (7 endpoints): Products, Stripe integration
- **Certificate** (6 endpoints): Generate, view, verify
- **Public** (5 endpoints): Public certificates, health check

---

## 📝 Implementation Priority

### Phase 1: Core Authentication (Day 1-2)
**Priority**: ⭐⭐⭐⭐⭐

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

**Why first?** Everything else requires authentication.

**Test with frontend:**
```typescript
// Frontend code already written, just start your API
npm run dev  // Frontend on :5173
// Your API on :3000

// Frontend will automatically call:
// POST http://localhost:3000/api/auth/login
```

---

### Phase 2: User Data (Day 2)
**Priority**: ⭐⭐⭐⭐⭐

```
GET   /api/users/me/data
PATCH /api/users/me
GET   /api/users/me/products
```

**Purpose**: Load user's verification progress on dashboard.

---

### Phase 3: Products & Payments (Day 3)
**Priority**: ⭐⭐⭐⭐

```
GET  /api/products
POST /api/payments/create-intent
POST /api/payments/confirm
```

**Purpose**: Users can purchase verifications.

**Note**: Use Stripe test mode initially.

---

### Phase 4: Skill Interview (Day 4-5)
**Priority**: ⭐⭐⭐⭐

```
POST /api/interviews/documents          # Upload resume
POST /api/interviews/voice/start        # Start session
POST /api/interviews/voice/submit       # Submit recording
GET  /api/interviews/mcq                # Get questions
POST /api/interviews/mcq/submit         # Submit answers
GET  /api/interviews/coding             # Get challenge
POST /api/interviews/coding/submit      # Submit solution
GET  /api/interviews/evaluation         # Get results
POST /api/interviews/certificate        # Generate certificate
```

**Most complex feature**. Break into sub-phases:
- 4a: Document upload (1 day)
- 4b: Voice + MCQ + Coding (2 days)
- 4c: Evaluation + Certificate (1 day)

---

### Phase 5: ID Verification (Day 6)
**Priority**: ⭐⭐⭐

```
POST /api/id-verification/id            # Upload ID
POST /api/id-verification/visa          # Upload visa
POST /api/id-verification/selfie        # Upload selfie
POST /api/id-verification/submit        # Submit for review
GET  /api/id-verification/status        # Check status
```

**Simpler than interview**. Mostly file uploads + manual review workflow.

---

### Phase 6: Reference Check (Day 7)
**Priority**: ⭐⭐⭐

```
GET    /api/references                  # List all
POST   /api/references                  # Add one
PATCH  /api/references/:id              # Update
DELETE /api/references/:id              # Delete
POST   /api/references/submit           # Send emails
POST   /api/references/:id/resend       # Resend email
GET    /api/references/summary          # Get summary
```

**Key feature**: Email automation for reference requests.

---

### Phase 7: Certificates (Day 7)
**Priority**: ⭐⭐

```
GET /api/certificates                   # User's certificates
GET /api/certificates/:id               # One certificate
GET /api/certificates/public/:number    # Public view
GET /api/certificates/:id/download      # PDF download
GET /api/certificates/verify/:number    # Verify validity
```

**Note**: Frontend already generates PDF. Backend stores metadata.

---

## 🔑 Critical API Details

### Authentication

**JWT Structure:**
```javascript
{
  "userId": "usr_123456789",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Expiry:**
- Access token: 15 minutes
- Refresh token: 7 days

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### File Uploads

**Implementation options:**

**Option 1: Direct Upload** (Simpler)
```
Client → FormData → Your API → S3 → Return URL
```

**Option 2: Presigned URL** (Better for large files)
```
Client → Request URL → Your API → Generate presigned URL
Client → Upload to S3 → Notify your API
```

**File Limits:**
- Resume: PDF, max 10MB
- Images: JPEG/PNG/WebP, max 10MB
- Audio: WebM/WAV, max 50MB

**Validation:**
```javascript
// Check magic bytes, not just extension
const isValidPDF = buffer[0] === 0x25 && 
                   buffer[1] === 0x50 && 
                   buffer[2] === 0x44 && 
                   buffer[3] === 0x46;
```

---

### Stripe Integration

**Flow:**
1. Frontend calls `POST /api/payments/create-intent`
2. Backend creates Stripe Payment Intent
3. Backend returns `clientSecret`
4. Frontend uses Stripe.js to confirm payment
5. Frontend calls `POST /api/payments/confirm`
6. Backend verifies payment with Stripe
7. Backend adds product to user's account

**Code example:**
```javascript
// Step 1-2: Create intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 4900, // $49.00 in cents
  currency: 'usd',
  metadata: { 
    userId: user.id,
    productId: 'skill'
  }
});

return { clientSecret: paymentIntent.client_secret };

// Step 5-7: Confirm
const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
if (intent.status === 'succeeded') {
  await addProductToUser(userId, productId);
}
```

---

### Error Response Format

**Always return this structure:**
```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email is already registered"
  }
}
```

**Common error codes:**
```
UNAUTHORIZED          (401)
FORBIDDEN             (403)
NOT_FOUND             (404)
VALIDATION_ERROR      (400)
DUPLICATE_EMAIL       (409)
INVALID_CREDENTIALS   (401)
TOKEN_EXPIRED         (401)
FILE_TOO_LARGE        (413)
PAYMENT_FAILED        (402)
RATE_LIMIT_EXCEEDED   (429)
INTERNAL_SERVER_ERROR (500)
```

---

## 🧪 Testing Strategy

### Local Testing

**1. Start both servers:**
```bash
# Terminal 1: Frontend
cd simplehire-app
npm run dev
# Runs on :5173

# Terminal 2: Backend
cd backend
npm start  # or python app.py
# Runs on :3000
```

**2. Configure frontend:**
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000/api
```

**3. Test flow:**
```
1. Open http://localhost:5173
2. Try signup → Should call POST /api/auth/signup
3. Try login → Should call POST /api/auth/login
4. Check Network tab for API calls
5. Verify tokens in localStorage
```

### Using Test Accounts

Frontend has pre-configured test scenarios:

```javascript
// john@example.com / password123
// Has no products, fresh start

// jane@example.com / password123  
// Has skill product, partial progress

// mike@example.com / password123
// Has all products, various states
```

See `TEST_ACCOUNTS.md` for complete list.

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### User Data Table
```sql
CREATE TABLE user_data (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
  purchased_products TEXT[], -- ['skill', 'id-visa', 'reference']
  interview_progress JSONB,
  id_verification_status VARCHAR(50),
  reference_check_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### References Table
```sql
CREATE TABLE references (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  relationship VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  submitted_at TIMESTAMP,
  response_received_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_references_user_id ON references(user_id);
CREATE INDEX idx_references_status ON references(status);
```

**See `BACKEND_INTEGRATION.md` for complete schema.**

---

## 🔐 Security Checklist

Must implement:
- ✅ Password hashing (bcrypt, cost 12)
- ✅ JWT token signing and verification
- ✅ HTTPS in production
- ✅ CORS configuration (allow your frontend domain)
- ✅ Rate limiting (especially auth endpoints)
- ✅ Input validation (sanitize all inputs)
- ✅ File upload validation (check magic bytes)
- ✅ SQL injection prevention (use parameterized queries)

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors
**Symptom:** `Access-Control-Allow-Origin` error in browser console

**Solution:**
```javascript
// Express.js
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
```

### Issue 2: Token Not Sent
**Symptom:** Backend gets no Authorization header

**Solution:** Frontend automatically sends token. Check:
1. Token stored in localStorage (`authToken`)
2. apiClient loads token on init
3. Headers include `Authorization: Bearer <token>`

### Issue 3: File Upload Fails
**Symptom:** 413 error or timeout

**Solution:**
```javascript
// Increase body size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

### Issue 4: Stripe Webhook Not Working
**Symptom:** Payment succeeds but user doesn't get product

**Solution:**
1. Use Stripe CLI for local testing
2. Verify webhook signature
3. Handle `payment_intent.succeeded` event

---

## 📚 Essential Documentation

### Must Read
1. **BACKEND_INTEGRATION.md** - Complete API spec
2. **API_INTEGRATION_EXAMPLES.md** - Code examples

### Reference
3. **PRODUCTION_README.md** - Project overview
4. **DEPLOYMENT_GUIDE.md** - When ready to deploy

### For Testing
5. **TEST_ACCOUNTS.md** - Pre-configured test users

---

## 🎯 Acceptance Criteria

Before considering backend "done":

### Functionality
- [ ] User can signup and login
- [ ] User can purchase products
- [ ] User can complete skill interview
- [ ] User can upload ID documents
- [ ] User can add references
- [ ] Certificates are generated

### Quality
- [ ] All 55+ endpoints working
- [ ] Error handling consistent
- [ ] File uploads working
- [ ] Payments processing (Stripe test mode)
- [ ] Emails sending (test environment)

### Security
- [ ] Passwords hashed
- [ ] JWTs validated
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Files validated

### Performance
- [ ] API responses < 200ms (except file uploads)
- [ ] Database queries optimized
- [ ] Indexes created
- [ ] Caching implemented

---

## 💡 Pro Tips

### Tip 1: Start Small
Don't try to implement all 55 endpoints at once. Follow the phase priority.

### Tip 2: Use Frontend As Specification
The frontend code is the ultimate API specification. Check service files:
```typescript
// /src/services/auth.service.ts shows exact request format
await apiClient.post('/auth/login', {
  email,    // What it sends
  password
});
```

### Tip 3: Test As You Go
After each endpoint, test immediately with frontend. Don't wait until all endpoints are done.

### Tip 4: Use Database Transactions
Especially for payments and multi-step operations:
```javascript
const transaction = await db.transaction();
try {
  await addProduct(userId, productId, transaction);
  await createCertificate(userId, transaction);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Tip 5: Log Everything (Development)
```javascript
console.log('Received request:', {
  method: req.method,
  path: req.path,
  body: req.body,
  headers: req.headers
});
```

---

## 📞 Need Help?

### Common Questions

**Q: Do I need to implement all endpoints at once?**  
A: No! Follow the phase priority. Start with auth, then user data, then products.

**Q: Can I change the API structure?**  
A: Yes, but you'll need to modify frontend services. Better to follow spec first.

**Q: What about AI for interview evaluation?**  
A: You can use OpenAI API or return mock scores initially. Frontend just displays data.

**Q: How do I test file uploads locally?**  
A: Use MinIO (S3-compatible) or mock S3 responses initially.

**Q: Do I need WebSockets?**  
A: No! Polling works fine initially. WebSockets are optional enhancement.

### Get Support
- Read: `BACKEND_INTEGRATION.md` (comprehensive)
- Check: `API_INTEGRATION_EXAMPLES.md` (code examples)
- Email: backend@simplehire.ai
- Slack: #simplehire-backend

---

## ✅ Quick Checklist

Before you start coding:
- [ ] Frontend running locally
- [ ] Read BACKEND_INTEGRATION.md
- [ ] Reviewed API examples
- [ ] Database setup complete
- [ ] S3 bucket created (or MinIO locally)
- [ ] Stripe account (test mode)
- [ ] Email service configured (test mode)

---

## 🚀 Ready to Start?

### Week 1 Plan

**Day 1-2**: Authentication + User Management  
**Day 3**: Products + Payments  
**Day 4-5**: Skill Interview (biggest feature)  
**Day 6**: ID Verification  
**Day 7**: Reference Check + Certificates  

**By end of week**: Full working integration! 🎉

---

**Good luck! You've got comprehensive documentation to support you every step.** 👍

---

**Document Version**: 1.0  
**Created**: January 2025  
**Estimated Implementation**: 5-7 days for experienced developer
