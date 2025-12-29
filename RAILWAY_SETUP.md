# Railway Deployment Guide

## Quick Setup

### 1. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `achurisujith-droid/Simplehirefigma-new`

### 2. Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create and inject `DATABASE_URL`

### 3. Configure Environment Variables

Add the following in Railway dashboard → Variables:

#### Required Variables
```bash
# Database (automatically set by Railway PostgreSQL plugin)
DATABASE_URL=postgresql://...

# JWT Authentication (generate strong secrets)
JWT_SECRET=<generate-with-openssl-rand-hex-32>
REFRESH_TOKEN_SECRET=<generate-with-openssl-rand-hex-32>

# Node Environment
NODE_ENV=production

# Frontend URL (update with your actual frontend URL)
FRONTEND_URL=https://your-frontend-url.com

# Port (Railway sets this automatically, but you can specify if needed)
PORT=3000
```

#### Optional but Recommended Variables
```bash
# OpenAI (for dynamic question generation)
OPENAI_API_KEY=sk-...

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Anthropic (for multi-LLM evaluation)
ANTHROPIC_API_KEY=sk-ant-...

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@simplehire.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Generate Secret Keys

Use the following commands to generate secure secrets:

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate REFRESH_TOKEN_SECRET
openssl rand -hex 32
```

### 5. Deploy

Once environment variables are configured:
1. Railway will automatically trigger a deployment
2. Monitor the build logs in Railway dashboard
3. Once deployed, your API will be available at `https://your-service.railway.app`

## Configuration Files

This repository includes the following Railway configuration files:

### `railway.toml`
Main Railway configuration that specifies:
- Build commands
- Start commands
- Health check endpoint
- Restart policy

### `nixpacks.toml`
Nixpacks configuration for building the application:
- Node.js 18.x runtime
- Build phases (install, build, start)
- Prisma generation

### `Procfile`
Fallback process configuration for Railway

### Root `package.json`
Monorepo management scripts for building and deploying both frontend and backend

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

### Build Fails with "Cannot find module"
- Ensure all dependencies are listed in `Simplehirefigma-main/src/backend/package.json`
- Check that `npm ci` runs successfully

### Prisma Migration Fails
- Verify `DATABASE_URL` is set correctly
- Ensure PostgreSQL database is running
- Check that schema.prisma is valid

### Application Crashes on Start
- Check environment variables are set
- Review logs in Railway dashboard
- Verify `dist/server.js` was built successfully

### Health Check Timeout
- Ensure server is listening on the correct port
- Check that `/health` endpoint is accessible
- Review application startup logs

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
