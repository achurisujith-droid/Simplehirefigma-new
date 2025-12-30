# Railway Deployment Checklist

Use this checklist to ensure a successful Railway deployment.

## Pre-Deployment Checklist

### 1. Environment Variables Configuration

Railway uses a Dockerfile builder, which means environment variables **must be manually configured** in the Railway dashboard.

#### Required Variables (Application will fail without these):
- [ ] `DATABASE_URL` - Automatically set by Railway PostgreSQL plugin
- [ ] `JWT_SECRET` - Generate using: `openssl rand -hex 32`
- [ ] `JWT_REFRESH_SECRET` - Generate using: `openssl rand -hex 32` (must be different from JWT_SECRET)
- [ ] `FRONTEND_URL` - Your frontend application URL

#### Recommended Variables:
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Set to `3000`
- [ ] `APP_URL` - Your Railway backend URL (set after first deployment)
- [ ] `BCRYPT_ROUNDS` - Set to `12`

#### Optional Feature Variables:

**AI/LLM Services** (for AI-powered interviews):
- [ ] `OPENAI_API_KEY` - Required for interview questions
- [ ] `ANTHROPIC_API_KEY` - Optional for multi-LLM evaluation
- [ ] `LLM_PROVIDERS` - Default: `gpt-4o,claude-opus-4-5-20251101`
- [ ] `ENABLE_MULTI_LLM_ARBITER` - Set to `true` for multi-LLM

**File Storage** (AWS S3 for resumes, documents):
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` - Default: `us-east-1`
- [ ] `AWS_S3_BUCKET`

**Payment Processing** (Stripe):
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

**Email Service** (SendGrid or SMTP):
- [ ] `EMAIL_FROM` - Default: `noreply@simplehire.ai`
- [ ] `EMAIL_FROM_NAME` - Default: `Simplehire`
- [ ] `SENDGRID_API_KEY`

**OAuth** (Google Sign-In):
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### 2. Database Setup

- [ ] PostgreSQL database added to Railway project
- [ ] Database connection verified in Railway logs
- [ ] Migrations exist in `prisma/migrations/` folder
- [ ] Migration will run automatically on deployment

### 3. Repository Configuration

- [ ] All code changes committed to GitHub
- [ ] Railway connected to GitHub repository
- [ ] Correct branch selected for deployment
- [ ] `Dockerfile` exists in repository root
- [ ] `railway.json` and `railway.toml` configured

## Deployment Steps

### Step 1: Create Railway Project
1. [ ] Go to [railway.app](https://railway.app)
2. [ ] Click "New Project"
3. [ ] Select "Deploy from GitHub repo"
4. [ ] Choose your repository

### Step 2: Add PostgreSQL Database
1. [ ] In Railway project, click "+ New"
2. [ ] Select "Database" → "Add PostgreSQL"
3. [ ] Wait for database to provision
4. [ ] Verify `DATABASE_URL` is injected

### Step 3: Configure Environment Variables
1. [ ] Click on your service in Railway
2. [ ] Navigate to "Variables" tab
3. [ ] Add all required variables from checklist above
4. [ ] Use "Raw Editor" for bulk paste if needed
5. [ ] Generate JWT secrets using: `openssl rand -hex 32`

### Step 4: Deploy
1. [ ] Railway automatically triggers deployment after variable configuration
2. [ ] Monitor build logs in "Deployments" tab
3. [ ] Wait for build to complete (typically 3-5 minutes)
4. [ ] Check for any errors in build logs

### Step 5: Verify Deployment
1. [ ] Check deployment status shows "Active"
2. [ ] Note the Railway-provided URL
3. [ ] Test health endpoint: `https://your-service.railway.app/health`
4. [ ] Verify response includes all service statuses

## Post-Deployment Verification

### Health Check
- [ ] Visit `/health` endpoint
- [ ] Verify `success: true` in response
- [ ] Check `services.database: true`
- [ ] Verify other service statuses match your configuration

### Expected Health Check Response:
```json
{
  "success": true,
  "message": "Simplehire API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 123.456,
  "services": {
    "database": true,
    "multiLLM": true,
    "storage": true,
    "payments": false,
    "email": false
  }
}
```

### Database Check
- [ ] Review deployment logs for migration success
- [ ] Look for: `✓ Migrations applied successfully`
- [ ] No migration errors in logs

### Application Logs
- [ ] View application logs in Railway dashboard
- [ ] Verify startup messages appear:
  - `✓ Environment validation passed`
  - `🚀 Simplehire Backend Server Started Successfully`
  - `📍 Server running on port 3000`
- [ ] No error messages in startup logs

### Feature Availability
Check logs for feature availability report:
```
=== Feature Availability ===
✓ Multi-LLM Evaluation: Enabled
✓ File Uploads (S3): Enabled
✗ Payment Processing: Disabled (not configured)
✗ Email Service: Disabled (not configured)
============================
```

## Troubleshooting

### Build Failures

**Issue**: Build fails with module not found
- [ ] Check that all dependencies are in `package.json`
- [ ] Verify npm install completed in build logs
- [ ] Check Dockerfile COPY commands

**Issue**: TypeScript compilation errors
- [ ] Review build logs for specific errors
- [ ] Verify code compiles locally: `npm run build`
- [ ] Check TypeScript version compatibility

### Runtime Failures

**Issue**: Application crashes on startup
- [ ] Check for missing environment variables in logs
- [ ] Look for "Missing required environment variable" errors
- [ ] Verify DATABASE_URL is set
- [ ] Verify JWT secrets are configured

**Issue**: Database connection fails
- [ ] Verify PostgreSQL database is running
- [ ] Check DATABASE_URL format
- [ ] Review database logs in Railway
- [ ] Ensure database and service in same project

**Issue**: Health check failures
- [ ] Check application is listening on port 3000
- [ ] Review startup logs for errors
- [ ] Increase health check timeout if needed
- [ ] Verify `/health` endpoint is accessible

**Issue**: LLM Configuration not found
- [ ] This should not occur (fallback config implemented)
- [ ] Check build logs to verify config folder copied
- [ ] Review application logs for config loading messages

**Issue**: Migration failures
- [ ] Check prisma/migrations folder exists
- [ ] Verify DATABASE_URL is correct
- [ ] Review migration logs for specific errors
- [ ] Ensure schema.prisma is valid

### Service Unavailable

**Issue**: 503 Service Unavailable
- [ ] Check application logs for startup errors
- [ ] Verify environment variables are set
- [ ] Check database connectivity
- [ ] Review health check endpoint response

## Monitoring

### Daily Checks
- [ ] Review Railway dashboard for any alerts
- [ ] Check application logs for errors
- [ ] Monitor resource usage (CPU, memory)
- [ ] Verify health check endpoint

### Weekly Checks
- [ ] Review database performance metrics
- [ ] Check for any security updates
- [ ] Review error logs and patterns
- [ ] Verify backups are running

## Rollback Procedure

If deployment fails:
1. [ ] Go to Railway Deployments tab
2. [ ] Find last successful deployment
3. [ ] Click "Redeploy" on that deployment
4. [ ] Verify health check passes
5. [ ] Review what changed and fix issues

## Security Best Practices

- [ ] Never commit secrets to repository
- [ ] Rotate JWT secrets regularly
- [ ] Use strong database password
- [ ] Enable HTTPS only (Railway provides by default)
- [ ] Set appropriate CORS origins
- [ ] Keep dependencies updated
- [ ] Review Railway security logs

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Project Documentation**: See RAILWAY_SETUP.md
- **Environment Variables**: See .env.example

## Notes

- Railway automatically rebuilds on git push
- Migrations run automatically on each deployment
- Health checks run every 30 seconds
- Application has 40 second start-period for health checks
- Maximum 10 restart retries on failure

---

**Last Updated**: December 30, 2024
**Version**: 1.0.0
