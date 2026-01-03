# Simplehire - Candidate Verification Platform

<div align="center">

![Simplehire Logo](https://img.shields.io/badge/Simplehire-Candidate%20Verification-blue?style=for-the-badge)

**A comprehensive platform for candidate verification including skill assessment, ID verification, and reference checks**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Demo Accounts & Testing](#demo-accounts--testing)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Railway Deployment](#railway-deployment)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## 🎯 Overview

**Simplehire** is a modern, comprehensive candidate verification platform designed to streamline the hiring process. It combines AI-powered skill assessments, identity verification, and automated reference checks into a single, user-friendly platform.

### What It Does

- **Skill Assessment**: AI-powered interviews, MCQ tests, and coding challenges
- **ID Verification**: Document upload and identity verification system
- **Reference Checks**: Automated reference collection and verification
- **Payment Processing**: Integrated payment system for verification packages
- **Real-time Analytics**: Dashboard for tracking candidate progress and results

---

## 🔐 Demo Accounts & Testing

> **⚠️ IMPORTANT**: This platform is configured for **DEMO/TESTING ONLY**. Only the following demo accounts will work for login. All demo accounts start with a clean slate for testing purposes.

### Available Demo Login Credentials

| Email | Password | Description |
|-------|----------|-------------|
| `demo@simplehire.ai` | `demo` | Demo user with all products purchased |
| `john@example.com` | `password123` | User with skill interview product |
| `sarah@example.com` | `password123` | User with skill + ID verification |
| `mike@example.com` | `password123` | User with all products |
| `emma@example.com` | `password123` | User with skill interview |
| `alex@example.com` | `password123` | User with no products |

### Testing Guidelines

- **Account Creation**: Regular signup is disabled. Use only the demo accounts above.
- **Clean State**: All demo accounts are reset to a clean state on deployment.
- **Data Persistence**: Any data created during testing is for demonstration purposes only.
- **Reset Database**: To reset all demo accounts to clean state, run:
  ```bash
  npm run prisma:reset-demo
  ```

### What Gets Reset

When you run the reset script or redeploy:
- ✅ All assessments and interview data
- ✅ All progress tracking
- ✅ All payments and purchases (products preserved)
- ✅ All sessions and auth tokens
- ✅ Demo accounts restored to initial state

---

## ✨ Features

### 🎤 **Skill Interview System**
- AI-powered voice interviews using OpenAI and Anthropic Claude
- Multi-LLM evaluation with arbiter system for unbiased scoring
- Real-time audio recording and transcription
- Dynamic question generation based on resume analysis
- MCQ tests and coding challenges
- Comprehensive scoring rubric with detailed feedback

### 🪪 **ID & Visa Verification**
- Document upload (ID cards, passports, visas)
- Photo/selfie verification
- Secure document storage on AWS S3
- Automated verification workflow
- Status tracking and notifications

### 📝 **Reference Check System**
- Automated reference request emails
- Reference form submission portal
- Document upload for reference letters
- Reference verification tracking
- Integration with candidate profiles

### 💳 **Payment Integration**
- Stripe payment processing
- Multiple verification packages
- Secure payment webhook handling
- Transaction history and receipts

### 🔐 **Authentication & Security**
- JWT-based authentication with refresh tokens
- Secure password hashing (bcrypt)
- Role-based access control (RBAC)
- Rate limiting and DDoS protection
- CORS configuration
- Input validation and sanitization

### 📊 **Dashboard & Analytics**
- Real-time candidate progress tracking
- Assessment results visualization
- Verification status overview
- Payment history
- Admin management panel

---

## 🏗️ Architecture

Simplehire follows a modern **monorepo architecture** with separate frontend and backend services:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  React Frontend │────────▶│  Express Backend │────────▶│ PostgreSQL  │
│  (TypeScript)   │  REST   │   (TypeScript)   │         │  Database   │
└─────────────────┘  API    └──────────────────┘         └─────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │   AWS    │    │  Stripe  │    │  OpenAI/ │
              │    S3    │    │ Payments │    │ Anthropic│
              └──────────┘    └──────────┘    └──────────┘
```

### Architecture Highlights

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL with Prisma schema migrations
- **File Storage**: AWS S3 or S3-compatible storage (MinIO for local dev)
- **AI/LLM**: OpenAI GPT-4o and Anthropic Claude Opus for interview evaluation
- **Payments**: Stripe integration for secure payment processing
- **Authentication**: JWT with refresh token rotation

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 6.3
- **Styling**: Tailwind CSS v4, Radix UI components
- **State Management**: Zustand (lightweight state management)
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios
- **UI Components**: Custom components built with Radix UI primitives

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 4.22
- **Language**: TypeScript 5.7
- **ORM**: Prisma 6.19
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **File Upload**: Multer + AWS SDK
- **Email**: Nodemailer
- **Logging**: Winston
- **Validation**: express-validator + Zod
- **API Documentation**: OpenAPI/Swagger ready

### Database & Storage
- **Database**: PostgreSQL 14+
- **ORM**: Prisma with type-safe queries
- **File Storage**: AWS S3
- **Cache**: Redis (optional, for sessions)

### AI & Machine Learning
- **OpenAI**: GPT-4o for interview evaluation
- **Anthropic**: Claude Opus 4.5 for multi-LLM evaluation
- **Resume Parsing**: PDF/DOCX parsing with custom analysis

### DevOps & Deployment
- **Containerization**: Docker + multi-stage builds
- **Deployment**: Railway, Docker, or any Node.js hosting
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Built-in health checks

---

## 📦 Prerequisites

Before setting up Simplehire, ensure you have the following installed:

- **Node.js**: 20.x or higher ([Download](https://nodejs.org/))
- **npm**: 10.8.2 or higher (comes with Node.js)
- **PostgreSQL**: 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For version control ([Download](https://git-scm.com/))

### Optional (for full functionality)
- **AWS Account**: For S3 file storage
- **OpenAI API Key**: For AI-powered interviews
- **Anthropic API Key**: For multi-LLM evaluation
- **Stripe Account**: For payment processing
- **Railway Account**: For easy deployment ([Sign up](https://railway.app))

---

## 🚀 Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/achurisujith-droid/Simplehirefigma-new.git
cd Simplehirefigma-new
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd Simplehirefigma-main/src/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set:
#   - DATABASE_URL=postgresql://user:password@localhost:5432/simplehire
#   - JWT_SECRET=<generate-with-openssl-rand-hex-32>
#   - JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
#   - FRONTEND_URL=http://localhost:5173

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with demo users and products
npm run prisma:seed

# Start backend development server
npm run dev
```

> **Note**: The seed script creates 6 demo accounts. See the [Demo Accounts & Testing](#demo-accounts--testing) section for login credentials.

**Backend will be running at**: `http://localhost:3000`

### Step 3: Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd Simplehirefigma-main

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env.local

# Start frontend development server
npm run dev
```

**Frontend will be running at**: `http://localhost:5173`

### Step 4: Database Setup

#### Create PostgreSQL Database

```bash
# Using psql
psql postgres
CREATE DATABASE simplehire;
\q

# Or using createdb command
createdb simplehire
```

#### Set Database URL

Update the `DATABASE_URL` in `Simplehirefigma-main/src/backend/.env`:

```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/simplehire
```

### Step 5: Generate JWT Secrets

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET
openssl rand -hex 32
```

Copy these values into your `.env` file.

### Step 6: Test the Application

1. Open browser at `http://localhost:5173`
2. Log in with one of the demo accounts (see [Demo Accounts](#demo-accounts--testing))
3. Test authentication flow
4. Check backend logs to verify API requests
5. Access Prisma Studio to view database:
   ```bash
   cd Simplehirefigma-main/src/backend
   npm run prisma:studio
   ```

> **Important**: Regular signup is disabled. Use only the demo accounts for testing.

### Step 7: Reset Database (Optional)

To reset all demo accounts and data to a clean state:

```bash
# From the root directory
npm run prisma:reset-demo

# Or from the backend directory
cd Simplehirefigma-main/src/backend
npm run prisma:reset-demo
```

---

## 🔐 Environment Variables

Simplehire requires various environment variables for configuration. Variables are categorized as **REQUIRED** or **OPTIONAL**.

### REQUIRED Variables

These variables **must** be set for the application to work:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
APP_URL=https://your-backend-url.com
FRONTEND_URL=https://your-frontend-url.com

# Database (Auto-set by Railway PostgreSQL plugin)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Authentication (Generate with: openssl rand -hex 32)
JWT_SECRET=your-64-character-secret-key
JWT_REFRESH_SECRET=your-64-character-refresh-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
```

### OPTIONAL Variables (Recommended)

These variables enable additional features:

#### AI/LLM Services
```env
OPENAI_API_KEY=sk-your-openai-api-key          # For AI interviews
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key    # For multi-LLM evaluation
LLM_PROVIDERS=gpt-4o,claude-opus-4-5-20251101
ENABLE_MULTI_LLM_ARBITER=true
```

#### File Storage (AWS S3)
```env
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=simplehire-storage
```

#### Payment Processing (Stripe)
```env
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

#### Email Service (SendGrid)
```env
EMAIL_FROM=noreply@simplehire.ai
EMAIL_FROM_NAME=Simplehire
SENDGRID_API_KEY=your-sendgrid-api-key
```

#### OAuth Providers
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
```

#### File Upload Limits
```env
MAX_FILE_SIZE=16777216           # 16 MB
MAX_AUDIO_SIZE=52428800          # 50 MB
```

For a complete list with detailed descriptions, see [`.env.example`](.env.example).

---

## 🚂 Railway Deployment

Railway provides the easiest way to deploy Simplehire with zero-config PostgreSQL and automatic HTTPS.

> **🎉 Recent Improvements**: This repository has been updated with enhanced deployment support:
> - ✅ Prisma migrations included for automatic database setup
> - ✅ Environment variable validation with clear error messages
> - ✅ Enhanced health checks with comprehensive service status monitoring
> - ✅ Database connectivity with retry logic and detailed logging
> - ✅ Console logging enabled for production environments
> - ✅ Startup readiness checks before accepting requests
> - ✅ Updated dependencies (Prisma 6.19.1, npm 11.7.0 in Docker)
> - ✅ Comprehensive deployment documentation
> 
> See [FIX_SUMMARY.md](FIX_SUMMARY.md) for details on recent improvements.

### Quick Railway Setup

1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `achurisujith-droid/Simplehirefigma-new`

3. **Add PostgreSQL Database**:
   - In your Railway project, click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway auto-injects `DATABASE_URL` into your service

4. **Configure Environment Variables**:
   
   Railway uses a Dockerfile builder, so you **must manually add environment variables**:
   
   **Navigate to**: Service → Variables Tab
   
   **Add these REQUIRED variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate-with-openssl-rand-hex-32>
   JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
   FRONTEND_URL=https://your-frontend-url.com
   PORT=3000
   ```
   
   **Add these OPTIONAL variables** (as needed):
   ```
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SENDGRID_API_KEY=...
   ```

5. **Deploy**: Railway will automatically build and deploy your application

6. **Get Your URL**: Once deployed, Railway provides a public URL like:
   - `https://simplehire-backend.railway.app`

### Railway Configuration Files

This repository includes Railway-specific configuration:

- **`Dockerfile`**: Multi-stage build for optimized production images
- **`railway.toml`**: Railway-specific deployment configuration
- **`railway.json`**: Service configuration with health checks
- **Root `package.json`**: Build scripts for Railway

### Troubleshooting Railway Deployment

For comprehensive deployment assistance, see:
- **[Railway Deployment Checklist](RAILWAY_DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist with verification steps
- **[Railway Setup Guide](RAILWAY_SETUP.md)** - Detailed deployment instructions and troubleshooting
- **[Fix Summary](FIX_SUMMARY.md)** - Recent improvements and resolved issues

Common issues and solutions:
- Environment variable configuration
- Database migration errors  
- Health check failures
- LLM configuration issues
- Service availability monitoring

---

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t simplehire-backend .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/simplehire" \
  -e JWT_SECRET="your-secret-key" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e FRONTEND_URL="http://localhost:5173" \
  --name simplehire \
  simplehire-backend
```

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: simplehire
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/simplehire
      JWT_SECRET: your-secret-key
      JWT_REFRESH_SECRET: your-refresh-secret
      FRONTEND_URL: http://localhost:5173
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

---

## 📁 Project Structure

```
Simplehirefigma-new/
├── .dockerignore              # Docker ignore patterns
├── Dockerfile                 # Multi-stage Docker build
├── railway.toml              # Railway configuration
├── railway.json              # Railway service config
├── Procfile                  # Process configuration
├── package.json              # Root monorepo scripts
├── .env.example              # Environment variables template
├── README.md                 # This file
├── RAILWAY_SETUP.md          # Railway deployment guide
│
└── Simplehirefigma-main/
    ├── package.json          # Frontend dependencies
    ├── vite.config.ts        # Vite configuration
    ├── index.html            # HTML entry point
    │
    └── src/
        ├── main.tsx          # React entry point
        ├── App.tsx           # Root component
        ├── components/       # React components (50+)
        ├── pages/            # Page components
        ├── services/         # API client services
        ├── hooks/            # Custom React hooks
        ├── styles/           # Global styles
        ├── tests/            # Frontend tests
        │
        ├── COMPLETE_SETUP_GUIDE.md      # Complete setup instructions
        ├── BACKEND_INTEGRATION.md       # Backend API specs
        │
        └── backend/
            ├── package.json            # Backend dependencies
            ├── tsconfig.json          # TypeScript config
            ├── .env.example           # Backend env template
            │
            ├── prisma/
            │   ├── schema.prisma      # Database schema
            │   ├── migrations/        # Database migrations
            │   └── seed.ts            # Seed data
            │
            ├── config/
            │   └── llm_config.json    # LLM configuration
            │
            ├── src/
            │   ├── server.ts          # Express entry point
            │   ├── config/            # Configuration modules
            │   ├── controllers/       # Route controllers
            │   ├── middleware/        # Express middleware
            │   ├── routes/            # API routes
            │   ├── types/             # TypeScript types
            │   └── utils/             # Utility functions
            │
            ├── tests/                 # Backend tests
            ├── logs/                  # Application logs
            └── dist/                  # Build output (generated)
```

---

## 📚 API Documentation

The backend API follows RESTful principles with comprehensive endpoint coverage.

### API Base URL

- **Local Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.railway.app/api`

### Key Endpoints

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

#### Products & Payments
- `GET /api/products` - List verification packages
- `POST /api/payments/create-checkout` - Create payment session
- `POST /api/payments/webhook` - Stripe webhook handler

#### Interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/:id` - Get interview details
- `POST /api/interviews/:id/submit` - Submit interview
- `GET /api/interviews/:id/results` - Get interview results

#### ID Verification
- `POST /api/id-verification` - Create verification
- `POST /api/id-verification/upload` - Upload documents
- `GET /api/id-verification/:id` - Get verification status

#### References
- `POST /api/references` - Request reference
- `GET /api/references/:id` - Get reference details
- `POST /api/references/:id/submit` - Submit reference form

For complete API documentation with request/response examples, see:
- [BACKEND_INTEGRATION.md](Simplehirefigma-main/src/BACKEND_INTEGRATION.md)
- [Backend README](Simplehirefigma-main/src/backend/README.md)

---

## 🧪 Testing

### Backend Tests

```bash
# Navigate to backend
cd Simplehirefigma-main/src/backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

### Frontend Tests

```bash
# Navigate to frontend
cd Simplehirefigma-main

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Test Coverage

Current test coverage includes:
- Authentication flows
- User management
- Payment processing
- Interview evaluation
- Multi-LLM arbiter system
- Security middleware
- API integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits focused and atomic

---

## 📖 Additional Documentation

- **[Railway Deployment Checklist](RAILWAY_DEPLOYMENT_CHECKLIST.md)**: Step-by-step deployment verification
- **[Fix Summary](FIX_SUMMARY.md)**: Recent deployment improvements and resolved issues
- **[Complete Setup Guide](Simplehirefigma-main/src/COMPLETE_SETUP_GUIDE.md)**: Detailed setup instructions
- **[Backend Integration](Simplehirefigma-main/src/BACKEND_INTEGRATION.md)**: API specifications and integration guide
- **[Backend README](Simplehirefigma-main/src/backend/README.md)**: Backend-specific documentation
- **[Railway Setup](RAILWAY_SETUP.md)**: Railway deployment guide

---

## 💬 Support

### Getting Help

- **Documentation**: Check the docs in this repository
- **Issues**: Open an issue on [GitHub Issues](https://github.com/achurisujith-droid/Simplehirefigma-new/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/achurisujith-droid/Simplehirefigma-new/discussions)

### Reporting Bugs

When reporting bugs, please include:
- Operating system and version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or error messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o API
- **Anthropic** for Claude API
- **Stripe** for payment processing
- **AWS** for S3 storage
- **Railway** for deployment platform
- **Prisma** for database ORM
- **React** and **TypeScript** communities

---

## 🎯 Roadmap

### Current Version (v1.0)
- ✅ Complete authentication system
- ✅ AI-powered skill interviews
- ✅ ID verification
- ✅ Reference checks
- ✅ Payment integration
- ✅ Multi-LLM evaluation

### Upcoming Features (v1.1)
- [ ] Video interview support
- [ ] Background check integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] API rate limiting with Redis

### Future Enhancements (v2.0)
- [ ] AI-powered resume screening
- [ ] Automated interview scheduling
- [ ] Integration with ATS systems
- [ ] Advanced fraud detection
- [ ] Blockchain-based verification certificates

---

<div align="center">

**Made with ❤️ by the Simplehire Team**

[Documentation](Simplehirefigma-main/src/COMPLETE_SETUP_GUIDE.md) • [Report Bug](https://github.com/achurisujith-droid/Simplehirefigma-new/issues) • [Request Feature](https://github.com/achurisujith-droid/Simplehirefigma-new/issues)

</div>
