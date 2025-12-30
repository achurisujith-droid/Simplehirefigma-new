# Railway Deployment Guide

> **⚠️ IMPORTANT**: This project uses a **Dockerfile builder**. Railway does NOT auto-detect environment variables when using Dockerfile. You **MUST manually add all required environment variables** in the Railway dashboard.

## Quick Setup

### 1. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `achurisujith-droid/Simplehirefigma-new`

### 2. Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create and inject `DATABASE_URL` into your service
4. This is the **only** environment variable Railway auto-injects when using Dockerfile

### 3. Configure Environment Variables

**CRITICAL**: When using a Dockerfile builder, Railway requires you to **manually add ALL environment variables** through the dashboard. Unlike Nixpacks deployments, Railway cannot auto-detect or prompt for variables.

#### How to Add Variables in Railway:

1. Navigate to your service in Railway dashboard
2. Click on the **"Variables"** tab
3. Click **"+ New Variable"** or **"Raw Editor"**
4. Add each variable individually or paste all at once in raw editor

#### Required Variables (MUST ADD THESE)
```bash
# Database (automatically set by Railway PostgreSQL plugin - NO NEED TO ADD)
DATABASE_URL=postgresql://...

# JWT Authentication (generate strong secrets using: openssl rand -hex 32)
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>

# Token Expiration
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Node Environment
NODE_ENV=production

# Frontend URL (update with your actual frontend URL)
FRONTEND_URL=https://your-frontend-url.com

# Application URL (your Railway backend URL)
APP_URL=https://your-service.railway.app

# Port (Railway sets this automatically, but backend expects it)
PORT=3000

# Security
BCRYPT_ROUNDS=12
```

#### Optional but Recommended Variables

**Add these based on features you want to enable:**

```bash
# AI/LLM Services (for AI-powered interviews)
OPENAI_API_KEY=sk-...                           # Required for interview questions
ANTHROPIC_API_KEY=sk-ant-...                    # Optional: multi-LLM evaluation
LLM_PROVIDERS=gpt-4o,claude-opus-4-5-20251101  # Comma-separated list
ENABLE_MULTI_LLM_ARBITER=true                   # Enable multi-LLM evaluation

# AWS S3 (for file uploads - resumes, ID documents)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Stripe (for payment processing)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (for notifications - SendGrid or SMTP)
EMAIL_FROM=noreply@simplehire.ai
EMAIL_FROM_NAME=Simplehire
SENDGRID_API_KEY=your-sendgrid-api-key

# Alternative: SMTP Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000                     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

# File Upload Limits (in bytes)
MAX_FILE_SIZE=16777216                          # 16 MB
MAX_AUDIO_SIZE=52428800                         # 50 MB

# Session Management
SESSION_MAX_AGE_MS=3600000                      # 1 hour

# Logging
LOG_LEVEL=info
```

#### Why Manual Configuration is Required

When using a **Dockerfile builder** (as this project does), Railway:
- ✅ **Can**: Build your Docker image from the Dockerfile
- ✅ **Can**: Auto-inject `DATABASE_URL` from PostgreSQL plugin
- ❌ **Cannot**: Auto-detect environment variables from your code
- ❌ **Cannot**: Prompt you for missing variables during setup
- ❌ **Cannot**: Read `.env.example` files to suggest variables

This is different from **Nixpacks** deployments, which can analyze your code and suggest environment variables.

### 4. Generate Secret Keys

Use the following commands to generate secure secrets:

```bash
# Generate JWT_SECRET (64+ characters recommended)
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET (64+ characters recommended)
openssl rand -hex 32
```

Copy these values into Railway dashboard variables.

### 5. View Build and Deployment Logs

**Monitor your deployment**:

1. In Railway dashboard, click on your service
2. Navigate to **"Deployments"** tab
3. Click on the active deployment
4. View real-time logs:
   - **Build logs**: Shows Docker image building process
   - **Deploy logs**: Shows application startup and runtime logs

**What to look for in logs**:
- ✅ Successful Prisma client generation
- ✅ Database migrations completed
- ✅ Server started on port 3000
- ✅ Health check responding
- ❌ Any error messages or stack traces
- ❌ Missing environment variable warnings

### 6. Deploy

Once environment variables are configured:
1. Railway will automatically trigger a deployment
2. Monitor the build logs in Railway dashboard
3. Wait for migrations to complete
4. Check health check status
5. Once deployed, your API will be available at `https://your-service.railway.app`

### 7. Test Your Deployment

```bash
# Test health endpoint
curl https://your-service.railway.app/health

# Expected response:
# {"success":true,"message":"Simplehire API is running","timestamp":"2024-01-01T00:00:00.000Z"}
```

## Configuration Files

This repository includes the following Railway configuration files:

### `Dockerfile`
Multi-stage Docker build configuration:
- Base stage with Node.js 20 Alpine
- Dependencies stage for npm install
- Builder stage for TypeScript compilation and Prisma generation
- Production stage with minimal runtime image
- **Important**: Copies `config/llm_config.json` to dist folder (line 56)

### `railway.toml`
Main Railway configuration that specifies:
- Build method: Dockerfile
- Dockerfile path
- Health check endpoint at `/health`
- Restart policy: ON_FAILURE with max 10 retries
- Health check timeout: 100 seconds

### `railway.json`
Additional Railway service configuration:
- Builder type (DOCKERFILE)
- Deployment replicas
- Health check configuration

### `Procfile`
Fallback process configuration for Railway

### Root `package.json`
Monorepo management scripts for building and deploying backend

## Project Structure

```
.
├── railway.toml              # Railway configuration
├── nixpacks.toml            # Nixpacks build configuration
├── Procfile                 # Process configuration
├── package.json             # Root package.json with monorepo scripts
└── Simplehirefigma-main/
    ├── package.json         # Frontend dependencies
    └── src/
        └── backend/
            ├── package.json  # Backend dependencies
            ├── prisma/
            │   └── schema.prisma
            ├── src/
            │   └── server.ts
            └── dist/        # Build output
```

## Deployment Process

Railway will execute the following steps:

1. **Setup Phase**: Install Node.js 18.x and OpenSSL
2. **Install Phase**: Run `npm ci` in backend directory
3. **Build Phase**: 
   - Generate Prisma client
   - Compile TypeScript to JavaScript
4. **Deploy Phase**:
   - Run Prisma migrations
   - Start the Node.js server

## Health Check

The application exposes a health check endpoint at `/health` which returns:

```json
{
  "success": true,
  "message": "Simplehire API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Railway will use this endpoint to verify the application is running correctly.

## Troubleshooting

### Common Issues and Solutions

#### 1. Build Fails with "Cannot find module"
**Symptom**: Build logs show module not found errors

**Solution**:
- Ensure all dependencies are listed in `Simplehirefigma-main/src/backend/package.json`
- Check that npm install completed successfully in build logs
- Verify the Dockerfile copies files correctly

#### 2. "LLM configuration file not found" Error
**Symptom**: Application crashes on startup with config file error

**Solution**:
- ✅ **Already Fixed**: Dockerfile line 56 copies `config/llm_config.json`
- This issue should not occur with the current Dockerfile
- If you still see this error, check Docker build logs to ensure config folder was copied

#### 3. Prisma Migration Fails
**Symptom**: Deployment fails during database migration

**Solution**:
- Verify `DATABASE_URL` is set correctly in Railway variables
- Ensure PostgreSQL database is running and accessible
- Check that `schema.prisma` is valid
- Review migration files in `prisma/migrations/`
- Check Railway logs for specific Prisma error messages

#### 4. Application Crashes on Start
**Symptom**: Service starts but immediately crashes

**Solutions**:
- **Missing Environment Variables**: Check Railway logs for "undefined" or "missing" variable errors
  - Add all required variables listed in the "Required Variables" section above
- **Database Connection**: Verify `DATABASE_URL` is correct
- **JWT Secrets**: Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Review application logs in Railway dashboard for specific error messages

#### 5. Health Check Timeout
**Symptom**: Deployment shows health check failures

**Solution**:
- Ensure server is listening on the correct port (3000 or `$PORT`)
- Check that `/health` endpoint is accessible
- Review application startup logs
- Increase health check timeout in `railway.toml` if needed
- Verify the application starts without errors

#### 6. Environment Variables Not Working
**Symptom**: Application doesn't recognize environment variables

**Solution**:
- Remember: Railway with Dockerfile **requires manual variable addition**
- Go to Service → Variables tab in Railway dashboard
- Add each variable individually
- Redeploy after adding variables
- Check for typos in variable names

#### 7. Database Connection Errors
**Symptom**: "Connection refused" or "Cannot connect to database"

**Solution**:
- Verify PostgreSQL plugin is added to your Railway project
- Check that `DATABASE_URL` is injected (should be automatic)
- Ensure database and backend service are in the same Railway project
- Try manually setting `DATABASE_URL` from PostgreSQL plugin connection string

#### 8. Port Binding Issues
**Symptom**: Application can't bind to port

**Solution**:
- Ensure `PORT` variable is set to `3000`
- Railway may inject its own `$PORT` - application should use `process.env.PORT || 3000`
- Check Dockerfile EXPOSE statement matches the port

#### 9. File Upload Failures
**Symptom**: File uploads fail or timeout

**Solution**:
- Ensure AWS S3 credentials are configured:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_BUCKET`
- Verify S3 bucket exists and has correct permissions
- Check file size limits (`MAX_FILE_SIZE`, `MAX_AUDIO_SIZE`)

#### 10. Payment Processing Errors
**Symptom**: Stripe payments fail

**Solution**:
- Verify Stripe keys are set:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Ensure webhook endpoint is configured in Stripe dashboard
- Use test keys for development
- Check Stripe webhook logs for delivery issues

## Database Migrations

### Development
Migrations are managed in the backend directory:
```bash
cd Simplehirefigma-main/src/backend
npx prisma migrate dev --name your-migration-name
```

### Production (Railway)
Railway automatically runs migrations on deployment:
- Migrations are applied before starting the server
- Failed migrations will prevent deployment
- Always test migrations in development first

## Monitoring

### Logs
View real-time logs in Railway dashboard:
1. Open your service
2. Click "Deployments"
3. Select a deployment to view logs

### Metrics
Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Response times

## Scaling

Railway supports both vertical and horizontal scaling:

### Vertical Scaling
Increase resources in Railway dashboard:
1. Go to service settings
2. Adjust CPU and memory limits

### Horizontal Scaling
For horizontal scaling, consider:
- Multiple Railway services
- Load balancer configuration
- Session management (use database-backed sessions)

## Environment-Specific Configuration

### Development
- Set `NODE_ENV=development`
- Enable detailed logging
- Use development database

### Staging
- Set `NODE_ENV=staging`
- Use separate database
- Test with production-like data

### Production
- Set `NODE_ENV=production`
- Enable all security features
- Use production database
- Configure proper CORS origins

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate secrets regularly** (JWT_SECRET, API keys)
3. **Use strong passwords** for database
4. **Enable HTTPS only** in production
5. **Set appropriate CORS origins**
6. **Keep dependencies updated**
7. **Monitor for vulnerabilities**

## Backup and Recovery

### Database Backups
Railway provides automatic PostgreSQL backups:
- Daily backups retained for 7 days
- Instant recovery from Railway dashboard

### Manual Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## Cost Optimization

### Tips to Reduce Costs
1. Use appropriate instance size
2. Enable auto-sleep for development environments
3. Optimize database queries
4. Use caching where appropriate
5. Monitor resource usage

## Support

### Railway Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### Project Support
- Open an issue on GitHub
- Check existing documentation
- Review deployment logs

## Next Steps

After successful deployment:

1. **Test the API**: Use the health check endpoint
2. **Configure Frontend**: Update frontend to use Railway API URL
3. **Set up Monitoring**: Configure alerts and monitoring
4. **Document API**: Share API documentation with frontend team
5. **Test All Features**: Verify authentication, file uploads, database operations

## Quick Commands

```bash
# Test local build process
npm run railway:build

# Test local start process
npm run railway:start

# Run backend in development
npm run dev:backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Build backend only
npm run build:backend
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
