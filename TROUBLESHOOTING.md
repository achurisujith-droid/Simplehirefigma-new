# Troubleshooting Guide

This guide covers common issues and their solutions for deploying and running the Simplehire application.

## Table of Contents

- [Health Check Failures](#health-check-failures)
- [Database Connection Issues](#database-connection-issues)
- [Dependency and Build Problems](#dependency-and-build-problems)
- [Environment Variable Issues](#environment-variable-issues)
- [Deployment Issues](#deployment-issues)
- [Runtime Errors](#runtime-errors)

---

## Health Check Failures

### Symptom: `/health` endpoint returns 503 or times out

**Possible Causes:**
1. Database is not accessible
2. Server hasn't fully started
3. Environment variables are missing or invalid

**Solutions:**

1. **Check Database Connectivity:**
   ```bash
   # Test database connection manually
   psql $DATABASE_URL
   ```
   
   If this fails:
   - Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
   - Check if PostgreSQL service is running
   - Verify network connectivity to database host
   - Check firewall rules

2. **Review Server Logs:**
   ```bash
   # For Railway deployment
   railway logs
   
   # For Docker
   docker logs container-name
   ```
   
   Look for:
   - "Testing database connection..." - Should succeed within 30 seconds
   - "✓ Database connection successful" - Confirms DB is ready
   - "✗ Database connection failed" - Indicates DB problems

3. **Verify Health Check Timeout:**
   - Default timeout is 100 seconds in `railway.json`
   - If database takes longer to connect, increase this value
   - Check Railway dashboard for health check status

4. **Test Health Endpoint Manually:**
   ```bash
   curl -v http://localhost:3000/health
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "Simplehire API is running",
     "timestamp": "2025-12-30T08:00:00.000Z",
     "environment": "production",
     "version": "1.0.0",
     "uptime": 123.45,
     "services": {
       "database": true,
       "multiLLM": true,
       "storage": true,
       "payments": false,
       "email": false
     }
   }
   ```

---

## Database Connection Issues

### Symptom: "Failed to establish database connection"

**Solutions:**

1. **Verify DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```
   
   Format should be:
   ```
   postgresql://username:password@host:port/database
   ```

2. **Check PostgreSQL Service:**
   ```bash
   # For local development
   pg_isready -h localhost -p 5432
   
   # Check if PostgreSQL is running
   systemctl status postgresql  # Linux
   brew services list           # macOS
   ```

3. **Test Connection with psql:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

4. **Check Railway PostgreSQL Plugin:**
   - In Railway dashboard, verify PostgreSQL service is running
   - Check that DATABASE_URL variable is linked to backend service
   - Restart PostgreSQL service if needed

5. **Review Connection Retry Logs:**
   - Server attempts 10 connection retries with 3-second delays
   - Check logs for retry attempts and failure reasons
   - Common failures:
     - "ECONNREFUSED" - Database not accepting connections
     - "password authentication failed" - Wrong credentials
     - "database does not exist" - Database not created
     - "timeout" - Network issues or slow database startup

---

## Dependency and Build Problems

### Symptom: Build fails with dependency errors

**Solutions:**

1. **Clean Install Dependencies:**
   ```bash
   cd Simplehirefigma-main/src/backend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verify Node and npm Versions:**
   ```bash
   node --version  # Should be 20.x or higher
   npm --version   # Should be 10.8.2 or higher
   ```

3. **Update npm:**
   ```bash
   npm install -g npm@11.7.0
   ```

4. **Regenerate Prisma Client:**
   ```bash
   cd Simplehirefigma-main/src/backend
   npx prisma generate
   ```

5. **Build TypeScript:**
   ```bash
   cd Simplehirefigma-main/src/backend
   npm run build
   ```
   
   If build fails:
   - Check `tsconfig.json` for correct paths
   - Verify all dependencies are installed
   - Look for TypeScript errors in output

### Symptom: Prisma generation fails

**Solutions:**

1. **Check Prisma Schema:**
   ```bash
   cd Simplehirefigma-main/src/backend
   npx prisma validate
   ```

2. **Verify Prisma Version:**
   ```bash
   npx prisma --version
   # Should be 6.19.1
   ```

3. **Clear Prisma Cache:**
   ```bash
   rm -rf node_modules/.prisma
   rm -rf node_modules/@prisma
   npm install
   npx prisma generate
   ```

4. **Check Database URL in Schema:**
   - Ensure `prisma/schema.prisma` has correct datasource configuration
   - Should use `env("DATABASE_URL")`

---

## Environment Variable Issues

### Symptom: "Missing required environment variable"

**Solutions:**

1. **Verify Required Variables Are Set:**
   
   **Required variables:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   
   Check if set:
   ```bash
   # Local development
   cat .env | grep DATABASE_URL
   
   # Railway
   railway variables
   ```

2. **Generate JWT Secrets:**
   ```bash
   # Generate strong secrets
   openssl rand -hex 32
   ```

3. **Railway Variable Configuration:**
   - Go to Railway dashboard → Your Service → Variables
   - Add all required variables from `.env.example`
   - Click "Add Variable" for each one
   - Redeploy after adding variables

4. **Check Variable Names:**
   - Ensure no typos in variable names
   - Variable names are case-sensitive
   - No spaces around `=` in `.env` file

### Symptom: JWT secrets too short warning

**Solution:**
- JWT secrets should be at least 32 characters
- Use `openssl rand -hex 32` to generate secure secrets
- Update `JWT_SECRET` and `JWT_REFRESH_SECRET`

---

## Deployment Issues

### Symptom: Railway deployment fails

**Solutions:**

1. **Check Build Logs:**
   - Railway dashboard → Deployments → Select failed deployment → View logs
   - Look for specific error messages

2. **Verify Dockerfile:**
   - Ensure `Dockerfile` is in repository root
   - Check that all paths in Dockerfile are correct
   - Verify multi-stage build stages are correct

3. **Check railway.toml Configuration:**
   ```toml
   [build]
   builder = "DOCKERFILE"
   dockerfilePath = "Dockerfile"
   
   [deploy]
   healthcheckPath = "/health"
   healthcheckTimeout = 100
   ```

4. **Database Not Linked:**
   - In Railway, click "+ New" → "Database" → "Add PostgreSQL"
   - Link database to backend service
   - Verify `DATABASE_URL` is auto-injected

5. **Port Configuration:**
   - Ensure `PORT` environment variable is set to `3000`
   - Railway auto-injects `PORT`, but you can override it

### Symptom: Docker build fails

**Solutions:**

1. **Check Docker Version:**
   ```bash
   docker --version
   # Should be recent version (20+)
   ```

2. **Build Locally to Test:**
   ```bash
   docker build -t simplehire-test .
   ```

3. **Check for Missing Files:**
   - Ensure all required files are not in `.dockerignore`
   - Verify `Simplehirefigma-main/src/backend/` directory structure

4. **Increase Docker Memory:**
   - Docker Desktop: Settings → Resources → Memory
   - Allocate at least 4GB for builds

---

## Runtime Errors

### Symptom: "Unhandled Rejection" or "Unhandled Exception"

**Solutions:**

1. **Check Application Logs:**
   ```bash
   # Railway
   railway logs --tail
   
   # Docker
   docker logs -f container-name
   
   # Local
   cat logs/combined.log
   ```

2. **Common Runtime Errors:**

   **a) Stripe initialization error:**
   - Ensure `STRIPE_SECRET_KEY` is set correctly
   - Stripe key should start with `sk_`
   - Check that key is not expired

   **b) AWS S3 errors:**
   - Verify AWS credentials are correct
   - Check S3 bucket exists and is accessible
   - Ensure IAM permissions are set correctly

   **c) OpenAI/Anthropic API errors:**
   - Verify API keys are valid
   - Check API quota and usage limits
   - Ensure correct model names in config

3. **Enable Debug Logging:**
   - Set `LOG_LEVEL=debug` in environment variables
   - Restart application
   - Review detailed logs for more context

### Symptom: 500 Internal Server Error on API requests

**Solutions:**

1. **Check Request Body:**
   - Ensure Content-Type is `application/json`
   - Verify required fields are present
   - Check field types match API expectations

2. **Review Validation Errors:**
   - Check if input validation is failing
   - Look for Zod or express-validator errors in logs

3. **Database Query Errors:**
   - Check if Prisma queries are failing
   - Look for foreign key constraint violations
   - Verify data types match schema

4. **Enable Error Stack Traces:**
   - Set `NODE_ENV=development` temporarily
   - Error responses will include stack traces
   - **Important:** Set back to `production` after debugging

---

## Performance Issues

### Symptom: Slow response times or timeouts

**Solutions:**

1. **Database Query Optimization:**
   - Check if database indexes are created
   - Review slow queries in PostgreSQL logs
   - Consider connection pooling if needed

2. **Enable Compression:**
   - Already enabled in `server.ts`
   - Verify it's working with browser dev tools

3. **Check Resource Limits:**
   - Railway: Verify service plan has adequate resources
   - Docker: Check container resource limits
   - Monitor CPU and memory usage

4. **Network Latency:**
   - Test database connection latency
   - Consider moving services closer geographically
   - Check for network issues

---

## Getting Additional Help

If you're still experiencing issues:

1. **Check Documentation:**
   - [README.md](README.md)
   - [RAILWAY_SETUP.md](RAILWAY_SETUP.md)
   - [RAILWAY_DEPLOYMENT_CHECKLIST.md](RAILWAY_DEPLOYMENT_CHECKLIST.md)
   - [FIX_SUMMARY.md](FIX_SUMMARY.md)

2. **Review Logs Carefully:**
   - Application logs contain detailed error messages
   - Look for error codes and stack traces
   - Check for environment validation messages

3. **Open an Issue:**
   - Go to [GitHub Issues](https://github.com/achurisujith-droid/Simplehirefigma-new/issues)
   - Provide:
     - Environment (Railway, Docker, local)
     - Error messages and logs
     - Steps to reproduce
     - Expected vs actual behavior

4. **Search Existing Issues:**
   - Check if someone else has encountered the same problem
   - Look for solutions in closed issues

---

## Preventive Measures

To avoid common issues:

1. **Always Use Environment Variables:**
   - Never hardcode secrets
   - Use `.env.example` as a template
   - Keep `.env` out of version control

2. **Test Locally First:**
   - Run application locally before deploying
   - Test all API endpoints
   - Verify database migrations work

3. **Keep Dependencies Updated:**
   - Regularly check for security updates
   - Test updates in development first
   - Review changelogs for breaking changes

4. **Monitor Your Deployment:**
   - Set up health check monitoring
   - Enable logging and error tracking
   - Review logs regularly for warnings

5. **Follow the Checklists:**
   - Use [RAILWAY_DEPLOYMENT_CHECKLIST.md](RAILWAY_DEPLOYMENT_CHECKLIST.md)
   - Verify each step before proceeding
   - Document any deviations or customizations

---

**Last Updated:** December 30, 2024
