# Simplehire Backend API

Complete Node.js/Express backend for the Simplehire candidate verification platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- AWS S3 or S3-compatible storage (MinIO for local development)
- Stripe account (test mode for development)

### Installation

```bash
# Install dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with test data (optional)
npm run prisma:seed

# Start development server
npm run dev
```

Server will start on `http://localhost:3000`

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Seed data
├── src/
│   ├── config/              # Configuration
│   │   ├── index.ts         # Main config
│   │   ├── database.ts      # Prisma client
│   │   └── logger.ts        # Winston logger
│   ├── controllers/         # Route controllers
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── errorHandler.ts # Error handling
│   │   └── validation.ts    # Request validation
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── product.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── interview.routes.ts
│   │   ├── idVerification.routes.ts
│   │   ├── reference.routes.ts
│   │   └── certificate.routes.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── errors.ts        # Custom error class
│   │   ├── jwt.ts           # JWT utilities
│   │   ├── password.ts      # Password hashing
│   │   └── fileUpload.ts    # File upload to S3
│   └── server.ts            # Express app entry point
├── logs/                    # Log files
├── .env.example            # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Setup

### PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb simplehire

# Or using psql
psql postgres
CREATE DATABASE simplehire;
```

### Prisma Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npm run prisma:studio
```

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/simplehire
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# AWS S3 (required for file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=simplehire-storage

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_test_...
```

### Local S3 with MinIO (Optional)

For local development, use MinIO instead of AWS S3:

```bash
# Install MinIO
brew install minio

# Start MinIO server
minio server ~/minio-data

# Access at http://localhost:9000
# Default credentials: minioadmin / minioadmin

# In .env, add:
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=simplehire-dev
```

---

## 🔑 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me/data` | Get user data | ✅ |
| PATCH | `/api/users/me` | Update profile | ✅ |
| GET | `/api/users/me/products` | Get purchased products | ✅ |
| PATCH | `/api/users/me/interview-progress` | Update interview progress | ✅ |

### Products

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | ❌ |
| GET | `/api/products/:id` | Get product by ID | ❌ |

### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/create-intent` | Create Stripe payment intent | ✅ |
| POST | `/api/payments/confirm` | Confirm payment | ✅ |
| GET | `/api/payments/history` | Get payment history | ✅ |

### Skill Interview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/interviews/documents` | Upload resume/cover letter | ✅ |
| POST | `/api/interviews/voice/start` | Start voice interview | ✅ |
| POST | `/api/interviews/voice/submit` | Submit voice recording | ✅ |
| GET | `/api/interviews/mcq` | Get MCQ questions | ✅ |
| POST | `/api/interviews/mcq/submit` | Submit MCQ answers | ✅ |
| GET | `/api/interviews/coding` | Get coding challenge | ✅ |
| POST | `/api/interviews/coding/submit` | Submit coding solution | ✅ |
| GET | `/api/interviews/evaluation` | Get evaluation results | ✅ |
| POST | `/api/interviews/certificate` | Generate certificate | ✅ |

### ID Verification

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/id-verification/id` | Upload ID document | ✅ |
| POST | `/api/id-verification/visa` | Upload visa document | ✅ |
| POST | `/api/id-verification/selfie` | Upload selfie | ✅ |
| POST | `/api/id-verification/submit` | Submit for review | ✅ |
| GET | `/api/id-verification/status` | Get verification status | ✅ |

### Reference Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/references` | Get all references | ✅ |
| POST | `/api/references` | Add reference | ✅ |
| PATCH | `/api/references/:id` | Update reference | ✅ |
| DELETE | `/api/references/:id` | Delete reference | ✅ |
| POST | `/api/references/submit` | Submit references (send emails) | ✅ |
| POST | `/api/references/:id/resend` | Resend email | ✅ |
| GET | `/api/references/summary` | Get summary | ✅ |

### Certificates

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/certificates` | Get user certificates | ✅ |
| GET | `/api/certificates/:id` | Get certificate by ID | ✅ |
| GET | `/api/certificates/public/:number` | Get public certificate | ❌ |
| GET | `/api/certificates/verify/:number` | Verify certificate | ❌ |
| POST | `/api/certificates/:id/share` | Generate shareable link | ✅ |

---

## 🧪 Testing

### Health Check

The health check endpoint monitors the status of critical services:

```bash
curl http://localhost:3000/health
```

**Expected Response (Healthy):**
```json
{
  "success": true,
  "message": "Simplehire API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "uptime": 123.45,
  "services": {
    "database": true,
    "multiLLM": false,
    "storage": false,
    "payments": false,
    "email": false
  }
}
```

**Response (Database Unavailable) - Returns 503:**
```json
{
  "success": false,
  "message": "Service degraded - database unavailable",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": false,
    "multiLLM": false,
    "storage": false,
    "payments": false,
    "email": false
  }
}
```

**Troubleshooting 503 Errors:**
- Verify `DATABASE_URL` is set correctly in `.env`
- Ensure PostgreSQL is running and accessible
- Check database credentials are valid
- Verify network connectivity to database host
- Review logs for detailed error messages

### Test Authentication

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'

# Use the returned token in subsequent requests
curl http://localhost:3000/api/users/me/data \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Frontend Integration

1. **Update frontend environment**:
```bash
# In frontend/.env.local
VITE_API_BASE_URL=http://localhost:3000/api
```

2. **Start both servers**:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd ..
npm run dev
```

3. **Test the integration**:
   - Open http://localhost:5173
   - Try signup/login
   - Check browser Network tab for API calls
   - Verify data is stored in PostgreSQL

---

## 🔐 Security Features

### Implemented
✅ JWT-based authentication with refresh tokens  
✅ Password hashing with bcrypt (12 rounds)  
✅ Rate limiting on all endpoints  
✅ Extra rate limiting on login (5 attempts per 15 min)  
✅ Helmet.js security headers  
✅ CORS configuration  
✅ Request validation with express-validator  
✅ SQL injection prevention (Prisma ORM)  
✅ File type and size validation  

### To Configure in Production
⚠️ Set strong JWT_SECRET  
⚠️ Configure HTTPS  
⚠️ Set up firewall rules  
⚠️ Enable database encryption  
⚠️ Configure S3 bucket permissions  
⚠️ Set up monitoring and alerts  

---

## 📊 Database Models

### Users
- id, email, passwordHash, name, emailVerified
- Relations: userData, references, certificates, payments

### UserData
- purchasedProducts, interviewProgress
- idVerificationStatus, referenceCheckStatus

### Reference
- name, email, company, position, relationship
- status (draft → email-sent → response-received → verified)

### Certificate
- certificateNumber, productId, skillsData
- status (active/revoked)

### Payment
- productId, amount, currency, status
- paymentIntentId (Stripe)

See `prisma/schema.prisma` for complete schema.

---

## 🚧 To-Do / Enhancements

### Core Features (Already Implemented)
- ✅ Authentication (signup, login, refresh tokens)
- ✅ User management
- ✅ Product listing
- ✅ Payment integration (Stripe)
- ✅ File uploads (S3)
- ✅ ID verification workflow
- ✅ Reference management

### Enhancements Needed
- [ ] Google OAuth implementation (verify idToken)
- [ ] Email sending (reference requests, notifications)
- [ ] MCQ question database and randomization
- [ ] Coding challenge evaluation (run tests)
- [ ] AI interview evaluation (OpenAI integration)
- [ ] Certificate PDF generation
- [ ] Admin panel endpoints
- [ ] WebSocket for real-time updates
- [ ] Unit and integration tests

---

## 📧 Email Integration

To enable email sending for reference requests:

### Using SendGrid

```bash
npm install @sendgrid/mail
```

```typescript
// src/utils/email.ts
import sgMail from '@sendgrid/mail';
import config from '../config';

sgMail.setApiKey(config.email.sendgridApiKey!);

export const sendReferenceEmail = async (
  referenceEmail: string,
  referenceName: string,
  candidateName: string,
  referenceId: string
) => {
  const msg = {
    to: referenceEmail,
    from: config.email.from,
    subject: `Reference Request for ${candidateName}`,
    html: `
      <p>Hi ${referenceName},</p>
      <p>${candidateName} has listed you as a professional reference...</p>
      <a href="${config.appUrl}/reference-form/${referenceId}">Provide Reference</a>
    `,
  };

  await sgMail.send(msg);
};
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build
RUN npm run prisma:generate

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/simplehire
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: simplehire
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

```bash
docker-compose up -d
```

---

## 📈 Performance Tips

### Database Indexing
Already configured in Prisma schema:
- `users.email` - unique index
- `references.userId`, `references.status` - indexes
- `certificates.certificateNumber` - unique index
- `payments.userId`, `payments.paymentIntentId` - indexes

### Caching
Add Redis for caching frequently accessed data:

```bash
npm install redis
```

```typescript
import { createClient } from 'redis';

const redis = createClient({ url: config.redisUrl });
await redis.connect();

// Cache user data
await redis.setEx(`user:${userId}`, 900, JSON.stringify(userData)); // 15 min TTL
```

---

## 🔍 Debugging

### View Logs

```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log
```

### Prisma Studio

```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

### Common Issues

**1. Database connection failed**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database exists

**2. S3 upload failed**
- Check AWS credentials in `.env`
- Verify S3 bucket exists
- Check bucket permissions

**3. Stripe payment failed**
- Use test mode keys for development
- Check webhook configuration
- Verify payment intent status

**4. CORS errors**
- Check `FRONTEND_URL` in `.env`
- Verify CORS configuration in `server.ts`

---

## 📚 Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Express.js**: https://expressjs.com/
- **Stripe API**: https://stripe.com/docs/api
- **AWS S3**: https://docs.aws.amazon.com/s3/
- **JWT**: https://jwt.io/

---

## 🤝 Support

For issues or questions:
- Check the main `BACKEND_INTEGRATION.md` for API specs
- Review `API_INTEGRATION_EXAMPLES.md` for code examples
- Email: backend@simplehire.ai

---

**Status**: ✅ Core API Complete - Ready for Integration  
**Version**: 1.0.0  
**Last Updated**: January 2025
