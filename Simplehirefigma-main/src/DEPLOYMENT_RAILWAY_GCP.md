# Deployment Guide: Railway → GCP

## Overview

**Development/Staging**: Railway (rapid iteration, easy setup)  
**Production**: Google Cloud Platform (Cloud Run + Cloud SQL)  
**Document Verification**: AWS Textract + Rekognition  

---

## Phase 1: Railway Deployment (Dev/Staging)

### Why Railway?
- ✅ Fastest setup (5 minutes)
- ✅ Built-in PostgreSQL
- ✅ Automatic deployments from Git
- ✅ Free tier available
- ✅ Perfect for rapid iteration

### Backend Deployment

1. **Create Railway Account**
   ```bash
   # Visit https://railway.app
   # Sign up with GitHub
   ```

2. **Create New Project**
   ```bash
   # Click "New Project"
   # Select "Deploy from GitHub repo"
   # Connect your repository
   # Select backend folder
   ```

3. **Add PostgreSQL**
   ```bash
   # In Railway dashboard:
   # Click "+ New"
   # Select "Database"
   # Choose "PostgreSQL"
   # Railway will create DATABASE_URL automatically
   ```

4. **Configure Environment Variables**
   ```bash
   # In Railway dashboard → Variables tab:
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-frontend.vercel.app
   
   # JWT (generate strong secrets)
   JWT_SECRET=your-production-jwt-secret-min-32-chars
   REFRESH_TOKEN_SECRET=your-production-refresh-secret-min-32-chars
   
   # AWS S3
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=simplehire-production
   
   # Stripe (LIVE mode for production)
   STRIPE_SECRET_KEY=sk_live_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Email (SendGrid recommended)
   SENDGRID_API_KEY=SG.your_sendgrid_key
   EMAIL_FROM=noreply@simplehire.ai
   
   # DATABASE_URL is automatically set by Railway
   ```

5. **Deploy**
   ```bash
   # Railway auto-deploys on git push
   git push origin main
   
   # Or redeploy manually in Railway dashboard
   ```

6. **Run Migrations**
   ```bash
   # In Railway dashboard:
   # Click on your service
   # Go to "Settings" → "Custom Start Command"
   npm run prisma:migrate deploy && npm start
   ```

7. **Get Your API URL**
   ```bash
   # Railway provides: https://your-backend-production-xxxx.up.railway.app
   ```

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   
   # Or connect GitHub in Vercel dashboard
   ```

2. **Configure Environment**
   ```bash
   # In Vercel dashboard → Settings → Environment Variables:
   VITE_API_BASE_URL=https://your-backend-production-xxxx.up.railway.app/api
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
   ```

3. **Redeploy**
   ```bash
   vercel --prod
   ```

### Testing Railway Deployment

```bash
# Health check
curl https://your-backend-production-xxxx.up.railway.app/health

# Test signup
curl -X POST https://your-backend-production-xxxx.up.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test User"}'
```

### Railway Pricing

- **Hobby Plan**: $5/month
  - 500 hours runtime
  - 512 MB RAM
  - 1 GB disk
  - Perfect for staging

- **Pro Plan**: $20/month
  - 8 GB RAM
  - 100 GB disk
  - Suitable for small production

---

## Phase 2: GCP Production Deployment

### Why GCP?
- ✅ Enterprise-grade reliability
- ✅ Better pricing for scale
- ✅ Cloud Run: auto-scaling, pay-per-use
- ✅ Cloud SQL: managed PostgreSQL
- ✅ Integrated with Google services

### Prerequisites

```bash
# Install Google Cloud SDK
# macOS:
brew install google-cloud-sdk

# Login
gcloud auth login

# Create project
gcloud projects create simplehire-prod
gcloud config set project simplehire-prod
```

### 1. Set Up Cloud SQL (PostgreSQL)

```bash
# Create PostgreSQL instance
gcloud sql instances create simplehire-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_STRONG_PASSWORD

# Create database
gcloud sql databases create simplehire --instance=simplehire-db

# Get connection name
gcloud sql instances describe simplehire-db
# Note the connectionName: project:region:instance
```

### 2. Build and Push Docker Image

Create `/backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8080

# Start command
CMD npm run prisma:migrate deploy && npm start
```

```bash
# Build and push to Google Container Registry
cd backend

# Build image
gcloud builds submit --tag gcr.io/simplehire-prod/backend

# Or use Docker
docker build -t gcr.io/simplehire-prod/backend .
docker push gcr.io/simplehire-prod/backend
```

### 3. Deploy to Cloud Run

```bash
# Deploy
gcloud run deploy simplehire-backend \
  --image gcr.io/simplehire-prod/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances simplehire-prod:us-central1:simplehire-db \
  --set-env-vars NODE_ENV=production \
  --set-env-vars FRONTEND_URL=https://simplehire.ai \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10
```

### 4. Configure Environment Variables

```bash
# Set secrets using Secret Manager
gcloud secrets create jwt-secret --data-file=- <<< "your-jwt-secret"
gcloud secrets create stripe-secret --data-file=- <<< "sk_live_..."

# Update Cloud Run service with secrets
gcloud run services update simplehire-backend \
  --update-secrets=JWT_SECRET=jwt-secret:latest \
  --update-secrets=STRIPE_SECRET_KEY=stripe-secret:latest \
  --region us-central1
```

### 5. Configure Custom Domain

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service simplehire-backend \
  --domain api.simplehire.ai \
  --region us-central1

# Follow instructions to update DNS records
```

### 6. Set Up Cloud Storage for Files

```bash
# Create storage bucket
gsutil mb -l us-central1 gs://simplehire-storage

# Set CORS
cat > cors.json <<EOF
[
  {
    "origin": ["https://simplehire.ai"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://simplehire-storage

# Make bucket publicly readable for uploaded files
gsutil iam ch allUsers:objectViewer gs://simplehire-storage
```

### 7. Configure Monitoring

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# Set up alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5
```

---

## AWS Integration (Document Verification)

### Why AWS for Document Verification?
- Textract: Best-in-class ID extraction
- Rekognition: Accurate face matching
- Can use from any cloud (GCP, Railway, etc.)

### Setup

1. **Create AWS Account & IAM User**
   ```bash
   # In AWS Console:
   # 1. Go to IAM → Users → Add User
   # 2. Name: simplehire-textract-user
   # 3. Access type: Programmatic access
   # 4. Attach policies:
   #    - AmazonTextractFullAccess
   #    - AmazonRekognitionFullAccess
   #    - AmazonS3FullAccess
   # 5. Save Access Key ID and Secret
   ```

2. **Configure in Backend**
   ```bash
   # Railway/GCP environment variables:
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=simplehire-docs
   ```

3. **Test Verification**
   ```bash
   # Upload test ID document
   curl -X POST https://your-api/api/id-verification/id \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-id.jpg" \
     -F "documentType=passport"
   
   # Upload selfie
   curl -X POST https://your-api/api/id-verification/selfie \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@selfie.jpg"
   
   # Submit for AI verification
   curl -X POST https://your-api/api/id-verification/submit \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Response includes AI verification results:
   # {
   #   "success": true,
   #   "data": {
   #     "status": "verified",
   #     "aiVerification": {
   #       "overallScore": 95,
   #       "autoVerified": true,
   #       "issues": []
   #     }
   #   }
   # }
   ```

---

## Cost Estimates

### Railway (Staging)
- Hobby: $5/month
- PostgreSQL: Included
- **Total: $5/month**

### GCP (Production at 1000 users)
- **Cloud Run**: ~$10/month
  - 1M requests/month
  - ~100ms avg response time
- **Cloud SQL**: ~$25/month
  - db-f1-micro (shared CPU)
  - 10 GB storage
- **Cloud Storage**: ~$5/month
  - 50 GB storage
  - 100 GB egress
- **Total: ~$40/month**

### AWS (Document Verification)
- **Textract**: $1.50 per 1000 pages
- **Rekognition**: $1.00 per 1000 images
- **S3 Storage**: $0.023 per GB/month
- **Example**: 500 verifications/month = ~$2/month

### Other Services
- **Stripe**: 2.9% + $0.30 per transaction
- **SendGrid**: Free up to 100 emails/day
- **Vercel**: Free for frontend

**Total Monthly Cost (1000 active users)**: ~$50-60/month

---

## Deployment Workflow

### Development
```bash
# Local development
cd backend && npm run dev
# Frontend
npm run dev
```

### Staging (Railway)
```bash
git push origin develop
# Auto-deploys to Railway
```

### Production (GCP)
```bash
# Merge to main
git checkout main
git merge develop
git push origin main

# Build and deploy
cd backend
gcloud builds submit --tag gcr.io/simplehire-prod/backend
gcloud run deploy simplehire-backend \
  --image gcr.io/simplehire-prod/backend \
  --region us-central1
```

---

## Monitoring & Maintenance

### Railway
```bash
# View logs
# In Railway dashboard → Logs tab

# View metrics
# In Railway dashboard → Metrics tab
```

### GCP
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View metrics
# Go to Cloud Console → Cloud Run → your service → Metrics

# Set up Uptime Checks
gcloud monitoring uptime-checks create https \
  --resource-type=uptime-url \
  --host=api.simplehire.ai \
  --path=/health
```

### AWS (Textract/Rekognition)
```bash
# Monitor usage in AWS Console
# Go to Billing → Cost Explorer

# Set up budget alerts
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json
```

---

## Rollback Plan

### Railway
```bash
# In Railway dashboard:
# Deployments tab → Click on previous deployment → Redeploy
```

### GCP Cloud Run
```bash
# List revisions
gcloud run revisions list --service simplehire-backend

# Rollback to previous revision
gcloud run services update-traffic simplehire-backend \
  --to-revisions REVISION_NAME=100
```

---

## Security Checklist

### Before Production:
- [ ] Change all JWT secrets (min 32 characters)
- [ ] Use Stripe live keys (not test keys)
- [ ] Enable HTTPS only (both Railway and GCP do this automatically)
- [ ] Set up CORS properly (only allow your frontend domain)
- [ ] Enable Cloud SQL backup (GCP)
- [ ] Set up database connection pooling
- [ ] Configure rate limiting
- [ ] Enable Google Cloud Armor (DDoS protection)
- [ ] Set up AWS IAM roles with minimal permissions
- [ ] Enable S3 bucket encryption
- [ ] Configure SendGrid domain authentication
- [ ] Set up error monitoring (Sentry)
- [ ] Configure uptime monitoring

---

## Support

**Railway**: https://railway.app/help  
**GCP**: https://cloud.google.com/support  
**AWS**: https://aws.amazon.com/support  

---

**Recommended Path**:
1. **Start**: Railway (5 minutes setup)
2. **Test**: Run for 1-2 weeks, validate everything works
3. **Scale**: Migrate to GCP when ready for production
4. **Monitor**: Set up proper monitoring and alerts

**You're now ready to deploy! 🚀**
